import { useAuth } from "@/_core/hooks/useAuth";
import { Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function Topbar() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { data: unreadCount = 0 } = trpc.notifications.getUnreadCount.useQuery();

  const getPageTitle = () => {
    if (location === "/") return "CONVERSAS";
    if (location === "/notifications") return "NOTIFICAÇÕES";
    if (location === "/settings") return "CONFIGURAÇÕES";
    if (location.startsWith("/chat/")) return "CONVERSA";
    return "DASHBOARD";
  };

  return (
    <header className="topbar-brutalist flex items-center justify-between h-20">
      {/* Title */}
      <div>
        <h1 className="text-brutalist-h2 font-black">{getPageTitle()}</h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <button className="relative p-2 hover:bg-muted transition-colors">
          <Bell size={24} className="text-foreground" />
          {unreadCount > 0 && (
            <span className="badge-unread absolute -top-1 -right-1 text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* User Info */}
        <div className="border-l-4 border-foreground pl-6">
          <p className="text-brutalist-label text-gray-600">USUÁRIO</p>
          <p className="font-bold text-foreground">{user?.name || "Proprietário"}</p>
        </div>
      </div>
    </header>
  );
}
