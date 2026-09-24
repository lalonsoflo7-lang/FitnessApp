import { defineConfig } from 'vitest/config';

// Security-rules tests: run against the Firestore emulator (`npm run test:rules`).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20000,
  },
});
