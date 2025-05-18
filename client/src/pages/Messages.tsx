import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

interface User {
  id: number;
  name: string;
  age: number;
  image: string;
}

interface Match {
  id: number;
  user1Id: number;
  user2Id: number;
  createdAt: string;
}

interface MatchWithUser {
  match: Match;
  user: User;
}

interface MessagesProps {
  userId: number;
}

const Messages = ({ userId }: MessagesProps) => {
  const { data: matches = [], isLoading, isError } = useQuery<MatchWithUser[]>({
    queryKey: [`/api/users/${userId}/matches`],
  });

  if (isLoading) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        <p className="mt-4 text-neutral-500">Loading messages...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-center">
        <div className="text-destructive text-5xl mb-4">😕</div>
        <h3 className="text-xl font-bold mb-2">Oops! Something went wrong</h3>
        <p className="text-neutral-500">We couldn't load your messages right now.</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">💬</div>
        <h3 className="text-xl font-bold mb-2">No messages yet</h3>
        <p className="text-neutral-500 mb-4">Match with someone to start chatting!</p>
        <Link href="/">
          <a className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition">
            Find Matches
          </a>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 overflow-y-auto h-full">
      <h2 className="text-2xl font-bold mb-4">Messages</h2>
      <div className="space-y-2">
        {matches.map(({ match, user }) => {
          const matchDate = new Date(match.createdAt);
          return (
            <Card 
              key={match.id} 
              className="hover:bg-muted/40 transition cursor-pointer"
              onClick={() => window.location.href = `/messages/${match.id}`}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{user.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(matchDate, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    You matched with {user.name}!
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Messages;
