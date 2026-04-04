"use client";

import Link from "next/link";
import { timeAgo } from "@/core/utils/dates";
import { MessageSquare, Paperclip, Settings2, Shield } from "lucide-react";
import { useConversations } from "@/interfaces/providers/useConversations";

export default function ChatPage() {
  const { conversations, loading } = useConversations();

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#121212]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
             <div className="w-8 h-8 rounded-full border border-zinc-700 border-t-zinc-400 animate-spin mx-auto mb-4" />
             LOADING_CONVERSATIONS...
          </div>
        </div>
      </div>
    );
  }

  // The empty state based heavily on Image 3
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#121212] relative">
        <div className="flex-1 flex flex-col items-center justify-center -mt-10">
          <div className="w-16 h-16 rounded-xl bg-[#1c1c1c] border border-[#262626] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="w-6 h-6 rounded-full border border-zinc-500 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-zinc-400" />
            </div>
          </div>
          
          <h2 className="text-xl font-bold tracking-[0.1em] font-mono text-white mb-4">ANTIGRAVITY</h2>
          
          <div className="text-center mb-8">
            <p className="text-[11px] text-zinc-400 font-mono tracking-wide mb-1">
              System initialized. Connection to neural mesh established.
            </p>
            <p className="text-[11px] text-white font-mono tracking-wide font-bold">
              Select an Agent to begin operation.
            </p>
          </div>

          <div className="font-mono text-[9px] tracking-widest text-zinc-500 space-y-2 mb-12">
            <div className="flex gap-4 justify-center">
              <span className="animate-pulse">_ WAITING_FOR_INCOMING_CONNECTIONS...</span>
            </div>
          </div>
        </div>

        {/* Bottom Composer and Status Bar Container */}
        <div className="p-6 pb-2 shrink-0">
          <div className="w-full max-w-3xl mx-auto">
            {/* Terminal Input Box */}
            <div className="bg-[#18181b] border border-[#262626] rounded-sm flex flex-col mb-2">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#262626]">
                <div className="w-5 h-3 border border-zinc-600 rounded-[2px]" />
                <span className="text-[11px] font-mono text-zinc-600">
                  Select an agent or cluster to start a session...
                </span>
              </div>
              
              <div className="flex items-center px-4 py-3 bg-[#121212]">
                <div className="flex gap-3 text-zinc-600 mr-4">
                  <button onClick={() => window.alert("[ANTIGRAVITY_OS]\n\nATTACHMENTS_OFFLINE.")} className="hover:text-white cursor-pointer transition-colors" title="Attach Data">
                    <Paperclip size={14} />
                  </button>
                  <button onClick={() => window.alert("[ANTIGRAVITY_OS]\n\nPARAMETERS_UNAVAILABLE_WITHOUT_SESSION.")} className="hover:text-white cursor-pointer transition-colors" title="Configure">
                    <Settings2 size={14} />
                  </button>
                  <button onClick={() => window.alert("[ANTIGRAVITY_OS]\n\nSECURITY_POLICIES_INACTIVE.")} className="hover:text-white cursor-pointer transition-colors" title="Security Settings">
                    <Shield size={14} />
                  </button>
                </div>
                <div className="flex-1 flex justify-end items-center gap-4">
                   <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-600 uppercase" title="Awaiting incoming Webhooks">OFFLINE MODE</span>
                   <button 
                     onClick={() => window.alert("[ANTIGRAVITY_OS]\n\nERROR_403: AWAITING_ACTIVE_SESSION.\nPlease select an active session on the left to transmit commands.")}
                     className="bg-[#1c1c1c] text-zinc-400 border border-[#262626] px-4 py-1.5 text-[9px] font-mono font-bold tracking-widest uppercase hover:bg-zinc-800 hover:text-white transition-colors"
                     title="Execute Command"
                   >
                     EXECUTE
                   </button>
                </div>
              </div>
            </div>
            
            {/* Status Line */}
            <div className="flex items-center justify-between text-[8px] font-mono tracking-[0.15em] uppercase text-zinc-600 px-1 py-1">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-zinc-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                  <span>SUPABASE REALTIME</span>
                </div>
                <span>{conversations.length} SESSIONS</span>
              </div>
              <div className="flex items-center gap-2">
                 <span>WEBHOOK: /API/WEBHOOKS/ANTIGRAVITY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view (when conversations exist)
  return (
    <div className="flex flex-col h-full bg-[#121212] p-8 overflow-auto">
      <div className="mb-8 border-b border-[#262626] pb-4">
        <h2 className="text-[11px] font-mono font-bold tracking-[0.2em] text-white uppercase mb-2">ACTIVE SESSIONS</h2>
        <p className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">{conversations.length} CONVERSATION{conversations.length !== 1 ? "S" : ""} // SORTED BY LAST ACTIVITY</p>
      </div>

      <div className="space-y-3 max-w-4xl">
        {conversations.map((conv: any) => (
          <Link key={conv.id} href={`/chat/${conv.id}`}>
            <div className="bg-[#1c1c1c] border border-[#262626] p-4 flex items-center gap-5 hover:border-[#3f3f46] hover:bg-[#202020] transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-[#262626] border border-[#3f3f46] flex items-center justify-center shrink-0">
                <MessageSquare size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <h3 className="text-xs font-mono font-bold tracking-widest text-white truncate">
                    {conv.title}
                  </h3>
                  <span className="px-2 py-0.5 bg-[#262626] text-[8px] font-mono font-bold tracking-widest text-zinc-400 uppercase">
                    {conv.agent?.slug || "UNKNOWN"}
                  </span>
                </div>
                {conv.last_message_at && (
                  <p className="text-[10px] font-mono tracking-wider text-zinc-500 truncate">
                    ACTIVITY: {timeAgo(conv.last_message_at)}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {(conv.unread_count > 0) && (
                  <span className="px-2 py-0.5 bg-white text-black text-[9px] font-mono font-bold">
                    {conv.unread_count}
                  </span>
                )}
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
