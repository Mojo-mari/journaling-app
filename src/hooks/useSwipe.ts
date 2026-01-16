import { useState, useRef, useEffect } from 'react';

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // スワイプの最小距離（ピクセル）
  minVelocity?: number; // 最小速度（ピクセル/ミリ秒）
}

export const useSwipe = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  minVelocity = 0.3
}: UseSwipeOptions) => {
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [flipProgress, setFlipProgress] = useState(0); // 0-1の値でページめくりの進捗
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const containerWidthRef = useRef<number>(0);

  const handleTouchStart = (e: TouchEvent) => {
    // ボタンやインタラクティブ要素からのイベントは無視
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || 
        target.closest('button') || 
        target.closest('a') ||
        target.closest('[data-no-swipe]')) {
      return;
    }
    
    const touch = e.touches[0];
    const element = elementRef.current;
    if (element) {
      containerWidthRef.current = element.clientWidth || window.innerWidth;
    }
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    setIsSwiping(true);
    setSwipeOffset(0);
    setFlipProgress(0);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // 縦方向のスクロールが大きい場合は無視
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    // 横方向のスワイプのみ処理
    const width = containerWidthRef.current || window.innerWidth;
    const progress = Math.min(Math.abs(deltaX) / width, 1);
    
    setSwipeOffset(deltaX);
    setFlipProgress(progress);
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current) return;

    const deltaX = swipeOffset;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(deltaX) / deltaTime;

    // スワイプの判定
    if (Math.abs(deltaX) > threshold && velocity > minVelocity) {
      setIsTransitioning(true);
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
      // アニメーション完了後にリセット
      setTimeout(() => {
        setIsTransitioning(false);
        setFlipProgress(0);
      }, 600);
    }

    touchStartRef.current = null;
    setIsSwiping(false);
    setSwipeOffset(0);
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return; // 左クリックのみ
    
    // ボタンやインタラクティブ要素からのイベントは無視
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || 
        target.closest('button') || 
        target.closest('a') ||
        target.closest('[data-no-swipe]')) {
      return;
    }
    
    const element = elementRef.current;
    if (element) {
      containerWidthRef.current = element.clientWidth || window.innerWidth;
    }
    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
    setIsSwiping(true);
    setSwipeOffset(0);
    setFlipProgress(0);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!touchStartRef.current) return;

    const deltaX = e.clientX - touchStartRef.current.x;
    const deltaY = e.clientY - touchStartRef.current.y;

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    const width = containerWidthRef.current || window.innerWidth;
    const progress = Math.min(Math.abs(deltaX) / width, 1);
    
    setSwipeOffset(deltaX);
    setFlipProgress(progress);
  };

  const handleMouseUp = () => {
    if (!touchStartRef.current) return;

    const deltaX = swipeOffset;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(deltaX) / deltaTime;

    if (Math.abs(deltaX) > threshold && velocity > minVelocity) {
      setIsTransitioning(true);
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
      setTimeout(() => {
        setIsTransitioning(false);
        setFlipProgress(0);
      }, 600);
    }

    touchStartRef.current = null;
    setIsSwiping(false);
    setSwipeOffset(0);
    setFlipProgress(0);
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // タッチイベント
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    // マウスイベント（デスクトップ対応）
    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onSwipeLeft, onSwipeRight]);

  return {
    ref: elementRef,
    isSwiping,
    swipeOffset,
    isTransitioning,
    flipProgress,
    swipeDirection: swipeOffset > 0 ? 'right' : swipeOffset < 0 ? 'left' : null
  };
};

