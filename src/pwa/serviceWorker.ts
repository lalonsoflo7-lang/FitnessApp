import { registerSW } from 'virtual:pwa-register';

/**
 * Service worker lifecycle. Strategy "prompt": a new version is downloaded in the background
 * and only activated when the user taps "Actualizar", so an update never reloads the app in
 * the middle of a workout. All static assets are precached, so the app opens offline.
 */
type Listener = () => void;

interface SwState {
  needRefresh: boolean;
  offlineReady: boolean;
}

let state: SwState = { needRefresh: false, offlineReady: false };
const listeners = new Set<Listener>();
let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null;

function set(patch: Partial<SwState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh: () => set({ needRefresh: true }),
    onOfflineReady: () => set({ offlineReady: true }),
    onRegisteredSW(_url, registration) {
      // Check for new versions periodically while the app stays open (installed PWAs rarely reload).
      if (registration) {
        window.setInterval(() => void registration.update().catch(() => undefined), 60 * 60 * 1000);
      }
    },
  });
}

export function subscribeSw(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSwState() {
  return state;
}

export function applyUpdate() {
  void updateSW?.(true);
}

export function dismissUpdate() {
  set({ needRefresh: false, offlineReady: false });
}
