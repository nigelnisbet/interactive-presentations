import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        'demo-canvas': resolve(__dirname, 'src/demo-canvas/index.html'),
        'fraction-builder': resolve(__dirname, 'src/fraction-builder/index.html'),
      },
    },
    outDir: 'dist',
  },
  server: {
    port: 5174,
  },
});
