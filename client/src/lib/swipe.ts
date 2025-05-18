import { useState, MouseEvent, TouchEvent } from "react";

interface DragState {
  isDragging: boolean;
  startX: number;
  offsetX: number;
}

interface DragHandlers {
  onMouseDown: (e: MouseEvent) => void;
  onTouchStart: (e: TouchEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onMouseUp: () => void;
  onTouchEnd: () => void;
}

interface UseDragOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  swipeThreshold?: number;
}

export function useDrag({ onSwipeLeft, onSwipeRight, swipeThreshold = 100 }: UseDragOptions) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    offsetX: 0,
  });

  const startDrag = (clientX: number) => {
    setDragState({
      isDragging: true,
      startX: clientX,
      offsetX: 0,
    });
  };

  const drag = (clientX: number) => {
    if (!dragState.isDragging) return;

    const offsetX = clientX - dragState.startX;
    setDragState(prev => ({
      ...prev,
      offsetX,
    }));
  };

  const endDrag = () => {
    if (!dragState.isDragging) return;
    
    if (dragState.offsetX > swipeThreshold) {
      // Swipe right
      onSwipeRight();
    } else if (dragState.offsetX < -swipeThreshold) {
      // Swipe left
      onSwipeLeft();
    }
    
    // Reset the drag state
    setDragState({
      isDragging: false,
      startX: 0,
      offsetX: 0,
    });
  };

  const dragHandlers: DragHandlers = {
    onMouseDown: (e: MouseEvent) => startDrag(e.clientX),
    onTouchStart: (e: TouchEvent) => startDrag(e.touches[0].clientX),
    onMouseMove: (e: MouseEvent) => drag(e.clientX),
    onTouchMove: (e: TouchEvent) => drag(e.touches[0].clientX),
    onMouseUp: endDrag,
    onTouchEnd: endDrag,
  };

  return { dragState, dragHandlers };
}
