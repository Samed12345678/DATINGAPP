import { Link } from "wouter";
import { User, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TopNavigationProps {
  unreadCount?: number;
}

const TopNavigation = ({ unreadCount = 0 }: TopNavigationProps) => {
  return (
    <header className="px-4 py-3 flex items-center justify-between bg-white shadow-sm sticky top-0 z-30">
      <div className="w-10">
        <Link href="/profile">
          <a className="text-neutral-500 p-2 block">
            <User className="h-5 w-5" />
          </a>
        </Link>
      </div>
      
      <div>
        <Link href="/">
          <a className="block">
            <h1 className="text-xl font-bold text-primary">SwipeMatch</h1>
          </a>
        </Link>
      </div>
      
      <div className="w-10">
        <Link href="/messages">
          <a className="text-neutral-500 p-2 block relative">
            <MessageSquare className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </a>
        </Link>
      </div>
    </header>
  );
};

export default TopNavigation;
