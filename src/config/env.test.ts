import { EMULATOR_PROJECT_ID, readEnv } from './env';

const full = {
  VITE_FIREBASE_API_KEY: 'k',
  VITE_FIREBASE_AUTH_DOMAIN: 'd',
  VITE_FIREBASE_PROJECT_ID: 'p',
  VITE_FIREBASE_STORAGE_BUCKET: 's',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'm',
  VITE_FIREBASE_APP_ID: 'a',
};

describe('readEnv', () => {
  it('reports every missing variable', () => {
    const result = readEnv({ VITE_FIREBASE_API_KEY: 'k', VITE_FIREBASE_APP_ID: '  ' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toContain('VITE_FIREBASE_APP_ID');
      expect(result.missing).toContain('VITE_FIREBASE_PROJECT_ID');
      expect(result.missing).not.toContain('VITE_FIREBASE_API_KEY');
    }
  });

  it('builds the config when everything is present', () => {
    const result = readEnv(full);
    expect(result).toMatchObject({ ok: true, useEmulators: false, firebase: { projectId: 'p' } });
  });

  it('uses the demo project with emulators and needs no credentials', () => {
    const result = readEnv({ VITE_USE_EMULATORS: 'true' });
    expect(result).toMatchObject({
      ok: true,
      useEmulators: true,
      firebase: { projectId: EMULATOR_PROJECT_ID },
    });
  });
});
