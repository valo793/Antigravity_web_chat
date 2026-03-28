import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Notifications() {
  const { data: notifications = [], isLoading } = trpc.notifications.getNotifications.useQuery({
    limit: 50,
  });

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      trpc.useUtils().notifications.getNotifications.invalidate();
      trpc.useUtils().notifications.getUnreadCount.invalidate();
    },
  });

  const markMultipleAsReadMutation = trpc.notifications.markMultipleAsRead.useMutation({
    onSuccess: () => {
      trpc.useUtils().notifications.getNotifications.invalidate();
      trpc.useUtils().notifications.getUnreadCount.invalidate();
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate({ notificationId });
  };

  const handleMarkAllAsRead = () => {
    const unreadIds = notifications
      .filter((n) => !n.isRead)
      .map((n) => n.id);

    if (unreadIds.length > 0) {
      markMultipleAsReadMutation.mutate({ notificationIds: unreadIds });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="brutalist-bracket mb-6">
            <h2 className="text-brutalist-h2 mb-4">SEM NOTIFICAÇÕES</h2>
            <p className="text-brutalist-body text-gray-600">
              Você está em dia! Novas notificações aparecerão aqui.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header with Mark All as Read */}
      <div className="border-b-4 border-foreground p-6 flex items-center justify-between">
        <div>
          <h2 className="text-brutalist-h2 font-black">
            {unreadCount > 0 ? `${unreadCount} NÃO LIDA(S)` : "TODAS LIDAS"}
          </h2>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            disabled={markMultipleAsReadMutation.isPending}
            className="btn-brutalist"
          >
            MARCAR TUDO COMO LIDO
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`card-brutalist cursor-pointer transition-colors ${
              !notification.isRead ? "bg-muted" : ""
            }`}
            onClick={() => {
              if (!notification.isRead) {
                handleMarkAsRead(notification.id);
              }
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-brutalist-h3 font-black mb-1">
                  {notification.title}
                </h3>
                <p className="text-brutalist-label text-gray-600">
                  {notification.kind.toUpperCase()}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsRead(notification.id);
                }}
                className="ml-4 p-2 hover:bg-foreground hover:text-background transition-colors"
              >
                {notification.isRead ? (
                  <CheckCheck size={20} />
                ) : (
                  <Check size={20} />
                )}
              </button>
            </div>

            {notification.body && (
              <p className="text-brutalist-body text-gray-600 mb-3 border-t-2 border-foreground pt-3">
                {notification.body}
              </p>
            )}

            <p className="text-xs text-gray-600">
              {formatDistanceToNow(new Date(notification.createdAt || new Date()), {
                locale: ptBR,
                addSuffix: true,
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
