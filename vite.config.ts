import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  publicDir: 'content',
  build: { rollupOptions: { input: { main: 'index.html', renderer: 'renderer/v1/index.html' } } },
});
