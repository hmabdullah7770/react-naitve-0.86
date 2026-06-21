import { useState, useEffect, useRef, useCallback } from 'react';
import { filtercategouryposts } from '../../API/categoury';
import { isBootFlushComplete } from '../../utils/ratingQueue';

// ─────────────────────────────────────────────────────────────────────────────
// MODULE-LEVEL CACHE
// ─────────────────────────────────────────────────────────────────────────────
//
//  tables[cat]      → Post[]
//  cursors[cat]     → { oldest, newest, hasMore }
//  scrollPos[cat]   → { itemId, inCategoryId }   ← where user LEFT the category
//  firstPostId[cat] → { itemId, inCategoryId }   ← FIRST post ever seen for category
//                     SET on first data load
//                     UPDATED when pull-to-refresh brings newer posts
//                     Never reset to anything older
//
// ─────────────────────────────────────────────────────────────────────────────
const tables      = {};
const cursors     = {};
const scrollPos   = {};
const firstPostId = {};   // ← NEW


// ─── Public helpers ───────────────────────────────────────────────────────────

export const saveScrollPosition = (category, itemId, inCategoryId) => {
  if (!category || !itemId) return;
  scrollPos[category] = { itemId, inCategoryId };
  console.log(`💾 [Feed] Saved scroll: "${category}" → ${itemId}`);
};

export const getScrollPosition  = (category) => scrollPos[category]   ?? null;
export const getFirstPostId     = (category) => firstPostId[category] ?? null;

// Internal: store the first post for a category.
// Only updates if the new post is genuinely newer (prepended refresh case).
function setFirstPost(cat, post) {
  if (!post?.inCategoryId) return;

  // On first call for this category → always store it
  if (!firstPostId[cat]) {
    firstPostId[cat] = { itemId: post._id, inCategoryId: post.inCategoryId };
    console.log(`📌 [Feed] First post stored for "${cat}": ${post._id}`);
    return;
  }

  // On subsequent calls (refresh prepend) → update to the newer post
  // The new post is "newer" because it was prepended at index 0
  firstPostId[cat] = { itemId: post._id, inCategoryId: post.inCategoryId };
  console.log(`🔄 [Feed] First post updated for "${cat}": ${post._id}`);
}


// ─── Internal helpers ─────────────────────────────────────────────────────────

function seedFromAllPosts(posts) {
  posts.forEach(post => {
    const cat = post.category;
    if (!cat) return;

    if (!tables[cat])  tables[cat]  = [];
    if (!cursors[cat]) cursors[cat] = { oldest: null, newest: null, hasMore: true };

    if (tables[cat].some(p => p._id === post._id)) return;

    tables[cat].push(post);

    if (post.inCategoryId) cursors[cat].oldest = post.inCategoryId;
    if (!cursors[cat].newest && post.inCategoryId) cursors[cat].newest = post.inCategoryId;

    // Store first post for this category (set once — seedFromAll processes
    // posts in order so the first call per category is the newest we've seen)
    if (!firstPostId[cat]) {
      setFirstPost(cat, post);
    }
  });
}

function toArray(val) { return Array.isArray(val) ? val : []; }

function normalizePosts(posts) {
  return posts.map(post => ({
    ...post,
    store:      toArray(post.store),
    product:    toArray(post.product),
    imageFiles: toArray(post.imageFiles),
    videoFiles: toArray(post.videoFiles),
  }));
}

async function fetchPage(category, limit, cursor, direction = 'older') {
  const res        = await filtercategouryposts(category, limit, cursor ?? null, direction);
  const posts      = normalizePosts(res.data?.messege?.posts || []);
  const pagination = res.data?.messege?.pagination || {};
  return { posts, pagination };
}

function prependToTable(cat, newPosts) {
  if (!newPosts?.length) return;
  const existing = tables[cat] || [];
  const seen     = new Set(existing.map(p => p._id));
  const unique   = newPosts.filter(p => !seen.has(p._id));
  if (!unique.length) return;

  tables[cat] = [...unique, ...existing];

  if (unique[0]?.inCategoryId) cursors[cat].newest = unique[0].inCategoryId;

  // The new top post is now the first post for this category
  setFirstPost(cat, unique[0]);
}

