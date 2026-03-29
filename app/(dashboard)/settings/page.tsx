"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Copy, Shield, Zap, Database } from "lucide-react";

export default function SettingsPage() {
  const [showSecret, setShowSecret] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchAgents = async () => {
      const { data } = await supabase.from("agents").select("*").order("name");
      setAgents(data || []);
    };
    fetchAgents();
  }, [supabase]);

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/antigravity`
    : "/api/webhooks/antigravity";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-display mb-2">Operational Parameters</h1>
          <p className="text-body" style={{ color: "var(--color-ag-text-secondary)" }}>
            Manage autonomous agents and secure communication protocols for the Antigravity ecosystem.
          </p>
        </div>

        {/* System status */}
        <div className="flex justify-end mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5" style={{ border: "1px solid var(--color-ag-border)", background: "var(--color-ag-surface)" }}>
            <span className="ag-status-dot ag-status-dot-active" />
            <span className="text-caption">SYSTEM UPLINK: ACTIVE</span>
          </div>
        </div>

        {/* ---- Agents Section ---- */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading">AUTONOMOUS AGENTS</h2>
            <span className="text-caption">
              {agents.filter((a) => a.is_active).length} ACTIVE / {agents.length.toString().padStart(2, "0")} TOTAL
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {agents.map((agent) => (
              <div key={agent.id} className="ag-card">
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="text-sm font-bold"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--color-ag-text)" }}
                  >
                    {agent.name.toUpperCase().replace(/\s+/g, "_")}
                  </h3>
                  <span className={`ag-badge ${agent.is_active ? "ag-badge-success" : ""}`}>
                    {agent.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-caption">
                    <span>ID:</span>
                    <span style={{ color: "var(--color-ag-text-secondary)" }}>
                      #{agent.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between text-caption">
                    <span>LAST OP</span>
                    <span style={{ color: "var(--color-ag-text-secondary)" }}>—</span>
                  </div>
                  <div className="flex justify-between text-caption">
                    <span>LATENCY</span>
                    <span style={{ color: "var(--color-ag-text-secondary)" }}>14ms</span>
                  </div>
                </div>
                <button className="ag-btn w-full text-xs py-2">CONFIG</button>
              </div>
            ))}
          </div>
        </section>

        <hr className="ag-divider" />

        {/* ---- External Protocols ---- */}
        <section className="mb-10 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-heading mb-2">EXTERNAL PROTOCOLS</h2>
              <p className="text-body mb-4" style={{ color: "var(--color-ag-text-secondary)" }}>
                Securely bridge Antigravity with third-party providers. All API keys are encrypted at rest and never exposed in plain text.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-1.5">
                  <Shield size={14} style={{ color: "var(--color-ag-text-muted)" }} />
                  <span className="text-caption">AES-256 ENCRYPTED</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="ag-status-dot ag-status-dot-idle" />
                  <span className="text-caption">TLS 1.3 MANDATORY</span>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {/* Webhook URL */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-label">EVENT WEBHOOK URL</label>
                  <span className="text-caption" style={{ color: "var(--color-ag-success)" }}>VERIFIED</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={webhookUrl}
                    readOnly
                    className="ag-input flex-1"
                  />
                  <button
                    onClick={() => copyToClipboard(webhookUrl)}
                    className="ag-btn px-3"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <p className="text-caption mt-1" style={{ color: "var(--color-ag-text-dim)" }}>
                  POST request payload will be sent as application/json.
                </p>
              </div>

              {/* Webhook secret */}
              <div>
                <label className="text-label block mb-1.5">BEARER AUTH TOKEN</label>
                <div className="flex gap-2">
                  <input
                    type={showSecret ? "text" : "password"}
                    value="Configure via ANTIGRAVITY_WEBHOOK_SECRET env"
                    readOnly
                    className="ag-input flex-1"
                  />
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="ag-btn px-3"
                  >
                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="ag-divider" />

        {/* ---- System Metrics ---- */}
        <section className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon: Zap, label: "TOKEN QUOTA", value: "644,213 / 1,000,000", bar: 64 },
              { icon: Database, label: "BURST CAPACITY", value: "400 RPM", sub: "CURRENT LOAD: LOW" },
              { icon: Shield, label: "LOG PERSISTENCE", value: "30 DAYS", sub: "STORAGE USAGE: 14.2 GB" },
            ].map((metric) => (
              <div key={metric.label} className="ag-card">
                <metric.icon size={18} className="mb-3" style={{ color: "var(--color-ag-text-muted)" }} />
                <p className="text-label mb-1">{metric.label}</p>
                <p className="text-lg font-bold" style={{ color: "var(--color-ag-text)" }}>
                  {metric.value}
                </p>
                {metric.bar && (
                  <div className="mt-2 h-1" style={{ background: "var(--color-ag-border)" }}>
                    <div className="h-full" style={{ width: `${metric.bar}%`, background: "var(--color-ag-accent)" }} />
                  </div>
                )}
                {metric.sub && (
                  <p className="text-caption mt-2">{metric.sub}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
