"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { formatTimestamp, timeAgo } from "@/core/utils/dates";
import { Send, Bot, Plus, Mic, ShieldAlert, Cpu } from "lucide-react";
import { useMessages } from "@/interfaces/providers/useMessages";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  
  const { messages, conversation, loading, sendMessage } = useMessages(conversationId);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    try {
      const success = await sendMessage(inputText);
      if (success) {
        setInputText("");
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#121212]">
        <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-3">
           <div className="w-4 h-4 rounded-full border border-zinc-700 border-t-zinc-400 animate-spin" />
           LOADING_SESSION...
        </div>
      </div>
    );
  }

  const agentName = conversation?.agent?.name || conversation?.title || "AGENT";
  const agentSlug = conversation?.agent?.slug?.toUpperCase() || "NEXUS-01";

  // Render dynamic messages directly
  const displayMessages = messages;

  return (
    <div className="flex flex-col h-full bg-[#121212] relative">
      {/* Conversation header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-[#262626] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#262626] border border-[#3f3f46] flex flex-col items-center justify-center relative shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <Bot size={18} className="text-white" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border-[1.5px] border-[#121212]" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-[0.15em] font-mono text-white mb-0.5 uppercase">
              {agentSlug}
            </h2>
            <p className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">
              {conversation?.title || "AWAITING TITLE"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 font-mono text-[9px] font-bold tracking-widest text-zinc-500">
          {["LOGS", "PARAMETERS"].map((tab) => (
            <button 
              key={tab} 
              onClick={() => window.alert(`[ANTIGRAVITY_OS]\n\nACCESS_DENIED: L4_CLEARANCE_REQUIRED_FOR_${tab}`)}
              className="hover:text-white transition-colors uppercase cursor-not-allowed"
              title={`View ${tab}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {/* Session init marker */}
        <div className="flex justify-center mb-10">
          <span className="px-5 py-1.5 text-[9px] font-mono font-bold tracking-[0.2em] text-zinc-500 bg-[#1c1c1c] border border-[#262626] rounded-full uppercase">
            SESSION INIT // {agentSlug}
          </span>
        </div>

        <div className="space-y-8 max-w-4xl mx-auto">
          {displayMessages.map((msg: any) => {
            const isUser = msg.sender_type === "user";
            const dateObj = new Date(msg.created_at);
            const timeStr = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}:${dateObj.getSeconds().toString().padStart(2, '0')}`;

            const senderLabel = isUser ? "USER_01" : (msg.sender_label || agentSlug);

            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                <div className={`flex items-center gap-2 mb-2 font-mono text-[9px] font-bold tracking-widest ${isUser ? "text-zinc-500" : "text-zinc-500"}`}>
                  <span className={isUser ? "text-zinc-400 uppercase" : "text-white uppercase"}>{senderLabel}</span>
                  <span>|</span>
                  <span>{timeStr}</span>
                </div>

                <div className={`p-5 max-w-[80%] ${isUser ? "bg-[#1f1f1f] border border-[#2a2a2a] text-zinc-300" : "bg-[#1c1c1c] border border-[#262626] text-zinc-200"} text-sm leading-relaxed whitespace-pre-wrap`}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          
          {displayMessages.length === 0 && (
             <div className="text-center font-mono text-[10px] tracking-widest text-zinc-600 mt-10">
               AWAITING_INITIAL_TELEMETRY
             </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Bottom Composer and Status Bar Container */}
      <div className="px-8 pb-4 shrink-0 bg-[#121212]">
        <div className="max-w-4xl mx-auto">
          {/* Main Input Box */}
          <div className="bg-[#18181b] border border-[#262626] rounded-md flex px-2 py-2 mb-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <button 
              type="button"
              onClick={() => window.alert("[ANTIGRAVITY_OS]\n\nDATA_ATTACHMENT_OFFLINE")}
              className="flex items-center justify-center w-10 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              title="Attach File"
            >
               <Plus size={18} />
            </button>
            
            <form onSubmit={handleSend} className="flex-1 flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Execute command or enter message..."
                className="w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none px-2 font-mono"
                disabled={sending}
              />
              <div className="flex items-center gap-2 pr-2">
                 <button 
                   type="button" 
                   onClick={() => window.alert("[ANTIGRAVITY_OS]\n\nVOICE_RECOGNITION_MODULE_OFFLINE")}
                   className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                   title="Voice Input"
                 >
                   <Mic size={16} />
                 </button>
                 <button
                   type="submit"
                   disabled={sending || !inputText.trim()}
                   className="bg-white text-black px-4 py-2 text-[10px] font-mono font-bold tracking-widest uppercase flex items-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50"
                 >
                   TRANSMIT
                   <Send size={12} />
                 </button>
              </div>
            </form>
          </div>
          
          {/* Status Line */}
          <div className="flex items-center justify-between text-[8px] font-mono tracking-[0.15em] uppercase text-zinc-600 px-2">
            <div className="flex items-center gap-4">
              <span>MESSAGES: {displayMessages.length}</span>
              <span>SESSION: {agentSlug}</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.3)]" />
               <span>REALTIME SYNC ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
