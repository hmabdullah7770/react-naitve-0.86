import database from '../db';

// ─── In-Memory Queue ────────────────────────────────────────────────────────
let queue = []; // [{ postId, rating }, ...]
const FLUSH_THRESHOLD = 100;

// ─── Boot Flush Flag ─────────────────────────────────────────────────────────
let bootFlushComplete = false;
export const isBootFlushComplete = () => bootFlushComplete;
export const setBootFlushComplete = () => { bootFlushComplete = true; };

/** Push or UPDATE a rating in the queue (same postId updates rating) */
export const pushToRatingQueue = async (postId, rating,addRatingFn) => {
    // if (!postId || !rating) return;
if (!postId || rating === undefined) return;
    const existingIndex = queue.findIndex(item => item.postId === postId);
    if (existingIndex !== -1) {
        queue[existingIndex].rating = rating; // update if already queued
    } else {
        queue.push({ postId, rating });
    }
    console.log('[RatingQueue] pushed:', { postId, rating }, '| queue:', queue);
     if (queue.length >= FLUSH_THRESHOLD) {
        console.log('[RatingQueue] threshold reached → flushing');
        const snapshot = [...queue];
        queue = []; // clear immediately so new ratings aren't lost
        try {
            // const { addrating } = await import('../API/rating');
            // await addrating(snapshot);
            await addRatingFn(snapshot); // ✅ same process as normal rating call
            console.log('[RatingQueue] threshold flush success');
        } catch (e) {
            // ✅ flush failed → put items back at front so they're not lost
            queue = [...snapshot, ...queue];
            console.error('[RatingQueue] threshold flush failed, restored queue:', e);
        }
    }

};

 

/** Get a copy of the current in-memory queue */
export const getRatingQueue = () => [...queue];

/** Clear the in-memory queue */
export const clearRatingQueue = () => {
    queue = [];
    console.log('[RatingQueue] in-memory queue cleared');
};

// ─── WatermelonDB Persistence ────────────────────────────────────────────────

/** Save current in-memory queue to WatermelonDB */
export const saveRatingQueueToWatermelon = async () => {
    if (queue.length === 0) return;
    try {
        const existing = await database
            .get('pending_ratings')
            .query()
            .fetch();

        await database.write(async () => {
            for (const { postId, rating } of queue) {
                const existingRecord = existing.find(r => r.postId === postId);
                if (existingRecord) {
                    // ✅ update existing record with new rating
                    await existingRecord.update(record => {
                        record.rating = rating;
                    });
                } else {
                    // ✅ create new record
                    await database.get('pending_ratings').create(record => {
                        record.postId = postId;
                        record.rating = rating;
                    });
                }
            }
        });
        console.log('[RatingQueue] saved to WatermelonDB:', queue);
    } catch (e) {
        console.error('[RatingQueue] WatermelonDB save failed:', e);
    }
};

/** Read persisted ratings from WatermelonDB */
export const getWatermelonRatingQueue = async () => {
    try {
        const records = await database
            .get('pending_ratings')
            .query()
            .fetch();
        const ratings = records.map(r => ({ postId: r.postId, rating: r.rating }));
        console.log('[RatingQueue] read from WatermelonDB:', ratings);
        return ratings;
    } catch (e) {
        console.error('[RatingQueue] WatermelonDB read failed:', e);
        return [];
    }
};

/** Delete all pending ratings from WatermelonDB */
export const clearWatermelonRatingQueue = async () => {
    try {
        await database.write(async () => {
            const records = await database
                .get('pending_ratings')
                .query()
                .fetch();
            await Promise.all(records.map(r => r.destroyPermanently()));
        });
        console.log('[RatingQueue] WatermelonDB cleared');
    } catch (e) {
        console.error('[RatingQueue] WatermelonDB clear failed:', e);
    }
};