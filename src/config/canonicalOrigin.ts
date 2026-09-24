/**
 * Firebase Hosting serves the app on two domains: <project>.web.app and <project>.firebaseapp.com.
 * Google Sign-In uses the `authDomain` (<project>.firebaseapp.com by default). When the app runs on
 * a different origin, Safari/iOS (which blocks third-party storage) can break the redirect flow.
 * Serving the app from the same origin as `authDomain` avoids that, so web.app redirects there.
 * It also keeps a single origin for the installed PWA, IndexedDB cache and localStorage.
 */
export function canonicalRedirectUrl(
  location: Pick<Location, 'protocol' | 'hostname' | 'pathname' | 'search' | 'hash'>,
  firebase: { projectId: string; authDomain: string },
): string | null {
  if (location.protocol !== 'https:') return null;
  const webAppHost = `${firebase.projectId}.web.app`;
  if (location.hostname !== webAppHost || firebase.authDomain === webAppHost) return null;
  return `https://${firebase.authDomain}${location.pathname}${location.search}${location.hash}`;
}
