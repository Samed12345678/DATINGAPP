import { Button } from "@/components/ui/button";
import { X, Heart, Star } from "lucide-react";

interface SwipeButtonsProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSuperLike?: () => void;
}

const SwipeButtons = ({ onSwipeLeft, onSwipeRight, onSuperLike }: SwipeButtonsProps) => {
  return (
    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center space-x-6 z-20">
      <Button
        onClick={onSwipeLeft}
        className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg border border-neutral-300 hover:scale-105 active:scale-95 p-0"
      >
        <X className="h-6 w-6 text-destructive" />
      </Button>
      
      <Button
        onClick={onSwipeRight}
        className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg border border-neutral-300 hover:scale-105 active:scale-95 p-0"
      >
        <Heart className="h-6 w-6 text-primary" fill="currentColor" />
      </Button>
      
      {onSuperLike && (
        <Button
          onClick={onSuperLike}
          className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg border border-neutral-300 hover:scale-105 active:scale-95 p-0"
        >
          <Star className="h-5 w-5 text-blue-500" fill="currentColor" />
        </Button>
      )}
    </div>
  );
};

export default SwipeButtons;
