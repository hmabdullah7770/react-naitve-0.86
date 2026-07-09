// src/hooks/useReadNotificationQueue.js
import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { markasread } from '../API/notification';
import {
  getReadNotificationQueue,
  clearReadNotificationQueue,
  saveReadNotificationQueueToWatermelon,
  getWatermelonReadNotificationQueue,
  clearWatermelonReadNotificationQueue,
  setBootFlushComplete,
} from '../utils/readNotificationQueue';
import { useQueryClient } from '@tanstack/react-query';

const useReadNotificationQueue = () => {
  const appStateRef = useRef(AppState.currentState);
  const queryClient = useQueryClient();
  const flushToAPIRef = useRef(null);

  const flushToAPI = useCallback(async (ids) => {
    if (!ids || ids.length === 0) return true;
    try {
      const response = await markasread(ids);
      console.log('[ReadNotifQueue] API success:', ids);
      console.log('[ReadNotifQueue] API response:', response);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      return true;
    } catch (error) {
      console.error('[ReadNotifQueue] API failed:', error);
      return false;
    }
  }, [queryClient]);

  // ✅ Keep ref pointing to latest flushToAPI
  useEffect(() => {
    flushToAPIRef.current = flushToAPI;
  }, [flushToAPI]);

  // ── Step 1: Boot-time flush ────────────────────────────────────────────
  useEffect(() => {
    const bootFlush = async () => {
      const storedIds = await getWatermelonReadNotificationQueue();
      console.log('[ReadNotifQueue] boot flush check → storedIds:', storedIds);

      if (storedIds.length === 0) {
        setBootFlushComplete();
        return;
      }

      const success = await flushToAPI(storedIds);
      if (success) {
        await clearWatermelonReadNotificationQueue();
      }
      setBootFlushComplete();
    };
    bootFlush();
  }, [flushToAPI]);

  // ── Step 2: Background / Foreground ────────────────────────────────────
  useEffect(() => {
    const handleAppStateChange = async (nextState) => {
      const isGoingToBackground =
        appStateRef.current === 'active' &&
        (nextState === 'background' || nextState === 'inactive');

      const isComingToForeground =
        (appStateRef.current === 'background' || appStateRef.current === 'inactive') &&
        nextState === 'active';

      if (isGoingToBackground) {
        const currentQueue = getReadNotificationQueue();
        if (currentQueue.length > 0) {
          await saveReadNotificationQueueToWatermelon();
          clearReadNotificationQueue();
          console.log('[ReadNotifQueue] backgrounded → saved to WatermelonDB');
        }
      }

      if (isComingToForeground) {
        const storedIds = await getWatermelonReadNotificationQueue();
        if (storedIds.length > 0) {
          const success = await flushToAPIRef.current(storedIds);
          if (success) {
            await clearWatermelonReadNotificationQueue();
          }
        }
      }

      appStateRef.current = nextState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // ── Step 3: Screen leave ──────────────────────────────────────────────
  const flushReadNotificationsOnScreenLeave = useCallback(async () => {
    const currentQueue = getReadNotificationQueue();
    if (currentQueue.length === 0) return;

    console.log('[ReadNotifQueue] screen-leave flush:', currentQueue);
    const success = await flushToAPIRef.current(currentQueue);

    if (success) {
      clearReadNotificationQueue();
      await clearWatermelonReadNotificationQueue();
    } else {
      await saveReadNotificationQueueToWatermelon();
      clearReadNotificationQueue();
    }
  }, []);

  return { flushReadNotificationsOnScreenLeave };
};

export default useReadNotificationQueue;