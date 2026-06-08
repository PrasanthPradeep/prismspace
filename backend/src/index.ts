import express from 'express';
import { createRequire } from 'node:module';
import { corsMiddleware } from './middleware/cors.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { getConfiguredProviders, getProvider, getProviderOrder } from './providers/providerFactory.js';
import assistantRouter from './routes/assistant.js';
import migrationRouter from './routes/migration.js';

// ─── Global safety net ────────────────────────────────────────────────────────
// Prevent unhandled rejections / exceptions from crashing Cloud Run (→ 503)
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION (process kept alive):', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION (process kept alive):', reason);
});


// Load pino-http with require (CommonJS compat)
const require = createRequire(import.meta.url);
const pinoHttp = require('pino-http');

const app = express();

// ─── Trust Cloud Run proxy ────────────────────────────────────────────────────
// Cloud Run sits behind a Google-managed load balancer. Trust one hop.
app.set('trust proxy', 1);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(corsMiddleware);
app.use(express.json({ limit: '512kb' }));
app.use(pinoHttp());
app.use(rateLimiter);
app.use(authMiddleware);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'prismspace-backend',
    provider: process.env.AI_PROVIDER ?? 'gemini',
    providerOrder: getProviderOrder(),
    providers: getConfiguredProviders(),
    timestamp: new Date().toISOString()
  });
});

// ─── AI routes ────────────────────────────────────────────────────────────────
app.use('/', assistantRouter);
app.use('/', migrationRouter);


// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 8080);
app.listen(PORT, () => {
  const providerName = process.env.AI_PROVIDER ?? 'gemini';
  const env = process.env.NODE_ENV ?? 'development';
  console.log(`🚀 Prism Space backend running on :${PORT} [${env}] [provider: ${providerName}]`);
  console.log(`🔁 AI provider order: ${getProviderOrder().join(' -> ')}`);

  // Eagerly validate the AI provider on startup so misconfiguration surfaces
  // in logs immediately rather than as a 503 on the first real request.
  for (const name of getProviderOrder()) {
    try {
      getProvider(name);
      console.log(`✅ AI provider "${name}" initialized successfully.`);
    } catch (err: any) {
      console.error(`❌ AI provider "${name}" failed to initialize: ${err.message}`);
      console.error('   This provider will be skipped unless its configuration is fixed.');
    }
  }
});

export default app;
