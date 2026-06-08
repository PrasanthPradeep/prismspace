import type { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

const EXTENSION_SECRET = process.env.EXTENSION_SECRET;
const isDev = process.env.NODE_ENV !== 'production';

// Regex to validate UUID v4 (anonymous user ID format)
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates the X-Prism-Secret header against the EXTENSION_SECRET env var,
 * and handles Firebase ID Token verification to secure Firestore access.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Skip auth on health check
  if (req.path === '/health') {
    next();
    return;
  }

  // 1. Verify Extension Secret (protects backend from opportunistic scraping)
  if (EXTENSION_SECRET) {
    const provided = req.headers['x-prism-secret'];
    if (provided !== EXTENSION_SECRET) {
      res.status(401).json({ ok: false, error: 'Unauthorized' });
      return;
    }
  } else if (!isDev) {
    // Production: server is misconfigured
    res.status(500).json({
      ok: false,
      error: 'Server configuration error: EXTENSION_SECRET is not set.'
    });
    return;
  }

  // 2. Extract and Verify Firebase ID Token if present
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      // Overwrite/Inject the authenticated user's uid into the request body
      if (req.body) {
        req.body.userId = decodedToken.uid;
      }
      // Store the decoded token in the request context for downstream routes
      (req as any).user = decodedToken;
    } catch (err: any) {
      const logger = (req as any).log || console;
      logger.error({ err }, 'Firebase token verification failed');
      res.status(401).json({
        ok: false,
        error: `Unauthorized: Invalid Firebase ID token. ${err.message || ''}`
      });
      return;
    }
  } else {
    // 3. Fallback to Anonymous User ID if present (UUID v4 format check to prevent spoofing)
    if (req.body && req.body.userId) {
      const userId = req.body.userId;
      if (!UUID_V4_REGEX.test(userId)) {
        res.status(401).json({
          ok: false,
          error: 'Unauthorized: Anonymous userId must be in UUID v4 format.'
        });
        return;
      }
    }
  }

  next();
}

