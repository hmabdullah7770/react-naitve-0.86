import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { useFavouret } from '../ReactQuery/TanStackQueryHooks/useFavouret';
import {
    getFiveStarQueue,
    clearFiveStarQueue,
    saveQueueToWatermelon,   // ✅ renamed
    getWatermelonQueue,       // ✅ renamed
    clearWatermelonQueue,     // ✅ renamed
} from '../utils/fiveStarQueue';
import { useQueryClient } from '@tanstack/react-query';

const useFiveStarFavourite = () => {
    const appStateRef = useRef(AppState.currentState);
    const queryClient = useQueryClient();
    const { mutateAsync } = useFavouret();
    const flushToAPIRef = useRef(null);

    const flushToAPI = useCallback(async (postIds) => {
        if (!postIds || postIds.length === 0) return true;
        try {
            const response = await mutateAsync(postIds);
            console.log('[FiveStarFavourite] API success for ids:', postIds);
            console.log('[FiveStarFavourite] API response:', response);
            queryClient.invalidateQueries({ queryKey: ['favouret'] });
            return true;
        } catch (error) {
            console.error('[FiveStarFavourite] API failed:', error);
            return false;
        }
    }, [mutateAsync, queryClient]);

    useEffect(() => {
        flushToAPIRef.current = flushToAPI;
    }, [flushToAPI]);

    // ── Step 1: Boot-time flush ──────────────────────────────────────────────
    useEffect(() => {
        const bootFlush = async () => {
            const storedIds = await getWatermelonQueue(); // ✅ now async
            console.log('[FiveStarFavourite] boot flush check → storedIds:', storedIds);
            if (storedIds.length === 0) return;

            console.log('[FiveStarFavourite] boot flush → WatermelonDB ids:', storedIds);
            const success = await flushToAPI(storedIds);
            if (success) {
                await clearWatermelonQueue(); // ✅ now async
            }
        };
        bootFlush();
    }, [flushToAPI]);

    // ── Step 2: Background / Foreground ─────────────────────────────────────
    useEffect(() => {
        const handleAppStateChange = async (nextState) => {
            const isGoingToBackground =
                appStateRef.current === 'active' &&
                (nextState === 'background' || nextState === 'inactive');

            const isComingToForeground =
                (appStateRef.current === 'background' || appStateRef.current === 'inactive') &&
                nextState === 'active';

            if (isGoingToBackground) {
                const currentQueue = getFiveStarQueue();
                if (currentQueue.length > 0) {
                    await saveQueueToWatermelon(); // ✅ now async
                    clearFiveStarQueue();
                    console.log('[FiveStarFavourite] backgrounded → saved to WatermelonDB only');
                }
            }

            if (isComingToForeground) {
                const storedIds = await getWatermelonQueue(); // ✅ now async
                console.log('[FiveStarFavourite] foreground check → storedIds:', storedIds);
                if (storedIds.length > 0) {
                    console.log('[FiveStarFavourite] foreground → flushing WatermelonDB ids:', storedIds);
                    const success = await flushToAPIRef.current(storedIds);
                    if (success) {
                        await clearWatermelonQueue(); // ✅ now async
                    }
                }
            }

            appStateRef.current = nextState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, []);

    // ── Step 3: Screen leave ─────────────────────────────────────────────────
    const flushOnScreenLeave = useCallback(async () => {
        const currentQueue = getFiveStarQueue();
        if (currentQueue.length === 0) return;

        console.log('[FiveStarFavourite] screen-leave flush:', currentQueue);
        const success = await flushToAPIRef.current(currentQueue);

        if (success) {
            clearFiveStarQueue();
            await clearWatermelonQueue(); // ✅ now async
        } else {
            await saveQueueToWatermelon(); // ✅ now async
            clearFiveStarQueue();
        }
    }, []);

    return { flushOnScreenLeave };
};

export default useFiveStarFavourite;



// mmkv code 
// import { useEffect, useRef, useCallback } from 'react';
// import { AppState } from 'react-native';
// import { useFavouret } from '../ReactQuery/TanStackQueryHooks/useFavouret';
// import {
//     getFiveStarQueue,
//     clearFiveStarQueue,
//     saveQueueToMMKV,
//     getMMKVQueue,
//     clearMMKVQueue,
// } from '../utils/fiveStarQueue';
// import { useQueryClient } from '@tanstack/react-query';

// /**
//  * Call this hook ONCE at the Feed/Root screen level.
//  *
//  * Responsibilities:
//  *  1. Boot-time        → check MMKV for leftover ids from previous session → call API → clear MMKV
//  *  2. Background       → save in-memory queue to MMKV only (no API call)
//  *  3. Foreground       → read MMKV → call API → clear MMKV
//  *  4. Kill + Reopen    → handled by boot-time flush (MMKV persists across kills)
//  *  5. Screen leave     → flush in-memory queue via API → clear everything
//  */
// const useFiveStarFavourite = () => {
//     const appStateRef = useRef(AppState.currentState);
//     const queryClient = useQueryClient();
//     const { mutateAsync } = useFavouret();

//     // ── Store flushToAPI in a ref so AppState listener always gets latest ────
//     const flushToAPIRef = useRef(null);

//     const flushToAPI = useCallback(async (postIds) => {
//         if (!postIds || postIds.length === 0) return true;
//         try {
//             const response = await mutateAsync(postIds);
//             console.log('[FiveStarFavourite] API success for ids:', postIds);
//             console.log('[FiveStarFavourite] API response:', response);
//             queryClient.invalidateQueries({ queryKey: ['favouret'] });
//             return true;
//         } catch (error) {
//             console.error('[FiveStarFavourite] API failed:', error);
//             return false;
//         }
//     }, [mutateAsync, queryClient]);

//     // ✅ Keep ref always pointing to latest flushToAPI
//     useEffect(() => {
//         flushToAPIRef.current = flushToAPI;
//     }, [flushToAPI]);

//     // ── Step 1: Boot-time flush ──────────────────────────────────────────────
//     // Handles both fresh boot and kill + reopen (MMKV persists across kills)
//     useEffect(() => {
//         const bootFlush = async () => {
//             const storedIds = getMMKVQueue();
//             console.log('[FiveStarFavourite] boot flush check → storedIds:', storedIds);
//             if (storedIds.length === 0) return;

//             console.log('[FiveStarFavourite] boot flush → MMKV ids:', storedIds);
//             const success = await flushToAPI(storedIds); // ✅ direct call not via ref
//             if (success) {
//                 clearMMKVQueue();
//             }
//             // If API fails → MMKV stays intact → retried on next boot
//         };
//         bootFlush();
//     }, [flushToAPI]); // ✅ flushToAPI as dependency ensures ref is ready

//     // ── Step 2: Background / Foreground ─────────────────────────────────────
//     useEffect(() => {
//         const handleAppStateChange = async (nextState) => {
//             const isGoingToBackground =
//                 appStateRef.current === 'active' &&
//                 (nextState === 'background' || nextState === 'inactive');

//             const isComingToForeground =
//                 (appStateRef.current === 'background' || appStateRef.current === 'inactive') &&
//                 nextState === 'active';

//             if (isGoingToBackground) {
//                 const currentQueue = getFiveStarQueue();
//                 if (currentQueue.length > 0) {
//                     saveQueueToMMKV();
//                     clearFiveStarQueue();
//                     console.log('[FiveStarFavourite] backgrounded → saved to MMKV only');
//                 }
//             }

//             // ✅ use ref here — AppState listener is a stale closure
//             if (isComingToForeground) {
//                 const storedIds = getMMKVQueue();
//                 console.log('[FiveStarFavourite] foreground check → storedIds:', storedIds);
//                 if (storedIds.length > 0) {
//                     console.log('[FiveStarFavourite] foreground → flushing MMKV ids:', storedIds);
//                     const success = await flushToAPIRef.current(storedIds);
//                     if (success) {
//                         clearMMKVQueue();
//                     }
//                 }
//             }

//             appStateRef.current = nextState;
//         };

//         const subscription = AppState.addEventListener('change', handleAppStateChange);
//         return () => subscription.remove();
//     }, []); // ✅ safe because foreground uses ref

//     // ── Step 3: Screen leave ─────────────────────────────────────────────────
//     const flushOnScreenLeave = useCallback(async () => {
//         const currentQueue = getFiveStarQueue();
//         if (currentQueue.length === 0) return;

//         console.log('[FiveStarFavourite] screen-leave flush:', currentQueue);
//         const success = await flushToAPIRef.current(currentQueue);

//         if (success) {
//             clearFiveStarQueue();
//             clearMMKVQueue();
//         } else {
//             saveQueueToMMKV();
//             clearFiveStarQueue();
//         }
//     }, []);

//     return { flushOnScreenLeave };
// };

// export default useFiveStarFavourite;
