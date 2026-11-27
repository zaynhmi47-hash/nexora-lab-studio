import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      { find: 'next/navigation', replacement: path.resolve(__dirname, 'test/mocks/next-navigation.ts') },
      { find: 'next/server', replacement: path.resolve(__dirname, 'test/mocks/next-server.ts') },
      { find: 'next/headers', replacement: path.resolve(__dirname, 'test/mocks/next-headers.ts') },
      { find: '@/locales', replacement: path.resolve(__dirname, 'messages') },
      { find: '@', replacement: path.resolve(__dirname, '.') },
    ],
  },
  build: {
    target: 'esnext', // sau 'es2017', 'es2018' etc, evită transpiling inutil
  },
  test: {
    globals: true,
    deps: { inline: ['next-intl'] },
    environment: 'jsdom',
  },
});
