import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Migrated vite.config.js
 * – Removes the base44 vite plugin
 * – Aliases @/api/base44Client → the local PHP-backed API shim
 * – Adds a dev-server proxy so /api/* requests hit XAMPP directly
 */
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Drop-in replacement: same import path, local PHP backend
      '@/api/base44Client': path.resolve(__dirname, './src/api/index.js'),
    },
  },

  server: {
    port: 5173,
    proxy: {
      // Proxy all /api/* and /auth/* calls to XAMPP
      '/api': {
        target: 'http://localhost/scout_connect/backend',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, '/api'),
      },
      '/auth': {
        target: 'http://localhost/scout_connect/backend',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/auth/, '/auth'),
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});