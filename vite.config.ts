import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Use '.' instead of process.cwd() to avoid TypeScript errors if Node types are not fully loaded.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY so code using standard Node pattern works in browser
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY)
    }
  }
})