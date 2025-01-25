import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173, // Specify a consistent port
    host: true, // Listen on all network interfaces
    strictPort: true, // Don't try other ports if 5173 is taken
  },
});
