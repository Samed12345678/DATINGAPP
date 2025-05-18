import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: number;
  name: string;
  age: number;
  bio?: string;
  title?: string;
  image: string;
  distance?: number;
  tags?: string[];
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

interface MatchesProps {
  userId: number;
}

const Matches = ({ userId }: MatchesProps) => {
  const { data: matches = [], isLoading, isError } = useQuery<MatchWithUser[]>({
    queryKey: [`/api/users/${userId}/matches`],
  });

  if (isLoading) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        <p className="mt-4 text-neutral-500">Loading matches...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-center">
        <div className="text-destructive text-5xl mb-4">😕</div>
        <h3 className="text-xl font-bold mb-2">Oops! Something went wrong</h3>
        <p className="text-neutral-500">We couldn't load your matches right now.</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">💘</div>
        <h3 className="text-xl font-bold mb-2">No matches yet</h3>
        <p className="text-neutral-500 mb-4">Keep swiping to find your perfect match!</p>
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
      <h2 className="text-2xl font-bold mb-4">Your Matches</h2>
      <div className="space-y-4">
        {matches.map(({ match, user }) => (
          <Link key={match.id} href={`/messages/${match.id}`}>
            <a className="block">
              <Card className="hover:shadow-md transition cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{user.name}, {user.age}</h3>
                          {user.title && <p className="text-sm text-muted-foreground">{user.title}</p>}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {formatDistanceToNow(new Date(match.createdAt), { addSuffix: true })}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {user.tags?.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-secondary rounded-full text-xs text-secondary-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Matches;
