import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

/**
 * Vercel runs everything in `api/` as serverless functions, but `vite dev`
 * knows nothing about them. This plugin mounts the same handler files as dev
 * middleware, shimming the small slice of the Vercel request/response API the
 * handlers actually use — so `npm run dev` behaves like production.
 */
function vercelApiDev() {
  return {
    name: 'vercel-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        if (!url.pathname.startsWith('/api/')) return next();

        const route = url.pathname.slice(5).replace(/[^a-z0-9_-]/gi, '');
        // `_`-prefixed files are shared helpers, not routes — same rule Vercel
        // uses. Answer 404 rather than falling through, or Vite's module server
        // would happily serve the helper's source in dev.
        if (!route || route.startsWith('_')) {
          res.statusCode = 404;
          res.setHeader('content-type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Not found' }));
          return;
        }
        const file = fileURLToPath(new URL(`./api/${route}.js`, import.meta.url));
        if (!existsSync(file)) return next();

        // Vercel parses the query string and JSON body for you.
        req.query = Object.fromEntries(url.searchParams);
        req.body = await readJsonBody(req);

        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (payload) => {
          res.setHeader('content-type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(payload));
          return res;
        };

        try {
          // Cache-bust so edits to handlers take effect without restarting.
          const mod = await server.ssrLoadModule(`/api/${route}.js`);
          await mod.default(req, res);
        } catch (err) {
          server.config.logger.error(`[api/${route}] ${err.stack || err}`);
          if (!res.writableEnded) res.status(500).json({ error: 'Handler crashed. See terminal.' });
        }
      });
    },
  };
}

function readJsonBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return Promise.resolve(undefined);
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      if (!raw) return resolve(undefined);
      try { resolve(JSON.parse(raw)); } catch { resolve(undefined); }
    });
  });
}

export default defineConfig(({ mode }) => {
  // Expose non-VITE_ vars (MONGODB_URI) to the dev-only API handlers.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    plugins: [vercelApiDev()],
    server: { port: 5173 },
    build: { outDir: 'dist', target: 'es2022' },
  };
});
