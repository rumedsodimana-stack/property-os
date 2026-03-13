import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const anthropicKey = env.VITE_ANTHROPIC_API_KEY || '';
  const isMainWorkspace = path.basename(process.cwd()) === 'Hotel_Singularity_OS_Source';

  // On case-insensitive filesystems, "/app" can resolve to App.tsx in dev.
  // Redirecting to "/app/" and "/superadmin" to "/superadmin/" forces SPA HTML fallback.
  const appRouteCollisionFixPlugin = {
    name: 'app-route-collision-fix',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (url === '/app' || url === '/superadmin') {
          res.statusCode = 302;
          res.setHeader('Location', url + '/' + (req.url?.includes('?') ? '?' + req.url.split('?')[1] : ''));
          res.end();
          return;
        }
        next();
      });
    },
  };

  return {
    cacheDir: '/tmp/vite-cache',
    server: {
      port: 3005,
      host: true, // Listen on all interfaces (localhost + LAN)
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
    plugins: [appRouteCollisionFixPlugin, react()],
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
