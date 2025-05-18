import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Matches from "@/pages/Matches";
import Messages from "@/pages/Messages";
import ChatConversation from "@/pages/ChatConversation";
import BottomNavigation from "./components/BottomNavigation";
import TopNavigation from "./components/TopNavigation";
import { useState, useEffect } from "react";

function App() {
  const [location] = useLocation();
  const [currentUser, setCurrentUser] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Set a default user ID on first load
  useEffect(() => {
    // In a real app, this would come from auth
    // For demo purposes, we'll use a fixed user ID
    setCurrentUser(1);
  }, []);

  // Fetch unread message count
  useEffect(() => {
    if (currentUser) {
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch(`/api/users/${currentUser}/unread`);
          const data = await response.json();
          setUnreadCount(data.count);
        } catch (error) {
          console.error("Failed to fetch unread count:", error);
        }
      };

      fetchUnreadCount();
      
      // Poll for new messages every 10 seconds
      const interval = setInterval(fetchUnreadCount, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Hide bottom navigation on chat conversation routes
  const shouldShowNavigation = !location.startsWith("/messages/");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="app-container">
          <TopNavigation unreadCount={unreadCount} />
          <main className="relative h-[calc(100%-120px)] overflow-hidden">
            <Switch>
              <Route path="/" component={() => <Home userId={currentUser || 1} />} />
              <Route path="/matches" component={() => <Matches userId={currentUser || 1} />} />
              <Route path="/messages" component={() => <Messages userId={currentUser || 1} />} />
              <Route path="/messages/:matchId" component={ChatConversation} />
              <Route component={NotFound} />
            </Switch>
          </main>
          {shouldShowNavigation && <BottomNavigation unreadCount={unreadCount} />}
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
