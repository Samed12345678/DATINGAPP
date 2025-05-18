import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface Profile {
  id: number;
  name: string;
  age: number;
  bio?: string;
  title?: string;
  image: string;
  distance?: number;
  tags?: string[];
  score?: string;
  likesReceived?: number;
  dislikesReceived?: number;
}

interface ProfileCardProps {
  profile: Profile;
}

const ProfileCard = ({ profile }: ProfileCardProps) => {
  return (
    <div className="w-full">
      {/* Profile image */}
      <div className="relative">
        <img 
          src={profile.image} 
          alt={`${profile.name}, ${profile.age}`} 
          className="w-full h-96 object-cover"
        />
        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/70 to-transparent text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{profile.name}, {profile.age}</h2>
              {profile.title && (
                <p className="text-sm opacity-90">{profile.title}</p>
              )}
            </div>
            {profile.score && (
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center">
                <span className="text-xs font-medium mr-1">Score</span>
                <span className="text-sm font-bold">{Math.round(parseFloat(profile.score))}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile details */}
      <CardContent className="p-4">
        {profile.bio && (
          <>
            <h3 className="font-medium text-lg mb-2">About</h3>
            <p className="text-neutral-600 mb-4">{profile.bio}</p>
          </>
        )}
        
        {profile.distance !== undefined && (
          <div className="flex items-center space-x-2 text-sm text-neutral-600 mb-3">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{profile.distance} {profile.distance === 1 ? 'mile' : 'miles'} away</span>
          </div>
        )}
        
        {profile.tags && profile.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="rounded-full">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  );
};

export default ProfileCard;
