import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    css: false,
  },
  base: './',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.VITE_APP_VERSION),
    'import.meta.env.VITE_APP_BUILD': JSON.stringify(process.env.VITE_APP_BUILD),
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
      'chart.js',
      'react-chartjs-2',
      'dayjs',
      'axios',
      'react-router-dom',
      '@mui/icons-material',
      '@react-google-maps/api',
      '@fontsource/roboto',
    ],
  },
  build: {
    chunkSizeWarningLimit: 2000, // Set to 1000 KB (1MB) to suppress the warning
  },
  /* server: {
    https: {
      key: fs.readFileSync('localhost+1-key.pem'),
      cert: fs.readFileSync('localhost+1.pem'),
    },
    port: 3000, // Opsional: Pastikan portnya 3000
    proxy: {
      // Proxy semua permintaan yang dimulai dengan '/api'
      '/api': {
        target: 'https://dev-erp.samkarsa.com',
        changeOrigin: true,
        secure: false, // Penting jika server target menggunakan sertifikat yang tidak tepercaya
      }, zGwAaS39grpJogG1 , db_siumang_dev
    }, 
  }, */
})
