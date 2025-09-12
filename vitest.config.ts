import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [{ find: /^@\//, replacement: path.resolve(__dirname, 'src/') + '/' }],
  },
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    globals: true,
    pool: 'threads',
    poolOptions: {
      threads: { singleThread: true },
    },
  },
});
