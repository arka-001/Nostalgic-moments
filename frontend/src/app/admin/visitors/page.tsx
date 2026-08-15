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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const handleToggleBlock = async (ip: string) => {
    const confirmAction = window.confirm(`Are you sure you want to toggle block status for IP: ${ip}?`);
    if (!confirmAction) return;

    setBlockingIp(ip);
    try {
      const res = await toggleBlockIp(ip);
      await loadData(true);
      alert(res.message);
    } catch (err: any) {
      alert(`Failed to update IP block: ${err.message || "Unknown error"}`);
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
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
            title="Toggle live auto-refresh every 10 seconds"
          >
            <Activity className={`w-3.5 h-3.5 ${autoRefresh ? "animate-pulse text-emerald-400" : ""}`} />
            <span>{autoRefresh ? "Auto-Refresh On" : "Auto-Refresh Off"}</span>
          </button>

          <button
            onClick={() => loadData()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── METRICS OVERVIEW CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Live Online Listeners */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 border border-emerald-500/30 shadow-xl backdrop-blur-xl group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Now
            </span>
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-300">
            {data?.live_online_count ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-serif">Active Online Listeners</div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/80 font-mono">
            Active in last 3 minutes
          </div>
        </div>

        {/* Total Unique Visitors */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 shadow-xl backdrop-blur-xl group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              Total Audience
            </span>
          </div>
          <div className="text-3xl font-bold font-mono text-cyan-300">
            {data?.total_unique_visitors ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-serif">Unique IP Sessions</div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/80 font-mono">
            Across all environments
          </div>
        </div>

        {/* Global Reach */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 shadow-xl backdrop-blur-xl group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
              Geographic
            </span>
          </div>
          <div className="text-3xl font-bold font-mono text-purple-300">
            {data?.total_countries_reached ?? 1}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-serif">Countries Reached</div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/80 font-mono">
            {data?.top_cities?.[0]?.name ? `Top City: ${data.top_cities[0].name}` : "Global Network"}
          </div>
        </div>

        {/* Device Landscape */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 shadow-xl backdrop-blur-xl group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Laptop className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Platforms
            </span>
          </div>
          <div className="text-3xl font-bold font-mono text-amber-300">
            {data?.device_breakdown?.[0]?.name ?? "Desktop"}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-serif">Leading Device Type</div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/80 font-mono">
            {data?.browser_breakdown?.[0]?.name ? `Top Browser: ${data.browser_breakdown[0].name}` : "Web Audio API"}
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE WORLD VISITOR MAP ── */}
      <WorldVisitorMap
        points={data?.geo_map_points || []}
        liveCount={data?.live_online_count || 1}
      />

      {/* ── GEOGRAPHIC & PLATFORM BREAKDOWN SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Countries Card */}
        <div className="lg:col-span-6 bg-slate-900/85 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <h2 className="text-base font-serif font-bold text-amber-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" /> Geographic Country Distribution
            </h2>
            <span className="text-xs font-mono text-slate-400">Top Listener Locations</span>
          </div>

          <div className="space-y-3">
            {data?.top_countries && data.top_countries.length > 0 ? (
              data.top_countries.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-200 font-medium">
                      <span className="text-base">{getCountryFlag(c.code)}</span>
                      <span>{c.name}</span>
                    </span>
                    <span className="font-mono text-slate-400">
                      <strong className="text-amber-300 font-bold">{c.count}</strong> listeners ({c.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, c.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No country data tracked yet.</p>
            )}
          </div>
        </div>

        {/* Top Cities Card */}
        <div className="lg:col-span-6 bg-slate-900/85 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <h2 className="text-base font-serif font-bold text-amber-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" /> Top Listener Cities & Regions
            </h2>
            <span className="text-xs font-mono text-slate-400">Regional Concentrations</span>
          </div>

          <div className="space-y-3">
            {data?.top_cities && data.top_cities.length > 0 ? (
              data.top_cities.map((city) => (
                <div key={city.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-200 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate max-w-xs">{city.name}</span>
                    </span>
                    <span className="font-mono text-slate-400">
                      <strong className="text-cyan-300 font-bold">{city.count}</strong> sessions ({city.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, city.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No city data available yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── LIVE VISITORS INTELLIGENCE TABLE ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-4 p-6 sm:p-8">
        {/* Controls & Search Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-xl font-serif font-bold text-amber-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" /> Active & Historical Visitor Sessions
            </h2>
            <p className="text-xs text-slate-400">
              Live tracking enriched with client IP, GeoIP ISP details, active streaming tracks, and IP block protection.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                  statusFilter === "all"
                    ? "bg-slate-800 text-slate-100 shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All
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
                Live Now
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
          <div className="p-16 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-medium">No visitor sessions match your filter.</p>
            <p className="text-xs text-slate-500">
              When listeners visit Nostalgic Moments or stream tracks, their live sessions and GeoIP location appear here.
            </p>
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
                  <th className="px-4 py-3 text-center">Shield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.visitors.map((v) => {
                  const isCopied = copiedIp === v.ip_address;
                  const isBlocking = blockingIp === v.ip_address;

                  return (
                    <tr key={v.id} className="hover:bg-slate-800/30 transition">
                      {/* Status */}
                      <td className="px-4 py-4">
                        {v.is_blocked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                            <Ban className="w-3 h-3" /> Blocked
                          </span>
                        ) : v.is_online ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700">
                            Idle
                          </span>
                        )}
                      </td>

                      {/* IP Address & ISP */}
                      <td className="px-4 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-100">
                            <span>{v.ip_address}</span>
                            <button
                              onClick={() => handleCopyIp(v.ip_address)}
                              className="text-slate-500 hover:text-amber-400 transition"
                              title="Copy IP Address"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs font-sans">
                            {v.isp || "Broadband / Provider"}
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

                      {/* IP Block Shield Action */}
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleToggleBlock(v.ip_address)}
                          disabled={isBlocking}
                          className={`p-2 rounded-xl text-xs font-mono transition flex items-center justify-center gap-1 mx-auto ${
                            v.is_blocked
                              ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40"
                              : "bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700"
                          }`}
                          title={v.is_blocked ? "Unblock IP Address" : "Block IP Address"}
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
    </div>
  );
}
