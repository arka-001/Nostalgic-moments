"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Radio,
  LayoutDashboard,
  FolderOpen,
  Music,
  LogOut,
  Menu,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Shield,
  FileCode2,
} from "lucide-react";
import { fetchMe, logoutAdmin } from "@/lib/api";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Environments & Sounds", href: "/admin/categories", icon: FolderOpen },
  { label: "Music & Audio Tracks", href: "/admin/songs", icon: Music },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [adminRole, setAdminRole] = useState<string>("admin");

  const logout = useCallback(async () => {
    try {
      await logoutAdmin();
    } catch (_) {}
    router.push("/admin/login");
  }, [router]);

  useEffect(() => {
    if (pathname === "/admin/login") return;

    fetchMe()
      .then((data) => {
        if (data && data.email) {
          setAdminEmail(data.email);
          setAdminRole(data.role || "admin");
        } else {
          router.push("/admin/login?expired=1");
        }
      })
      .catch(() => {
        if (!pathname.startsWith("/admin/login")) {
          router.push("/admin/login?expired=1");
        }
      });
  }, [pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900/95 backdrop-blur-2xl border-r border-slate-800/80 flex flex-col z-40 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <Radio className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-amber-100 text-sm tracking-wide">
                Nostalgic Moments
              </span>
            </div>
            <span className="block text-[10px] uppercase tracking-widest text-amber-400/80 font-mono">
              Control Station
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
            Management
          </div>
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all group ${
                  active
                    ? "bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent text-amber-200 border border-amber-500/30 shadow-md shadow-amber-500/5 font-semibold"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    active ? "text-amber-400" : "text-slate-400"
                  }`}
                />
                <span className="truncate">{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-amber-400" />}
              </Link>
            );
          })}

          <div className="px-3 pt-6 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
            Quick Links
          </div>
          <Link
            href="http://localhost:8000/api/docs"
            target="_blank"
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs text-slate-400 hover:text-amber-300 hover:bg-slate-800/40 transition group"
          >
            <FileCode2 className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
            <span>FastAPI Swagger Docs</span>
            <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
          </Link>
        </nav>

        {/* Admin User Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/40">
          <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {adminEmail || "admin@nostalgia.com"}
              </div>
              <div className="text-[10px] font-mono text-emerald-400 uppercase">
                {adminRole} • Authenticated
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 transition border border-transparent hover:border-rose-800/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 bg-slate-950/80 backdrop-blur-2xl border-b border-slate-800/80 flex items-center justify-between px-6 gap-4">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-slate-400 hover:text-amber-400 transition p-1.5 rounded-lg hover:bg-slate-800"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-amber-400">Admin</span>
              <span>/</span>
              <span className="text-slate-200 capitalize font-medium">
                {navItems.find((n) => n.href === pathname)?.label || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-xs font-mono transition"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>View Site</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
