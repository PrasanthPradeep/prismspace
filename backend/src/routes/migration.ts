import { Router, type Request, type Response } from 'express';
import { db } from '../services/firestore.js';
import { z } from 'zod';

const router = Router();

const MigrationRequestSchema = z.object({
  anonymousId: z.string().min(1).max(128)
});

router.post('/migrate-anonymous-data', async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Ensure the caller is authenticated
    const user = (req as any).user;
    if (!user || !user.uid) {
      res.status(401).json({ ok: false, error: 'Unauthorized: Authentication required for migration.' });
      return;
    }

    const authenticatedUid = user.uid;

    // 2. Validate request body
    const parsed = MigrationRequestSchema.parse(req.body);
    const anonymousId = parsed.anonymousId;

    if (anonymousId === authenticatedUid) {
      res.status(400).json({ ok: false, error: 'Cannot migrate to the same user ID.' });
      return;
    }

    const logger = (req as any).log || console;
    logger.info({ anonymousId, authenticatedUid }, 'Starting anonymous data migration');

    const batch = db.batch();
    let operationCount = 0;

    // --- Migrate saved_pages ---
    // Deterministic IDs: require creating a new document and deleting the old one.
    const savedPagesSnapshot = await db.collection('saved_pages')
      .where('userId', '==', anonymousId)
      .get();

    for (const doc of savedPagesSnapshot.docs) {
      const data = doc.data();
      const url = data.url;
      if (url) {
        const newDocId = `${authenticatedUid}_${Buffer.from(url).toString('base64url')}`;
        const newDocRef = db.collection('saved_pages').doc(newDocId);
        
        // Copy data with new userId
        batch.set(newDocRef, {
          ...data,
          userId: authenticatedUid
        }, { merge: true });
        
        // Delete old document
        batch.delete(doc.ref);
        operationCount += 2;
      }
    }

    // --- Migrate notes ---
    // Auto-generated IDs: can update in-place.
    const notesSnapshot = await db.collection('notes')
      .where('userId', '==', anonymousId)
      .get();

    for (const doc of notesSnapshot.docs) {
      batch.update(doc.ref, { userId: authenticatedUid });
      operationCount++;
    }

    // --- Migrate chat_history ---
    // Auto-generated IDs: can update in-place.
    const chatHistorySnapshot = await db.collection('chat_history')
      .where('userId', '==', anonymousId)
      .get();

    for (const doc of chatHistorySnapshot.docs) {
      batch.update(doc.ref, { userId: authenticatedUid });
      operationCount++;
    }

    // Commit batch if there are any operations (Firestore batch limit is 500)
    if (operationCount > 0) {
      logger.info({ operationCount }, 'Committing Firestore migration batch');
      await batch.commit();
    }

    res.json({
      ok: true,
      migratedCount: savedPagesSnapshot.size + notesSnapshot.size + chatHistorySnapshot.size
    });
  } catch (err: any) {
    const logger = (req as any).log || console;
    logger.error({ err }, 'Migration failed');
    res.status(500).json({ ok: false, error: err.message || 'Internal server error during migration' });
  }
});

export default router;
