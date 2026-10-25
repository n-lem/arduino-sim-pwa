import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Arduino Sim Offline',
        short_name: 'ArduinoSim',
        description: 'Simulador de circuitos y programación de Arduino Uno offline y táctil',
        theme_color: '#00979D',
        background_color: '#0F172A',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,json}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document' ||
                                         request.destination === 'script' ||
                                         request.destination === 'style' ||
                                         request.destination === 'image' ||
                                         request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'arduino-sim-core-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año offline
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true
  }
})
