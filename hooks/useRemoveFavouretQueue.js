import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { useRemoveFavouret } from '../ReactQuery/TanStackQueryHooks/useFavouret';
import {
    getRemovalQueue,
    clearRemovalQueue,
    saveRemovalQueueToWatermelon,
    getWatermelonRemovalQueue,
    clearWatermelonRemovalQueue,
} from '../utils/removeFavouretQueue';
import { useQueryClient } from '@tanstack/react-query';

const useRemoveFavouretQueue = () => {
    const appStateRef = useRef(AppState.currentState);
    const queryClient = useQueryClient();
    const { mutateAsync } = useRemoveFavouret();
    const flushToAPIRef = useRef(null);

    const flushToAPI = useCallback(async (postIds) => {
        if (!postIds || postIds.length === 0) return true;
        try {
            const response = await mutateAsync({ postIds });
            console.log('[useRemoveFavouretQueue] API success for ids:', postIds);
            console.log('[useRemoveFavouretQueue] API response:', response);
            queryClient.invalidateQueries({ queryKey: ['favouret'] });
            return true;
        } catch (error) {
            console.error('[useRemoveFavouretQueue] API failed:', error);
            return false;
        }
    }, [mutateAsync, queryClient]);

    useEffect(() => {
        flushToAPIRef.current = flushToAPI;
    }, [flushToAPI]);

    // ── Step 1: Boot-time flush ───────────────────────────────────────────────
    useEffect(() => {
        const bootFlush = async () => {
            const storedIds = await getWatermelonRemovalQueue();
            console.log('[useRemoveFavouretQueue] boot flush check → storedIds:', storedIds);
            if (storedIds.length === 0) return;

            console.log('[useRemoveFavouretQueue] boot flush → WatermelonDB ids:', storedIds);
            const success = await flushToAPI(storedIds);
            if (success) {
                await clearWatermelonRemovalQueue();
            }
        };
        bootFlush();
    }, [flushToAPI]);

    // ── Step 2: Background / Foreground ──────────────────────────────────────
    useEffect(() => {
        const handleAppStateChange = async (nextState) => {
            const isGoingToBackground =
                appStateRef.current === 'active' &&
                (nextState === 'background' || nextState === 'inactive');

            const isComingToForeground =
                (appStateRef.current === 'background' || appStateRef.current === 'inactive') &&
                nextState === 'active';

            if (isGoingToBackground) {
                const currentQueue = getRemovalQueue();
                if (currentQueue.length > 0) {
                    await saveRemovalQueueToWatermelon();
                    clearRemovalQueue();
                    console.log('[useRemoveFavouretQueue] backgrounded → saved to WatermelonDB only');
                }
            }

            if (isComingToForeground) {
                const storedIds = await getWatermelonRemovalQueue();
                console.log('[useRemoveFavouretQueue] foreground check → storedIds:', storedIds);
                if (storedIds.length > 0) {
                    console.log('[useRemoveFavouretQueue] foreground → flushing WatermelonDB ids:', storedIds);
                    const success = await flushToAPIRef.current(storedIds);
                    if (success) {
                        await clearWatermelonRemovalQueue();
                    }
                }
            }

            appStateRef.current = nextState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, []);

    // ── Step 3: Screen leave ──────────────────────────────────────────────────
    const flushRemovalsOnScreenLeave = useCallback(async () => {
        const currentQueue = getRemovalQueue();
        if (currentQueue.length === 0) return;

        console.log('[useRemoveFavouretQueue] screen-leave flush:', currentQueue);
        const success = await flushToAPIRef.current(currentQueue);

        if (success) {
            clearRemovalQueue();
            await clearWatermelonRemovalQueue();
        } else {
            await saveRemovalQueueToWatermelon();
            clearRemovalQueue();
        }
    }, []);

    return { flushRemovalsOnScreenLeave };
};

export default useRemoveFavouretQueue;