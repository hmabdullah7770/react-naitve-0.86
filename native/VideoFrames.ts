import { useEffect, useRef, useCallback } from 'react';
import NativeVideoFrames, {
    VideoFramesEmitter,
    type VideoMetadata,
    type FrameResult,
    type ExtractOptions,
    type ProgressEvent,
} from './NativeVideoFrames';
// Need React import for useState in hook
import React from 'react';

export type { VideoMetadata, FrameResult, ExtractOptions, ProgressEvent };

// ─────────────────────────────────────────────
// Core API
// ─────────────────────────────────────────────

/**
 * Get video metadata
 */
export async function getVideoMetadata(
    videoPath: string
): Promise<VideoMetadata> {
    return NativeVideoFrames.getMetadata(videoPath);
}

/**
 * Extract multiple frames from a video
 */
export async function extractFrames(
    videoPath: string,
    options: ExtractOptions = {}
): Promise<FrameResult[]> {
    const defaultOptions: ExtractOptions = {
        startTime: 0,
        frameCount: 10,
        quality: 80,
        format: 'jpeg',
        ...options,
    };

    return NativeVideoFrames.extractFrames(videoPath, defaultOptions);
}

/**
 * Extract a single frame at a specific time
 */
export async function extractFrameAtTime(
    videoPath: string,
    timeMs: number,
    options: ExtractOptions = {}
): Promise<FrameResult> {
    const defaultOptions: ExtractOptions = {
        quality: 80,
        format: 'jpeg',
        ...options,
    };

    return NativeVideoFrames.extractFrameAtTime(videoPath, timeMs, defaultOptions);
}

/**
 * Clear extracted frames cache
 */
export async function clearFramesCache(): Promise<boolean> {
    return NativeVideoFrames.clearCache();
}

// ─────────────────────────────────────────────
// React Hook
// ─────────────────────────────────────────────

interface UseVideoFramesOptions extends ExtractOptions {
    onProgress?: (event: ProgressEvent) => void;
}

interface UseVideoFramesResult {
    frames: FrameResult[];
    isLoading: boolean;
    error: Error | null;
    progress: ProgressEvent | null;
    extract: (videoPath: string) => Promise<void>;
    extractAt: (videoPath: string, timeMs: number) => Promise<FrameResult | null>;
    clear: () => Promise<void>;
    reset: () => void;
}

export function useVideoFrames(
    options: UseVideoFramesOptions = {}
): UseVideoFramesResult {
    const [frames, setFrames] = React.useState<FrameResult[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<Error | null>(null);
    const [progress, setProgress] = React.useState<ProgressEvent | null>(null);

    const { onProgress, ...extractOptions } = options;
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        const subscription = VideoFramesEmitter.addListener(
            'VideoFramesProgress',
            (event: ProgressEvent) => {
                if (mountedRef.current) {
                    setProgress(event);
                    onProgress?.(event);
                }
            }
        );

        return () => {
            mountedRef.current = false;
            subscription.remove();
        };
    }, [onProgress]);

    const extract = useCallback(
        async (videoPath: string) => {
            if (!mountedRef.current) return;

            setIsLoading(true);
            setError(null);
            setProgress(null);

            try {
                const result = await extractFrames(videoPath, extractOptions);

                if (mountedRef.current) {
                    setFrames(result);
                }
            } catch (err) {
                if (mountedRef.current) {
                    setError(err instanceof Error ? err : new Error(String(err)));
                }
            } finally {
                if (mountedRef.current) {
                    setIsLoading(false);
                }
            }
        },
        [extractOptions]
    );

    const extractAt = useCallback(
        async (
            videoPath: string,
            timeMs: number
        ): Promise<FrameResult | null> => {
            try {
                return await extractFrameAtTime(videoPath, timeMs, extractOptions);
            } catch (err) {
                if (mountedRef.current) {
                    setError(err instanceof Error ? err : new Error(String(err)));
                }
                return null;
            }
        },
        [extractOptions]
    );

    const clear = useCallback(async () => {
        await clearFramesCache();
        if (mountedRef.current) {
            setFrames([]);
        }
    }, []);

    const reset = useCallback(() => {
        setFrames([]);
        setError(null);
        setProgress(null);
        setIsLoading(false);
    }, []);

    return {
        frames,
        isLoading,
        error,
        progress,
        extract,
        extractAt,
        clear,
        reset,
    };
}

