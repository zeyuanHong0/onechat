import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: 'src/ai-chat.ts',
      name: 'OneChat',
      formats: ['es', 'iife'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.global.js'),
    },
    rollupOptions: {},
  },
  server: {
    port: 5173,
    open: true,
  },
});
