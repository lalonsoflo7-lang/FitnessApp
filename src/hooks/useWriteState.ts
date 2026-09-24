import { useSyncExternalStore } from 'react';
import { getWriteState, subscribeWrites } from '../data/writeTracker';

export function useWriteState() {
  return useSyncExternalStore(subscribeWrites, getWriteState, getWriteState);
}
