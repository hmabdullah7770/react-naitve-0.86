import { useRef, useCallback, useState } from 'react';

// Minimal legend-state: store small pieces of state in a ref to avoid many re-renders
export default function useLegendState(initial = {}) {
  const stateRef = useRef({ ...initial });
  const [, setTick] = useState(0);

  const get = useCallback((key) => stateRef.current[key], []);

  const set = useCallback((key, value, { silent = false } = {}) => {
    stateRef.current[key] = value;
    if (!silent) setTick(t => t + 1);
  }, []);

  const snapshot = useCallback(() => ({ ...stateRef.current }), []);

  return { get, set, snapshot, raw: stateRef.current };
}
