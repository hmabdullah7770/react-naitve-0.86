/**
 * Builds the videoModerationIds payload the backend expects — an ARRAY of
 * full moderation records, one per video, exactly mirroring what check-frames
 * returned for that video:
 *   [
 *     { mediaIndex: 2, _id: "<VideoModeration _id>", approved: true, rejectionReason: null },
 *     { mediaIndex: 4, _id: "<VideoModeration _id>", approved: false, rejectionReason: "..." },
 *   ]
 *
 * mediaIndex is the GRID SLOT (1-based index in selectedMedia) — the same
 * shared positional numbering used for imageFile{slot}/videoFile{slot}.
 *
 * Also returns which videos (if any) are NOT safe to post yet, so the
 * caller can block submission with a clear message instead of silently
 * sending an incomplete/invalid payload. A video counts as blocking if
 * it's still pending/checking, errored out, OR came back approved: false.
 *
 * @param {Array} selectedMedia - the full media array (photos + videos)
 * @returns {{
 *   videoModerationIds: Array<{mediaIndex: number, _id: string, approved: boolean, rejectionReason: string|null}>,
 *   blockingIssues: Array<{ position: number, status: string, reason: string|null }>
 * }}
 */
export function buildVideoModerationPayload(selectedMedia) {
  const videoModerationIds = [];
  const blockingIssues = [];

  selectedMedia.forEach((media, index) => {
    if (!media.isVideo) {
      return; // only videos get a moderation entry
    }

    const slot = index + 1; // 1-based, matches imageFile{slot}/videoFile{slot}
    const record = media.moderationRecord;

    if (media.moderationStatus === 'approved' && record?.approved && record?._id) {
      videoModerationIds.push({
        mediaIndex: slot,
        _id: record._id,
        approved: record.approved,
        rejectionReason: record.rejectionReason,
      });
    } else {
      // pending / checking / flagged / error — not safe to post yet
      blockingIssues.push({
        position: slot,
        status: media.moderationStatus || 'unknown',
        reason: record?.rejectionReason || null,
      });
    }
  });

  return {videoModerationIds, blockingIssues};
}