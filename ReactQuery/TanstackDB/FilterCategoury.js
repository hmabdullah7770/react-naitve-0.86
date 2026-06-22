import { useState, useEffect, useRef, useCallback, useEffectEvent } from 'react';
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
  //
  // React 19: the actual fetch logic lives in a useEffectEvent. This means:
  //   - It always reads the LATEST `category`/`limit` etc. without needing
  //     them in a dependency array (no stale-closure risk).
  //   - Calling it does NOT re-trigger the effect — so there's no way for
  //     a re-render to cause this body to run twice for the same category
  //     while a fetch is already in flight. The old `cancelled` flag is no
  //     longer needed for that purpose; the effect itself only ever calls
  //     `loadCategory` once per actual `[category, limit, bootReady]` change.
  //
  const loadCategory = useEffectEvent(async (cat, lim) => {
    if (tables[cat]?.length > 0) {
      setPosts([...tables[cat]]);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Already fetching this exact category — never reset posts/isLoading
    // a second time while that fetch is still in flight.
    if (locks.current.initial) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setPosts([]);

    locks.current.initial = true;
    try {
      const { posts: newPosts, pagination } = await fetchPage(cat, lim, null, 'older');

      if (!tables[cat])  tables[cat]  = [];
      if (!cursors[cat]) cursors[cat] = { oldest: null, newest: null, hasMore: true };

      appendToTable(cat, newPosts);   // ← sets firstPostId[cat] on first call

      if (newPosts[0]?.inCategoryId) cursors[cat].newest = newPosts[0].inCategoryId;
      if (cat === 'All') seedFromAllPosts(newPosts);

      cursors[cat].hasMore = !!pagination.hasNextPage;

      setPosts([...tables[cat]]);
      setIsLoading(false);
    } catch (err) {
      setError(err);
      setIsLoading(false);
    } finally {
      locks.current.initial = false;
    }
  });

  useEffect(() => {
    if (!bootReady) return; // ✅ wait for boot flush
    categoryRef.current = category;
    loadCategory(category, limit);
  }, [category, limit, bootReady]);


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
// import { useState, useEffect, useRef, useCallback } from 'react';
// import { filtercategouryposts } from '../../API/categoury';
// import { isBootFlushComplete } from '../../utils/ratingQueue';

// // ─────────────────────────────────────────────────────────────────────────────
// // MODULE-LEVEL CACHE
// // ─────────────────────────────────────────────────────────────────────────────
// //
// //  tables[cat]      → Post[]
// //  cursors[cat]     → { oldest, newest, hasMore }
// //  scrollPos[cat]   → { itemId, inCategoryId }   ← where user LEFT the category
// //  firstPostId[cat] → { itemId, inCategoryId }   ← FIRST post ever seen for category
// //                     SET on first data load
// //                     UPDATED when pull-to-refresh brings newer posts
// //                     Never reset to anything older
// //
// // ─────────────────────────────────────────────────────────────────────────────
// const tables      = {};
// const cursors     = {};
// const scrollPos   = {};
// const firstPostId = {};   // ← NEW


// // ─── Public helpers ───────────────────────────────────────────────────────────

// export const saveScrollPosition = (category, itemId, inCategoryId) => {
//   if (!category || !itemId) return;
//   scrollPos[category] = { itemId, inCategoryId };
//   console.log(`💾 [Feed] Saved scroll: "${category}" → ${itemId}`);
// };

// export const getScrollPosition  = (category) => scrollPos[category]   ?? null;
// export const getFirstPostId     = (category) => firstPostId[category] ?? null;

// // Internal: store the first post for a category.
// // Only updates if the new post is genuinely newer (prepended refresh case).
// function setFirstPost(cat, post) {
//   if (!post?.inCategoryId) return;

//   // On first call for this category → always store it
//   if (!firstPostId[cat]) {
//     firstPostId[cat] = { itemId: post._id, inCategoryId: post.inCategoryId };
//     console.log(`📌 [Feed] First post stored for "${cat}": ${post._id}`);
//     return;
//   }

//   // On subsequent calls (refresh prepend) → update to the newer post
//   // The new post is "newer" because it was prepended at index 0
//   firstPostId[cat] = { itemId: post._id, inCategoryId: post.inCategoryId };
//   console.log(`🔄 [Feed] First post updated for "${cat}": ${post._id}`);
// }


// // ─── Internal helpers ─────────────────────────────────────────────────────────

// function seedFromAllPosts(posts) {
//   posts.forEach(post => {
//     const cat = post.category;
//     if (!cat) return;

//     if (!tables[cat])  tables[cat]  = [];
//     if (!cursors[cat]) cursors[cat] = { oldest: null, newest: null, hasMore: true };

//     if (tables[cat].some(p => p._id === post._id)) return;

//     tables[cat].push(post);

//     if (post.inCategoryId) cursors[cat].oldest = post.inCategoryId;
//     if (!cursors[cat].newest && post.inCategoryId) cursors[cat].newest = post.inCategoryId;

//     // Store first post for this category (set once — seedFromAll processes
//     // posts in order so the first call per category is the newest we've seen)
//     if (!firstPostId[cat]) {
//       setFirstPost(cat, post);
//     }
//   });
// }

// function toArray(val) { return Array.isArray(val) ? val : []; }

// function normalizePosts(posts) {
//   return posts.map(post => ({
//     ...post,
//     store:      toArray(post.store),
//     product:    toArray(post.product),
//     imageFiles: toArray(post.imageFiles),
//     videoFiles: toArray(post.videoFiles),
//   }));
// }

// async function fetchPage(category, limit, cursor, direction = 'older') {
//   const res        = await filtercategouryposts(category, limit, cursor ?? null, direction);
//   const posts      = normalizePosts(res.data?.messege?.posts || []);
//   const pagination = res.data?.messege?.pagination || {};
//   return { posts, pagination };
// }

// function prependToTable(cat, newPosts) {
//   if (!newPosts?.length) return;
//   const existing = tables[cat] || [];
//   const seen     = new Set(existing.map(p => p._id));
//   const unique   = newPosts.filter(p => !seen.has(p._id));
//   if (!unique.length) return;

//   tables[cat] = [...unique, ...existing];

//   if (unique[0]?.inCategoryId) cursors[cat].newest = unique[0].inCategoryId;

//   // The new top post is now the first post for this category
//   setFirstPost(cat, unique[0]);
// }

// function appendToTable(cat, newPosts) {
//   if (!newPosts?.length) return;
//   tables[cat] = tables[cat] || [];
//   const seen  = new Set(tables[cat].map(p => p._id));

//   newPosts.forEach(p => {
//     if (!seen.has(p._id)) { tables[cat].push(p); seen.add(p._id); }
//   });

//   const last = tables[cat][tables[cat].length - 1];
//   if (last?.inCategoryId) cursors[cat].oldest = last.inCategoryId;

//   const first = tables[cat][0];
//   if (first?.inCategoryId && !cursors[cat].newest) cursors[cat].newest = first.inCategoryId;

//   // Store first post on initial append (set once — never overwritten by append)
//   if (!firstPostId[cat] && first) setFirstPost(cat, first);
// }



// // flux for udate rating cache 

// // ✅ Add these after the tables/cursors/scrollPos declarations
// const flushListeners = new Set();

// export const subscribeToFlush = (fn) => {
//     flushListeners.add(fn);
//     return () => flushListeners.delete(fn);
// };

// export const updatePostRatingInCache = (postId, hasRated, myRatingValue) => {
//     Object.keys(tables).forEach(cat => {
//         const postIndex = tables[cat]?.findIndex(p => p._id === postId);
//         if (postIndex !== -1) {
//             tables[cat][postIndex] = {
//                 ...tables[cat][postIndex],
//                 hasRated,
//                 myRatingValue,
//             };
//         }
//     });
//     // ✅ Notify all feed instances to flush/re-render
//     flushListeners.forEach(fn => fn());
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // useSmartFilteredFeed
// // ─────────────────────────────────────────────────────────────────────────────
// export const useSmartFilteredFeed = (category, limit = 20) => {

//   const [posts,              setPosts]        = useState(() => tables[category] ? [...tables[category]] : []);
//   const [isLoading,          setIsLoading]    = useState(!tables[category]?.length);
//   const [isFetchingNextPage, setFetchingNext] = useState(false);
//   const [isFetchingPrevPage, setFetchingPrev] = useState(false);
//   const [error,              setError]        = useState(null);

//    const [bootReady, setBootReady] = useState(isBootFlushComplete()); // ✅


  

//     // ✅ Poll until boot flush is done
//     useEffect(() => {
//         if (bootReady) return;
//         const interval = setInterval(() => {
//             if (isBootFlushComplete()) {
//                 setBootReady(true);
//                 clearInterval(interval);
//             }
//         }, 50);
//         return () => clearInterval(interval);
//     }, [bootReady]);

//   const locks       = useRef({ initial: false, next: false, prev: false, refresh: false });
//   const categoryRef = useRef(category);
//   useEffect(() => { categoryRef.current = category; }, [category]);

//   const flush = useCallback(() => {
//     const cat = categoryRef.current;
//     setPosts(tables[cat] ? [...tables[cat]] : []);
//   }, []);

// // for rating update
//    useEffect(() => {
//     const unsubscribe = subscribeToFlush(flush);
//     return unsubscribe;
// }, [flush]);

//   // ── INITIAL / CATEGORY-SWITCH LOAD ──────────────────────────────────────────
//   useEffect(() => {
//     if (!bootReady) return; // ✅ wait for boot flush
//     const cat = category;
//     categoryRef.current = cat;

//     if (tables[cat]?.length > 0) {
//       setPosts([...tables[cat]]);
//       setIsLoading(false);
//       setError(null);
//       return;
//     }

//     let cancelled = false;
//     setIsLoading(true);
//     setError(null);
//     setPosts([]);

//     (async () => {
//       if (locks.current.initial) return;
//       locks.current.initial = true;
//       try {
//         const { posts: newPosts, pagination } = await fetchPage(cat, limit, null, 'older');
//         if (cancelled) return;

//         if (!tables[cat])  tables[cat]  = [];
//         if (!cursors[cat]) cursors[cat] = { oldest: null, newest: null, hasMore: true };

//         appendToTable(cat, newPosts);   // ← sets firstPostId[cat] on first call

//         if (newPosts[0]?.inCategoryId) cursors[cat].newest = newPosts[0].inCategoryId;
//         if (cat === 'All') seedFromAllPosts(newPosts);

//         cursors[cat].hasMore = !!pagination.hasNextPage;

//         setPosts([...tables[cat]]);
//         setIsLoading(false);
//       } catch (err) {
//         if (!cancelled) { setError(err); setIsLoading(false); }
//       } finally {
//         locks.current.initial = false;
//       }
//     })();

//     return () => { cancelled = true; };
//   }, [category, limit,bootReady]);


//   // ── FETCH NEXT PAGE (scroll DOWN) ───────────────────────────────────────────
//   const fetchNextPage = useCallback(async () => {
//     const cat = categoryRef.current;
//     if (locks.current.next || !cursors[cat]?.hasMore) return;

//     locks.current.next = true;
//     setFetchingNext(true);
//     try {
//       const { posts: newPosts, pagination } = await fetchPage(cat, limit, cursors[cat].oldest, 'older');
//       appendToTable(cat, newPosts);
//       if (cat === 'All') seedFromAllPosts(newPosts);
//       cursors[cat].hasMore = !!pagination.hasNextPage;
//       flush();
//     } catch (err) {
//       console.error('[Feed] fetchNextPage error:', err);
//     } finally {
//       setFetchingNext(false);
//       locks.current.next = false;
//     }
//   }, [limit, flush]);


//   // ── FETCH PREVIOUS PAGE (scroll UP) ─────────────────────────────────────────
//   const fetchPreviousPage = useCallback(async () => {
//     const cat = categoryRef.current;
//     if (locks.current.prev || !cursors[cat]?.newest) return;

//     locks.current.prev = true;
//     setFetchingPrev(true);
//     try {
//       const { posts: newPosts } = await fetchPage(cat, limit, cursors[cat].newest, 'newer');
//       if (newPosts.length > 0) {
//         prependToTable(cat, newPosts);   // ← updates firstPostId[cat] to newer top
//         if (cat === 'All') seedFromAllPosts(newPosts);
//         flush();
//       }
//     } catch (err) {
//       console.error('[Feed] fetchPreviousPage error:', err);
//     } finally {
//       setFetchingPrev(false);
//       locks.current.prev = false;
//     }
//   }, [limit, flush]);


//   // ── PULL-TO-REFRESH ──────────────────────────────────────────────────────────
//   const refetch = useCallback(async () => {
//     const cat = categoryRef.current;
//     if (locks.current.refresh) return;

//     locks.current.refresh = true;
//     try {
//       const { posts: freshPosts, pagination } = await fetchPage(cat, limit, null, 'older');
//       const existing = tables[cat] || [];
//       const existIds = new Set(existing.map(p => p._id));
//       const brandNew = freshPosts.filter(p => !existIds.has(p._id));

//       if (brandNew.length > 0) {
//         prependToTable(cat, brandNew);   // ← updates firstPostId[cat] to newest post
//         if (cat === 'All') seedFromAllPosts(brandNew);
//         flush();
//         console.log(`✅ [Feed] Refresh: +${brandNew.length} new posts in "${cat}"`);
//       } else {
//         console.log(`✅ [Feed] Refresh: "${cat}" already up to date`);
//       }
//       cursors[cat].hasMore = !!pagination.hasNextPage;
//     } catch (err) {
//       console.error('[Feed] refetch error:', err);
//     } finally {
//       locks.current.refresh = false;
//     }
//   }, [limit, flush]);


//   // ── PUBLIC API ───────────────────────────────────────────────────────────────
//   return {
//     data:                   posts,
//     isLoading,
//     error,

//     fetchNextPage,
//     hasNextPage:            cursors[category]?.hasMore ?? true,
//     isFetchingNextPage,

//     fetchPreviousPage,
//     isFetchingPreviousPage: isFetchingPrevPage,

//     refetch,

//     // Where the user LEFT this category → used to resume scroll
//     savedScrollPosition:    scrollPos[category]   ?? null,

//     // The FIRST post ever seen for this category
//     // → SET on first load, UPDATED when refresh brings newer posts
//     // → Feed.jsx can use this for "go to start" behavior when needed
//     categoryFirstPost:      firstPostId[category] ?? null,
//   };
// };