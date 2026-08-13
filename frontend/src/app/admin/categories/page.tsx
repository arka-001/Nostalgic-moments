"use client";

import { useEffect, useState, useRef } from "react";
import {
  Plus, Pencil, Trash2, Loader2, X,
  Image, Save, Link2, ToggleLeft, ToggleRight,
  Wind, Music, Volume2, Sliders
} from "lucide-react";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadImageFile,
  uploadAudioFile,
} from "@/lib/api";
import { Category } from "@/types";
import { AmbientType } from "@/lib/ambientSoundscapes";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  tagline: "",
  thumbnail_url: "",
  background_url: "",
  background_type: "image",
  theme_config: {
    player_transparency: 10,
    ambient_sound_type: "auto" as AmbientType,
    ambient_sound_name: "",
    ambient_sound_description: "",
    ambient_sound_url: "",
    ambient_default_volume: 25,
  },
  is_active: true,
  sort_order: 0,
};


export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingAmbientAudio, setUploadingAmbientAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const thumbRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);
  const ambientAudioRef = useRef<HTMLInputElement>(null);

  const loadCategoriesData = async () => {
    setLoading(true);
    try {
      const data = await fetchCategories(true);
      setCategories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategoriesData();
  }, []);

  const openCreate = () => {
    setEditingCat(null);
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      tagline: cat.tagline || "",
      thumbnail_url: cat.thumbnail_url || "",
      background_url: cat.background_url || "",
      background_type: cat.background_type || "image",
      theme_config: {
        player_transparency: cat.theme_config?.player_transparency ?? 10,
        ambient_sound_type: (cat.theme_config?.ambient_sound_type as any) ?? "auto",
        ambient_sound_name: cat.theme_config?.ambient_sound_name ?? "",
        ambient_sound_description: cat.theme_config?.ambient_sound_description ?? "",
        ambient_sound_url: cat.theme_config?.ambient_sound_url ?? "",
        ambient_default_volume: cat.theme_config?.ambient_default_volume ?? 25,
      },
      is_active: cat.is_active,
      sort_order: cat.sort_order,
    });
    setError(null);
    setShowModal(true);
  };


  const handleSave = async () => {
    if (!form.name || !form.slug) {
      setError("Name and Slug are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingCat) {
        await updateCategory(editingCat.id, form);
      } else {
        await createCategory(form);
      }

      setShowModal(false);
      await loadCategoriesData();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Delete environment "${cat.name}"? This will remove all its playlist associations.`))
      return;

    try {
      await deleteCategory(cat.id);
      await loadCategoriesData();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleActive = async (cat: Category) => {
    try {
      await updateCategory(cat.id, { is_active: !cat.is_active });
      await loadCategoriesData();
    } catch (e) {
      console.error(e);
    }
  };

  const uploadImage = async (
    file: File,
    bucket: "thumbnails" | "backgrounds",
    field: "thumbnail_url" | "background_url",
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true);
    try {
      const data = await uploadImageFile(file, bucket);
      setForm((f) => ({ ...f, [field]: data.url }));
    } catch (e: any) {
      setError(e.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const uploadAmbientAudio = async (file: File) => {
    setUploadingAmbientAudio(true);
    setError(null);
    try {
      const data = await uploadAudioFile(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ");
      const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

      setForm((f) => ({
        ...f,
        theme_config: {
          ...f.theme_config,
          ambient_sound_type: "custom_url",
          ambient_sound_url: data.url,
          ambient_sound_name: f.theme_config?.ambient_sound_name || formattedName,
          ambient_sound_description:
            f.theme_config?.ambient_sound_description ||
            `Custom ${formattedName} environmental loop`,
        },
      }));
    } catch (e: any) {
      setError(e.message || "Ambient audio upload failed");
    } finally {
      setUploadingAmbientAudio(false);
    }
  };

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");



  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-amber-100">Environments</h1>
          <p className="text-sm text-slate-400">Manage nostalgic experience categories.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" /> New Environment
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No environments found. Create your first one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase text-slate-400 tracking-wider">
                  <th className="px-6 py-4 text-left">Environment</th>
                  <th className="px-4 py-4 text-left hidden md:table-cell">Slug</th>
                  <th className="px-4 py-4 text-center">Tracks</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-800/30 transition group"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-medium text-slate-200">{cat.name}</span>
                        {cat.tagline && (
                          <p className="text-xs text-slate-500 italic truncate max-w-xs mt-0.5">
                            "{cat.tagline}"
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <code className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
                        {cat.slug}
                      </code>
                    </td>
                    <td className="px-4 py-4 text-center font-mono text-slate-400 text-xs">
                      {cat.song_count ?? 0}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => toggleActive(cat)}
                        title={cat.is_active ? "Disable" : "Enable"}
                        className="inline-flex items-center gap-1.5 text-xs"
                      >
                        {cat.is_active ? (
                          <span className="flex items-center gap-1.5 text-emerald-400">
                            <ToggleRight className="w-5 h-5" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <ToggleLeft className="w-5 h-5" /> Disabled
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={`/experience/${cat.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition"
                          title="View Environment"
                        >
                          <Link2 className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-serif font-bold text-amber-100">
                {editingCat ? "Edit Environment" : "New Environment"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name & Slug Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((f) => ({
                        ...f,
                        name,
                        slug: editingCat ? f.slug : autoSlug(name),
                      }));
                    }}
                    placeholder="Running Bus"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="running-bus"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Tagline */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Tagline
                </label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                  placeholder="Songs for a journey through old memories"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe the nostalgic environment..."
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition resize-none"
                />
              </div>

              {/* Background Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Background Type
                  </label>
                  <select
                    value={form.background_type}
                    onChange={(e) => setForm((f) => ({ ...f, background_type: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="animation">Animation</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-amber-300 uppercase tracking-wider">
                    Player Transparency (Admin Control)
                  </label>
                  <select
                    value={form.theme_config?.player_transparency ?? 10}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        theme_config: {
                          ...f.theme_config,
                          player_transparency: parseInt(e.target.value),
                        },
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-slate-800 border border-amber-500/40 rounded-xl text-amber-200 text-sm focus:outline-none focus:border-amber-400 transition font-medium"
                  >
                    <option value={0}>0% Opacity (100% Invisible Pure Glass)</option>
                    <option value={5}>5% Opacity (95% Ultra Transparent Glass)</option>
                    <option value={10}>10% Opacity (90% Soft Glass - Recommended)</option>
                    <option value={15}>15% Opacity (85% Standard Glass)</option>
                    <option value={20}>20% Opacity (80% Subtle Glass)</option>
                    <option value={35}>35% Opacity (65% Medium Dark)</option>
                    <option value={50}>50% Opacity (50% Semi-Solid)</option>
                  </select>
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Thumbnail Image
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={form.thumbnail_url}
                    onChange={(e) => setForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
                    placeholder="https://... or upload →"
                    className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                  <button
                    onClick={() => thumbRef.current?.click()}
                    disabled={uploadingThumb}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition flex items-center gap-2 shrink-0"
                  >
                    {uploadingThumb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                    Upload
                  </button>
                  <input
                    ref={thumbRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadImage(f, "thumbnails", "thumbnail_url", setUploadingThumb);
                    }}
                  />
                </div>
                {form.thumbnail_url && (
                  <img
                    src={form.thumbnail_url}
                    alt="thumbnail preview"
                    className="w-24 h-16 rounded-lg object-cover border border-slate-700"
                  />
                )}
              </div>

              {/* Background Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Background Image / Video
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={form.background_url}
                    onChange={(e) => setForm((f) => ({ ...f, background_url: e.target.value }))}
                    placeholder="https://... or upload →"
                    className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                  <button
                    onClick={() => bgRef.current?.click()}
                    disabled={uploadingBg}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition flex items-center gap-2 shrink-0"
                  >
                    {uploadingBg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                    Upload
                  </button>
                  <input
                    ref={bgRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadImage(f, "backgrounds", "background_url", setUploadingBg);
                    }}
                  />
                </div>
              </div>

              {/* 🎧 Environment Ambient Sound Configuration & Upload */}
              <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                  <div className="flex items-center gap-2 text-amber-300">
                    <Wind className="w-4 h-4" />
                    <h3 className="text-sm font-serif font-semibold">Environment Ambient Sound & Audio Upload</h3>
                  </div>
                  {form.theme_config?.ambient_sound_url && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Audio Attached
                    </span>
                  )}
                </div>

                {/* Direct Ambient Audio File Upload Card */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-amber-400" /> Upload Custom Ambient Sound File (.mp3, .wav, .ogg)
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Max 50MB</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={() => ambientAudioRef.current?.click()}
                      disabled={uploadingAmbientAudio}
                      className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold transition flex items-center justify-center gap-2 shrink-0 shadow-sm"
                    >
                      {uploadingAmbientAudio ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Uploading Audio...</span>
                        </>
                      ) : (
                        <>
                          <Music className="w-4 h-4 text-amber-400" />
                          <span>Choose Ambient Audio File</span>
                        </>
                      )}
                    </button>
                    <input
                      ref={ambientAudioRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadAmbientAudio(f);
                      }}
                    />

                    <input
                      type="text"
                      value={form.theme_config?.ambient_sound_url ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          theme_config: {
                            ...f.theme_config,
                            ambient_sound_type: e.target.value ? "custom_url" : f.theme_config?.ambient_sound_type,
                            ambient_sound_url: e.target.value,
                          },
                        }))
                      }
                      placeholder="Or paste direct audio URL (https://...)"
                      className="flex-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  {/* Audio Player Preview if file attached */}
                  {form.theme_config?.ambient_sound_url && (
                    <div className="p-3 rounded-xl bg-black/40 border border-slate-700/60 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="font-mono text-[11px] text-amber-300 truncate max-w-[280px]">
                          Preview: {form.theme_config.ambient_sound_name || "Uploaded Ambient Track"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              theme_config: {
                                ...f.theme_config,
                                ambient_sound_type: "auto",
                                ambient_sound_url: "",
                                ambient_sound_name: "",
                              },
                            }))
                          }
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-mono underline"
                        >
                          Remove Audio
                        </button>
                      </div>
                      <audio
                        src={form.theme_config.ambient_sound_url}
                        controls
                        className="w-full h-8 accent-amber-500 rounded"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Sound Preset Mode
                    </label>
                    <select
                      value={form.theme_config?.ambient_sound_type ?? "auto"}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          theme_config: {
                            ...f.theme_config,
                            ambient_sound_type: e.target.value as any,
                          },
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition"
                    >
                      <option value="auto">Auto (Match Environment Slug)</option>
                      <option value="custom_url">🔗 Custom Uploaded Audio Track</option>
                      <option value="bus">🚌 Bus Engine & Road Breeze (Procedural)</option>
                      <option value="car_rain">🚗 Rain on Windshield (Procedural)</option>
                      <option value="chai">🫖 Chai Tapri Murmur & Kettle (Procedural)</option>
                      <option value="salon">💈 Salon Acoustics & Cassette (Procedural)</option>
                      <option value="train">🚂 Railway Platform & Track (Procedural)</option>
                      <option value="vinyl">📻 Vintage Vinyl Warmth (Procedural)</option>
                      <option value="off">🚫 Disabled / Muted by Default</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Default Volume ({form.theme_config?.ambient_default_volume ?? 25}%)
                    </label>
                    <div className="flex items-center gap-3 pt-2">
                      <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={form.theme_config?.ambient_default_volume ?? 25}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            theme_config: {
                              ...f.theme_config,
                              ambient_default_volume: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                        className="w-full h-2 accent-amber-500 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Custom Ambient Sound Display Label
                  </label>
                  <input
                    type="text"
                    value={form.theme_config?.ambient_sound_name ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        theme_config: {
                          ...f.theme_config,
                          ambient_sound_name: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. Vintage Roadways Bus Engine & Horn"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>


              {/* Sort Order & Active Toggle */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Status
                  </label>
                  <button
                    onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition flex items-center gap-2 ${
                      form.is_active
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    {form.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {form.is_active ? "Active" : "Disabled"}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-semibold text-sm transition flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingCat ? "Save Changes" : "Create Environment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
