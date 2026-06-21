import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { addrating } from '../API/rating';
import {
    getRatingQueue,
    clearRatingQueue,
    saveRatingQueueToWatermelon,
    getWatermelonRatingQueue,
    clearWatermelonRatingQueue,
    setBootFlushComplete
} from '../utils/ratingQueue';
import { useQueryClient } from '@tanstack/react-query';

const useRatingQueue = () => {
    const appStateRef = useRef(AppState.currentState);
    const queryClient = useQueryClient();
    const flushToAPIRef = useRef(null);

    const flushToAPI = useCallback(async (posts) => {
        if (!posts || posts.length === 0) return true;
        try {
            const response = await addrating(posts);
            console.log('[RatingQueue] API success:', posts);
            console.log('[RatingQueue] API response:', response);
            queryClient.invalidateQueries({ queryKey: ['rating'] });
            return true;
        } catch (error) {
            console.error('[RatingQueue] API failed:', error);
            return false;
        }
    }, [queryClient]);

    // ✅ Keep ref always pointing to latest flushToAPI
    useEffect(() => {
        flushToAPIRef.current = flushToAPI;
    }, [flushToAPI]);

    // ── Step 1: Boot-time flush ──────────────────────────────────────────────
    useEffect(() => {
        const bootFlush = async () => {
            const storedRatings = await getWatermelonRatingQueue();
            console.log('[RatingQueue] boot flush check → storedRatings:', storedRatings);
            
            if (storedRatings.length === 0) {
                setBootFlushComplete();
                return;
            }

            console.log('[RatingQueue] boot flush → WatermelonDB ratings:', storedRatings);
            const success = await flushToAPI(storedRatings);
            if (success) {
                await clearWatermelonRatingQueue();
            }
            // If fails → WatermelonDB stays → retried next boot
             setBootFlushComplete(); // ✅ done, unblock feed
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
                const currentQueue = getRatingQueue();
                if (currentQueue.length > 0) {
                    await saveRatingQueueToWatermelon();
                    clearRatingQueue();
                    console.log('[RatingQueue] backgrounded → saved to WatermelonDB only');
                }
            }

            if (isComingToForeground) {
                const storedRatings = await getWatermelonRatingQueue();
                console.log('[RatingQueue] foreground check → storedRatings:', storedRatings);
                if (storedRatings.length > 0) {
                    console.log('[RatingQueue] foreground → flushing WatermelonDB ratings:', storedRatings);
                    const success = await flushToAPIRef.current(storedRatings);
                    if (success) {
                        await clearWatermelonRatingQueue();
                    }
                }
            }

            appStateRef.current = nextState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, []);

    // ── Step 3: Screen leave ─────────────────────────────────────────────────
    const flushRatingsOnScreenLeave = useCallback(async () => {
        const currentQueue = getRatingQueue();
        if (currentQueue.length === 0) return;

        console.log('[RatingQueue] screen-leave flush:', currentQueue);
        const success = await flushToAPIRef.current(currentQueue);

        if (success) {
            clearRatingQueue();
            await clearWatermelonRatingQueue();
        } else {
            await saveRatingQueueToWatermelon();
            clearRatingQueue();
        }
    }, []);

    return { flushRatingsOnScreenLeave };
};

export default useRatingQueue;