import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 10, expiration: { maxEntries: 100, maxAgeSeconds: 3600 } }
          }
        ]
      },
      manifest: {
        name: 'AI 供应商管理器',
        short_name: '供应商管理',
        description: 'AI模型供应商管理、测试与监控平台',
        theme_color: '#2D8B4E',
        background_color: '#F8FAFB',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],
  server: { host: '0.0.0.0', port: 3001, allowedHosts: ['vmiiiiii.top', 'supplier.vmiiiiii.top'] }
})
