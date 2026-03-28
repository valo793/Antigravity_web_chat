import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ChatThreadProps {
  conversationId: string;
}

export default function ChatThread({ conversationId }: ChatThreadProps) {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = trpc.chat.getMessages.useQuery({
    conversationId,
  });

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      trpc.useUtils().chat.getMessages.invalidate({ conversationId });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    sendMessageMutation.mutate({
      conversationId,
      content: messageText,
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages Container */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 font-bold">Nenhuma mensagem ainda</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderType === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md ${
                  message.senderType === "user"
                    ? "message-user"
                    : "message-agent"
                }`}
              >
                <p className="text-brutalist-label mb-2 font-bold">
                  {message.senderLabel}
                </p>
                <p className="text-brutalist-body mb-2">{message.content}</p>
                <p className="text-xs text-gray-600">
                  {formatDistanceToNow(new Date(message.createdAt), {
                    locale: ptBR,
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t-4 border-foreground p-6 bg-background">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={sendMessageMutation.isPending}
            className="flex-1 border-2 border-foreground px-4 py-2 font-bold"
          />
          <Button
            type="submit"
            disabled={sendMessageMutation.isPending || !messageText.trim()}
            className="btn-brutalist flex items-center gap-2"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Send size={18} />
            )}
            ENVIAR
          </Button>
        </form>
      </div>
    </div>
  );
}
