"use client";

import { useEffect, useState, useRef } from "react";
import {
  Globe,
  Radio,
  Users,
  MapPin,
  Laptop,
  Smartphone,
  Tablet,
  RefreshCw,
  Search,
  Filter,
  Copy,
  Check,
  Music,
  ExternalLink,
  Clock,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Compass,
  Sparkles,
  Download,
  FileSpreadsheet,
  Ban,
  X,
  AlertTriangle,
  Lock,
  Unlock,
} from "lucide-react";
import { fetchVisitorTelemetry, toggleBlockIp, getCsvExportUrl } from "@/lib/api";
import { VisitorSession, VisitorTelemetrySummary, GeoDistributionItem } from "@/types";
import WorldVisitorMap from "@/components/map/WorldVisitorMap";

// Helper: Convert 2-letter country code into flag emoji
function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode === "UN" || countryCode.length !== 2) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

interface IPModalState {
  isOpen: boolean;
  ip: string;
  isBlocked: boolean;
  city?: string;
  country?: string;
  countryCode?: string;
  isp?: string;
}

export default function AdminVisitorsPage() {
  const [data, setData] = useState<VisitorTelemetrySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online">("all");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [blockingIp, setBlockingIp] = useState<string | null>(null);

  // IP Block Modal State & Toast
  const [ipModal, setIpModal] = useState<IPModalState>({
    isOpen: false,
    ip: "",
    isBlocked: false,
  });
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetchVisitorTelemetry({
        page,
        limit: 30,
        search: search.trim() || undefined,
        status_filter: statusFilter === "online" ? "online" : undefined,
        country_filter: countryFilter || undefined,
      });
      setData(res);
    } catch (e) {
      console.error("Error fetching visitor telemetry:", e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter, countryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      loadData();
    }, 400);
    return () => clearTimeout(handler);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh interval (every 10 seconds for live listener radar)
  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        loadData(true);
      }, 10000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, page, search, statusFilter, countryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const openBlockModal = (v: VisitorSession) => {
    setIpModal({
      isOpen: true,
      ip: v.ip_address,
      isBlocked: Boolean(v.is_blocked),
      city: v.city,
      country: v.country,
      countryCode: v.country_code,
      isp: v.isp,
    });
  };

  const handleConfirmToggleBlock = async () => {
    if (!ipModal.ip) return;
    const targetIp = ipModal.ip;
    setBlockingIp(targetIp);

    try {
      const res = await toggleBlockIp(targetIp);
      await loadData(true);
      setIpModal((prev) => ({ ...prev, isOpen: false }));
      showToast(res.message, "success");
    } catch (err: any) {
      showToast(`Failed to update IP block: ${err.message || "Unknown error"}`, "error");
    } finally {
      setBlockingIp(null);
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return "Never";
    const date = new Date(isoString);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSecs < 15) return "Just now";
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return `${Math.floor(diffSecs / 86400)}d ago`;
  };

  const getDeviceIcon = (device?: string) => {
    if (device === "Mobile") return <Smartphone className="w-3.5 h-3.5 text-blue-400" />;
    if (device === "Tablet") return <Tablet className="w-3.5 h-3.5 text-purple-400" />;
    return <Laptop className="w-3.5 h-3.5 text-emerald-400" />;
  };

  return (
    <div className="space-y-8 max-w-7xl pb-16 font-sans">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all animate-in fade-in slide-in-from-top-4 duration-200 ${
            toastMessage.type === "success"
              ? "bg-slate-950/95 border-emerald-500/40 text-emerald-300"
              : "bg-slate-950/95 border-rose-500/40 text-rose-300"
          }`}
        >
          {toastMessage.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          )}
          <span className="text-xs font-mono">{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Presence Radar
            </span>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Globe className="w-3 h-3" /> GeoIP Intelligence & Protection
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-amber-100">
            Live Visitors & IP Intelligence
          </h1>
          <p className="text-sm text-slate-400">
            Real-time listener telemetry, interactive geographic world map, CSV analytics export, and IP shield controls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* CSV Export Dropdown / Buttons */}
          <a
            href={getCsvExportUrl("visitors")}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-mono transition"
            title="Export full visitor logs to CSV"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Visitors CSV</span>
          </a>

          <a
            href={getCsvExportUrl("streaming")}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-mono transition"
            title="Export streaming track playback analytics to CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Streams CSV</span>
          </a>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono transition border ${
              autoRefresh
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? "animate-spin" : ""}`} />
            <span>{autoRefresh ? "Radar Live (10s)" : "Radar Paused"}</span>
          </button>
        </div>
      </div>

      {/* ── METRIC TILES OVERVIEW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Live Online Listeners */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-300">
            <span>LIVE NOW</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-3xl font-bold text-emerald-200 font-mono">
            {data ? data.live_online_count : "..."}
          </div>
          <p className="text-xs text-slate-400">Listeners active in the last 5 minutes</p>
        </div>

        {/* Metric 2: Total Unique Listeners */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-amber-300">
            <span>UNIQUE AUDIENCE</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-200 font-mono">
            {data ? data.total_unique_visitors : "..."}
          </div>
          <p className="text-xs text-slate-400">Unique listener session profiles</p>
        </div>

        {/* Metric 3: Global Reach (Countries) */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
            <span>GLOBAL REACH</span>
            <Globe className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-cyan-200 font-mono">
            {data ? data.total_countries_reached : "..."}
          </div>
          <p className="text-xs text-slate-400">Countries reached worldwide</p>
        </div>

        {/* Metric 4: Total Recorded Sessions */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-purple-300">
            <span>TOTAL SESSIONS</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-200 font-mono">
            {data ? data.total_records : "..."}
          </div>
          <p className="text-xs text-slate-400">Visitor interactions recorded</p>
        </div>
      </div>

      {/* ── INTERACTIVE GIS GEOGRAPHIC LISTENER RADAR ── */}
      <WorldVisitorMap
        points={data?.geo_map_points || []}
        liveCount={data?.live_online_count || 0}
      />

      {/* ── GEOGRAPHIC & DEVICE BREAKDOWN ANALYTICS ── */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Top Countries */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <h4 className="text-sm font-bold text-amber-200 font-mono flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" /> Top Countries
            </h4>
            <div className="space-y-2.5 text-xs">
              {data.top_countries.length === 0 ? (
                <p className="text-slate-500 text-xs">No country data recorded yet.</p>
              ) : (
                data.top_countries.map((c) => (
                  <div key={c.name} className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span>{getCountryFlag(c.code)}</span>
                        <span>{c.name}</span>
                      </span>
                      <span className="font-mono text-slate-400">
                        {c.count} ({c.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, c.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Cities */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <h4 className="text-sm font-bold text-cyan-200 font-mono flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" /> Top Cities
            </h4>
            <div className="space-y-2.5 text-xs">
              {data.top_cities.length === 0 ? (
                <p className="text-slate-500 text-xs">No city data recorded yet.</p>
              ) : (
                data.top_cities.map((city) => (
                  <div key={city.name} className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>{city.name}</span>
                      <span className="font-mono text-slate-400">
                        {city.count} ({city.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, city.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Device & OS Share */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <h4 className="text-sm font-bold text-emerald-200 font-mono flex items-center gap-2">
              <Laptop className="w-4 h-4 text-emerald-400" /> Device Distribution
            </h4>
            <div className="space-y-2.5 text-xs">
              {data.device_breakdown.length === 0 ? (
                <p className="text-slate-500 text-xs">No device data recorded yet.</p>
              ) : (
                data.device_breakdown.map((dev) => (
                  <div key={dev.name} className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span className="flex items-center gap-1.5">
                        {getDeviceIcon(dev.name)}
                        <span>{dev.name}</span>
                      </span>
                      <span className="font-mono text-slate-400">
                        {dev.count} ({dev.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, dev.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVE & HISTORICAL SESSIONS TABLE ── */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl p-6 space-y-4">
        {/* Table Filters Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-serif font-bold text-amber-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" /> Active & Historical Visitor Sessions
            </h3>
            <p className="text-xs text-slate-400">
              Live tracking enriched with client IP, GeoIP ISP details, active streaming tracks, and IP block protection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search IP, City, Song, ISP..."
                className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition font-mono w-48 sm:w-60"
              />
            </div>

            {/* Status Filter Toggle */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setStatusFilter("all")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                  statusFilter === "all"
                    ? "bg-slate-800 text-slate-100 shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>All</span>
                {data && (
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 text-[10px]">
                    {data.total_records}
                  </span>
                )}
              </button>
              <button
                onClick={() => setStatusFilter("online")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                  statusFilter === "online"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Now</span>
                {data && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      data.live_online_count > 0
                        ? "bg-emerald-500/30 text-emerald-200"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {data.live_online_count}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex items-center justify-center p-16">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        ) : !data || data.visitors.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-medium">No visitor sessions match your current filter.</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {statusFilter === "online"
                ? "There are currently no active visitors streaming tracks in the last 5 minutes."
                : "When listeners visit Nostalgic Moments or stream tracks, their live sessions and GeoIP location appear here."}
            </p>
            {(statusFilter !== "all" || search) && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSearch("");
                }}
                className="mt-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono transition"
              >
                Reset Filters & View All Sessions
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase font-mono text-slate-400 tracking-wider">
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">IP Address & ISP</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Device & OS</th>
                  <th className="px-4 py-3 text-left">Environment & Song</th>
                  <th className="px-4 py-3 text-center hidden lg:table-cell">Listened</th>
                  <th className="px-4 py-3 text-right">Last Seen</th>
                  <th className="px-4 py-3 text-center">IP Shield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.visitors.map((v) => {
                  const isLive = v.is_online;
                  const isBlocked = v.is_blocked;

                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* Live Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            Live Now
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            Offline
                          </span>
                        )}
                      </td>

                      {/* IP Address & ISP */}
                      <td className="px-4 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-200 font-bold">
                              {v.ip_address}
                            </span>
                            <button
                              onClick={() => handleCopyIp(v.ip_address)}
                              className="text-slate-500 hover:text-amber-300 transition"
                              title="Copy IP Address"
                            >
                              {copiedIp === v.ip_address ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            {isBlocked && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-mono">
                                BLOCKED
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono truncate max-w-[200px]" title={v.isp}>
                            {v.isp || "Unknown Provider"}
                          </p>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-200 font-medium">
                            <span className="text-base">{getCountryFlag(v.country_code)}</span>
                            <span>{v.city || "Unknown City"}</span>
                            <span className="text-slate-500 text-[11px]">({v.country})</span>
                          </div>
                          {v.region && (
                            <p className="text-[11px] text-slate-500 font-sans">
                              {v.region}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Device & OS */}
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                            {getDeviceIcon(v.device)}
                          </div>
                          <div className="text-xs font-mono text-slate-300">
                            <div>{v.os}</div>
                            <div className="text-[10px] text-slate-500">{v.browser}</div>
                          </div>
                        </div>
                      </td>

                      {/* Environment & Active Song */}
                      <td className="px-4 py-4">
                        <div className="space-y-1 min-w-0 max-w-xs">
                          {v.current_environment && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-serif">
                              <Compass className="w-3 h-3 text-amber-400" />
                              {v.current_environment}
                            </span>
                          )}
                          {v.current_song_title ? (
                            <div className="flex items-center gap-1 text-xs text-slate-300 truncate">
                              <Music className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">{v.current_song_title}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono">Browsing catalog</span>
                          )}
                        </div>
                      </td>

                      {/* Total Duration Listened */}
                      <td className="px-4 py-4 text-center hidden lg:table-cell font-mono text-xs text-slate-300">
                        <span className="font-semibold text-amber-300">
                          {Math.round((v.total_duration_listened || 0) / 60)} mins
                        </span>
                        <div className="text-[10px] text-slate-500">{v.total_visits} visits</div>
                      </td>

                      {/* Last Seen */}
                      <td className="px-4 py-4 text-right font-mono text-xs text-slate-400">
                        {formatRelativeTime(v.last_seen_at)}
                      </td>

                      {/* IP Block Shield Action Button */}
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => openBlockModal(v)}
                          disabled={blockingIp === v.ip_address}
                          className={`p-2 rounded-xl text-xs font-mono transition flex items-center justify-center gap-1 mx-auto ${
                            v.is_blocked
                              ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 shadow-lg shadow-rose-950/40"
                              : "bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700"
                          }`}
                          title={v.is_blocked ? "Manage IP Block Rule" : "Block IP Address"}
                        >
                          {v.is_blocked ? (
                            <ShieldAlert className="w-4 h-4 text-rose-400" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {data && data.total_records > 30 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs font-mono text-slate-400">
            <span>
              Showing {(page - 1) * 30 + 1} - {Math.min(page * 30, data.total_records)} of {data.total_records} sessions
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition"
              >
                Previous
              </button>
              <span className="px-2 text-slate-300 font-bold">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 30 >= data.total_records}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── LUXURY IP SHIELD CONFIRMATION MODAL ── */}
      {ipModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md rounded-3xl bg-slate-950 border border-slate-800 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIpModal((prev) => ({ ...prev, isOpen: false }))}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3.5">
              <div
                className={`p-3 rounded-2xl border ${
                  ipModal.isBlocked
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                }`}
              >
                {ipModal.isBlocked ? (
                  <Unlock className="w-6 h-6" />
                ) : (
                  <Lock className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  IP Security Shield
                </span>
                <h3 className="text-lg font-serif font-bold text-slate-100">
                  {ipModal.isBlocked ? "Unblock IP Address" : "Restrict IP Access"}
                </h3>
              </div>
            </div>

            {/* Target Details Card */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target IP:</span>
                <span className="text-amber-300 font-bold text-sm">{ipModal.ip}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="text-slate-200 flex items-center gap-1">
                  <span>{getCountryFlag(ipModal.countryCode)}</span>
                  <span>{ipModal.city || "Unknown City"}</span>
                  <span className="text-slate-500">({ipModal.country || "Unknown"})</span>
                </span>
              </div>
              {ipModal.isp && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Network ISP:</span>
                  <span className="text-slate-300 truncate max-w-[180px]">{ipModal.isp}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Current Status:</span>
                <span
                  className={`font-bold ${
                    ipModal.isBlocked ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {ipModal.isBlocked ? "🔴 Actively Blocked" : "🟢 Allowed"}
                </span>
              </div>
            </div>

            {/* Action Explanation */}
            <p className="text-xs text-slate-400 leading-relaxed">
              {ipModal.isBlocked
                ? "Unblocking will immediately restore music streaming, ambience mixer, and platform access for all visitors on this IP."
                : "Blocking will immediately restrict this IP from streaming tracks, accessing experiences, or fetching catalog data."}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIpModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={blockingIp === ipModal.ip}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleBlock}
                disabled={blockingIp === ipModal.ip}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition shadow-xl ${
                  ipModal.isBlocked
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/50"
                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50"
                }`}
              >
                {blockingIp === ipModal.ip ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : ipModal.isBlocked ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Confirm Unblock IP</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>Block IP Address</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
