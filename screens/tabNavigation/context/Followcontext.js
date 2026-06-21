import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

/**
 * FollowContext
 *
 * Tracks a single pending follow/unfollow action for a profile being viewed.
 * The actual API call fires elsewhere (on blur in ProfileScreenHeader).
 * This context exposes only what the Network tab needs to mirror locally:
 *   - followerDelta: -1, 0, or +1 to apply on top of the server count
 *   - setFollowState(isNowFollowing): called by ProfileScreenHeader on each tap
 *   - resetFollow(): called when the profile changes (different userId)
 */

const FollowContext = createContext(null);

export const FollowProvider = ({ children }) => {
  // null = no pending action yet for this profile session
  // true  = user has tapped to follow   (net action: follow)
  // false = user has tapped to unfollow (net action: unfollow)
  const [pendingState, setPendingState] = useState(null);

  // The server-side "isFollowing" at the time this profile was loaded.
  // We store it once so we can compute the delta correctly no matter
  // how many times the user taps the button.
  const originalIsFollowingRef = useRef(null);

  /**
   * Call this once when the profile data first loads (or changes).
   * Stores the baseline so delta math stays correct.
   */
  const initFollow = useCallback((serverIsFollowing) => {
    // Only initialise if not already set (avoids re-init on re-renders)
    if (originalIsFollowingRef.current === null) {
      originalIsFollowingRef.current = serverIsFollowing;
    }
  }, []);

  /**
   * Call this every time the user taps Follow / Unfollow.
   * @param {boolean} isNowFollowing - the NEW state after the tap
   */
  const setFollowState = useCallback((isNowFollowing) => {
    setPendingState(isNowFollowing);
  }, []);

  /**
   * Reset when navigating to a different profile.
   */
  const resetFollow = useCallback(() => {
    setPendingState(null);
    originalIsFollowingRef.current = null;
  }, []);

  /**
   * The delta to apply to the displayed follower count:
   *   +1 if the user has tapped Follow   and originally wasn't following
   *   -1 if the user has tapped Unfollow and originally was   following
   *    0 if they've returned to the original state (tap → tap again)
   *    0 if no tap has happened yet
   */
  const followerDelta = (() => {
    if (pendingState === null) return 0;
    const original = originalIsFollowingRef.current;
    if (original === null) return 0;
    if (pendingState === true  && original === false) return +1;
    if (pendingState === false && original === true)  return -1;
    return 0; // tapped back to original state
  })();

  return (
    <FollowContext.Provider
      value={{ followerDelta, pendingState, initFollow, setFollowState, resetFollow }}
    >
      {children}
    </FollowContext.Provider>
  );
};

export const useFollowContext = () => {
  const ctx = useContext(FollowContext);
  if (!ctx) throw new Error('useFollowContext must be used inside <FollowProvider>');
  return ctx;
};