"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Terminal,
  Bot,
  Archive,
  Settings,
  HelpCircle,
  Plus,
  Box,
  User as UserIcon,
  Crosshair
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface DashboardShellProps {
  children: React.ReactNode;
  user: User;
}

const navItems = [
  { icon: Terminal, label: "TERMINAL", href: "/chat" },
  { icon: Bot, label: "AGENTS", href: "/agents" },
  { icon: Crosshair, label: "CLUSTERS", href: "/clusters" },
  { icon: Archive, label: "ARCHIVE", href: "/notifications" },
  { icon: Settings, label: "SETTINGS", href: "/settings" },
];

export default function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const json = await res.json();
      setUnreadCount(json.unread_count || 0);
    }
  }, []);

  useEffect(() => {
    fetchUnread();

    const channel = supabase
      .channel("notifications-count")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => fetchUnread()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchUnread]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const getPageTitle = () => {
    if (pathname === "/chat" || pathname?.startsWith("/chat/")) return "Console";
    if (pathname === "/notifications") return "Network"; // Or Archive
    if (pathname === "/settings") return "Vault"; // Using these names based on mockups
    if (pathname === "/agents") return "Vault";
    return "Console";
  };

  return (
    <div className="flex h-screen bg-[#080808] text-white font-sans overflow-hidden">
      {/* ---- Left Sidebar ---- */}
      <aside className="w-[240px] flex flex-col border-r border-[#262626] bg-[#121212] shrink-0">
        {/* Header */}
        <div className="flex items-center gap-3 p-5">
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center shrink-0">
            <Box size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-widest font-mono">ANTIGRAVITY_OS</h2>
            <p className="text-[9px] tracking-[0.15em] text-zinc-500 font-mono">V4.0.2-STABLE</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="px-4 py-2 mb-4">
          <button className="w-full bg-white text-black flex items-center justify-center gap-2 py-3 font-mono text-[10px] font-bold tracking-widest uppercase hover:bg-zinc-200 transition-colors cursor-pointer">
            <Plus size={14} strokeWidth={2.5} />
            NEW INSTANCE
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 mb-1 font-mono text-[11px] font-semibold tracking-widest transition-colors ${
                  isActive 
                    ? "text-white bg-[#1c1c1c] border-l-2 border-white" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-[#18181b] border-l-2 border-transparent"
                }`}
              >
                <item.icon size={16} 
                  className={isActive ? "text-white" : "text-zinc-500"} 
                  strokeWidth={isActive ? 2 : 1.5} 
                />
                <span className="flex-1 mt-[1px]">{item.label}</span>
                {item.href === "/notifications" && unreadCount > 0 && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-[#262626]">
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-white font-mono text-[10px] font-semibold tracking-widest transition-colors">
            <Archive size={14} />
            DOCUMENTATION
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-white font-mono text-[10px] font-semibold tracking-widest transition-colors">
            <HelpCircle size={14} />
            SUPPORT
          </Link>
        </div>
      </aside>

      {/* ---- Main Canvas & Right Panel ---- */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Global Topbar */}
        <header className="h-[60px] flex items-center justify-between px-6 border-b border-[#262626] bg-[#080808] shrink-0">
          <div className="flex items-center gap-8 border-b-2 border-transparent h-full">
            <h1 className="font-bold text-lg tracking-[0.2em] font-mono translate-y-[1px]">ANTIGRAVITY</h1>
            <nav className="flex items-center gap-6 h-full ml-2">
              {["Console", "Network", "Vault"].map((tab) => {
                const isActive = getPageTitle() === tab;
                return (
                  <button
                    key={tab}
                    className={`h-full flex items-center text-[11px] font-mono tracking-widest uppercase transition-colors relative ${
                      isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center pr-4 border-r border-[#262626]">
              <div className="flex items-center gap-2 bg-[#1c1c1c] text-zinc-300 px-3 py-1.5 border border-[#3f3f46]">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                <span className="text-[9px] font-mono tracking-widest uppercase">CONNECTED // SECURE</span>
              </div>
            </div>
            
            <button className="text-zinc-400 hover:text-white transition-colors">
              <Box size={18} />
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <Settings size={18} />
            </button>
            <button 
              onClick={handleLogout}
              className="w-7 h-7 bg-zinc-800 flex items-center justify-center rounded-full hover:bg-zinc-700 transition-colors"
            >
              <UserIcon size={14} className="text-white" />
            </button>
          </div>
        </header>

        {/* Content area split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 flex flex-col relative bg-[#121212]">
            {children}
          </main>

          {/* Right Inspector Panel */}
          <InspectorPanel user={user} />
        </div>
      </div>
    </div>
  );
}

/* ---- Inspector Panel (real data) ---- */
function InspectorPanel({ user }: { user: User }) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => {});
  }, []);

  const s = stats?.summary;

  return (
    <aside className="w-[300px] bg-[#121212] border-l border-[#262626] flex flex-col shrink-0">
      <div className="p-6 flex-1 overflow-y-auto">
        <h3 className="text-xs font-mono font-bold tracking-[0.2em] uppercase mb-8">OBJECT_INSPECTOR</h3>

        {/* User identity — real data */}
        <div className="mb-8">
          <p className="text-[9px] font-mono tracking-widest text-zinc-500 mb-3">UNIT_IDENTITY</p>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-mono text-zinc-400">USER</span>
            <span className="text-xs font-mono text-white truncate ml-2 max-w-[160px]">{user.email || "UNKNOWN"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-zinc-400">SESSION</span>
            <span className="text-xs font-mono text-white">{user.id.substring(0, 8).toUpperCase()}</span>
          </div>
        </div>

        {/* Real stats */}
        {s ? (
          <>
            <div className="mb-8">
              <p className="text-[9px] font-mono tracking-widest text-zinc-500 mb-3">ACTIVITY</p>
              <div className="w-full bg-[#1c1c1c] h-[2px] mb-2">
                <div className="bg-white h-full transition-all" style={{ width: `${Math.min((s.total_messages / Math.max(s.total_messages, 100)) * 100, 100)}%` }} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-mono text-zinc-500 tracking-widest">MESSAGES</span>
                <span className="text-[10px] font-mono font-bold">{s.total_messages}</span>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs tracking-wider">
              <div className="flex justify-between items-center text-zinc-400">
                <span>CONVERSATIONS</span>
                <span className="text-white font-bold">{s.total_conversations}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>AGENTS</span>
                <span className="text-white font-bold">{s.active_agents}/{s.total_agents}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>UNREAD</span>
                <span className="text-white font-bold">{s.unread_notifications}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>AVG MSG/CONV</span>
                <span className="text-white font-bold">{s.avg_messages_per_conversation}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-[9px] font-mono text-zinc-600 animate-pulse">LOADING_TELEMETRY...</div>
        )}

        {/* Webhook health */}
        {stats?.webhook && (
          <div className="mt-8">
            <p className="text-[9px] font-mono tracking-widest text-zinc-500 mb-3 uppercase">WEBHOOK_HEALTH</p>
            <div className="space-y-2 font-mono text-[10px]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-zinc-400">OK</span>
                </div>
                <span className="text-white font-bold">{stats.webhook.success}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-zinc-400">FAIL</span>
                </div>
                <span className="text-white font-bold">{stats.webhook.failed}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activity visualizer */}
      <div className="h-[100px] border-t border-[#262626] p-4">
        {stats?.daily_activity ? (
          <div className="w-full h-full flex items-end gap-[1px]">
            {stats.daily_activity.slice(-14).map((d: any, i: number) => {
              const max = Math.max(...stats.daily_activity.map((x: any) => x.total), 1);
              const h = Math.max((d.total / max) * 60, 2);
              return (
                <div
                  key={i}
                  className="flex-1 bg-white transition-all hover:bg-zinc-300"
                  style={{ height: `${h}px`, opacity: d.total === 0 ? 0.1 : 0.6 }}
                  title={`${d.date}: ${d.total} msg`}
                />
              );
            })}
          </div>
        ) : (
          <div className="w-full h-full bg-[#080808] border border-[#262626] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white opacity-50 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
}
