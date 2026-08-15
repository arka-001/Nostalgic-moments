"use client";

import { useState } from "react";
import { Globe, MapPin, Users, Radio, Sparkles } from "lucide-react";
import { GeoMapPoint } from "@/types";

interface WorldVisitorMapProps {
  points: GeoMapPoint[];
  liveCount: number;
}

// Convert latitude and longitude to SVG X/Y coordinates (Equirectangular Projection)
function projectLatLonToSvg(lat: number, lon: number, width: number, height: number) {
  // Longitude: -180 to 180 -> 0 to width
  const x = ((lon + 180) / 360) * width;
  // Latitude: 90 to -90 -> 0 to height
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

// Flag emoji helper
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

  // SVG viewBox dimensions
  const mapWidth = 800;
  const mapHeight = 400;

  return (
    <div className="relative w-full rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-2xl overflow-hidden space-y-4">
      {/* Top Map Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-serif font-bold text-amber-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" /> Real-Time Geographic Listener Radar
          </h3>
          <p className="text-xs text-slate-400">
            Aggregated approximate city/country density nodes • Zero raw IP exposure
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {liveCount} Active Listener Nodes
          </span>
        </div>
      </div>

      {/* ── INTERACTIVE SVG WORLD MAP ── */}
      <div className="relative w-full aspect-[2/1] max-h-[380px] bg-slate-950/80 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-center p-2">
        {/* Subtle Map Grid Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-full object-contain filter drop-shadow-md select-none"
        >
          <defs>
            {/* World Landmass Pattern & Glow Filters */}
            <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Simplified Stylized World Continents Background (Vector Outlines) */}
          <g fill="#1e293b" opacity="0.65" stroke="#334155" strokeWidth="0.75">
            {/* North America */}
            <path d="M 120 70 Q 200 60 250 90 Q 260 140 210 180 Q 170 200 130 150 Q 90 110 120 70 Z" />
            {/* South America */}
            <path d="M 230 220 Q 290 230 280 310 Q 250 370 220 340 Q 200 280 230 220 Z" />
            {/* Europe */}
            <path d="M 380 80 Q 460 70 470 120 Q 430 150 390 140 Q 360 110 380 80 Z" />
            {/* Africa */}
            <path d="M 380 160 Q 470 150 490 230 Q 460 330 410 310 Q 360 250 380 160 Z" />
            {/* Asia & India */}
            <path d="M 480 80 Q 680 70 710 170 Q 640 240 560 220 Q 520 180 520 150 Q 470 110 480 80 Z" />
            {/* India Subcontinent Focus Outline */}
            <path
              d="M 530 160 Q 565 160 575 195 Q 555 240 535 220 Q 515 190 530 160 Z"
              fill="#334155"
              opacity="0.9"
            />
            {/* Australia */}
            <path d="M 640 270 Q 720 260 720 330 Q 660 360 630 320 Q 620 280 640 270 Z" />
          </g>

          {/* ── ACTIVE GEOGRAPHIC LISTENER RADAR BEACONS ── */}
          {points.map((pt, idx) => {
            const { x, y } = projectLatLonToSvg(pt.latitude, pt.longitude, mapWidth, mapHeight);
            const isLive = pt.active_listeners > 0;
            const isHovered = hoveredPoint?.city === pt.city;

            return (
              <g
                key={`${pt.city}-${idx}`}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Outer Ripple Wave for Live Nodes */}
                {isLive && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? "18" : "12"}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    opacity="0.75"
                    className="animate-ping"
                    style={{ transformOrigin: `${x}px ${y}px`, animationDuration: "2.5s" }}
                  />
                )}

                {/* Secondary Halo */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? "10" : isLive ? "6" : "4"}
                  fill={isLive ? "#10b981" : "#06b6d4"}
                  opacity="0.35"
                />

                {/* Center Solid Glowing Core */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? "6" : isLive ? "4" : "3"}
                  fill={isLive ? "#34d399" : "#38bdf8"}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                  filter={isLive ? "url(#glow-cyan)" : "none"}
                />
              </g>
            );
          })}
        </svg>

        {/* ── FLOATING TOOLTIP ── */}
        {hoveredPoint && (
          <div className="absolute bottom-4 left-4 z-20 p-3.5 rounded-2xl bg-slate-900/95 border border-amber-500/40 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 space-y-1 max-w-xs font-mono text-xs">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1">
              <span className="flex items-center gap-1.5 text-slate-100 font-bold">
                <span className="text-base">{getCountryFlag(hoveredPoint.country_code)}</span>
                <span>{hoveredPoint.city}</span>
              </span>
              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-sans">
                {hoveredPoint.country}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-slate-400">Live Streaming Now:</span>
              <span className="text-emerald-400 font-bold">
                {hoveredPoint.active_listeners} {hoveredPoint.active_listeners === 1 ? "listener" : "listeners"}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Total Recorded Sessions:</span>
              <span className="text-cyan-300 font-bold">{hoveredPoint.total_sessions}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Map Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400 pt-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Live Stream</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Audience Cluster Node</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Hover over nodes to view real-time city densities
        </div>
      </div>
    </div>
  );
}
