"use client";

import { useState, useMemo } from "react";
import { Globe, MapPin, Users, Radio, Sparkles, Navigation, Layers, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { GeoMapPoint } from "@/types";

interface WorldVisitorMapProps {
  points: GeoMapPoint[];
  liveCount: number;
}

// Convert latitude and longitude to SVG X/Y coordinates (Equirectangular Projection 1000 x 500)
function projectLatLonToSvg(lat: number, lon: number, width: number = 1000, height: number = 500) {
  // Longitude: -180 to 180 -> 0 to width
  const x = ((lon + 180) / 360) * width;
  // Latitude: 90 to -90 -> 0 to height
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

// Helper: Convert 2-letter country code into flag emoji
function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode === "UN" || countryCode.length !== 2) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default function WorldVisitorMap({ points, liveCount }: WorldVisitorMapProps) {
  const [hoveredPoint, setHoveredPoint] = useState<GeoMapPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<GeoMapPoint | null>(null);

  const mapWidth = 1000;
  const mapHeight = 500;

  // Active point for tooltip
  const activeTooltipPoint = hoveredPoint || selectedPoint;

  return (
    <div className="relative w-full rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800/90 p-5 sm:p-6 shadow-2xl overflow-hidden space-y-4 font-sans">
      {/* Top Map Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-cyan-400" />
              Geo-Telemetry Radar
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              High-Precision Equirectangular Projection
            </span>
          </div>
          <h3 className="text-lg font-serif font-bold text-amber-100 flex items-center gap-2">
            Real-Time Geographic Listener Radar
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold">{liveCount}</span> Active Listener {liveCount === 1 ? "Node" : "Nodes"}
          </span>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            {points.length} City Clusters
          </span>
        </div>
      </div>

      {/* ── INTERACTIVE SVG WORLD MAP ── */}
      <div className="relative w-full aspect-[2/1] min-h-[300px] max-h-[460px] bg-slate-950/90 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-center p-2 group shadow-inner">
        {/* Subtle Map Matrix Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-15 pointer-events-none" />

        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-full object-contain filter drop-shadow-md select-none"
        >
          <defs>
            {/* Gradients & Glow Filters */}
            <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>

            <linearGradient id="indiaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0.95" />
            </linearGradient>

            {/* Radar Beam Sweep Gradient */}
            <linearGradient id="radarSweep" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
              <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.18" />
            </linearGradient>
          </defs>

          {/* ── LATITUDE & LONGITUDE GRATICULE LINES ── */}
          <g stroke="#334155" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.35">
            {/* Longitudes (every 30 deg: 0, 83.3, 166.6, 250, 333.3, 416.6, 500, 583.3, 666.6, 750, 833.3, 916.6, 1000) */}
            <line x1="83" y1="0" x2="83" y2="500" />
            <line x1="167" y1="0" x2="167" y2="500" />
            <line x1="250" y1="0" x2="250" y2="500" />
            <line x1="333" y1="0" x2="333" y2="500" />
            <line x1="417" y1="0" x2="417" y2="500" />
            <line x1="500" y1="0" x2="500" y2="500" stroke="#0ea5e9" strokeWidth="0.8" opacity="0.5" strokeDasharray="none" /> {/* Prime Meridian */}
            <line x1="583" y1="0" x2="583" y2="500" />
            <line x1="667" y1="0" x2="667" y2="500" />
            <line x1="750" y1="0" x2="750" y2="500" />
            <line x1="833" y1="0" x2="833" y2="500" />
            <line x1="917" y1="0" x2="917" y2="500" />

            {/* Latitudes (every 30 deg: 0, 83.3, 166.6, 250 (Equator), 333.3, 416.6, 500) */}
            <line x1="0" y1="83" x2="1000" y2="83" />   {/* 60 N */}
            <line x1="0" y1="167" x2="1000" y2="167" /> {/* 30 N */}
            <line x1="0" y1="250" x2="1000" y2="250" stroke="#0ea5e9" strokeWidth="0.8" opacity="0.5" strokeDasharray="none" /> {/* Equator */}
            <line x1="0" y1="333" x2="1000" y2="333" /> {/* 30 S */}
            <line x1="0" y1="417" x2="1000" y2="417" /> {/* 60 S */}
          </g>

          {/* ── ACCURATE DETAILED CONTINENT VECTOR LANDMASSES ── */}
          <g fill="url(#landGrad)" stroke="#475569" strokeWidth="0.75" strokeLinejoin="round">
            {/* North America: Alaska, Canada, USA, Mexico, Central America */}
            <path d="M 95 62 L 125 50 L 155 45 L 205 48 L 245 42 L 285 58 L 305 78 L 280 92 L 290 115 L 275 125 L 265 145 L 245 160 L 225 185 L 210 205 L 220 220 L 240 245 L 230 258 L 215 252 L 200 230 L 180 200 L 165 175 L 140 168 L 130 145 L 115 130 L 100 95 L 80 82 Z" />
            
            {/* Greenland */}
            <path d="M 330 35 L 375 28 L 410 40 L 400 75 L 365 85 L 340 70 Z" />

            {/* Caribbean Islands */}
            <circle cx="285" cy="210" r="3.5" />
            <circle cx="270" cy="205" r="3" />
            <circle cx="295" cy="218" r="2.5" />

            {/* South America */}
            <path d="M 235 260 L 265 252 L 310 262 L 345 285 L 360 310 L 350 340 L 335 375 L 315 410 L 290 455 L 275 468 L 265 445 L 268 395 L 255 350 L 235 300 L 225 275 Z" />

            {/* Europe */}
            <path d="M 470 78 L 505 60 L 540 68 L 555 90 L 525 105 L 535 125 L 505 135 L 485 142 L 465 140 L 450 125 L 460 100 Z" />
            {/* Scandinavia */}
            <path d="M 515 50 L 535 38 L 555 45 L 550 78 L 530 85 L 520 70 Z" />
            {/* British Isles */}
            <path d="M 455 85 L 475 75 L 480 100 L 460 105 Z" />
            <path d="M 445 88 L 452 82 L 455 95 L 448 98 Z" />

            {/* Africa */}
            <path d="M 465 152 L 520 148 L 575 160 L 590 190 L 615 220 L 590 260 L 575 305 L 560 365 L 530 410 L 495 385 L 480 330 L 465 270 L 440 225 L 445 185 Z" />
            {/* Madagascar */}
            <path d="M 605 330 L 620 325 L 615 375 L 600 370 Z" />

            {/* Asia Mainland & Middle East & Russia/Siberia */}
            <path d="M 555 90 L 600 75 L 685 55 L 785 45 L 870 52 L 910 65 L 945 90 L 920 115 L 875 125 L 850 140 L 815 150 L 760 165 L 710 160 L 680 180 L 630 185 L 585 185 L 565 150 L 545 120 Z" />

            {/* India & South Asian Subcontinent (Highlighted Focus Area) */}
            <path
              d="M 685 185 L 740 180 L 765 195 L 755 235 L 735 268 L 710 240 L 685 205 Z"
              fill="url(#indiaGrad)"
              stroke="#0ea5e9"
              strokeWidth="1.2"
              className="transition-colors hover:fill-slate-700"
            />
            {/* Sri Lanka */}
            <circle cx="738" cy="280" r="3.5" fill="#38bdf8" />

            {/* East & Southeast Asia Mainland */}
            <path d="M 765 165 L 820 155 L 860 185 L 850 230 L 820 250 L 785 240 L 775 200 Z" />
            {/* Japan */}
            <path d="M 885 125 L 905 135 L 900 165 L 880 155 Z" />
            {/* Korea */}
            <path d="M 855 130 L 865 135 L 860 155 L 850 150 Z" />
            {/* Indonesia & Malaysia Islands */}
            <path d="M 770 270 L 810 275 L 860 285 L 840 300 L 780 285 Z" />
            <path d="M 825 295 L 870 300 L 855 315 L 820 310 Z" />
            <path d="M 865 240 L 885 245 L 875 270 L 855 260 Z" /> {/* Philippines */}

            {/* Australia */}
            <path d="M 810 350 L 870 340 L 925 355 L 940 400 L 905 435 L 845 440 L 810 405 L 800 375 Z" />
            {/* New Zealand */}
            <path d="M 960 415 L 975 410 L 970 440 L 955 445 Z" />
            <path d="M 950 448 L 965 445 L 955 470 L 945 465 Z" />
            {/* Tasmania */}
            <circle cx="890" cy="455" r="3" />
          </g>

          {/* ── RADAR SWEEP SCANNER EFFECT ── */}
          <rect
            x="0"
            y="0"
            width="1000"
            height="500"
            fill="url(#radarSweep)"
            className="animate-pulse pointer-events-none"
            style={{ animationDuration: "4s" }}
          />

          {/* ── ACTIVE GEOGRAPHIC LISTENER RADAR BEACONS ── */}
          {points.map((pt, idx) => {
            const { x, y } = projectLatLonToSvg(pt.latitude, pt.longitude, mapWidth, mapHeight);
            const isLive = pt.active_listeners > 0;
            const isHovered = hoveredPoint?.city === pt.city;
            const isSelected = selectedPoint?.city === pt.city;

            return (
              <g
                key={`${pt.city}-${idx}`}
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
                onClick={() => setSelectedPoint(selectedPoint?.city === pt.city ? null : pt)}
              >
                {/* Outer Ping Wave for Live Streamers */}
                {isLive && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered || isSelected ? "24" : "14"}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.75"
                    opacity="0.85"
                    className="animate-ping"
                    style={{ transformOrigin: `${x}px ${y}px`, animationDuration: "2.2s" }}
                  />
                )}

                {/* Secondary Semi-Transparent Ambient Glow Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered || isSelected ? "14" : isLive ? "8" : "5"}
                  fill={isLive ? "#10b981" : "#06b6d4"}
                  opacity="0.4"
                  filter={isLive ? "url(#glow-emerald)" : "url(#glow-cyan)"}
                />

                {/* Solid Core Dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered || isSelected ? "7" : isLive ? "5" : "3.5"}
                  fill={isLive ? "#34d399" : "#38bdf8"}
                  stroke="#020617"
                  strokeWidth="2"
                  filter={isLive ? "url(#glow-emerald)" : "url(#glow-cyan)"}
                />

                {/* City Name Label on Hover */}
                {(isHovered || isSelected || isLive) && (
                  <text
                    x={x}
                    y={y - 12}
                    textAnchor="middle"
                    fill={isLive ? "#6ee7b7" : "#7dd3fc"}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="select-none pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                  >
                    {pt.city} {isLive ? `(${pt.active_listeners} live)` : ""}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── FLOATING GLASS TOOLTIP ── */}
        {activeTooltipPoint && (
          <div className="absolute bottom-4 left-4 z-20 p-3.5 rounded-2xl bg-slate-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 space-y-1.5 max-w-xs font-mono text-xs">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5 text-slate-100 font-bold text-sm">
                <span className="text-base">{getCountryFlag(activeTooltipPoint.country_code)}</span>
                <span>{activeTooltipPoint.city}</span>
              </span>
              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-sans font-semibold">
                {activeTooltipPoint.country}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-slate-400">Live Streaming Status:</span>
              <span className={`font-bold flex items-center gap-1 ${activeTooltipPoint.active_listeners > 0 ? "text-emerald-400" : "text-slate-400"}`}>
                {activeTooltipPoint.active_listeners > 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {activeTooltipPoint.active_listeners} Active {activeTooltipPoint.active_listeners === 1 ? "Listener" : "Listeners"}
                  </>
                ) : (
                  "Idle (Historical Node)"
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Total Recorded Sessions:</span>
              <span className="text-cyan-300 font-bold">{activeTooltipPoint.total_sessions}</span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-800/60 font-sans">
              <span>Coords: {activeTooltipPoint.latitude.toFixed(2)}°, {activeTooltipPoint.longitude.toFixed(2)}°</span>
              <span className="text-amber-400/80">Click node to pin</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Map Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400 pt-1 border-t border-slate-800/60">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-200">Active Live Stream</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Audience Cluster Node</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-3 h-2 rounded-sm bg-slate-700 border border-cyan-500/50" />
            <span>Highlighted Subcontinent (India)</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Hover or click on geographic nodes to inspect live audience densities
        </div>
      </div>
    </div>
  );
}
