import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { attachPresence } from './server/presence.mjs';

export default defineConfig({
  plugins: [react(), {
    name: 'local-listener-presence',
    configureServer(server) { attachPresence(server.httpServer); },
    configurePreviewServer(server) { attachPresence(server.httpServer); },
  }],
  server: { host: '0.0.0.0', port: 5173, strictPort: true },
  preview: { host: '0.0.0.0', port: 4173, strictPort: true },
});
