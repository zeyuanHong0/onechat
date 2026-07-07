import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: 'src/ai-chat.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {},
  },
  server: {
    port: 5173,
    open: true,
  },
});
