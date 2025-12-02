import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the browser code that might use it
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || ''),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      'process.env.NODE_ENV': JSON.stringify(mode),
      
      // Generic process polyfill
      'process': {
        env: {
          API_KEY: JSON.stringify(env.VITE_API_KEY || ''),
          VITE_SUPABASE_URL: JSON.stringify(env.VITE_SUPABASE_URL || ''),
          VITE_SUPABASE_ANON_KEY: JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
          NODE_ENV: JSON.stringify(mode)
        }
      }
    }
  }
})