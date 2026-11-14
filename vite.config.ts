import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'Stock & Order',
        short_name: 'StockOrder',
        description: 'Gestão de encomendas e produtos',
        theme_color: '#f5f5f0',
        background_color: '#f5f5f0',
        display: 'standalone',
        start_url: '/',
        icons: []
      }
    })
  ]
})