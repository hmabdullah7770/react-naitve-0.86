// services/gzipService.js
import pako from 'pako';

/**
 * Compresses a JSON object into a Gzip binary buffer
 */
export const compressData = (jsonData) => {
  const jsonString = JSON.stringify(jsonData);
  return pako.gzip(jsonString);
};