import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

interface PerformanceGovernorProps {
  /** Deliberate render cap for consistent laptop and mobile performance. */
  targetFPS?: number;
}

/**
 * Pair this with Canvas frameloop="demand". The scene continues to animate,
 * but renders at a controlled cadence rather than spinning at the display's
 * maximum refresh rate. A 30 FPS target keeps motion legible while reducing
 * GPU load on integrated graphics and mobile devices.
 */
export default function PerformanceGovernor({ targetFPS = 30 }: PerformanceGovernorProps) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const frameInterval = Math.max(1, 1000 / Math.max(1, targetFPS));
    invalidate();
    const timer = window.setInterval(() => invalidate(), frameInterval);
    return () => window.clearInterval(timer);
  }, [invalidate, targetFPS]);

  return null;
}
