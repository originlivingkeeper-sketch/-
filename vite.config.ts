
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 優先抓取 Render 環境中已存在的變數名稱，並映射為程式碼需要的 process.env.API_KEY
    'process.env.API_KEY': JSON.stringify(
      process.env.VITE_API_KEY || 
      process.env.API_KEY || 
      process.env.GOOGLE_API_KEY || 
      process.env.VITE_GOOGLE_API_KEY
    )
  },
  server: {
    port: 3000
  },
  build: {
    outDir: 'build',
    sourcemap: false
  }
});
