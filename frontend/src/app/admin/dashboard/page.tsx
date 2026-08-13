"use client";

import { useEffect, useState } from "react";
import { Music, FolderOpen, CheckCircle, Layers, Radio, TrendingUp } from "lucide-react";
import Link from "next/link";
import { fetchCategories, fetchSongs } from "@/lib/api";
import { Category } from "@/types";

interface Stats {
  totalCategories: number;
  activeCategories: number;
  totalSongs: number;
  activeSongs: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [cats, songs] = await Promise.all([
          fetchCategories(true),
          fetchSongs(true),
        ]);

        setCategories(cats.slice(0, 5));
        setStats({
          totalCategories: cats.length,
          activeCategories: cats.filter((c) => c.is_active).length,
          totalSongs: songs.length,
          activeSongs: songs.filter((s) => s.is_active).length,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    { label: "Total Environments", value: stats?.totalCategories ?? 0, icon: FolderOpen, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { label: "Active Environments", value: stats?.activeCategories ?? 0, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Total Songs", value: stats?.totalSongs ?? 0, icon: Music, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Active Songs", value: stats?.activeSongs ?? 0, icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-serif font-bold text-amber-100">Dashboard</h1>
        <p className="text-slate-400 text-sm">Manage your nostalgic music environments and content.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className={`rounded-2xl p-6 bg-slate-900 border ${bg.split(" ")[1]} space-y-3`}
          >
            <div className={`inline-flex p-2.5 rounded-xl border ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-100">
                {loading ? <span className="animate-pulse">—</span> : value}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-serif font-semibold text-amber-100">Quick Actions</h2>
          </div>
          <div className="space-y-2">
            <Link
              href="/admin/categories"
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-sm text-slate-200 transition group"
            >
              <span className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-amber-400" /> Manage Environments
              </span>
              <span className="text-amber-400 group-hover:translate-x-1 transition">→</span>
            </Link>
            <Link
              href="/admin/songs"
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-sm text-slate-200 transition group"
            >
              <span className="flex items-center gap-2">
                <Music className="w-4 h-4 text-blue-400" /> Manage Songs & Upload MP3
              </span>
              <span className="text-amber-400 group-hover:translate-x-1 transition">→</span>
            </Link>
          </div>
        </div>

        {/* Active Environments */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-serif font-semibold text-amber-100">Active Environments</h2>
          </div>
          <div className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded-xl bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <p className="text-slate-500 text-sm">No environments found.</p>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-sm"
                >
                  <span className="text-slate-200 flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-amber-400" />
                    {cat.name}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {cat.song_count ?? 0} tracks
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

