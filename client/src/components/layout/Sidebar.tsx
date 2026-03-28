import { useLocation } from "wouter";
import { MessageSquare, Bell, Settings, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { logout } = useAuth();
  const { data: unreadCount = 0 } = trpc.notifications.getUnreadCount.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => location === path || location.startsWith(path + "/");

  return (
    <aside className="sidebar-brutalist w-64 flex flex-col border-r-4 border-foreground">
      {/* Logo */}
      <div className="p-6 border-b-4 border-foreground">
        <h2 className="text-brutalist-h3 font-black">AG</h2>
        <p className="text-brutalist-label text-gray-600 mt-2">CHAT</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-4">
        {/* Conversations */}
        <button
          onClick={() => setLocation("/")}
          className={`w-full flex items-center gap-3 px-4 py-3 font-bold transition-all ${
            isActive("/") 
              ? "bg-foreground text-background border-l-4 border-foreground" 
              : "hover:bg-muted"
          }`}
        >
          <MessageSquare size={20} />
          <span>CONVERSAS</span>
        </button>

        {/* Notifications */}
        <button
          onClick={() => setLocation("/notifications")}
          className={`w-full flex items-center gap-3 px-4 py-3 font-bold transition-all relative ${
            isActive("/notifications") 
              ? "bg-foreground text-background border-l-4 border-foreground" 
              : "hover:bg-muted"
          }`}
        >
          <Bell size={20} />
          <span>NOTIFICAÇÕES</span>
          {unreadCount > 0 && (
            <span className="badge-unread ml-auto text-xs">{unreadCount}</span>
          )}
        </button>

        {/* Settings */}
        <button
          onClick={() => setLocation("/settings")}
          className={`w-full flex items-center gap-3 px-4 py-3 font-bold transition-all ${
            isActive("/settings") 
              ? "bg-foreground text-background border-l-4 border-foreground" 
              : "hover:bg-muted"
          }`}
        >
          <Settings size={20} />
          <span>CONFIGURAÇÕES</span>
        </button>
      </nav>

      {/* Logout */}
      <div className="p-6 border-t-4 border-foreground">
        <Button
          onClick={handleLogout}
          className="btn-brutalist w-full flex items-center justify-center gap-2"
          disabled={logoutMutation.isPending}
        >
          <LogOut size={18} />
          SAIR
        </Button>
      </div>
    </aside>
  );
}
