import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const anthropicKey = env.VITE_ANTHROPIC_API_KEY || '';
  const isMainWorkspace = path.basename(process.cwd()) === 'Hotel_Singularity_OS_Source';
  return {
    server: {
      port: 3005,
      host: '127.0.0.1',
      watch: isMainWorkspace ? { ignored: ['**/Demo_200Rooms/**'] } : undefined,
      proxy: {
        // Proxy Anthropic API calls to avoid CORS in the browser
        '/api/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
          headers: {
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
            ...(anthropicKey ? { 'x-api-key': anthropicKey } : {}),
          },
        },
        // Proxy OpenAI calls (if used)
        '/api/openai': {
          target: 'https://api.openai.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/openai/, ''),
        },
        // Proxy to local Singularity Kernel (real file writes)
        '/kernel': {
          target: 'http://localhost:4321',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/kernel/, ''),
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.VITE_ANTHROPIC_API_KEY': JSON.stringify(anthropicKey),
      'process.env.VITE_AI_PROVIDER': JSON.stringify(env.VITE_AI_PROVIDER || 'anthropic'),
      'process.env.VITE_OPENAI_API_KEY': JSON.stringify(env.VITE_OPENAI_API_KEY || ''),
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          systemMap: path.resolve(__dirname, 'system-map.html'),
        },
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'vendor-ui': ['lucide-react']
          }
        }
      }
    }
  };
});
