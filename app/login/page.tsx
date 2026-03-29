"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"magic_link" | "password">("password");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setMessage("Link de acesso enviado. Verifique seu email.");
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      window.location.href = "/chat";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#020202]">
      {/* Grid pattern background */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--color-ag-border) 1px, transparent 1px),
                           linear-gradient(90deg, var(--color-ag-border) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Corner bracket decoration */}
      <div
        className="fixed top-8 left-8 w-16 h-16 pointer-events-none opacity-50"
        style={{
          borderLeft: "1px solid var(--color-ag-border-bright)",
          borderTop: "1px solid var(--color-ag-border-bright)",
        }}
      />
      
      <div
        className="fixed bottom-8 right-8 w-16 h-16 pointer-events-none opacity-50"
        style={{
          borderRight: "1px solid var(--color-ag-border-bright)",
          borderBottom: "1px solid var(--color-ag-border-bright)",
        }}
      />

      <div className="relative w-full max-w-[420px] mx-4">
        {/* Login card */}
        <div
          className="p-10"
          style={{
            background: "var(--color-ag-surface)",
            border: "1px solid var(--color-ag-border)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
          }}
        >
          {/* Title */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-[6px] h-6 bg-white shrink-0" />
              <h1
                className="text-xl font-bold tracking-widest uppercase"
                style={{ fontFamily: "var(--font-mono)", color: "var(--color-ag-text)" }}
              >
                ANTIGRAVITY_LOGIN
              </h1>
            </div>
            <p className="text-[10px] tracking-[0.15em] ml-4 text-ag-text-muted uppercase font-mono">
              PROTOCOL: AES-256-GCM / AUTH-V4
            </p>
          </div>

          <form onSubmit={mode === "magic_link" ? handleMagicLink : handlePassword}>
            {/* Email */}
            <div className="mb-6">
              <label className="text-[10px] tracking-[0.1em] font-mono font-medium block mb-2 uppercase text-ag-text-secondary">
                IDENTITY_IDENTIFIER
              </label>
              <div className="relative">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ag-text-muted pointer-events-none font-mono"
                >
                  @
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@antigravity.sys"
                  className="w-full bg-[#080808] border border-ag-border text-ag-text font-mono text-sm py-3 pl-10 pr-4 outline-none focus:border-white transition-colors placeholder:text-ag-text-muted"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password (conditional) */}
            {mode === "password" && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] tracking-[0.1em] font-mono font-medium uppercase text-ag-text-secondary">
                    ACCESS_KEY
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode("magic_link")}
                    className="text-[10px] tracking-[0.1em] font-mono uppercase text-ag-text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    LOST KEY?
                  </button>
                </div>
                <div className="relative">
                  <span
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-ag-text-muted pointer-events-none"
                  >
                    🔒
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#080808] border border-ag-border text-ag-text font-mono text-sm py-3 pl-10 pr-4 outline-none focus:border-white transition-colors placeholder:text-ag-text-muted tracking-widest"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>
            )}

            {/* Error/Success */}
            {error && (
              <div className="mb-6 p-3 bg-red-950/20 border border-red-900/50">
                <p className="text-[11px] font-mono text-red-500 uppercase tracking-wide">{error}</p>
              </div>
            )}
            {message && (
              <div className="mb-6 p-3 bg-emerald-950/20 border border-emerald-900/50">
                <p className="text-[11px] font-mono text-emerald-500 uppercase tracking-wide">{message}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black border border-white py-3.5 text-xs font-bold tracking-[0.2em] font-mono uppercase hover:bg-gray-200 hover:border-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "AUTHENTICATING..." : "INITIALIZE"}
            </button>
          </form>

          {/* Mode toggle */}
          {mode === "magic_link" && (
            <button
              type="button"
              onClick={() => setMode("password")}
              className="mt-6 w-full text-center text-[10px] tracking-[0.1em] font-mono uppercase text-ag-text-muted hover:text-white transition-colors cursor-pointer"
            >
              USE ACCESS_KEY INSTEAD
            </button>
          )}

          {/* Status bar */}
          <div className="mt-10 pt-5 border-t border-ag-border font-mono">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-ag-text-muted" />
                <span className="text-[10px] tracking-[0.1em] text-ag-text-secondary uppercase">
                  SECURE CONNECTION
                </span>
              </div>
              <span className="text-[10px] tracking-[0.05em] text-ag-text-dim">
                NODE_03: 184.18.2.14
              </span>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 bg-[#0f0f0f] border border-[#1f1f1f] p-3">
                <p className="text-[9px] tracking-[0.1em] text-ag-text-muted uppercase mb-1">LATENCY</p>
                <p className="text-xs text-white">14ms</p>
              </div>
              <div className="flex-1 bg-[#0f0f0f] border border-[#1f1f1f] p-3">
                <p className="text-[9px] tracking-[0.1em] text-ag-text-muted uppercase mb-1">ENCRYPTION</p>
                <p className="text-xs text-white">TLS 1.3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-between px-2 font-mono text-[9px] tracking-[0.15em] text-ag-text-dim uppercase">
          <span>SYSTEM_V4.0.2</span>
          <span>© 2026 ANTIGRAVITY</span>
          <span>VAULT_LOCKED</span>
        </div>
      </div>
    </div>
  );
}
