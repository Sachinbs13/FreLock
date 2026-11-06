import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_PROXY = {
  '/api': { target: 'http://localhost:5000', changeOrigin: true },
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: API_PROXY,
  },
  preview: {
    host: true,
    port: 5173,
    proxy: API_PROXY,
  },
});
