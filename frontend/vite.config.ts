import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  css: {
    postcss: {
      plugins: [
        postcss,
        autoprefixer,
      ],
    },
  },
})
