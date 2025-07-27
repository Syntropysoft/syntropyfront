import { useState } from 'react';

/**
 * Hook to count clicks
 * Single responsibility: Count user clicks
 */
export const useClickCounter = () => {
  const [clickCount, setClickCount] = useState(0);

  const incrementClick = () => {
    setClickCount(prev => prev + 1);
  };

  const resetClickCount = () => {
    setClickCount(0);
  };

  return {
    clickCount,
    incrementClick,
    resetClickCount
  };
}; 