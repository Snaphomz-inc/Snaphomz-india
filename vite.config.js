import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_DOMAIN__: JSON.stringify('snaphomz.in'),
    __APP_ENV__: JSON.stringify(process.env.VITE_ENV || 'demo'),
  },
})
