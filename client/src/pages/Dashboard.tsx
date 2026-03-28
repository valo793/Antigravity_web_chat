import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import ChatList from "@/components/chat/ChatList";
import ChatThread from "@/components/chat/ChatThread";
import Notifications from "@/components/notifications/Notifications";
import Settings from "@/components/settings/Settings";

export default function Dashboard() {
  const [location] = useLocation();
  const { user } = useAuth();

  const renderContent = () => {
    if (location === "/") {
      return <ChatList />;
    } else if (location.startsWith("/chat/")) {
      const conversationId = location.split("/")[2];
      return <ChatThread conversationId={conversationId} />;
    } else if (location === "/notifications") {
      return <Notifications />;
    } else if (location === "/settings") {
      return <Settings />;
    }
    return <ChatList />;
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <Topbar />

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
