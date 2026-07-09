// src/utils/readNotificationQueue.js
import database from '../db';

// ─── In-Memory Queue ────────────────────────────────────────────────────────
let queue = []; // [notificationId, notificationId, ...]
const FLUSH_THRESHOLD = 50;

// ─── Boot Flush Flag ─────────────────────────────────────────────────────────
let bootFlushComplete = false;
export const isBootFlushComplete = () => bootFlushComplete;
export const setBootFlushComplete = () => { bootFlushComplete = true; };

/** Push notificationId (skip duplicates) */
export const pushToReadNotificationQueue = async (notificationId, markAsReadFn) => {
  if (!notificationId) return;

  // ✅ Skip if already queued
  if (queue.includes(notificationId)) {
    console.log('[ReadNotifQueue] already queued:', notificationId);
    return;
  }

  queue.push(notificationId);
  console.log('[ReadNotifQueue] pushed:', notificationId, '| queue:', queue);

  // ✅ Threshold flush
  if (queue.length >= FLUSH_THRESHOLD) {
    console.log('[ReadNotifQueue] threshold reached → flushing');
    const snapshot = [...queue];
    queue = [];
    try {
      await markAsReadFn(snapshot); // ✅ send array to API
      console.log('[ReadNotifQueue] threshold flush success');
    } catch (e) {
      // ✅ restore on fail
      queue = [...snapshot, ...queue];
      console.error('[ReadNotifQueue] threshold flush failed, restored:', e);
    }
  }
};

/** Get copy of in-memory queue */
export const getReadNotificationQueue = () => [...queue];

/** Clear in-memory queue */
export const clearReadNotificationQueue = () => {
  queue = [];
  console.log('[ReadNotifQueue] in-memory queue cleared');
};

// ─── WatermelonDB Persistence ────────────────────────────────────────────────

/** Save in-memory queue to WatermelonDB */
export const saveReadNotificationQueueToWatermelon = async () => {
  if (queue.length === 0) return;
  try {
    const existing = await database
      .get('pending_read_notifications')
      .query()
      .fetch();

    const existingIds = new Set(existing.map(r => r.notificationId));

    await database.write(async () => {
      for (const notificationId of queue) {
        // ✅ Skip duplicates already in DB
        if (existingIds.has(notificationId)) continue;

        await database.get('pending_read_notifications').create(record => {
          record.notificationId = notificationId;
        });
      }
    });
    console.log('[ReadNotifQueue] saved to WatermelonDB:', queue);
  } catch (e) {
    console.error('[ReadNotifQueue] WatermelonDB save failed:', e);
  }
};

/** Read persisted notification ids from WatermelonDB */
export const getWatermelonReadNotificationQueue = async () => {
  try {
    const records = await database
      .get('pending_read_notifications')
      .query()
      .fetch();
    const ids = records.map(r => r.notificationId);
    console.log('[ReadNotifQueue] read from WatermelonDB:', ids);
    return ids;
  } catch (e) {
    console.error('[ReadNotifQueue] WatermelonDB read failed:', e);
    return [];
  }
};

/** Clear all pending read notifications from WatermelonDB */
export const clearWatermelonReadNotificationQueue = async () => {
  try {
    await database.write(async () => {
      const records = await database
        .get('pending_read_notifications')
        .query()
        .fetch();
      await Promise.all(records.map(r => r.destroyPermanently()));
    });
    console.log('[ReadNotifQueue] WatermelonDB cleared');
  } catch (e) {
    console.error('[ReadNotifQueue] WatermelonDB clear failed:', e);
  }
};