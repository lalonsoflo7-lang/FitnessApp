import { initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { env } from '../config/env';

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let services: FirebaseServices | null = null;

/**
 * Lazily initialises Firebase. Firestore uses the persistent (IndexedDB) local cache so
 * previously synced data is readable offline and writes are queued until connectivity returns.
 * The multi-tab manager lets several tabs/windows share the same cache safely.
 */
export function getFirebase(): FirebaseServices {
  if (services) return services;
  if (!env.ok) {
    throw new Error(`Faltan variables de entorno de Firebase: ${env.missing.join(', ')}`);
  }
  const app = initializeApp(env.firebase);
  const auth = getAuth(app);
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  if (env.useEmulators) {
    connectAuthEmulator(auth, `http://${env.emulatorHost}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, env.emulatorHost, 8080);
  }
  services = { app, auth, db };
  return services;
}
