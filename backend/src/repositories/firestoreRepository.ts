import admin from 'firebase-admin';
import { db } from '../services/firestore.js';

/**
 * Ensures that a user document exists in the 'users' collection.
 * If the user does not exist, a new document is created.
 * If the user does exist, the lastActiveAt timestamp is updated.
 */
export async function ensureUserExists(userId: string): Promise<void> {
  const userRef = db.collection('users').doc(userId);
  const doc = await userRef.get();

  if (!doc.exists) {
    await userRef.set({
      id: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } else {
    await userRef.update({
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

/**
 * Saves or updates a page in the 'saved_pages' collection.
 * The document ID is deterministically generated from the userId and URL
 * to avoid duplicate records for the same page per user.
 */
export async function savePage(
  userId: string,
  data: { url: string; title: string; summary: string; notes: string }
): Promise<void> {
  await ensureUserExists(userId);

  const docId = `${userId}_${Buffer.from(data.url).toString('base64url')}`;
  const pageRef = db.collection('saved_pages').doc(docId);

  await pageRef.set(
    {
      userId,
      url: data.url,
      title: data.title,
      summary: data.summary,
      notes: data.notes,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

/**
 * Saves or updates only the generated summary of a page in the 'saved_pages' collection.
 * Merges with existing data (e.g. notes) if present.
 */
export async function saveSummary(
  userId: string,
  data: { url: string; title: string; summary: string }
): Promise<void> {
  await ensureUserExists(userId);

  const docId = `${userId}_${Buffer.from(data.url).toString('base64url')}`;
  const pageRef = db.collection('saved_pages').doc(docId);

  await pageRef.set(
    {
      userId,
      url: data.url,
      title: data.title,
      summary: data.summary,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

/**
 * Saves a generated note in the 'notes' collection.
 */
export async function saveNote(
  userId: string,
  data: { pageUrl: string; pageTitle: string; content: string }
): Promise<void> {
  await ensureUserExists(userId);

  await db.collection('notes').add({
    userId,
    pageUrl: data.pageUrl,
    pageTitle: data.pageTitle,
    content: data.content,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Saves a chat interaction (query and response) in the 'chat_history' collection.
 */
export async function saveChat(
  userId: string,
  data: { pageUrl: string; query: string; response: string }
): Promise<void> {
  await ensureUserExists(userId);

  await db.collection('chat_history').add({
    userId,
    pageUrl: data.pageUrl,
    query: data.query,
    response: data.response,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}
