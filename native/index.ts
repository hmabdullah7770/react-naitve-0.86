export {
    getVideoMetadata,
    extractFrames,
    extractFrameAtTime,
    clearFramesCache,
    useVideoFrames,
} from './videoframes/VideoFrames';

export type {
    VideoMetadata,
    FrameResult,
    ExtractOptions,
    ProgressEvent,
} from './videoframes/VideoFrames';


export {
    checkForUpdate,
    syncUpdate,
    markBootSuccess,
    getAppVersion,
    getBundleId,
} from './ota/OtaClient';

export type {
    OtaClientConfig,
    UpdateCheckResult,
} from './ota/OtaClient';