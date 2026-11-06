import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  define: {
    'import.meta.env.VITE_RENDERER_REVISION': JSON.stringify(
      process.env.GITHUB_SHA || Date.now().toString(36),
    ),
  },
  plugins: [react()],
  publicDir: 'content',
  build: { rollupOptions: { input: { main: 'index.html', renderer: 'renderer/v1/index.html' } } },
});
