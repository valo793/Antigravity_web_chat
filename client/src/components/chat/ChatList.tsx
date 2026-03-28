import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

export default function ChatList() {
  const [, setLocation] = useLocation();
  const { data: conversations = [], isLoading } = trpc.chat.getConversations.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={32} />
          <p className="font-bold">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="brutalist-bracket mb-6">
            <h2 className="text-brutalist-h2 mb-4">NENHUMA CONVERSA</h2>
            <p className="text-brutalist-body text-gray-600">
              Aguardando novas conversas do Antigravity. As mensagens aparecerão aqui em tempo real.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-4">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => setLocation(`/chat/${conversation.id}`)}
            className="w-full card-brutalist text-left hover:bg-muted transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-brutalist-h3 font-black truncate">
                  {conversation.title}
                </h3>
                <p className="text-brutalist-label text-gray-600 mt-1">
                  {formatDistanceToNow(new Date(conversation.createdAt), {
                    locale: ptBR,
                    addSuffix: true,
                  })}
                </p>
              </div>
              {conversation.unreadCount > 0 && (
                <span className="badge-unread ml-4">
                  {conversation.unreadCount}
                </span>
              )}
            </div>

            {/* Last message preview */}
            {conversation.lastMessageAt && (
              <p className="text-brutalist-body text-gray-600 truncate border-t-2 border-foreground pt-3 mt-3">
                Última mensagem: {formatDistanceToNow(new Date(conversation.lastMessageAt), { locale: ptBR })}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
