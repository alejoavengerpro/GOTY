import { defineConfig } from 'vite';

// base relativa para que el build funcione en GitHub Pages o cualquier subcarpeta
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 900 },
});
