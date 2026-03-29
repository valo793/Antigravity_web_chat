"use client";

import { useState, useEffect } from "react";
import { Bot, MessageSquare, Activity, Zap, ArrowUp, ArrowDown } from "lucide-react";

interface Analytics {
  summary: {
    total_conversations: number;
    total_messages: number;
    total_agents: number;
    active_agents: number;
    unread_notifications: number;
    user_messages: number;
    agent_messages: number;
    system_messages: number;
    avg_messages_per_conversation: number;
    avg_response_length: number;
  };
  webhook: { total: number; success: number; failed: number; pending: number };
  daily_activity: { date: string; user: number; agent: number; total: number }[];
  agent_ranking: { id: string; name: string; slug: string; is_active: boolean; message_count: number; conversation_count: number }[];
  hourly_distribution: number[];
}

/* ---- Mini bar chart (pure CSS) ---- */
function BarChart({ data, maxH = 64 }: { data: number[]; maxH?: number }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px] h-full">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 bg-white transition-all duration-300 hover:bg-zinc-300 min-w-[2px]"
          style={{ height: `${Math.max((v / max) * maxH, 1)}px`, opacity: v === 0 ? 0.15 : 1 }}
          title={`${v}`}
        />
      ))}
    </div>
  );
}

/* ---- Horizontal bar ---- */
function HBar({ label, value, max, sub }: { label: string; value: number; max: number; sub?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] font-mono font-bold tracking-widest text-white uppercase">{label}</span>
        <span className="text-[10px] font-mono font-bold text-zinc-400">{value.toLocaleString()}</span>
      </div>
      <div className="w-full h-[3px] bg-[#1c1c1c]">
        <div className="h-full bg-white transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      {sub && <p className="text-[8px] font-mono tracking-widest text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}

