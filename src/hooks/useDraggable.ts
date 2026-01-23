import { useState, useEffect, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  initialPosition?: Position;
  bounds?: {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
  };
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function useDraggable(options: UseDraggableOptions = {}) {
  const {
    initialPosition = { x: 0, y: 0 },
    bounds,
    onDragStart,
    onDragEnd,
  } = options;

  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    onDragStart?.();
  }, [position, onDragStart]);

  const handleDrag = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;

    // 应用边界限制
    if (bounds) {
      if (bounds.minX !== undefined) newX = Math.max(bounds.minX, newX);
      if (bounds.maxX !== undefined) newX = Math.min(bounds.maxX, newX);
      if (bounds.minY !== undefined) newY = Math.max(bounds.minY, newY);
      if (bounds.maxY !== undefined) newY = Math.min(bounds.maxY, newY);
    }

    setPosition({ x: newX, y: newY });
  }, [isDragging, dragOffset, bounds]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    onDragEnd?.();
  }, [onDragEnd]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  return {
    position,
    setPosition,
    isDragging,
    handleDragStart,
  };
}

