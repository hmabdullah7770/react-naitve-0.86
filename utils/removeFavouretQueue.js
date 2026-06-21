import database from '../db';

// ─── In-Memory Queue ─────────────────────────────────────────────────────────
let removalQueue = [];
const FLUSH_THRESHOLD = 100;

export const pushToRemovalQueue = async (postId, mutateAsync) => {
    if (postId && !removalQueue.includes(postId)) {
        removalQueue.push(postId);
        console.log('[RemoveFavouretQueue] pushed:', postId, '| queue:', removalQueue);
    }

    if (removalQueue.length >= FLUSH_THRESHOLD) {
        console.log('[RemoveFavouretQueue] threshold reached → flushing');
        const snapshot = [...removalQueue];
        removalQueue = [];
        try {
            await mutateAsync(snapshot);
            console.log('[RemoveFavouretQueue] threshold flush success');
        } catch (e) {
            removalQueue = [...snapshot, ...removalQueue];
            console.error('[RemoveFavouretQueue] threshold flush failed, restored queue:', e);
        }
    }
};

export const getRemovalQueue = () => [...removalQueue];

export const clearRemovalQueue = () => {
    removalQueue = [];
    console.log('[RemoveFavouretQueue] in-memory queue cleared');
};

// ─── WatermelonDB Persistence ─────────────────────────────────────────────────

export const saveRemovalQueueToWatermelon = async () => {
    if (removalQueue.length === 0) return;
    try {
        await database.write(async () => {
            for (const postId of removalQueue) {
                const existing = await database
                    .get('pending_removals')
                    .query()
                    .fetch();
                const alreadyExists = existing.some(r => r.postId === postId);
                if (!alreadyExists) {
                    await database.get('pending_removals').create(record => {
                        record.postId = postId;
                    });
                }
            }
        });
        console.log('[RemoveFavouretQueue] saved to WatermelonDB:', removalQueue);
    } catch (e) {
        console.error('[RemoveFavouretQueue] WatermelonDB save failed:', e);
    }
};

export const getWatermelonRemovalQueue = async () => {
    try {
        const records = await database
            .get('pending_removals')
            .query()
            .fetch();
        const ids = records.map(r => r.postId);
        console.log('[RemoveFavouretQueue] read from WatermelonDB:', ids);
        return ids;
    } catch (e) {
        console.error('[RemoveFavouretQueue] WatermelonDB read failed:', e);
        return [];
    }
};

export const clearWatermelonRemovalQueue = async () => {
    try {
        await database.write(async () => {
            const records = await database
                .get('pending_removals')
                .query()
                .fetch();
            await Promise.all(records.map(r => r.destroyPermanently()));
        });
        console.log('[RemoveFavouretQueue] WatermelonDB cleared');
    } catch (e) {
        console.error('[RemoveFavouretQueue] WatermelonDB clear failed:', e);
    }
};