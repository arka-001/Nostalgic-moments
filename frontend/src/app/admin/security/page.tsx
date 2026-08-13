"use client";

import { useState, useEffect } from "react";
import { fetchMe, changeAdminPassword } from "@/lib/api";
import { AdminUser } from "@/types";
import { ShieldCheck, KeyRound, CheckCircle, AlertCircle, Lock, User, Clock } from "lucide-react";

export default function AdminSecurityPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchMe()
      .then((data) => setAdmin(data))
      .catch((err) => console.error("Error fetching admin profile:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match. Please verify.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await changeAdminPassword(currentPassword, newPassword);
      setSuccessMsg(res.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-serif font-bold text-amber-100 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-amber-400" /> Security & Account
        </h1>
        <p className="text-slate-400 text-sm">
          Manage administrator credentials, password security, and active session properties.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Change Password Form */}
        <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold text-slate-100">Update Admin Password</h2>
              <p className="text-xs text-slate-400">Passwords are salted and hashed using Bcrypt</p>
            </div>
          </div>

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-amber-400/70 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-amber-400/70 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-amber-400/70 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {submitting ? "Updating Password..." : "Save New Password"}
            </button>
          </form>
        </div>

        {/* Right Column: Account & Security Profile */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-serif font-semibold text-amber-100 flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" /> Account Profile
            </h3>

            {loading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-slate-800 rounded" />
                <div className="h-4 bg-slate-800 rounded w-2/3" />
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400 font-mono">Email Address:</span>
                  <span className="text-slate-200 font-medium">{admin?.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400 font-mono">Role:</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-mono">
                    {admin?.role}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400 font-mono">Account Status:</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Active
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400 font-mono">Session Token:</span>
                  <span className="text-slate-300 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> 24 Hours Active
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/20 rounded-3xl p-6 space-y-2.5">
            <h4 className="text-sm font-semibold text-amber-200 font-serif">Security Best Practices</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Use a strong password with letters, numbers, and symbols. Credentials are protected against brute-force attacks via automated rate-limiting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
