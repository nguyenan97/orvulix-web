import { useEffect, useState } from 'react';
import type { ToolSeoOverride } from './types';

type Overrides = Record<string, ToolSeoOverride>;

let cache: Overrides | undefined;
let pending: Promise<Overrides> | undefined;

/** Loads the override registry once, in its own chunk. */
export const loadToolOverrides = (): Promise<Overrides> => {
  pending ??= import('./overrides').then((module) => {
    cache = module.TOOL_OVERRIDES;
    return cache;
  });
  return pending;
};

/** Override registry, or undefined until its chunk has loaded. */
export const useToolOverrides = (enabled = true): Overrides | undefined => {
  const [overrides, setOverrides] = useState(cache);
  useEffect(() => {
    if (!enabled || overrides) return;
    let active = true;
    loadToolOverrides()
      .then((loaded) => {
        if (active) setOverrides(loaded);
      })
      .catch(() => {
        /* RouteSeo can still use default metadata if this optional chunk fails. */
      });
    return () => {
      active = false;
    };
  }, [overrides, enabled]);
  return overrides;
};
