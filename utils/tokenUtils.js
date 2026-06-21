// utils/tokenUtils.js
export const isTokenExpired = (token) => {
  try {
    // JWT is 3 base64 parts: header.payload.signature
    const payload = token.split('.')[1];
    // React Native needs atob replacement
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    
    // exp is in seconds, Date.now() is milliseconds
    const currentTime = Date.now() / 1000;
    
    // Add 30 second buffer to avoid edge cases
    return decoded.exp < (currentTime + 30);
  } catch (e) {
    return true; // if we can't decode, treat as expired
  }
};

export const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  } catch (e) {
    return null;
  }
};