import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import ProfileCard from "@/components/ProfileCard";
import SwipeButtons from "@/components/SwipeButtons";
import MatchModal from "@/components/MatchModal";
import { useToast } from "@/hooks/use-toast";
import { useDrag } from "@/lib/swipe";

interface User {
  id: number;
  name: string;
  age: number;
  bio: string;
  title: string;
  image: string;
  distance: number;
  tags: string[];
  score?: string;
  likesReceived?: number;
  dislikesReceived?: number;
}

interface HomeProps {
  userId: number;
}

const Home = ({ userId }: HomeProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [remainingCredits, setRemainingCredits] = useState(10);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch potential matches
  const { data: profiles = [], isLoading, isError } = useQuery<User[]>({
    queryKey: [`/api/users/${userId}/swipe`],
  });

  // Fetch user credits
  const { data: creditsData } = useQuery<{credits: number}>({
    queryKey: [`/api/users/${userId}/credits`],
    refetchInterval: 60000 // Refresh every minute to check for credit resets
  });
  
  // Update remaining credits when data changes
  useEffect(() => {
    if (creditsData?.credits !== undefined) {
      setRemainingCredits(creditsData.credits);
      
      // Show a warning toast when credits are running low
      if (creditsData.credits === 1) {
        toast({
          title: "Last credit remaining",
          description: "You have only 1 like left today. Choose wisely!",
          variant: "warning",
        });
      }
    }
  }, [creditsData, toast]);

  // Handle swipe mutation
  const swipeMutation = useMutation({
    mutationFn: async ({ swiperId, swipedId, liked }: { swiperId: number; swipedId: number; liked: boolean }) => {
      const res = await apiRequest('POST', '/api/swipes', { swiperId, swipedId, liked });
      return res.json();
    },
    onSuccess: (data) => {
      // If it's a match, show the match modal
      if (data.isMatch) {
        setMatchedUser(data.matchedUser);
        setShowMatchModal(true);
      }
      
      // Update remaining credits
      if (data.creditsRemaining !== undefined) {
        setRemainingCredits(data.creditsRemaining);
      }
      
      // Go to next card
      goToNextProfile();
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/swipe`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/credits`] });
    },
    onError: (error: any) => {
      // Handle no credits error
      if (error?.response?.status === 403) {
        toast({
          title: "Out of credits",
          description: "You don't have enough credits to like more profiles today. Try again tomorrow!",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Swipe failed",
        description: "Failed to register your swipe. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Setup drag functionality for swiping
  const { dragState, dragHandlers } = useDrag({
    onSwipeLeft: () => handleSwipe(false),
    onSwipeRight: () => handleSwipe(true),
  });

  // Handle the swipe action
  const handleSwipe = (liked: boolean) => {
    if (profiles.length <= currentIndex) return;
    
    const currentProfile = profiles[currentIndex];
    
    // Check if user has enough credits to like
    if (liked && remainingCredits <= 0) {
      toast({
        title: "Out of credits",
        description: "You've used all your daily likes. Credits will refresh tomorrow!",
        variant: "destructive",
      });
      return;
    }
    
    if (cardRef.current) {
      liked ? cardRef.current.classList.add('swipe-right') : cardRef.current.classList.add('swipe-left');
      
      // Delay the API call slightly to let the animation start
      setTimeout(() => {
        swipeMutation.mutate({
          swiperId: userId,
          swipedId: currentProfile.id,
          liked,
        });
      }, 100);
    }
  };

  // Go to the next profile
  const goToNextProfile = () => {
    setCurrentIndex(prevIndex => prevIndex + 1);
  };

  // Close the match modal
  const handleCloseMatch = () => {
    setShowMatchModal(false);
  };

  // Current profile to display
  const currentProfile = profiles[currentIndex];

  // Apply dragging styles
  const getCardStyle = () => {
    if (!dragState.isDragging) return {};
    
    const { offsetX } = dragState;
    const rotate = offsetX * 0.1;
    const opacity = Math.max(1 - Math.abs(offsetX) / 500, 0.7);
    
    return {
      transform: `translateX(${offsetX}px) rotate(${rotate}deg)`,
      opacity
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        <p className="mt-4 text-neutral-500">Loading profiles...</p>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <div className="text-destructive text-5xl mb-4">😕</div>
        <h3 className="text-xl font-bold mb-2">Oops! Something went wrong</h3>
        <p className="text-neutral-500 mb-4">We couldn't load profiles for you right now.</p>
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/swipe`] })}
          className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  // No more profiles state
  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-xl font-bold mb-2">You've seen everyone!</h3>
        <p className="text-neutral-500 mb-4">Check back later for new profiles.</p>
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/swipe`] })}
          className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Credit counter */}
      <div className="px-4 pt-2 pb-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-sm font-medium text-neutral-600">Daily Credits:</span>
            <div className="ml-2 px-2 py-1 bg-primary/10 rounded-full">
              <span className={`text-sm font-bold ${remainingCredits > 0 ? 'text-primary' : 'text-destructive'}`}>
                {remainingCredits} {remainingCredits === 1 ? 'like' : 'likes'} remaining
              </span>
            </div>
          </div>
          {currentProfile && (
            <div className="text-xs text-neutral-500">
              Profile Score: {currentProfile.score || '100'}
            </div>
          )}
        </div>
      </div>
      
      {/* Card stack */}
      <div className="card-stack flex-1 flex items-center justify-center px-4 py-2">
        <div 
          ref={cardRef}
          className="swipe-card w-full bg-white rounded-xl overflow-hidden shadow-lg"
          style={getCardStyle()}
          {...dragHandlers}
        >
          <ProfileCard profile={currentProfile} />
        </div>
        
        {/* Next card preview (for stack effect) */}
        {profiles[currentIndex + 1] && (
          <div className="swipe-card w-full bg-white rounded-xl overflow-hidden shadow-lg -mt-2 scale-[0.98] opacity-90 absolute top-0 left-0 right-0 z-[-1]">
            <div className="relative">
              <img 
                src={profiles[currentIndex + 1].image} 
                alt={profiles[currentIndex + 1].name} 
                className="w-full h-96 object-cover"
              />
            </div>
          </div>
        )}

        {/* Second next card preview (deeper in stack) */}
        {profiles[currentIndex + 2] && (
          <div className="swipe-card w-full bg-white rounded-xl overflow-hidden shadow-lg -mt-4 scale-[0.96] opacity-80 absolute top-0 left-0 right-0 z-[-2]">
            <div className="relative">
              <img 
                src={profiles[currentIndex + 2].image} 
                alt={profiles[currentIndex + 2].name} 
                className="w-full h-96 object-cover"
              />
            </div>
          </div>
        )}
      </div>

      {/* Swipe buttons */}
      <SwipeButtons 
        onSwipeLeft={() => handleSwipe(false)} 
        onSwipeRight={() => handleSwipe(true)}
        creditsRemaining={remainingCredits}
      />

      {/* Match modal */}
      {showMatchModal && matchedUser && (
        <MatchModal user={matchedUser} onClose={handleCloseMatch} />
      )}
    </div>
  );
};

export default Home;
