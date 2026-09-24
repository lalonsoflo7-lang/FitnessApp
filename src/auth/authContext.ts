import { createContext } from 'react';
import type { User } from 'firebase/auth';

export interface AuthState {
  user: User | null;
  /** True until Firebase restores (or rules out) a persisted session. */
  initializing: boolean;
  /** Error from a Google redirect sign-in that came back unsuccessfully. */
  redirectError: string | null;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  initializing: true,
  redirectError: null,
});
