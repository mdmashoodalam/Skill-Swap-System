import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          realtime: ['@stomp/stompjs', 'sockjs-client'],
          ui: ['lucide-react', 'react-easy-crop'],
          network: ['axios'],
        },
      },
    },
  },
  define: {
    // ✅ Fix sockjs-client "global is not defined" in Vite
    global: 'globalThis',
  },
})
