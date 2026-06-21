// watermelon DB code 

import  database  from '../db'; // ← your WatermelonDB instance path

// ─── In-Memory Queue ────────────────────────────────────────────────────────
let queue = [];
const FLUSH_THRESHOLD = 100;

/** Push a postId into the in-memory queue (no duplicates) */
export const pushToFiveStarQueue =async  (postId, mutateAsync) => {
    if (postId && !queue.includes(postId)) {
        queue.push(postId);
        console.log('[FiveStarQueue] pushed:', postId, '| queue:', queue);
    }

    // ✅ Threshold flush — prevent queue from growing too large
     if (queue.length >= FLUSH_THRESHOLD) {
        console.log('[FiveStarQueue] threshold reached → flushing');
        const snapshot = [...queue];
        queue = [];
        try {
            // const { addFavourite } = await import('../API/favourite');
            // await addFavourite(snapshot);
            await mutateAsync(snapshot); // ✅ same process as normal favourite call
            console.log('[FiveStarQueue] threshold flush success');
        } catch (e) {
            queue = [...snapshot, ...queue];
            console.error('[FiveStarQueue] threshold flush failed, restored queue:', e);
        }
    }

};

/** Get a copy of the current in-memory queue */
export const getFiveStarQueue = () => [...queue];

/** Clear the in-memory queue */
export const clearFiveStarQueue = () => {
    queue = [];
    console.log('[FiveStarQueue] in-memory queue cleared');
};

// ─── WatermelonDB Persistence ────────────────────────────────────────────────

/** Save current in-memory queue to WatermelonDB */
export const saveQueueToWatermelon = async () => {
    if (queue.length === 0) return;
    try {
        await database.write(async () => {
            for (const postId of queue) {
                // check no duplicate
                const existing = await database
                    .get('pending_favourites')
                    .query()
                    .fetch();
                const alreadyExists = existing.some(r => r.postId === postId);
                if (!alreadyExists) {
                    await database.get('pending_favourites').create(record => {
                        record.postId = postId;
                    });
                }
            }
        });
        console.log('[FiveStarQueue] saved to WatermelonDB:', queue);
    } catch (e) {
        console.error('[FiveStarQueue] WatermelonDB save failed:', e);
    }
};

/** Read persisted ids from WatermelonDB */
export const getWatermelonQueue = async () => {
    try {
        const records = await database
            .get('pending_favourites')
            .query()
            .fetch();
        const ids = records.map(r => r.postId);
        console.log('[FiveStarQueue] read from WatermelonDB:', ids);
        return ids;
    } catch (e) {
        console.error('[FiveStarQueue] WatermelonDB read failed:', e);
        return [];
    }
};

/** Delete all pending favourites from WatermelonDB */
export const clearWatermelonQueue = async () => {
    try {
        await database.write(async () => {
            const records = await database
                .get('pending_favourites')
                .query()
                .fetch();
            await Promise.all(records.map(r => r.destroyPermanently()));
        });
        console.log('[FiveStarQueue] WatermelonDB cleared');
    } catch (e) {
        console.error('[FiveStarQueue] WatermelonDB clear failed:', e);
    }
};



export const isPostInFiveStarQueue = (postId) => queue.includes(postId);

/** Remove a postId from the in-memory queue (cancels pending favourite) */
export const removeFromFiveStarQueue = (postId) => {
    queue = queue.filter(id => id !== postId);
    console.log('[FiveStarQueue] removed:', postId, '| queue:', queue);
};

// MMKv code 

// import { MMKV } from 'react-native-mmkv';

// const MMKV_KEY = 'fiveStarPostIds';

// // ─── Memory Fallback (used when MMKV is unavailable e.g. remote debugger) ───
// const memoryFallback = {
//     _store: {},
//     set(key, value) { this._store[key] = value; },
//     getString(key) { return this._store[key] ?? null; },
//     delete(key) { delete this._store[key]; },
// };

// // ─── Lazy MMKV Instance ─────────────────────────────────────────────────────
// let storage = null;

// const getStorage = () => {
//     if (!storage) {
//         try {
//             storage = new MMKV();
//         } catch (e) {
//             console.warn('[FiveStarQueue] MMKV unavailable, using memory fallback:', e.message);
//             storage = memoryFallback;
//         }
//     }
//     return storage;
// };

// // ─── In-Memory Queue ────────────────────────────────────────────────────────
// let queue = [];

// /** Push a postId into the in-memory queue (no duplicates) */
// export const pushToFiveStarQueue = (postId) => {
//     if (postId && !queue.includes(postId)) {
//         queue.push(postId);
//         console.log('[FiveStarQueue] pushed:', postId, '| queue:', queue);
//     }
// };

// /** Get a copy of the current in-memory queue */
// export const getFiveStarQueue = () => [...queue];

// /** Clear the in-memory queue */
// export const clearFiveStarQueue = () => {
//     queue = [];
//     console.log('[FiveStarQueue] in-memory queue cleared');
// };

// // ─── MMKV Persistence ───────────────────────────────────────────────────────

// /** Save current in-memory queue to MMKV */
// export const saveQueueToMMKV = () => {
//     if (queue.length > 0) {
//         getStorage().set(MMKV_KEY, JSON.stringify(queue));
//         console.log('[FiveStarQueue] saved to MMKV:', queue);
//     }
// };

// /** Read persisted ids from MMKV */
// export const getMMKVQueue = () => {
//     try {
//         const raw = getStorage().getString(MMKV_KEY);
//         return raw ? JSON.parse(raw) : [];
//     } catch {
//         return [];
//     }
// };

// /** Delete the MMKV entry */
// export const clearMMKVQueue = () => {
//     getStorage().delete(MMKV_KEY);
//     console.log('[FiveStarQueue] MMKV cleared');
// };

// // import { MMKV } from 'react-native-mmkv';

// // const storage = new MMKV();
// // const MMKV_KEY = 'fiveStarPostIds';

// // // ─── In-Memory Queue ────────────────────────────────────────────────────────
// // let queue = [];

// // /** Push a postId into the in-memory queue (no duplicates) */
// // export const pushToFiveStarQueue = (postId) => {
// //     if (postId && !queue.includes(postId)) {
// //         queue.push(postId);
// //         console.log('[FiveStarQueue] pushed:', postId, '| queue:', queue);
// //     }
// // };

// // /** Get a copy of the current in-memory queue */
// // export const getFiveStarQueue = () => [...queue];

// // /** Clear the in-memory queue */
// // export const clearFiveStarQueue = () => {
// //     queue = [];
// //     console.log('[FiveStarQueue] in-memory queue cleared');
// // };

// // // ─── MMKV Persistence ───────────────────────────────────────────────────────

// // /** Save current in-memory queue to MMKV */
// // export const saveQueueToMMKV = () => {
// //     if (queue.length > 0) {
// //         storage.set(MMKV_KEY, JSON.stringify(queue));
// //         console.log('[FiveStarQueue] saved to MMKV:', queue);
// //     }
// // };

// // /** Read persisted ids from MMKV */
// // export const getMMKVQueue = () => {
// //     try {
// //         const raw = storage.getString(MMKV_KEY);
// //         return raw ? JSON.parse(raw) : [];
// //     } catch {
// //         return [];
// //     }
// // };

// // /** Delete the MMKV entry */
// // export const clearMMKVQueue = () => {
// //     storage.delete(MMKV_KEY);
// //     console.log('[FiveStarQueue] MMKV cleared');
// // }; 