function appendToTable(cat, newPosts) {
  if (!newPosts?.length) return;
  tables[cat] = tables[cat] || [];
  const seen  = new Set(tables[cat].map(p => p._id));

  newPosts.forEach(p => {
    if (!seen.has(p._id)) { tables[cat].push(p); seen.add(p._id); }
  });

  const last = tables[cat][tables[cat].length - 1];
  if (last?.inCategoryId) cursors[cat].oldest = last.inCategoryId;

  const first = tables[cat][0];
  if (first?.inCategoryId && !cursors[cat].newest) cursors[cat].newest = first.inCategoryId;

  // Store first post on initial append (set once — never overwritten by append)
  if (!firstPostId[cat] && first) setFirstPost(cat, first);
}



// flux for udate rating cache 

// ✅ Add these after the tables/cursors/scrollPos declarations
const flushListeners = new Set();

export const subscribeToFlush = (fn) => {
    flushListeners.add(fn);
    return () => flushListeners.delete(fn);
};

export const updatePostRatingInCache = (postId, hasRated, myRatingValue) => {
    Object.keys(tables).forEach(cat => {
        const postIndex = tables[cat]?.findIndex(p => p._id === postId);
        if (postIndex !== -1) {
            tables[cat][postIndex] = {
                ...tables[cat][postIndex],
                hasRated,
                myRatingValue,
            };
        }
    });
    // ✅ Notify all feed instances to flush/re-render
    flushListeners.forEach(fn => fn());
};

