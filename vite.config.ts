/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from https://<user>.github.io/heliotrope/
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/heliotrope/' : '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    // One jsdom per worker instead of one per test file: about 25% faster, still isolated.
    pool: 'vmThreads',
  },
});