export default function ClustersPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#121212]">
        <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border border-zinc-700 border-t-zinc-400 animate-spin" />
          LOADING_TELEMETRY...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full bg-[#121212]">
        <p className="text-[10px] font-mono text-zinc-500">ANALYTICS_UNAVAILABLE</p>
      </div>
    );
  }

  const s = data.summary;
  const maxAgentMessages = Math.max(...data.agent_ranking.map((a) => a.message_count), 1);

  return (
    <div className="h-full overflow-auto bg-[#121212] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-lg font-bold tracking-[0.15em] font-mono text-white uppercase mb-1">CLUSTER_OVERVIEW</h1>
            <p className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">
              REAL-TIME ANALYTICS // {s.total_agents} AGENT{s.total_agents !== 1 ? "S" : ""} TRACKED
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#1c1c1c] border border-[#262626] px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
            <span className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase">LIVE DATA</span>
          </div>
        </div>

        {/* ---- KPI Cards ---- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { label: "MESSAGES", value: s.total_messages, icon: MessageSquare },
            { label: "CONVERSATIONS", value: s.total_conversations, icon: Activity },
            { label: "ACTIVE AGENTS", value: s.active_agents, icon: Bot },
            { label: "AVG MSG/CONV", value: s.avg_messages_per_conversation, icon: Zap },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-[#1c1c1c] border border-[#262626] p-5">
              <kpi.icon size={16} className="text-zinc-500 mb-3" />
              <p className="text-2xl font-bold font-mono text-white mb-1">{kpi.value.toLocaleString()}</p>
              <p className="text-[8px] font-mono font-bold tracking-[0.2em] text-zinc-500 uppercase">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* ---- Daily Activity Chart ---- */}
        <div className="bg-[#1c1c1c] border border-[#262626] p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-white uppercase mb-1">MESSAGE_VOLUME</h2>
              <p className="text-[8px] font-mono tracking-widest text-zinc-500">LAST 30 DAYS</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white" />
                <span className="text-[8px] font-mono tracking-widest text-zinc-500">TOTAL</span>
              </div>
            </div>
          </div>
          <div className="h-16">
            <BarChart data={data.daily_activity.map((d) => d.total)} maxH={64} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[7px] font-mono text-zinc-600">{data.daily_activity[0]?.date.slice(5)}</span>
            <span className="text-[7px] font-mono text-zinc-600">{data.daily_activity[data.daily_activity.length - 1]?.date.slice(5)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* ---- Agent Ranking ---- */}
          <div className="bg-[#1c1c1c] border border-[#262626] p-6">
            <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-white uppercase mb-1">AGENT_RANKING</h2>
            <p className="text-[8px] font-mono tracking-widest text-zinc-500 mb-6">BY MESSAGE VOLUME</p>

            {data.agent_ranking.length === 0 ? (
              <p className="text-[10px] font-mono text-zinc-600 text-center py-8">NO_AGENTS_REGISTERED</p>
            ) : (
              <div className="space-y-0">
                {data.agent_ranking.map((agent, idx) => (
                  <div key={agent.id}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-mono font-bold text-zinc-600 w-4">{(idx + 1).toString().padStart(2, "0")}</span>
                      <div className="w-6 h-6 bg-[#262626] border border-[#3f3f46] flex items-center justify-center shrink-0">
                        <Bot size={12} className="text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <HBar
                          label={agent.slug.toUpperCase()}
                          value={agent.message_count}
                          max={maxAgentMessages}
                          sub={`${agent.conversation_count} SESSION${agent.conversation_count !== 1 ? "S" : ""}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ---- Hourly Distribution ---- */}
          <div className="bg-[#1c1c1c] border border-[#262626] p-6">
            <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-white uppercase mb-1">ACTIVITY_HEATMAP</h2>
            <p className="text-[8px] font-mono tracking-widest text-zinc-500 mb-6">HOURLY DISTRIBUTION (24H)</p>

            <div className="h-16 mb-2">
              <BarChart data={data.hourly_distribution} maxH={64} />
            </div>
            <div className="flex justify-between">
              <span className="text-[7px] font-mono text-zinc-600">00:00</span>
              <span className="text-[7px] font-mono text-zinc-600">06:00</span>
              <span className="text-[7px] font-mono text-zinc-600">12:00</span>
              <span className="text-[7px] font-mono text-zinc-600">18:00</span>
              <span className="text-[7px] font-mono text-zinc-600">23:00</span>
            </div>
          </div>
        </div>

        {/* ---- Bottom row ---- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Message breakdown */}
          <div className="bg-[#1c1c1c] border border-[#262626] p-6">
            <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-white uppercase mb-6">MSG_BREAKDOWN</h2>
            <HBar label="USER" value={s.user_messages} max={s.total_messages || 1} />
            <HBar label="AGENT" value={s.agent_messages} max={s.total_messages || 1} />
            <HBar label="SYSTEM" value={s.system_messages} max={s.total_messages || 1} />
          </div>

          {/* Webhook health */}
          <div className="bg-[#1c1c1c] border border-[#262626] p-6">
            <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-white uppercase mb-6">WEBHOOK_HEALTH</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-zinc-400">TOTAL EVENTS</span>
                <span className="text-sm font-mono font-bold text-white">{data.webhook.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-mono text-zinc-400">SUCCESS</span>
                </div>
                <span className="text-sm font-mono font-bold text-emerald-400">{data.webhook.success}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-[10px] font-mono text-zinc-400">FAILED</span>
                </div>
                <span className="text-sm font-mono font-bold text-red-400">{data.webhook.failed}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-mono text-zinc-400">PENDING</span>
                </div>
                <span className="text-sm font-mono font-bold text-amber-400">{data.webhook.pending}</span>
              </div>
              {data.webhook.total > 0 && (
                <div className="pt-2 border-t border-[#262626]">
                  <div className="w-full h-[3px] bg-[#262626] flex">
                    <div className="h-full bg-emerald-500" style={{ width: `${(data.webhook.success / data.webhook.total) * 100}%` }} />
                    <div className="h-full bg-red-500" style={{ width: `${(data.webhook.failed / data.webhook.total) * 100}%` }} />
                    <div className="h-full bg-amber-500" style={{ width: `${(data.webhook.pending / data.webhook.total) * 100}%` }} />
                  </div>
                  <p className="text-[8px] font-mono text-zinc-600 mt-1 text-right">
                    {Math.round((data.webhook.success / data.webhook.total) * 100)}% SUCCESS RATE
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* System stats */}
          <div className="bg-[#1c1c1c] border border-[#262626] p-6">
            <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-white uppercase mb-6">SYSTEM_METRICS</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-zinc-400">AVG RESPONSE LEN</span>
                <span className="text-sm font-mono font-bold text-white">{s.avg_response_length.toLocaleString()} CHARS</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-zinc-400">UNREAD</span>
                <span className="text-sm font-mono font-bold text-white">{s.unread_notifications}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-zinc-400">USER:AGENT RATIO</span>
                <span className="text-sm font-mono font-bold text-white">
                  {s.agent_messages > 0 ? (s.user_messages / s.agent_messages).toFixed(2) : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-zinc-400">TOTAL AGENTS</span>
                <span className="text-sm font-mono font-bold text-white">{s.total_agents}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
