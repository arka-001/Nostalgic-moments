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
  ShieldCheck,
} from "lucide-react";
import { fetchMe, logoutAdmin } from "@/lib/api";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Environments", href: "/admin/categories", icon: FolderOpen },
  { label: "Songs", href: "/admin/songs", icon: Music },
  { label: "Security & Account", href: "/admin/security", icon: ShieldCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string>("");

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-40 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Radio className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="font-serif font-bold text-amber-100 text-sm">Nostalgic Moments</span>
            <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-mono">
              Admin Panel
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition group ${
                  active
                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                    : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-amber-400" : "text-slate-400"}`} />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto text-amber-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Admin Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="px-3 py-2 rounded-lg bg-slate-800/60 text-xs text-slate-400 truncate">
            {adminEmail || "Admin User"}
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-16 bg-slate-950/90 backdrop-blur border-b border-slate-800 flex items-center px-6 gap-4">
          <button
            className="lg:hidden text-slate-400 hover:text-amber-400 transition"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-slate-200 capitalize">
              {navItems.find((n) => n.href === pathname)?.label || "Admin"}
            </h2>
          </div>
          <Link
            href="/"
            target="_blank"
            className="text-xs text-amber-400 hover:text-amber-300 transition font-mono"
          >
            View Site →
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

