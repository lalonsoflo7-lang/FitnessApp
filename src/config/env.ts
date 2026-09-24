export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export type EnvResult =
  | { ok: true; useEmulators: boolean; emulatorHost: string; firebase: FirebaseWebConfig }
  | { ok: false; missing: string[] };

const REQUIRED_KEYS = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
} as const satisfies Record<keyof FirebaseWebConfig, string>;

/** Project id used with the Emulator Suite. `demo-*` ids never touch real Firebase resources. */
export const EMULATOR_PROJECT_ID = 'demo-fitnessapp';

type RawEnv = Record<string, string | boolean | undefined>;

export function readEnv(raw: RawEnv): EnvResult {
  const useEmulators = String(raw.VITE_USE_EMULATORS ?? '').toLowerCase() === 'true';
  const emulatorHost = String(raw.VITE_EMULATOR_HOST ?? '') || '127.0.0.1';

  if (useEmulators) {
    return {
      ok: true,
      useEmulators,
      emulatorHost,
      firebase: {
        apiKey: 'demo-api-key',
        authDomain: `${EMULATOR_PROJECT_ID}.firebaseapp.com`,
        projectId: EMULATOR_PROJECT_ID,
        storageBucket: '',
        messagingSenderId: '',
        appId: 'demo-app',
      },
    };
  }

  const missing: string[] = [];
  const config = {} as FirebaseWebConfig;
  for (const [field, envKey] of Object.entries(REQUIRED_KEYS) as [
    keyof FirebaseWebConfig,
    string,
  ][]) {
    const value = raw[envKey];
    if (typeof value !== 'string' || value.trim() === '') {
      missing.push(envKey);
    } else {
      config[field] = value.trim();
    }
  }
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true, useEmulators: false, emulatorHost, firebase: config };
}

export const env: EnvResult = readEnv(import.meta.env as RawEnv);
