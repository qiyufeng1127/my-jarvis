import { useState, useCallback } from 'react';

export function useThinkingProcess() {
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);

  const addStep = useCallback((step: string) => {
    setThinkingSteps((prev) => [...prev, step]);
  }, []);

  const clearSteps = useCallback(() => {
    setThinkingSteps([]);
  }, []);

  const setSteps = useCallback((steps: string[]) => {
    setThinkingSteps(steps);
  }, []);

  return {
    thinkingSteps,
    addStep,
    clearSteps,
    setSteps,
  };
}

