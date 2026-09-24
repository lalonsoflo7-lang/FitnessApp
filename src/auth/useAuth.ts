import { useContext } from 'react';
import { AuthContext } from './authContext';

export function useAuth() {
  return useContext(AuthContext);
}

/** Returns the signed-in uid. Only use below <RequireAuth>. */
export function useUid(): string {
  const { user } = useContext(AuthContext);
  if (!user) throw new Error('useUid() se llamó sin sesión iniciada');
  return user.uid;
}
