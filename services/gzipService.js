// services/gzipService.js
import pako from 'pako';
import { uint8ToBase64Fast } from '../utils/base64';

/**
 * Compresses a JSON object into a Gzip binary buffer
 */
export const compressData = (jsonData) => {
  const jsonString = JSON.stringify(jsonData);
  return pako.gzip(jsonString);
};

export const compressToBase64 = (jsonData) => {
  const compressed = compressData(jsonData); // Uint8Array
  return uint8ToBase64Fast(compressed);
};