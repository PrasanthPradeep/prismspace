import cors from 'cors';

const allowedOriginsEnv = process.env.ALLOWED_ORIGINS ?? '';

// Parse comma-separated origins. In development allow all origins.
const allowedOrigins: string[] = allowedOriginsEnv
  ? allowedOriginsEnv.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const isDev = process.env.NODE_ENV !== 'production';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl, background service workers)
    // Background service workers in extensions often omit the Origin header.
    if (!origin) {
      return callback(null, true);
    }

    // In development, allow all origins
    if (isDev) {
      return callback(null, true);
    }

    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS: origin "${origin}" is not allowed`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Prism-Secret', 'Authorization'],
  maxAge: 600
});
