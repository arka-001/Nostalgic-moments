"use client";

import { useEffect, useState } from "react";
import {
  Youtube,
  Key,
  ShieldCheck,
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  AlertTriangle,
  FolderOpen,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ListMusic,
  Info,
  Edit2,
  Check,
} from "lucide-react";
import {
  fetchYouTubeSettings,
  updateYouTubeSettings,
  testYouTubeConnection,
  fetchYouTubePlaylists,
  createYouTubePlaylist,
  syncYouTubePlaylist,
  updateYouTubePlaylist,
  deleteYouTubePlaylist,
  fetchCategories,
} from "@/lib/api";
import {
  YouTubeSettings,
  YouTubePlaylist,
  YouTubeImportResult,
  Category,
} from "@/types";

export default function AdminYouTubePage() {
  const [settings, setSettings] = useState<YouTubeSettings | null>(null);
  const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings State
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  // Add Playlist Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [playlistActive, setPlaylistActive] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<YouTubeImportResult | null>(
    null
  );

  // Syncing state per playlist
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Edit Playlist Modal State
  const [editingPlaylist, setEditingPlaylist] = useState<YouTubePlaylist | null>(
    null
  );
  const [editTitle, setEditTitle] = useState("");
  const [editCatId, setEditCatId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, playlistsData, catsData] = await Promise.all([
        fetchYouTubeSettings().catch(() => null),
        fetchYouTubePlaylists(),
        fetchCategories(true),
      ]);
      setSettings(settingsData);
      setPlaylists(playlistsData);
      setCategories(catsData);
      if (catsData.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(catsData[0].id);
      }
    } catch (err) {
      console.error("Error loading YouTube management data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Save Settings
  const handleSaveSettings = async (
    overrideEnabled?: boolean,
    newKey?: string
  ) => {
    setSavingSettings(true);
    setSettingsError(null);
    setSettingsSuccess(null);
    try {
      const isEnabled =
        overrideEnabled !== undefined
          ? overrideEnabled
          : settings?.is_enabled ?? true;
      const keyToSave = newKey !== undefined ? newKey : (isEditingKey && apiKeyInput.trim() ? apiKeyInput.trim() : undefined);

      const updated = await updateYouTubeSettings({
        is_enabled: isEnabled,
        api_key: keyToSave,
      });
      setSettings(updated);
      setIsEditingKey(false);
      setApiKeyInput("");
      setSettingsSuccess("YouTube configuration saved securely.");
      setTimeout(() => setSettingsSuccess(null), 4000);
    } catch (err: any) {
      setSettingsError(err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle Test Connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testYouTubeConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Connection test failed",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Handle Add & Import Playlist
  const handleAddPlaylist = async () => {
    if (!playlistUrl.trim()) {
      setImportError("Please enter a YouTube playlist URL or ID.");
      return;
    }
    if (!selectedCategoryId) {
      setImportError("Please select a target environment.");
      return;
    }

    setImporting(true);
    setImportError(null);
    try {
      const res = await createYouTubePlaylist({
        url_or_id: playlistUrl.trim(),
        category_id: selectedCategoryId,
        is_active: playlistActive,
      });
      setImportResult(res);
      setPlaylistUrl("");
      await loadData();
    } catch (err: any) {
      setImportError(err.message || "Failed to import YouTube playlist.");
    } finally {
      setImporting(false);
    }
  };

  // Handle Sync Playlist
  const handleSyncPlaylist = async (playlist: YouTubePlaylist) => {
    setSyncingId(playlist.id);
    try {
      const res = await syncYouTubePlaylist(playlist.id);
      setImportResult(res);
      await loadData();
    } catch (err: any) {
      alert(`Sync failed: ${err.message || "Unknown error"}`);
    } finally {
      setSyncingId(null);
    }
  };

  // Handle Toggle Active Status
  const handleTogglePlaylistActive = async (playlist: YouTubePlaylist) => {
    try {
      await updateYouTubePlaylist(playlist.id, {
        is_active: !playlist.is_active,
      });
      await loadData();
    } catch (err: any) {
      console.error(err);
    }
  };

  // Open Edit Modal
  const openEditModal = (pl: YouTubePlaylist) => {
    setEditingPlaylist(pl);
    setEditTitle(pl.title);
    setEditCatId(pl.category_id);
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editingPlaylist) return;
    setSavingEdit(true);
    try {
      await updateYouTubePlaylist(editingPlaylist.id, {
        title: editTitle,
        category_id: editCatId,
      });
      setEditingPlaylist(null);
      await loadData();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Delete Playlist
  const handleDeletePlaylist = async (playlist: YouTubePlaylist) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove playlist "${playlist.title}"?\n\nThis will remove its songs from the "${playlist.category_name}" environment. Shared songs used by other environments will be preserved.`
    );
    if (!confirmDelete) return;

    try {
      await deleteYouTubePlaylist(playlist.id);
      await loadData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return "Never synced";
    const date = new Date(isoString);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSecs < 60) return "Just now";
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)} mins ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)} hours ago`;
    return `${Math.floor(diffSecs / 86400)} days ago`;
  };

  return (
    <div className="space-y-8 max-w-6xl pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Youtube className="w-3.5 h-3.5" /> Official Data API v3
            </span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Server-Side Encrypted
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-amber-100">
            YouTube Integration & Playlists
          </h1>
          <p className="text-sm text-slate-400">
            Manage your encrypted YouTube Data API configuration and sync public playlists with Nostalgic Moments environments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono transition"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`}
            />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setImportResult(null);
              setImportError(null);
              setPlaylistUrl("");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" /> Add Playlist
          </button>
        </div>
      </div>

      {/* ── SECTION 1: YOUTUBE API SETTINGS CARD ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-amber-100">
                YouTube API Settings
              </h2>
              <p className="text-xs text-slate-400">
                Encrypted at rest using AES-256 (Fernet) • Decrypted only in server memory
              </p>
            </div>
          </div>

          {/* Integration Status Toggle */}
          <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-2.5 rounded-2xl border border-slate-800">
            <span className="text-xs font-mono text-slate-400">Status:</span>
            <button
              onClick={() => handleSaveSettings(!settings?.is_enabled)}
              disabled={savingSettings}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                settings?.is_enabled
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              {settings?.is_enabled ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Enabled
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  Disabled
                </>
              )}
            </button>
          </div>
        </div>

        {/* API Key Form Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-8 space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
              YouTube Data API Key
            </label>

            {isEditingKey ? (
              <div className="space-y-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Paste YouTube Data API key (e.g. AIzaSy...)"
                  className="w-full px-4 py-3 bg-slate-950 border border-amber-500/40 rounded-2xl text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-400 transition"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveSettings(undefined, apiKeyInput)}
                    disabled={savingSettings || !apiKeyInput.trim()}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition flex items-center gap-1.5"
                  >
                    {savingSettings ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Save Key
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingKey(false);
                      setApiKeyInput("");
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-slate-200">
                      {settings?.masked_key || "Not Configured"}
                    </span>
                    {settings?.is_configured && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Configured ✓
                      </span>
                    )}
                  </div>
                  {settings?.updated_at && (
                    <span className="text-[11px] font-mono text-slate-500">
                      Updated {formatRelativeTime(settings.updated_at)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsEditingKey(true)}
                  className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition shrink-0 flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  {settings?.is_configured ? "Replace API Key" : "Configure Key"}
                </button>
              </div>
            )}

            {settingsSuccess && (
              <p className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {settingsSuccess}
              </p>
            )}
            {settingsError && (
              <p className="text-xs font-mono text-rose-400 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" /> {settingsError}
              </p>
            )}
          </div>

          {/* Connection Test Column */}
          <div className="md:col-span-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                API Diagnostics
              </span>
              <button
                onClick={handleTestConnection}
                disabled={testingConnection || !settings?.is_configured}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold transition disabled:opacity-40 flex items-center gap-1.5"
              >
                {testingConnection ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                Test Connection
              </button>
            </div>

            {testResult ? (
              <div
                className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                  testResult.success
                    ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-950/40 border-rose-500/30 text-rose-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {testResult.success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Connected ✓</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Connection Failed ✕</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  {testResult.message}
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                Click <strong>Test Connection</strong> to perform a minimal read probe against YouTube Data API v3.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: YOUTUBE PLAYLISTS TABLE ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-4 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <h2 className="text-xl font-serif font-bold text-amber-100 flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-amber-400" /> Managed YouTube Playlists
            </h2>
            <p className="text-xs text-slate-400">
              Assigned YouTube playlists sync directly into Nostalgic Moments environment queues without downloading any media.
            </p>
          </div>
          <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 w-fit">
            {playlists.length} {playlists.length === 1 ? "Playlist" : "Playlists"} Configured
          </span>
        </div>

        {/* Playlists Table */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        ) : playlists.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Youtube className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <p className="text-slate-300 font-medium">No YouTube playlists added yet.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click "+ Add Playlist" above to import a YouTube playlist into an environment like Running Bus or Tea Stall.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase font-mono text-slate-400 tracking-wider">
                  <th className="px-4 py-3 text-left">Playlist Name</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Playlist ID</th>
                  <th className="px-4 py-3 text-left">Environment</th>
                  <th className="px-4 py-3 text-center">Songs</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center hidden lg:table-cell">Last Sync</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {playlists.map((pl) => {
                  const isSyncing = syncingId === pl.id;
                  return (
                    <tr key={pl.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                            {pl.thumbnail_url ? (
                              <img
                                src={pl.thumbnail_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Youtube className="w-5 h-5 text-red-400" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <span className="font-semibold text-slate-200 truncate block">
                              {pl.title}
                            </span>
                            <a
                              href={`https://www.youtube.com/playlist?list=${pl.playlist_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-amber-400/80 hover:text-amber-300 font-mono inline-flex items-center gap-1"
                            >
                              <span>Open on YouTube</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 hidden md:table-cell font-mono text-xs text-slate-400">
                        {pl.playlist_id}
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 font-serif">
                          <FolderOpen className="w-3 h-3 text-amber-400" />
                          {pl.category_name || "Environment"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center font-mono text-xs font-semibold text-slate-200">
                        {pl.song_count} songs
                      </td>

                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleTogglePlaylistActive(pl)}
                          className="text-xs transition"
                          title="Toggle active status"
                        >
                          {pl.is_active ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <ToggleRight className="w-4 h-4" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                              <ToggleLeft className="w-4 h-4" /> Off
                            </span>
                          )}
                        </button>
                      </td>

                      <td className="px-4 py-4 text-center hidden lg:table-cell font-mono text-xs text-slate-400">
                        {formatRelativeTime(pl.last_synced_at)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Sync Button */}
                          <button
                            onClick={() => handleSyncPlaylist(pl)}
                            disabled={isSyncing}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-xs font-mono font-medium transition flex items-center gap-1.5 disabled:opacity-50"
                            title="Re-synchronize with YouTube playlist"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${isSyncing ? "animate-spin text-amber-400" : ""}`}
                            />
                            <span>{isSyncing ? "Syncing..." : "Sync"}</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(pl)}
                            className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                            title="Edit Playlist Settings"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeletePlaylist(pl)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Delete Playlist & Detach Songs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL 1: ADD PLAYLIST MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <Youtube className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-amber-100">
                    Add YouTube Playlist
                  </h2>
                  <p className="text-xs text-slate-400">
                    Import videos directly into a nostalgic environment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* URL Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                  YouTube Playlist URL or ID *
                </label>
                <input
                  type="text"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  placeholder="https://www.youtube.com/playlist?list=PL..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition font-mono"
                />
                <p className="text-[11px] text-slate-500 font-sans">
                  Supports full YouTube URLs, Music YouTube URLs, or raw playlist IDs.
                </p>
              </div>

              {/* Environment Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                  Assign to Environment *
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.slug})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs text-slate-300 font-medium">
                  Enable in Environment
                </span>
                <button
                  type="button"
                  onClick={() => setPlaylistActive((v) => !v)}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition flex items-center gap-1.5 ${
                    playlistActive
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {playlistActive ? (
                    <>
                      <ToggleRight className="w-4 h-4" /> Enabled
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" /> Disabled
                    </>
                  )}
                </button>
              </div>

              {importError && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs font-mono flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>{importError}</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800 bg-slate-950/40">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPlaylist}
                disabled={importing || !playlistUrl.trim()}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition flex items-center gap-2 shadow-md shadow-amber-500/20"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importing Videos...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Import Playlist</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: EDIT PLAYLIST MODAL ── */}
      {editingPlaylist && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-lg font-serif font-bold text-amber-100">
                Edit YouTube Playlist
              </h2>
              <button
                onClick={() => setEditingPlaylist(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300">
                  Playlist Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300">
                  Target Environment
                </label>
                <select
                  value={editCatId}
                  onChange={(e) => setEditCatId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800 bg-slate-950/40">
              <button
                onClick={() => setEditingPlaylist(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: IMPORT / SYNC SUMMARY RESULT MODAL ── */}
      {importResult && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-serif font-bold text-amber-100">
                  Playlist Sync Complete
                </h3>
              </div>
              <button
                onClick={() => {
                  setImportResult(null);
                  setShowAddModal(false);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                  Target Environment: {importResult.category}
                </span>
                <h4 className="text-base font-serif font-bold text-slate-100">
                  {importResult.playlist_title}
                </h4>
                <p className="text-xs font-mono text-slate-400">
                  ID: {importResult.playlist_id}
                </p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-2xl font-bold font-mono text-amber-300">
                    {importResult.total_items}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                    Total Videos
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-center">
                  <div className="text-2xl font-bold font-mono text-emerald-300">
                    +{importResult.imported}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400/80 uppercase mt-0.5">
                    Imported New
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-center">
                  <div className="text-2xl font-bold font-mono text-blue-300">
                    {importResult.already_existing}
                  </div>
                  <div className="text-[10px] font-mono text-blue-400/80 uppercase mt-0.5">
                    Reused Existing
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
                <span>Playlist Order Preserved:</span>
                <span className="text-emerald-400 font-semibold">✓ Exact Sequence</span>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button
                onClick={() => {
                  setImportResult(null);
                  setShowAddModal(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