// ─────────────────────────────────────────────────────────────────────────────
// useSmartFilteredFeed
// ─────────────────────────────────────────────────────────────────────────────
export const useSmartFilteredFeed = (category, limit = 20) => {

  const [posts,              setPosts]        = useState(() => tables[category] ? [...tables[category]] : []);
  const [isLoading,          setIsLoading]    = useState(!tables[category]?.length);
  const [isFetchingNextPage, setFetchingNext] = useState(false);
  const [isFetchingPrevPage, setFetchingPrev] = useState(false);
  const [error,              setError]        = useState(null);

   const [bootReady, setBootReady] = useState(isBootFlushComplete()); // ✅


  

    // ✅ Poll until boot flush is done
    useEffect(() => {
        if (bootReady) return;
        const interval = setInterval(() => {
            if (isBootFlushComplete()) {
                setBootReady(true);
                clearInterval(interval);
            }
        }, 50);
        return () => clearInterval(interval);
    }, [bootReady]);

  const locks       = useRef({ initial: false, next: false, prev: false, refresh: false });
  const categoryRef = useRef(category);
  useEffect(() => { categoryRef.current = category; }, [category]);

  const flush = useCallback(() => {
    const cat = categoryRef.current;
    setPosts(tables[cat] ? [...tables[cat]] : []);
  }, []);

// for rating update
   useEffect(() => {
    const unsubscribe = subscribeToFlush(flush);
    return unsubscribe;
}, [flush]);

  // ── INITIAL / CATEGORY-SWITCH LOAD ──────────────────────────────────────────
  useEffect(() => {
    if (!bootReady) return; // ✅ wait for boot flush
    const cat = category;
    categoryRef.current = cat;

    if (tables[cat]?.length > 0) {
      setPosts([...tables[cat]]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setPosts([]);

    (async () => {
      if (locks.current.initial) return;
      locks.current.initial = true;
      try {
        const { posts: newPosts, pagination } = await fetchPage(cat, limit, null, 'older');
        if (cancelled) return;

        if (!tables[cat])  tables[cat]  = [];
        if (!cursors[cat]) cursors[cat] = { oldest: null, newest: null, hasMore: true };

        appendToTable(cat, newPosts);   // ← sets firstPostId[cat] on first call

        if (newPosts[0]?.inCategoryId) cursors[cat].newest = newPosts[0].inCategoryId;
        if (cat === 'All') seedFromAllPosts(newPosts);

        cursors[cat].hasMore = !!pagination.hasNextPage;

        setPosts([...tables[cat]]);
        setIsLoading(false);
      } catch (err) {
        if (!cancelled) { setError(err); setIsLoading(false); }
      } finally {
        locks.current.initial = false;
      }
    })();

    return () => { cancelled = true; };
  }, [category, limit,bootReady]);


  // ── FETCH NEXT PAGE (scroll DOWN) ───────────────────────────────────────────
  const fetchNextPage = useCallback(async () => {
    const cat = categoryRef.current;
    if (locks.current.next || !cursors[cat]?.hasMore) return;

    locks.current.next = true;
    setFetchingNext(true);
    try {
      const { posts: newPosts, pagination } = await fetchPage(cat, limit, cursors[cat].oldest, 'older');
      appendToTable(cat, newPosts);
      if (cat === 'All') seedFromAllPosts(newPosts);
      cursors[cat].hasMore = !!pagination.hasNextPage;
      flush();
    } catch (err) {
      console.error('[Feed] fetchNextPage error:', err);
    } finally {
      setFetchingNext(false);
      locks.current.next = false;
    }
  }, [limit, flush]);


  // ── FETCH PREVIOUS PAGE (scroll UP) ─────────────────────────────────────────
  const fetchPreviousPage = useCallback(async () => {
    const cat = categoryRef.current;
    if (locks.current.prev || !cursors[cat]?.newest) return;

    locks.current.prev = true;
    setFetchingPrev(true);
    try {
      const { posts: newPosts } = await fetchPage(cat, limit, cursors[cat].newest, 'newer');
      if (newPosts.length > 0) {
        prependToTable(cat, newPosts);   // ← updates firstPostId[cat] to newer top
        if (cat === 'All') seedFromAllPosts(newPosts);
        flush();
      }
    } catch (err) {
      console.error('[Feed] fetchPreviousPage error:', err);
    } finally {
      setFetchingPrev(false);
      locks.current.prev = false;
    }
  }, [limit, flush]);


  // ── PULL-TO-REFRESH ──────────────────────────────────────────────────────────
  const refetch = useCallback(async () => {
    const cat = categoryRef.current;
    if (locks.current.refresh) return;

    locks.current.refresh = true;
    try {
      const { posts: freshPosts, pagination } = await fetchPage(cat, limit, null, 'older');
      const existing = tables[cat] || [];
      const existIds = new Set(existing.map(p => p._id));
      const brandNew = freshPosts.filter(p => !existIds.has(p._id));

      if (brandNew.length > 0) {
        prependToTable(cat, brandNew);   // ← updates firstPostId[cat] to newest post
        if (cat === 'All') seedFromAllPosts(brandNew);
        flush();
        console.log(`✅ [Feed] Refresh: +${brandNew.length} new posts in "${cat}"`);
      } else {
        console.log(`✅ [Feed] Refresh: "${cat}" already up to date`);
      }
      cursors[cat].hasMore = !!pagination.hasNextPage;
    } catch (err) {
      console.error('[Feed] refetch error:', err);
    } finally {
      locks.current.refresh = false;
    }
  }, [limit, flush]);


  // ── PUBLIC API ───────────────────────────────────────────────────────────────
  return {
    data:                   posts,
    isLoading,
    error,

    fetchNextPage,
    hasNextPage:            cursors[category]?.hasMore ?? true,
    isFetchingNextPage,

    fetchPreviousPage,
    isFetchingPreviousPage: isFetchingPrevPage,

    refetch,

    // Where the user LEFT this category → used to resume scroll
    savedScrollPosition:    scrollPos[category]   ?? null,

    // The FIRST post ever seen for this category
    // → SET on first load, UPDATED when refresh brings newer posts
    // → Feed.jsx can use this for "go to start" behavior when needed
    categoryFirstPost:      firstPostId[category] ?? null,
  };
};

// import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
// import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
// import { filtercategouryposts } from '../../API/categoury';

// // -------------------------------------------------------------------------
// // GLOBAL CACHE (Module Level) - Survives unmounts
// // -------------------------------------------------------------------------
// const globalScrollCache = {};
// const originalStartCache = {}; // ✅ Tracks the "First Known Item" for each category

// export const saveScrollPosition = (category, itemId) => {
//     if (!category || !itemId) return;
//     globalScrollCache[category] = itemId;
//     console.log(`📌 [TanStackDB] Saved Scroll: ${category} -> ${itemId}`);
// };

// export const getScrollPosition = (category) => {
//     return globalScrollCache[category];
// };

// /**
//  * useSmartFilteredFeed Hook - "TanStack DB" Pattern
//  * 
//  * CONCEPT:
//  * Instead of filtering the 'All' array on every render (slow),
//  * we build a mutable "Database Index" (HashMap) in memory.
//  * 
//  * 1. Source of Truth: 'All' Feed API
//  * 2. Index: { 'Cars': [Post1, Post2], 'Music': [Post3] }
//  * 3. Selector: Instantly grabs items from Index[Category]
//  */
// export const useSmartFilteredFeed = (category, limit = 20) => {
//     // -------------------------------------------------------------------------
//     // 1. "DB" STATE - The Index
//     // -------------------------------------------------------------------------
//     // We use a Ref for the index so mutations don't trigger re-renders of the hook itself
//     // We will force updates when the index changes relevant to *our* category.
//     const dbIndex = useRef({
//         'All': [],
//         // Dynamic keys will be added here, e.g., 'Cars': []
//     });

//     // Extras Ref: Stores items fetched manually (restoration or gap filling) that aren't in 'All' yet
//     const extrasRef = useRef({});

//     // We use a version counter to force the component to re-read from the DB
//     // when *its* category data has updated.
//     const [dbVersion, setDbVersion] = useState(0);
//     const [isRestoring, setIsRestoring] = useState(false);

//     // -------------------------------------------------------------------------
//     // 2. SOURCE OF TRUTH - The "All" Query
//     // -------------------------------------------------------------------------
//     const allQuery = useInfiniteQuery({
//         queryKey: ['smartFeed', 'All', limit],
//         queryFn: async ({ pageParam }) => {
//             const cursor = typeof pageParam === 'object' ? pageParam?.cursor : pageParam;
//             const direction = typeof pageParam === 'object' ? pageParam?.direction : 'older';

//             console.log(`🚀 [TanStackDB] FETCH: All | Cursor: ${cursor || 'Initial'} | Dir: ${direction}`);

//             const response = await filtercategouryposts('All', limit, cursor || null, direction);
//             return response.data;
//         },
//         initialPageParam: null,
//         getNextPageParam: (lastPage) => {
//             const nextCursor = lastPage?.messege?.pagination?.nextCursor;
//             return nextCursor ? { cursor: nextCursor, direction: 'older' } : undefined;
//         },
//         getPreviousPageParam: (firstPage) => {
//             const prevCursor = firstPage?.messege?.pagination?.previousCursor;
//             return prevCursor ? { cursor: prevCursor, direction: 'newer' } : undefined;
//         },
//         staleTime: 5 * 60 * 1000,
//         gcTime: 30 * 60 * 1000,
//         maxPages: 5,
//     });

//     // -------------------------------------------------------------------------
//     // 3. INDEXING ENGINE (The "Worker")
//     // -------------------------------------------------------------------------
//     // This effect runs whenever new data arrives from the API.
//     // It processes the RAW pages and updates our HashMap Index.
//     useEffect(() => {
//         const newIndex = { 'All': [] };

//         // 1. Add "All" Query Data
//         if (allQuery.data?.pages) {
//             allQuery.data.pages.forEach((page, pageIndex) => {
//                 const posts = page?.messege?.posts || [];
//                 posts.forEach((post, i) => {
//                     newIndex['All'].push(post);

//                     // ✅ Capture Original Start for 'All'
//                     if (pageIndex === 0 && i === 0) {
//                         const prevTop = originalStartCache['All'];
//                         if (prevTop !== post._id) {
//                             console.log(`🆕 [TanStackDB] Cache Updated (All): ${prevTop} -> ${post._id}`);
//                         }
//                         originalStartCache['All'] = post._id;
//                     }

//                     // Add to specific category index
//                     const cat = post.category;
//                     if (cat) {
//                         if (!newIndex[cat]) newIndex[cat] = [];
//                         newIndex[cat].push(post);

//                         // ✅ Capture Original Start for Category (First time we see it in 'All')
//                         if (!originalStartCache[cat]) {
//                             originalStartCache[cat] = post._id;
//                         }
//                     }
//                 });
//             });
//         }

//         // 2. Add "Extras" & Capture Start
//         Object.keys(extrasRef.current).forEach(cat => {
//             if (!newIndex[cat]) newIndex[cat] = [];

//             const extras = extrasRef.current[cat];
//             extras.forEach((post, i) => {
//                 // Deduplicate with Set would be faster but for small extra lists this is fine
//                 const exists = newIndex[cat].some(p => p._id === post._id);
//                 if (!exists) {
//                     newIndex[cat].push(post);
//                 }

//                 // ✅ Capture Start if coming from Extras (likely 'newer' calls)
//                 // Note: If we found older items via restoration, they might implicitly become the start.
//                 // But for "Smart Refresh", we care about the *top-most* known item.
//                 if (i === 0 && !originalStartCache[cat]) {
//                     originalStartCache[cat] = post._id;
//                 }
//             });
//         });

//         // Update the Ref
//         dbIndex.current = newIndex;

//         // Notify listeners (force re-render)
//         setDbVersion(v => v + 1);

//         // console.log(`✅ [TanStackDB] Index Updated. All: ${newIndex['All'].length}`);

//     }, [allQuery.data, isRestoring]); // Re-index when All changes or restoration finishes

//     // -------------------------------------------------------------------------
//     // 4. RESTORATION ENGINE
//     // -------------------------------------------------------------------------
//     useEffect(() => {
//         const checkAndRestore = async () => {
//             // Only restore if we have a saved ID
//             const savedId = globalScrollCache[category];
//             if (!savedId) return;

//             // Check if present in current DB Index
//             const catData = dbIndex.current[category] || [];
//             const exists = catData.find(p => p._id === savedId);

//             if (exists) {
//                 console.log(`✅ [TanStackDB] Restore: Item ${savedId} found in cache.`);
//                 return;
//             }

//             console.log(`⚠️ [TanStackDB] Restore: Item ${savedId} MISSING in cache. Fetching...`);
//             setIsRestoring(true);

//             try {
//                 // Fetch the specific missing chunk - Assume 'older' gets us context
//                 const response = await filtercategouryposts(category, limit, savedId, 'older');
//                 const newPosts = response.data?.messege?.posts || [];

//                 if (newPosts.length > 0) {
//                     console.log(`📦 [TanStackDB] Retrieved ${newPosts.length} items for restoration.`);

//                     // Add to Extras
//                     if (!extrasRef.current[category]) extrasRef.current[category] = [];
//                     const currentExtras = extrasRef.current[category];

//                     newPosts.forEach(p => {
//                         if (!currentExtras.some(e => e._id === p._id)) {
//                             currentExtras.push(p);
//                         }
//                     });

//                     // Trigger Re-indexing
//                     setDbVersion(v => v + 1);
//                 }
//             } catch (err) {
//                 console.error("❌ [TanStackDB] Restore Failed:", err);
//             } finally {
//                 setIsRestoring(false);
//             }
//         };

//         checkAndRestore();
//     }, [category]); // Runs when category switches or mounts

//     // -------------------------------------------------------------------------
//     // 5. QUERY / SELECTOR (The "Reader")
//     // -------------------------------------------------------------------------
//     const filteredData = useMemo(() => {
//         // Dependency on dbVersion ensures we re-calculate when DB updates
//         // eslint-disable-next-line no-unused-vars
//         const _v = dbVersion;

//         const targetCategory = category === 'all' || category === 'All' ? 'All' : category;

//         let data = dbIndex.current[targetCategory] || [];

//         // Case-insensitive fallback
//         if (data.length === 0 && targetCategory !== 'All') {
//             const key = Object.keys(dbIndex.current).find(k => k.toLowerCase() === targetCategory.toLowerCase());
//             if (key) data = dbIndex.current[key];
//         }

//         return data;
//     }, [category, dbVersion]);

//     // -------------------------------------------------------------------------
//     // 6. PAGINATION CONTROLLER (Bi-Directional + Smart Refresh)
//     // -------------------------------------------------------------------------

//     // --- NEXT PAGE (Older items) ---
//     const fetchNextPage = useCallback(() => {
//         if (allQuery.hasNextPage && !allQuery.isFetchingNextPage) {
//             console.log('📥 [TanStackDB] Fetching more MAIN FEED data...');
//             return allQuery.fetchNextPage(); // ✅ Return Promise
//         } else {
//             // console.log('⚠️ [TanStackDB] Main feed exhausted or loading.');
//             return Promise.resolve(); // ✅ Return resolved Promise to avoid crash
//         }
//     }, [allQuery, category]);

//     // --- PREVIOUS PAGE (Newer items / Smart Refresh) ---
//     const fetchPreviousPage = useCallback(async () => {
//         // 1. Identify Category Key
//         const catKey = (category === 'all' || category === 'All') ? 'All' : category;

//         // 2. Identify Current Top Item
//         const currentData = filteredData;
//         if (!currentData || currentData.length === 0) {
//             // If empty, but we are supposed to be in 'All', try fetching previous
//             if (catKey === 'All' && allQuery.hasPreviousPage) {
//                 return allQuery.fetchPreviousPage();
//             }
//             return;
//         }

//         const firstItem = currentData[0];
//         const currentTopId = firstItem._id;

//         // 3. CHECK: Are we at the "Original Start"?
//         // We compare the current top item with the cached "First Item" of this category.
//         const isAtOriginalStart = originalStartCache[catKey] === currentTopId;

//         if (isAtOriginalStart) {
//             console.log(`🔄 [TanStackDB] At Top ("${catKey}") -> Forcing FRESH FETCH / REFRESH`);

//             if (catKey === 'All') {
//                 // For 'All', we want a "Pull to Refresh" effect
//                 return allQuery.refetch();
//             } else {
//                 // Custom Fresh Fetch for Categories (Cursor: null)
//                 try {
//                     // Pass undefined direction to ensure clean fetch
//                     const response = await filtercategouryposts(category, limit, null, undefined);
//                     const freshPosts = response.data?.messege?.posts || [];
//                     console.log(`📦 [TanStackDB] Fresh Fetch received ${freshPosts.length} items.`);

//                     if (freshPosts.length > 0) {
//                         if (!extrasRef.current[category]) extrasRef.current[category] = [];
//                         const currentExtras = extrasRef.current[category];

//                         // Filter duplicates
//                         const uniqueFresh = freshPosts.filter(p => !currentExtras.some(e => e._id === p._id));

//                         // Update Start Cache to the NEW top
//                         if (freshPosts[0]) {
//                             const prevTop = originalStartCache[category];
//                             originalStartCache[category] = freshPosts[0]._id;
//                             console.log(`🆕 [TanStackDB] Cache Updated (${category}): ${prevTop} -> ${originalStartCache[category]}`);
//                         }

//                         // Prepend
//                         extrasRef.current[category] = [...uniqueFresh, ...currentExtras];
//                         setDbVersion(v => v + 1);
//                     }
//                 } catch (err) {
//                     console.error("❌ [TanStackDB] Fresh Fetch Failed:", err);
//                 }
//             }

//         } else {
//             // 4. STANDARD GAP FILL (Newer than current)
//             if (catKey === 'All') {
//                 // Delegate to allQuery's standard bi-directional logic
//                 if (allQuery.hasPreviousPage && !allQuery.isFetchingPreviousPage) {
//                     return allQuery.fetchPreviousPage();
//                 }
//                 return;
//             }

//             // Custom Gap Fill for Categories
//             try {
//                 const cursor = firstItem.inCategoryId || firstItem._id;
//                 // console.log(`🔼 [TanStackDB] Fetching NEWER than ${currentTopId}`);
//                 const response = await filtercategouryposts(category, limit, cursor, 'newer');
//                 const newPosts = response.data?.messege?.posts || [];

//                 if (newPosts.length > 0) {
//                     if (!extrasRef.current[category]) extrasRef.current[category] = [];
//                     const currentExtras = extrasRef.current[category];

//                     const cleanNewPosts = newPosts.filter(p => !currentExtras.some(e => e._id === p._id));

//                     if (cleanNewPosts.length > 0) {
//                         // Update Start Cache if found new top
//                         if (cleanNewPosts[0]) {
//                             const prevTop = originalStartCache[category];
//                             originalStartCache[category] = cleanNewPosts[0]._id;
//                             console.log(`🆕 [TanStackDB] Cache Updated GapFill (${category}): ${prevTop} -> ${originalStartCache[category]}`);
//                         }
//                         extrasRef.current[category] = [...cleanNewPosts, ...currentExtras];
//                         setDbVersion(v => v + 1);
//                     }
//                 }
//             } catch (err) {
//                 console.error("❌ [TanStackDB] Newer Fetch Failed:", err);
//             }
//         }

//     }, [category, allQuery, filteredData, limit]);

//     // -------------------------------------------------------------------------
//     // 7. API EXPORT
//     // -------------------------------------------------------------------------
//     return {
//         data: filteredData,
//         isLoading: allQuery.isLoading,
//         isFetching: allQuery.isFetching || isRestoring,
//         error: allQuery.error,

//         fetchNextPage,
//         fetchPreviousPage,
//         hasNextPage: allQuery.hasNextPage,
//         hasPreviousPage: true, // Always allow pulling up
//         isFetchingNextPage: allQuery.isFetchingNextPage,
//         isFetchingPreviousPage: allQuery.isFetchingPreviousPage,

//         refetch: allQuery.refetch,
//         isRestoring,
//         initialScrollIndex: globalScrollCache[category],
//     };
// };
