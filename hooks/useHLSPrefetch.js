// hooks/useHLSPrefetch.js
import { useRef, useCallback, useEffect } from 'react';

const useHLSPrefetch = (centerItemId, allItems) => {
  const prefetchedUrls = useRef(new Set());

  const prefetchVideoChunk = useCallback((url) => {
    if (!url || prefetchedUrls.current.has(url)) return;
    if (!url.includes('.m3u8') && !url.includes('/video/')) return;

    prefetchedUrls.current.add(url);

    fetch(url, { method: 'GET', headers: { Range: 'bytes=0-4096' } })
      .then(() => console.log('✅ Prefetched HLS manifest:', url))
      .catch(() => prefetchedUrls.current.delete(url));
  }, []);

  useEffect(() => {
    if (!centerItemId || !allItems?.length) return;

    const currentIndex = allItems.findIndex(p => p._id === centerItemId);
    if (currentIndex === -1) return;

    [1, 2].forEach(offset => {
      const nextItem = allItems[currentIndex + offset];
      if (!nextItem) return;
      nextItem.videoFiles?.forEach(v => {
        if (v?.url) prefetchVideoChunk(v.url);
      });
    });
  }, [centerItemId, allItems, prefetchVideoChunk]);

  // Call this when category changes to clear stale URLs
  const clearPrefetchCache = useCallback(() => {
    prefetchedUrls.current.clear();
  }, []);

  return { clearPrefetchCache };
};

export default useHLSPrefetch;