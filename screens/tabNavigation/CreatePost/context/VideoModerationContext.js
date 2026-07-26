import React, {createContext, useContext, useMemo, useState} from 'react';

const VideoModerationContext = createContext(null);

/**
 * Works out the overall submit-readiness of the post based on the current
 * moderation status of every video in selectedMedia.
 *
 * - isProcessing: true if ANY video is still pending/checking (extraction
 *   running, or the check-frames API call still in flight) — covers both
 *   the "waiting in queue" state and the "80% through the Vision check"
 *   state, since both just mean "not settled yet".
 * - hasRejected: true if ANY video came back approved: false.
 * - canSubmit: false if either of the above is true, or if there are no
 *   videos at all it's simply true (nothing to block on).
 */
function computeModerationState(selectedMedia = []) {
  const videos = selectedMedia.filter(media => media.isVideo);

  const isProcessing = videos.some(
    media =>
      media.moderationStatus === 'pending' ||
      media.moderationStatus === 'checking',
  );

  const hasRejected = videos.some(
    media =>
      media.moderationStatus === 'flagged' ||
      media.moderationRecord?.approved === false,
  );

  const hasError = videos.some(media => media.moderationStatus === 'error');

  return {
    isProcessing,
    hasRejected,
    hasError,
    canSubmit: !isProcessing && !hasRejected && !hasError,
    videoCount: videos.length,
  };
}

export function VideoModerationProvider({children}) {
  const [selectedMediaSnapshot, setSelectedMediaSnapshot] = useState([]);

  const moderationState = useMemo(
    () => computeModerationState(selectedMediaSnapshot),
    [selectedMediaSnapshot],
  );

  const value = useMemo(
    () => ({
      ...moderationState,
      setSelectedMediaSnapshot,
    }),
    [moderationState],
  );

  return (
    <VideoModerationContext.Provider value={value}>
      {children}
    </VideoModerationContext.Provider>
  );
}

/**
 * Hook for consumers (e.g. the Create Post button) to read the current
 * moderation state and decide whether to disable submission.
 */
export function useVideoModerationStatus() {
  const ctx = useContext(VideoModerationContext);
  if (!ctx) {
    throw new Error(
      'useVideoModerationStatus must be used within a VideoModerationProvider',
    );
  }
  return ctx;
}