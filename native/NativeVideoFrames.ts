// src/native/NativeVideoFrames.ts

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface VideoMetadata {
    duration: number;
    width: number;
    height: number;
    frameRate: number;
    bitrate: number;
    rotation: number;
}

export interface FrameResult {
    uri: string;
    timestamp: number;
    width: number;
    height: number;
}

// NOTE: Codegen does not support string literal unions (e.g. 'jpeg' | 'png' | 'base64')
// in TurboModule specs. Use `string` here and validate/narrow the value in your
// JS wrapper (VideoFrames.ts) before calling the native method.
export interface ExtractOptions {
    startTime?: number;
    endTime?: number;
    frameCount?: number;
    quality?: number;
    width?: number;
    height?: number;
    format?: string; // 'jpeg' | 'png' | 'base64'
    outputDir?: string;
}

export interface ProgressEvent {
    current: number;
    total: number;
}

// ─────────────────────────────────────────────
// TurboModule Spec
// ─────────────────────────────────────────────

export interface Spec extends TurboModule {
    getMetadata(videoPath: string): Promise<VideoMetadata>;

    extractFrames(
        videoPath: string,
        options: ExtractOptions
    ): Promise<FrameResult[]>;

    extractFrameAtTime(
        videoPath: string,
        timeMs: number,
        options: ExtractOptions
    ): Promise<FrameResult>;

    clearCache(): Promise<boolean>;

    // Required event emitter methods for TurboModules that emit events
    // (RN's NativeEventEmitter calls these under the hood)
    addListener(eventName: string): void;
    removeListeners(count: number): void;
}

// ─────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────

export default TurboModuleRegistry.getEnforcing<Spec>('VideoFrames');

// old native module
// // src/native/NativeVideoFrames.ts

// import {
//     NativeModules,
//     NativeEventEmitter,
//     Platform
// } from 'react-native';  // ← this is 100% correct import

// const LINKING_ERROR =
//     `The package 'VideoFrames' doesn't seem to be linked. Make sure: \n\n` +
//     Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
//     '- You rebuilt the app after installing the package\n';

// const VideoFramesNative = NativeModules.VideoFrames
//     ? NativeModules.VideoFrames
//     : new Proxy(
//         {},
//         {
//             get() {
//                 throw new Error(LINKING_ERROR);
//             },
//         }
//     );

// // ─────────────────────────────────────────────
// // Types
// // ─────────────────────────────────────────────

// export interface VideoMetadata {
//     duration: number;
//     width: number;
//     height: number;
//     frameRate: number;
//     bitrate: number;
//     rotation: number;
// }

// export interface FrameResult {
//     uri: string;
//     timestamp: number;
//     width: number;
//     height: number;
// }

// export interface ExtractOptions {
//     startTime?: number;
//     endTime?: number;
//     frameCount?: number;
//     quality?: number;
//     width?: number;
//     height?: number;
//     format?: 'jpeg' | 'png' | 'base64';
//     outputDir?: string;
// }

// export interface ProgressEvent {
//     current: number;
//     total: number;
// }

// // ─────────────────────────────────────────────
// // Export
// // ─────────────────────────────────────────────

// export default VideoFramesNative;
// export const VideoFramesEmitter = new NativeEventEmitter(VideoFramesNative);