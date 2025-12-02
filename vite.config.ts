import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the browser
      // We map VITE_API_KEY (from Vercel/Env) to process.env.API_KEY (used in code)
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || ''),
      'process.env.NODE_ENV': JSON.stringify(mode),
      
      // General process polyfill to avoid "process is not defined" errors
      'process': {
        env: {
          API_KEY: JSON.stringify(env.VITE_API_KEY || ''),
          NODE_ENV: JSON.stringify(mode)
        }
      }
    }
  }
})