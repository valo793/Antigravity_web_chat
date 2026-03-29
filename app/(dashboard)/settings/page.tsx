"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Copy, Shield } from "lucide-react";

export default function SettingsPage() {
  const [showSecret, setShowSecret] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchAgents = async () => {
      const { data } = await supabase.from("agents").select("*").order("name");
      setAgents(data || []);
    };
    fetchAgents();

    fetch("/api/analytics")
      .then((r) => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => {});
  }, [supabase]);

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/antigravity`
    : "/api/webhooks/antigravity";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const s = stats?.summary;
  const wh = stats?.webhook;

  return (
    <div className="h-full overflow-auto bg-[#121212] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-lg font-bold tracking-[0.15em] font-mono text-white uppercase mb-2">OPERATIONAL_PARAMETERS</h1>
          <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Manage agents and webhook configuration
          </p>
        </div>

        {/* ---- Agents Section ---- */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-white uppercase">AUTONOMOUS AGENTS</h2>
            <span className="text-[9px] font-mono tracking-widest text-zinc-500">
              {agents.filter((a) => a.is_active).length} ACTIVE / {agents.length.toString().padStart(2, "0")} TOTAL
            </span>
          </div>

          {agents.length === 0 ? (
            <div className="bg-[#1c1c1c] border border-[#262626] p-8 text-center">
              <p className="text-[10px] font-mono tracking-widest text-zinc-500">NO_AGENTS_REGISTERED</p>
              <p className="text-[9px] font-mono text-zinc-600 mt-1">Agents are created automatically when webhooks arrive</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {agents.map((agent) => {
                // Find agent stats from analytics
                const agentStats = stats?.agent_ranking?.find((a: any) => a.id === agent.id);
                return (
                  <div key={agent.id} className="bg-[#1c1c1c] border border-[#262626] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[11px] font-mono font-bold tracking-widest text-white uppercase">
                        {agent.name.toUpperCase().replace(/\s+/g, "_")}
                      </h3>
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 ${agent.is_active ? "bg-emerald-950/30 border border-emerald-900/50" : "bg-zinc-900 border border-zinc-800"}`}>
                        <div className={`w-1 h-1 rounded-full ${agent.is_active ? "bg-emerald-500" : "bg-zinc-600"}`} />
                        <span className={`text-[8px] font-mono font-bold tracking-widest ${agent.is_active ? "text-emerald-400" : "text-zinc-500"}`}>
                          {agent.is_active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-[10px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">SLUG</span>
                        <span className="text-zinc-300">{agent.slug}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">MESSAGES</span>
                        <span className="text-white font-bold">{agentStats?.message_count ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">SESSIONS</span>
                        <span className="text-white font-bold">{agentStats?.conversation_count ?? 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="border-t border-[#262626] my-8" />

        {/* ---- Webhook Config ---- */}
        <section className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-white uppercase mb-2">WEBHOOK_CONFIG</h2>
              <p className="text-[10px] font-mono tracking-wider text-zinc-500 mb-4">
                Configure the endpoint for receiving agent messages. Point your Antigravity system to this URL.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-1.5">
                  <Shield size={12} className="text-zinc-500" />
                  <span className="text-[9px] font-mono tracking-widest text-zinc-500">HMAC-SHA256 VERIFIED</span>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {/* Webhook URL */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase">WEBHOOK URL</label>
                  {copied && <span className="text-[9px] font-mono text-emerald-400">COPIED</span>}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={webhookUrl}
                    readOnly
                    className="flex-1 bg-[#080808] border border-[#262626] text-white font-mono text-xs py-2.5 px-3 outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(webhookUrl)}
                    className="bg-[#1c1c1c] border border-[#262626] px-3 text-zinc-400 hover:text-white hover:bg-[#262626] transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <p className="text-[8px] font-mono tracking-widest text-zinc-600 mt-1">
                  POST APPLICATION/JSON
                </p>
              </div>

              {/* Webhook secret */}
              <div>
                <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase block mb-1.5">SECRET</label>
                <div className="flex gap-2">
                  <input
                    type={showSecret ? "text" : "password"}
                    value="Defined in ANTIGRAVITY_WEBHOOK_SECRET env var"
                    readOnly
                    className="flex-1 bg-[#080808] border border-[#262626] text-zinc-500 font-mono text-xs py-2.5 px-3 outline-none"
                  />
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="bg-[#1c1c1c] border border-[#262626] px-3 text-zinc-400 hover:text-white hover:bg-[#262626] transition-colors"
                  >
                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="border-t border-[#262626] my-8" />

        {/* ---- Real Metrics ---- */}
        <section>
          <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-white uppercase mb-5">SYSTEM_METRICS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#1c1c1c] border border-[#262626] p-5">
              <p className="text-[9px] font-mono tracking-widest text-zinc-500 mb-2">TOTAL MESSAGES</p>
              <p className="text-2xl font-bold font-mono text-white">{s?.total_messages?.toLocaleString() ?? "—"}</p>
              {s && (
                <div className="mt-2 text-[8px] font-mono text-zinc-600 space-y-0.5">
                  <p>USER: {s.user_messages} // AGENT: {s.agent_messages}</p>
                </div>
              )}
            </div>
            <div className="bg-[#1c1c1c] border border-[#262626] p-5">
              <p className="text-[9px] font-mono tracking-widest text-zinc-500 mb-2">WEBHOOK EVENTS</p>
              <p className="text-2xl font-bold font-mono text-white">{wh?.total?.toLocaleString() ?? "—"}</p>
              {wh && wh.total > 0 && (
                <div className="mt-2">
                  <div className="w-full h-[3px] bg-[#262626] flex">
                    <div className="h-full bg-emerald-500" style={{ width: `${(wh.success / wh.total) * 100}%` }} />
                    <div className="h-full bg-red-500" style={{ width: `${(wh.failed / wh.total) * 100}%` }} />
                  </div>
                  <p className="text-[8px] font-mono text-zinc-600 mt-1">{Math.round((wh.success / wh.total) * 100)}% SUCCESS</p>
                </div>
              )}
            </div>
            <div className="bg-[#1c1c1c] border border-[#262626] p-5">
              <p className="text-[9px] font-mono tracking-widest text-zinc-500 mb-2">AVG RESPONSE</p>
              <p className="text-2xl font-bold font-mono text-white">{s?.avg_response_length?.toLocaleString() ?? "—"}</p>
              <p className="text-[8px] font-mono text-zinc-600 mt-2">CHARACTERS PER AGENT MSG</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
