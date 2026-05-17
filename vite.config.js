import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Ex: https://sfo.cloud.appwrite.io/v1 → https://sfo.cloud.appwrite.io
  const appwriteBase = (env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1').replace(/\/v1$/, '');

  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',   // SW customizado com suporte a Push
      srcDir: 'src',
      filename: 'sw.js',
      includeAssets: ['favicon.png', 'logo.png', 'robots.txt'],
      manifest: {
        name: 'Wilson Distribuidora',
        short_name: 'Wilson',
        description: 'Qualidade em carnes e produtos selecionados.',
        theme_color: '#800020',
        background_color: '#080808',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MB
      },
    })
  ],
  server: {
    // Proxy para imagens do Appwrite em dev — elimina erro de CORS no localhost
    proxy: {
      '/storage-proxy': {
        target: appwriteBase,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/storage-proxy/, '/v1'),
        secure: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'vitest.setup.js'],
    },
  },
  } // fecha return
})

