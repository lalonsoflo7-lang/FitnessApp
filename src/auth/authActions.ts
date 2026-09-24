import {
  GoogleAuthProvider,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { getFirebase } from '../firebase/firebase';

/** True when running as an installed PWA (Android/desktop `display-mode` or iOS `standalone`). */
export function isStandalonePwa(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

/**
 * Google Sign-In.
 * - Installed PWA (notably iOS standalone): redirect. Popups there open in a separate browser
 *   sheet that cannot report back to the app. The redirect works in Safari because the app is
 *   served from the same origin as `authDomain` (see config/canonicalOrigin.ts).
 * - Browser tab: popup, falling back to redirect if the popup is blocked.
 */
export async function signInWithGoogle(): Promise<void> {
  const { auth } = getFirebase();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  if (isStandalonePwa()) {
    await signInWithRedirect(auth, provider);
    return;
  }
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      (error.code === 'auth/popup-blocked' ||
        error.code === 'auth/operation-not-supported-in-this-environment')
    ) {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw error;
  }
}

/** Completes a pending redirect sign-in. Resolves quietly when there was none. */
export async function consumeRedirectResult(): Promise<void> {
  await getRedirectResult(getFirebase().auth);
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { auth } = getFirebase();
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signUpWithEmail(email: string, password: string): Promise<void> {
  const { auth } = getFirebase();
  await createUserWithEmailAndPassword(auth, email.trim(), password);
}

export async function signOut(): Promise<void> {
  await fbSignOut(getFirebase().auth);
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/popup-closed-by-user': 'Cerraste la ventana de inicio de sesión antes de terminar.',
  'auth/cancelled-popup-request': 'Se canceló el inicio de sesión. Inténtalo de nuevo.',
  'auth/network-request-failed':
    'No hay conexión. Necesitas internet la primera vez que inicias sesión.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/user-not-found': 'No existe una cuenta con ese correo.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Inicia sesión.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  'auth/unauthorized-domain':
    'Este dominio no está autorizado en Firebase Auth (Authentication → Settings → Authorized domains).',
  'auth/operation-not-allowed':
    'Este método de inicio de sesión no está habilitado en la consola de Firebase.',
};

export function describeAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    return AUTH_ERROR_MESSAGES[error.code] ?? `No se pudo iniciar sesión (${error.code}).`;
  }
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
}
