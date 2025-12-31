import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    global: 'window',  // <-- This makes `global` point to `window`
  },
});
