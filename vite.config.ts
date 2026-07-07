import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  // 1. Базовый путь для корректной работы на GitHub Pages
  base: '/RICIS-7.7-online-calculator/', 

  // 2. Плагины: подключаем React и Tailwind CSS
  plugins: [
    react(), 
    tailwindcss()
  ],

  // 3. Алиасы: позволяем использовать '@' вместо длинных путей ../../
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },

  // 4. Настройки сервера (оптимизировано для AI Studio и локальной разработки)
  server: {
    // HMR отключается через переменную окружения, чтобы избежать мерцания при правках агентом
    hmr: process.env.DISABLE_HMR !== 'true',
    // Отключаем слежение за файлами, если HMR выключен, для экономии ресурсов
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
})
