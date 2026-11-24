import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// CLIENT_PORT / API_PROXY_TARGET let the app run next to another copy on the default ports.
const clientPort = Number(process.env.CLIENT_PORT) || 3000;
const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:5001';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: clientPort,
    strictPort: true,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
  preview: { port: clientPort },
});
