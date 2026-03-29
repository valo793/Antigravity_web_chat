"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bot } from "lucide-react";

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchAgents = async () => {
      const { data } = await supabase.from("agents").select("*").order("name");
      setAgents(data || []);
      setLoading(false);
    };
    fetchAgents();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-caption ag-cursor-blink">LOADING_AGENTS</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-label mb-1">REGISTERED AGENTS</h2>
          <p className="text-caption">{agents.length} AGENT{agents.length !== 1 ? "S" : ""} AVAILABLE</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map((agent) => (
            <div key={agent.id} className="ag-card">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 flex items-center justify-center"
                  style={{ border: "1px solid var(--color-ag-border-bright)", background: "var(--color-ag-surface-raised)" }}
                >
                  <Bot size={16} style={{ color: "var(--color-ag-text-secondary)" }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-ag-text)" }}>
                    {agent.name.toUpperCase().replace(/\s+/g, "_")}
                  </h3>
                  <p className="text-caption">{agent.slug}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`ag-badge ${agent.is_active ? "ag-badge-success" : "ag-badge-error"}`}>
                  {agent.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
                <span className="text-caption">{agent.source_type.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>

        {agents.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Bot size={32} className="mx-auto mb-4" style={{ color: "var(--color-ag-text-muted)" }} />
              <p className="text-caption">NO_AGENTS_REGISTERED</p>
              <p className="text-caption mt-1" style={{ color: "var(--color-ag-text-dim)" }}>
                Agents serão registrados automaticamente via webhook.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
