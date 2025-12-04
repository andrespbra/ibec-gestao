import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Inject API Key directly into process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || ''),
      // Also inject Supabase keys
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      
      // Basic process polyfill to prevent "process is not defined" errors
      'process.env': {
        NODE_ENV: JSON.stringify(mode),
        ...env
      }
    }
  }
})
