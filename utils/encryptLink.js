import Aes from 'react-native-aes-crypto';
import Config from 'react-native-config';

const SECRET_KEY = Config.DEEP_LINKING_SECRET;  // ⚠️ store in .env
const IV = Config.DEEP_LINKING_IV;
// 'your-16-char-iv!!';                        // ⚠️ store in .env


console.log('KEY:', SECRET_KEY);   // must not be undefined
console.log('IV:', IV);            // must not be undefined
console.log('KEY length:', SECRET_KEY?.length);  // must be 32
console.log('IV length:', IV?.length);           // must be 16
export const encryptPostId = async (postId) => {
  try {
    const encrypted = await Aes.encrypt(postId, SECRET_KEY, IV, 'aes-256-cbc');
    const urlSafe = encrypted
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return urlSafe;
  } catch (error) {
    console.log('Encryption error:', error);
    return postId;
  }
};

export const decryptPostId = async (encrypted) => {
  try {
    const base64 = encrypted
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const decrypted = await Aes.decrypt(base64, SECRET_KEY, IV, 'aes-256-cbc');
    return decrypted;
  } catch (error) {
    console.log('Decryption error:', error);
    return encrypted;
  }
};