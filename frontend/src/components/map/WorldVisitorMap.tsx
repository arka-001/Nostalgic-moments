"use client";

import { useEffect, useRef, useState } from "react";
import {
  Globe,
  Radio,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  Activity,
  Layers,
} from "lucide-react";
import { GeoMapPoint } from "@/types";

interface WorldVisitorMapProps {
  points: GeoMapPoint[];
  liveCount: number;
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

// Global declaration for dynamically loaded Leaflet L
declare global {
  interface Window {
    L: any;
  }
}

export default function WorldVisitorMap({ points, liveCount }: WorldVisitorMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<GeoMapPoint | null>(null);

  // 1. Dynamically Load Leaflet CSS & JS
  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = async () => {
      // Load Leaflet CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Load Leaflet JS
      if (!window.L) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Leaflet"));
          document.body.appendChild(script);
        });
      }

      if (isMounted) {
        setMapLoaded(true);
      }
    };

    loadLeaflet().catch((err) => {
      console.warn("Leaflet map load warning:", err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || !window.L) return;

    if (!mapInstanceRef.current) {
      const L = window.L;

      // Dark theme map container
      const map = L.map(mapContainerRef.current, {
        center: [22.5, 75.0], // Centered on Indian subcontinent & Eastern hemisphere
        zoom: 2.5,
        minZoom: 1.5,
        maxZoom: 14,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
      });

      // CartoDB Dark Matter Tile Layer (Authentic Dark-Mode GIS World Map)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          maxZoom: 19,
          opacity: 0.95,
        }
      ).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded]);

  // 3. Render High-Tech Radar Beacons on Map
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !markersLayerRef.current || !window.L) return;

    const L = window.L;
    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    // If no points, add fallback baseline for India
    const activePoints =
      points.length > 0
        ? points
        : [
            {
              city: "Kolkata",
              country: "India",
              country_code: "IN",
              latitude: 22.5726,
              longitude: 88.3639,
              active_listeners: liveCount > 0 ? liveCount : 1,
              total_sessions: 1,
            },
          ];

    activePoints.forEach((pt) => {
      const isLive = pt.active_listeners > 0;
      const isIndia = pt.country_code === "IN";

      const beaconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${
            isLive
              ? `<span class="absolute w-8 h-8 rounded-full bg-emerald-400/40 animate-ping pointer-events-none"></span>`
              : ""
          }
          <span class="absolute w-5 h-5 rounded-full ${
            isLive ? "bg-emerald-500/30" : "bg-cyan-500/30"
          } pointer-events-none"></span>
          <span class="w-3.5 h-3.5 rounded-full ${
            isLive ? "bg-emerald-400" : "bg-cyan-400"
          } border-2 border-slate-950 shadow-lg pointer-events-none"></span>
          
          <div class="absolute -top-7 whitespace-nowrap px-2 py-0.5 rounded-full bg-slate-950/95 border ${
            isLive ? "border-emerald-500/40 text-emerald-300" : "border-cyan-500/40 text-cyan-300"
          } text-[10px] font-mono font-bold shadow-xl flex items-center gap-1 pointer-events-none">
            ${isLive ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>' : ""}
            <span>${pt.city}</span>
            <span class="opacity-75 font-normal">(${isLive ? `${pt.active_listeners} live` : `${pt.total_sessions} sess`})</span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: beaconHtml,
        className: "custom-radar-beacon",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([pt.latitude, pt.longitude], { icon }).addTo(markersGroup);

      // Popup Content
      const popupHtml = `
        <div class="p-2 space-y-1.5 font-mono text-xs text-slate-100 min-w-[180px]">
          <div class="flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
            <span class="font-bold text-amber-300 text-sm flex items-center gap-1">
              <span>${getCountryFlag(pt.country_code)}</span>
              <span>${pt.city}</span>
            </span>
            <span class="text-[10px] text-slate-400">${pt.country}</span>
          </div>
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-slate-400">Live Status:</span>
            <span class="font-bold ${isLive ? "text-emerald-400" : "text-slate-400"}">
              ${isLive ? `🟢 ${pt.active_listeners} Active` : "Idle"}
            </span>
          </div>
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-slate-400">Total Visits:</span>
            <span class="text-cyan-300 font-bold">${pt.total_sessions}</span>
          </div>
          <div class="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
            Coordinates: ${pt.latitude.toFixed(2)}°, ${pt.longitude.toFixed(2)}°
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: "dark-custom-popup",
        closeButton: false,
      });

      marker.on("click", () => {
        setSelectedPoint(pt);
      });
    });
  }, [mapLoaded, points, liveCount]);

  // Controls Handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };
  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([22.5, 75.0], 2.5);
      setSelectedPoint(null);
    }
  };
  const handleFocusIndia = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([22.5726, 82.3639], 4.5);
    }
  };

  return (
    <div className="relative w-full rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800/90 p-5 sm:p-6 shadow-2xl overflow-hidden space-y-4 font-sans">
      <style jsx global>{`
        .leaflet-container {
          background: #020617 !important;
          font-family: inherit;
          border-radius: 1rem;
        }
        .dark-custom-popup .leaflet-popup-content-wrapper {
          background: rgba(2, 6, 23, 0.96) !important;
          border: 1px solid rgba(6, 182, 212, 0.4) !important;
          border-radius: 1rem !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.7) !important;
          backdrop-filter: blur(16px) !important;
          padding: 2px !important;
        }
        .dark-custom-popup .leaflet-popup-tip {
          background: rgba(2, 6, 23, 0.96) !important;
        }
        .custom-radar-beacon {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      {/* Top Map Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live GIS Radar
            </span>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              CartoDB Dark Matter GIS Engine
            </span>
          </div>
          <h3 className="text-lg font-serif font-bold text-amber-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" /> Real-Time Geographic Listener Radar
          </h3>
          <p className="text-xs text-slate-400">
            Interactive GIS world map with live audience beacon tracking, geographic cluster densities, and zoomable navigation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold">{liveCount}</span> Live {liveCount === 1 ? "Listener" : "Listeners"}
          </span>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            {points.length > 0 ? points.length : 1} Active Cities
          </span>
        </div>
      </div>

      {/* ── INTERACTIVE GIS LEAFLET MAP CONTAINER ── */}
      <div className="relative w-full h-[360px] sm:h-[420px] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl group">
        {/* Leaflet Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Loading Overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 z-10">
            <Globe className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-xs font-mono text-slate-400">Loading Real-Time World Map...</span>
          </div>
        )}

        {/* Floating Quick Action Map Controls (Top Right) */}
        <div className="absolute top-3 right-3 z-[400] flex flex-col gap-1.5 bg-slate-950/90 border border-slate-800 p-1.5 rounded-2xl shadow-2xl backdrop-blur-md">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Reset World View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleFocusIndia}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 transition"
            title="Focus India Subcontinent"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Info Banner (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-[400] px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800/90 text-[11px] font-mono text-slate-300 backdrop-blur-md flex items-center gap-2 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-Time GIS Feed Active</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Click any beacon to view details</span>
        </div>
      </div>

      {/* Bottom Map Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400 pt-1 border-t border-slate-800/60">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-200">Active Live Listener Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Audience Cluster Node</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Drag to pan • Scroll to zoom • Click nodes for listener diagnostics
        </div>
      </div>
    </div>
  );
}
