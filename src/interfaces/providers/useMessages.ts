"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/infrastructure/database/supabase/client";
import type { Message } from "@/core/domain";

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/conversations/${conversationId}/messages`);
    if (res.ok) {
      const json = await res.json();
      setMessages(json.data || []);
    }
  }, [conversationId]);

  const fetchConversation = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (res.ok) {
      const json = await res.json();
      const conv = (json.data || []).find((c: any) => c.id === conversationId);
      setConversation(conv);
    }
  }, [conversationId]);

  useEffect(() => {
    Promise.all([fetchMessages(), fetchConversation()]).then(() =>
      setLoading(false)
    );

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, supabase, fetchMessages, fetchConversation]);

  const sendMessage = async (inputText: string): Promise<boolean> => {
    if (!inputText.trim()) return false;
    
    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          content: inputText.trim(),
        }),
      });

      if (res.ok) {
        setTimeout(fetchMessages, 500);
        return true;
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
    
    return false;
  };

  return { messages, conversation, loading, sendMessage, fetchMessages };
}
