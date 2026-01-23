import { useState, useEffect, useCallback } from 'react';

interface Size {
  width: number;
  height: number;
}

interface UseResizableOptions {
  initialSize?: Size;
  minSize?: Size;
  maxSize?: Size;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}

export function useResizable(options: UseResizableOptions = {}) {
  const {
    initialSize = { width: 400, height: 600 },
    minSize = { width: 320, height: 400 },
    maxSize,
    onResizeStart,
    onResizeEnd,
  } = options;

  const [size, setSize] = useState<Size>(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
    onResizeStart?.();
  }, [size, onResizeStart]);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    let newWidth = resizeStart.width + deltaX;
    let newHeight = resizeStart.height + deltaY;

    // 应用最小尺寸限制
    newWidth = Math.max(minSize.width, newWidth);
    newHeight = Math.max(minSize.height, newHeight);

    // 应用最大尺寸限制
    if (maxSize) {
      newWidth = Math.min(maxSize.width, newWidth);
      newHeight = Math.min(maxSize.height, newHeight);
    }

    setSize({ width: newWidth, height: newHeight });
  }, [isResizing, resizeStart, minSize, maxSize]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    onResizeEnd?.();
  }, [onResizeEnd]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResize, handleResizeEnd]);

  return {
    size,
    setSize,
    isResizing,
    handleResizeStart,
  };
}

