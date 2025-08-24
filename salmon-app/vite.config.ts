import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
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
})
