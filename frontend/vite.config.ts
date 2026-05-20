import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      '@mui/material',
      '@mui/icons-material',
      '@mui/icons-material/Add',
      '@mui/icons-material/Edit',
      '@mui/icons-material/Delete',
      '@mui/icons-material/Business',
      '@mui/icons-material/OpenInNew',
      '@mui/icons-material/FormatListNumbered',
      '@mui/icons-material/Calculate',
      '@mui/icons-material/Settings',
      '@mui/icons-material/HealthAndSafety',
      '@mui/icons-material/Gavel',
      '@mui/icons-material/CurrencyRupee',
      '@mui/icons-material/TrendingUp',
      '@mui/icons-material/TrendingDown',
      '@mui/icons-material/AccountBalance',
      '@mui/icons-material/Receipt',
      '@mui/icons-material/FileDownload',
      '@mui/icons-material/Download',
      '@mui/icons-material/Dashboard',
      '@mui/icons-material/People',
      '@mui/icons-material/Inventory',
      '@mui/icons-material/Store',
      '@mui/icons-material/AutoAwesome',
      '@mui/icons-material/CheckCircle',
      '@mui/icons-material/BarChart',
      '@emotion/react',
      '@emotion/styled',
      'recharts',
      '@tanstack/react-query',
      'zustand',
      'axios',
      'react-hook-form',
      'notistack',
    ],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
