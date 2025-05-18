import { Link, useLocation } from "wouter";
import { Home, HeartHandshake, MessageSquare, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BottomNavigationProps {
  unreadCount?: number;
}

const BottomNavigation = ({ unreadCount = 0 }: BottomNavigationProps) => {
  const [location] = useLocation();

  return (
    <footer className="bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-5 py-3 sticky bottom-0 z-30">
      <nav className="flex items-center justify-around">
        <Link href="/">
          <a className="flex flex-col items-center justify-center text-xs">
            <div className={`mb-1 ${location === "/" ? "text-primary" : "text-neutral-400"}`}>
              <Home className="h-5 w-5" />
            </div>
            <span className={location === "/" ? "font-medium text-primary" : "text-neutral-400"}>Discover</span>
          </a>
        </Link>
        
        <Link href="/matches">
          <a className="flex flex-col items-center justify-center text-xs">
            <div className={`mb-1 ${location === "/matches" ? "text-primary" : "text-neutral-400"}`}>
              <HeartHandshake className="h-5 w-5" />
            </div>
            <span className={location === "/matches" ? "font-medium text-primary" : "text-neutral-400"}>Matches</span>
          </a>
        </Link>
        
        <Link href="/messages">
          <a className="flex flex-col items-center justify-center text-xs">
            <div className={`mb-1 relative ${location === "/messages" ? "text-primary" : "text-neutral-400"}`}>
              <MessageSquare className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <span className={location === "/messages" ? "font-medium text-primary" : "text-neutral-400"}>Messages</span>
          </a>
        </Link>
        
        <Link href="/settings">
          <a className="flex flex-col items-center justify-center text-xs">
            <div className={`mb-1 ${location === "/settings" ? "text-primary" : "text-neutral-400"}`}>
              <Settings className="h-5 w-5" />
            </div>
            <span className={location === "/settings" ? "font-medium text-primary" : "text-neutral-400"}>Settings</span>
          </a>
        </Link>
      </nav>
    </footer>
  );
};

export default BottomNavigation;
