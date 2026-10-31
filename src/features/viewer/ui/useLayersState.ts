import { useCallback, useState } from 'react';

export interface LayersState {
  showPlans: boolean;
  planVisibility: Record<string, boolean>;
  showActual: boolean;
  showGeology: boolean;
  showScale: boolean;
}

export interface UseLayersStateReturn extends LayersState {
  togglePlan: (wellName: string, visible: boolean) => void;
  toggleShowPlans: (visible: boolean) => void;
  toggleActual: (visible: boolean) => void;
  toggleGeology: (visible: boolean) => void;
  toggleScale: (visible: boolean) => void;
  setShowGeology: React.Dispatch<React.SetStateAction<boolean>>;
  isPlanVisible: (wellName: string) => boolean;
}

export function useLayersState(wells: readonly { name: string }[] = []): UseLayersStateReturn {
  const [showPlans, setShowPlans] = useState(true);
  const [planVisibility, setPlanVisibility] = useState<Record<string, boolean>>({
    L1: true,
    L2: true,
    L3: true,
  });
  const [showActual, setShowActual] = useState(true);
  const [showGeology, setShowGeology] = useState(true);
  const [showScale, setShowScale] = useState(true);

  const getWellNames = useCallback((): string[] => {
    return wells.length > 0 ? wells.map((w) => w.name) : ['L1', 'L2', 'L3'];
  }, [wells]);

  const togglePlan = useCallback(
    (wellName: string, nextChecked: boolean) => {
      setPlanVisibility((prev) => {
        const next = { ...prev, [wellName]: nextChecked };
        if (nextChecked) {
          setShowPlans(true);
        } else {
          const names = getWellNames();
          const anyChecked = names.some((n) => (n === wellName ? false : (next[n] ?? true)));
          if (!anyChecked) {
            setShowPlans(false);
          }
        }
        return next;
      });
    },
    [getWellNames],
  );

  const toggleShowPlans = useCallback(
    (nextChecked: boolean) => {
      setShowPlans(nextChecked);
      if (nextChecked) {
        setPlanVisibility((prev) => {
          const names = getWellNames();
          const anyChecked = names.some((n) => prev[n] ?? true);
          if (!anyChecked) {
            const reset: Record<string, boolean> = {};
            for (const n of names) reset[n] = true;
            return reset;
          }
          return prev;
        });
      }
    },
    [getWellNames],
  );

  const toggleActual = useCallback((visible: boolean) => setShowActual(visible), []);
  const toggleGeology = useCallback((visible: boolean) => setShowGeology(visible), []);
  const toggleScale = useCallback((visible: boolean) => setShowScale(visible), []);

  const isPlanVisible = useCallback(
    (wellName: string) => showPlans && (planVisibility[wellName] ?? true),
    [showPlans, planVisibility],
  );

  return {
    showPlans,
    planVisibility,
    showActual,
    showGeology,
    showScale,
    togglePlan,
    toggleShowPlans,
    toggleActual,
    toggleGeology,
    toggleScale,
    setShowGeology,
    isPlanVisible,
  };
}

