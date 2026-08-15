"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Loader2, X, Music, Upload,
  Save, ToggleLeft, ToggleRight, FolderOpen, ArrowUp, ArrowDown,
  GripVertical, Search, Youtube, ExternalLink,
} from "lucide-react";
import {
  fetchSongs,
  fetchCategories,
  createSong,
  updateSong,
  deleteSong,
  searchSongs,
  uploadAudioFile,
  uploadImageFile,
  fetchCategoryBySlug,
  attachSongToCategory,
  detachSongFromCategory,
  reorderCategorySongs,
} from "@/lib/api";
import { Song, Category } from "@/types";

const emptyForm = {
  title: "", artist: "", album: "", duration: "", audio_url: "", cover_url: "",
  is_active: true, category_ids: [] as string[],
};

export default function AdminSongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>("");
  const [playlistSongs, setPlaylistSongs] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const audioRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [songsData, catsData] = await Promise.all([
        fetchSongs(true),
        fetchCategories(true),
      ]);
      setSongs(songsData);
      setCategories(catsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Debounced search handler (300-500ms)
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      if (q.trim()) {
        try {
          const results = await searchSongs(q.trim(), true);
          setSongs(results);
        } catch (err) {
          console.error("Search error:", err);
        }
      } else {
        const allSongs = await fetchSongs(true);
        setSongs(allSongs);
      }
    }, 400);
  };

  const openCreate = () => {
    setEditingSong(null);
    setForm(emptyForm);
    setError(null);
    setUploadProgress("");
    setShowModal(true);
  };

  const openEdit = (song: Song) => {
    setEditingSong(song);
    setForm({
      title: song.title, artist: song.artist, album: song.album || "",
      duration: song.duration?.toString() || "", audio_url: song.audio_url || "",
      cover_url: song.cover_url || "", is_active: song.is_active,
      category_ids: song.category_ids || [],
    });
    setError(null);
    setUploadProgress("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.artist) {
      setError("Title and Artist are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<Song> = {
        title: form.title,
        artist: form.artist,
        album: form.album || undefined,
        duration: form.duration ? parseFloat(form.duration) : undefined,
        audio_url: form.audio_url || undefined,
        cover_url: form.cover_url || undefined,
        is_active: form.is_active,
        category_ids: form.category_ids,
      };

      if (editingSong) {
        await updateSong(editingSong.id, payload);
      } else {
        await createSong(payload);
      }

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save song");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (song: Song) => {
    if (!confirm(`Delete "${song.title}" by ${song.artist}?`)) return;
    try {
      await deleteSong(song.id);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleActive = async (song: Song) => {
    try {
      await updateSong(song.id, { is_active: !song.is_active });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const uploadAudio = async (file: File) => {
    // Auto-detect audio duration in browser
    try {
      const audioUrl = URL.createObjectURL(file);
      const audio = new Audio(audioUrl);
      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          const durationSeconds = Math.round(audio.duration);
          setForm((f) => ({ ...f, duration: durationSeconds.toString() }));
        }
      };
    } catch (err) {
      console.warn("Could not auto-detect audio duration", err);
    }

    // Auto-fill title from filename if title is empty
    if (file.name) {
      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      setForm((f) => ({ ...f, title: f.title || cleanTitle }));
    }

    setUploadingAudio(true);
    setUploadProgress(`Uploading ${file.name} via FastAPI storage endpoint...`);
    try {
      const data = await uploadAudioFile(file);
      setForm((f) => ({ ...f, audio_url: data.url }));
      setUploadProgress(`✓ Uploaded: ${file.name} (Duration auto-detected!)`);
    } catch (e: any) {
      setError(e.message || "Audio upload failed");
      setUploadProgress("");
    } finally {
      setUploadingAudio(false);
    }
  };

  const uploadCover = async (file: File) => {
    setUploadingCover(true);
    try {
      const data = await uploadImageFile(file, "covers");
      setForm((f) => ({ ...f, cover_url: data.url }));
    } catch (e: any) {
      setError(e.message || "Cover upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  // Playlist management
  const loadPlaylist = async (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    setSelectedCat(catId);
    try {
      const catDetail = await fetchCategoryBySlug(cat.slug);
      setPlaylistSongs(catDetail?.songs || []);
      setShowPlaylistModal(true);
    } catch (e) {
      console.error("Failed to load category playlist:", e);
    }
  };

  const removeSongFromCat = async (songId: string) => {
    try {
      await detachSongFromCategory(selectedCat, songId);
      await loadPlaylist(selectedCat);
    } catch (e) {
      console.error("Failed to remove song from category:", e);
    }
  };

  const moveSong = async (idx: number, direction: "up" | "down") => {
    const newList = [...playlistSongs];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newList.length) return;

    const previousOrder = [...playlistSongs];
    [newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]];
    setPlaylistSongs(newList);

    const items = newList.map((s, i) => ({ song_id: s.id, sort_order: i + 1 }));
    try {
      await reorderCategorySongs(selectedCat, items);
    } catch (err) {
      console.error("Reorder failed, restoring order:", err);
      setPlaylistSongs(previousOrder);
    }
  };

  const addSongToCat = async (songId: string) => {
    try {
      await attachSongToCategory(selectedCat, songId, playlistSongs.length + 1);
      await loadPlaylist(selectedCat);
    } catch (e) {
      console.error("Failed to attach song to category:", e);
    }
  };

  const toggleCategoryForSong = (catId: string) => {
    setForm((f) => ({
      ...f,
      category_ids: f.category_ids.includes(catId)
        ? f.category_ids.filter((id) => id !== catId)
        : [...f.category_ids, catId],
    }));
  };

  const formatDuration = (secs?: number) => {
    if (!secs) return "--";
    return `${Math.floor(secs / 60)}:${Math.floor(secs % 60).toString().padStart(2, "0")}`;
  };

  const playlistSongIds = new Set(playlistSongs.map((s: any) => s.id));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-amber-100">Songs</h1>
          <p className="text-sm text-slate-400">Upload MP3s and manage song catalog.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadPlaylist(categories[0]?.id || "")}
            disabled={!categories.length}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition disabled:opacity-40"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" /> Manage Playlist
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" /> Upload Song
          </button>
        </div>
      </div>

      {/* Debounced Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by song title, artist, or album..."
          className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Songs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        ) : songs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Music className="w-10 h-10 text-slate-600 mx-auto" />
            <p>{searchQuery ? "No songs match your search." : "No songs yet. Upload your first MP3 →"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase text-slate-400 tracking-wider">
                  <th className="px-6 py-4 text-left">Song</th>
                  <th className="px-4 py-4 text-left hidden md:table-cell">Artist</th>
                  <th className="px-4 py-4 text-center">Source</th>
                  <th className="px-4 py-4 text-center hidden lg:table-cell">Duration</th>
                  <th className="px-4 py-4 text-center">Media</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {songs.map((song) => {
                  const isYouTube = song.source_type === "youtube" || Boolean(song.youtube_video_id);
                  return (
                    <tr key={song.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                            {song.cover_url ? (
                              <img src={song.cover_url} alt="" className="w-full h-full object-cover" />
                            ) : isYouTube ? (
                              <Youtube className="w-4 h-4 text-red-400" />
                            ) : (
                              <Music className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <span className="font-medium text-slate-200 truncate block">
                              {song.title}
                            </span>
                            {isYouTube && song.youtube_url && (
                              <a
                                href={song.youtube_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-red-400/80 hover:text-red-300 font-mono inline-flex items-center gap-1"
                              >
                                <span>Open YouTube</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell text-slate-400">
                        {song.artist}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {isYouTube ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                            <Youtube className="w-3 h-3" /> YouTube
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            <Music className="w-3 h-3" /> Uploaded
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center hidden lg:table-cell font-mono text-slate-400 text-xs">
                        {formatDuration(song.duration)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {isYouTube ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-300 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
                            ✓ YouTube Stream
                          </span>
                        ) : song.audio_url ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                            ✓ Media URL
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">No audio</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => toggleActive(song)} className="text-xs">
                          {song.is_active ? (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <ToggleRight className="w-5 h-5" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-500">
                              <ToggleLeft className="w-5 h-5" /> Off
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(song)}
                            className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(song)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Create / Edit Song Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-serif font-bold text-amber-100">
                {editingSong ? "Edit Song" : "Upload New Song"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* MP3 Upload Section */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  MP3 Audio File → FastAPI Storage Endpoint
                </label>
                <div
                  onClick={() => audioRef.current?.click()}
                  className="w-full border-2 border-dashed border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-6 flex flex-col items-center gap-3 cursor-pointer transition bg-amber-500/5"
                >
                  {uploadingAudio ? (
                    <>
                      <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                      <p className="text-sm text-amber-300">Uploading file via FastAPI...</p>
                    </>
                  ) : form.audio_url ? (
                    <>
                      <Music className="w-10 h-10 text-emerald-400" />
                      <p className="text-xs text-emerald-400 break-all text-center max-w-md">
                        ✓ {form.audio_url.split("/").pop()}
                      </p>
                      <p className="text-xs text-slate-400">Click to replace</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-amber-400/60" />
                      <p className="text-sm text-amber-300">Click to upload MP3</p>
                      <p className="text-xs text-slate-500">MP3, WAV, OGG, AAC, M4A, FLAC — up to 50MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={audioRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadAudio(f);
                  }}
                />
                {uploadProgress && (
                  <p className="text-xs text-emerald-400 font-mono bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-900/60">
                    {uploadProgress}
                  </p>
                )}
              </div>

              {/* Title & Artist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Pal Pal Dil Ke Paas"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">Artist *</label>
                  <input
                    type="text"
                    value={form.artist}
                    onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))}
                    placeholder="Kishore Kumar"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Album & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">Album</label>
                  <input
                    type="text"
                    value={form.album}
                    onChange={(e) => setForm((f) => ({ ...f, album: e.target.value }))}
                    placeholder="Blackmail (1973)"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">Duration (seconds)</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    placeholder="240"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Cover Art */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">Cover Image</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={form.cover_url}
                    onChange={(e) => setForm((f) => ({ ...f, cover_url: e.target.value }))}
                    placeholder="https://... or upload →"
                    className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                  <button
                    onClick={() => coverRef.current?.click()}
                    disabled={uploadingCover}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition flex items-center gap-2 shrink-0"
                  >
                    {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload
                  </button>
                  <input ref={coverRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); }}
                  />
                </div>
                {form.cover_url && (
                  <img src={form.cover_url} alt="cover" className="w-16 h-16 rounded-xl object-cover border border-slate-700" />
                )}
              </div>

              {/* Add to Environments */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Add to Environments
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const selected = form.category_ids.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategoryForSong(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                          selected
                            ? "bg-amber-500 text-black border-amber-400"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:border-amber-500/50"
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Toggle */}
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition flex items-center gap-2 ${
                  form.is_active
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                {form.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {form.is_active ? "Active" : "Disabled"}
              </button>

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-semibold text-sm transition flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingSong ? "Save Changes" : "Add Song"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playlist Ordering Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-serif font-bold text-amber-100">Manage Playlist</h2>
                <p className="text-xs text-slate-400">Reorder or remove songs from the environment</p>
              </div>
              <button onClick={() => setShowPlaylistModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Category Selector */}
              <select
                value={selectedCat}
                onChange={(e) => loadPlaylist(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Current Playlist */}
              <div className="space-y-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Current Playlist ({playlistSongs.length})</p>
                {playlistSongs.length === 0 ? (
                  <p className="text-sm text-slate-500 p-4 text-center">No songs in this playlist yet.</p>
                ) : (
                  playlistSongs.map((song: any, idx: number) => (
                    <div key={song.id} className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                      <GripVertical className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-xs font-mono text-slate-500 w-5">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate">{song.title}</p>
                        <p className="text-xs text-slate-400">{song.artist}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveSong(idx, "up")} disabled={idx === 0} className="p-1.5 text-slate-400 hover:text-amber-400 disabled:opacity-30">
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button onClick={() => moveSong(idx, "down")} disabled={idx === playlistSongs.length - 1} className="p-1.5 text-slate-400 hover:text-amber-400 disabled:opacity-30">
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button onClick={() => removeSongFromCat(song.id)} className="p-1.5 text-slate-400 hover:text-rose-400">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add songs from catalog */}
              <div className="space-y-2 border-t border-slate-800 pt-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Add Songs from Catalog</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {songs
                    .filter((s) => !playlistSongIds.has(s.id))
                    .map((song) => (
                      <div key={song.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700 text-sm transition">
                        <div>
                          <p className="text-slate-200">{song.title}</p>
                          <p className="text-xs text-slate-400">{song.artist}</p>
                        </div>
                        <button
                          onClick={() => addSongToCat(song.id)}
                          className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-400 text-xs font-medium transition border border-amber-500/20"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  {songs.filter((s) => !playlistSongIds.has(s.id)).length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-3">All songs already in this playlist.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

