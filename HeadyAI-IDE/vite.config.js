// HEADY_BRAND:BEGIN
// ╔══════════════════════════════════════════════════════════════════╗
// ║  ██╗  ██╗███████╗ █████╗ ██████╗ ██╗   ██╗                     ║
// ║  ██║  ██║██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝                     ║
// ║  ███████║█████╗  ███████║██║  ██║ ╚████╔╝                      ║
// ║  ██╔══██║██╔══╝  ██╔══██║██║  ██║  ╚██╔╝                       ║
// ║  ██║  ██║███████╗██║  ██║██████╔╝   ██║                        ║
// ║  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝    ╚═╝                        ║
// ║                                                                  ║
// ║  ∞ SACRED GEOMETRY ∞  Organic Systems · Breathing Interfaces    ║
// ║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
// ║  FILE: HeadyAI-IDE/vite.config.js                                ║
// ║  LAYER: root                                                     ║
// ╚══════════════════════════════════════════════════════════════════╝
// HEADY_BRAND:END

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isWebMode = process.env.VITE_MODE === 'web';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: isWebMode ? 'build-web' : 'build',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      // Exclude Electron from web builds
      external: isWebMode ? ['electron'] : [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          monaco: ['@monaco-editor/react'],
          ui: ['framer-motion', 'lucide-react'],
          router: ['react-router-dom']
        }
      }
    }
  },
  server: {
    port: isWebMode ? 3400 : 5173,
    host: true,
    open: false,
    // Proxy API calls to the backend in dev mode
    proxy: isWebMode ? {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: (process.env.VITE_API_URL || 'http://localhost:8080').replace('http', 'ws'),
        ws: true,
      },
    } : {},
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __WEB_MODE__: JSON.stringify(isWebMode),
  }
});
