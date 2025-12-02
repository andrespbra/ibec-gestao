import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Prevents "ReferenceError: process is not defined" from crashing the app
      // This creates a global 'process' object in the browser
      'process.env': {
        API_KEY: JSON.stringify(env.VITE_API_KEY || ''),
        NODE_ENV: JSON.stringify(mode)
      },
      // Fallback for libraries checking strict 'process' existence
      'process': {
        env: {
          API_KEY: JSON.stringify(env.VITE_API_KEY || ''),
          NODE_ENV: JSON.stringify(mode)
        }
      }
    }
  }
})