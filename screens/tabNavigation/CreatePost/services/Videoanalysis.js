// videoAnalysis.js
//
// Orchestrates: extract frames (native VideoFrames module) -> run each
// frame through a TFLite NSFW model (react-native-fast-tflite) -> report
// progress -> return an aggregated verdict -> clean up temp frame files.

import { loadTensorflowModel } from 'react-native-fast-tflite';
import RNFS from 'react-native-fs';
import { extractFrames, clearFramesCache } from '../native/VideoFrames';
// ^ adjust this relative path to wherever your VideoFrames.ts actually lives

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

const FRAME_COUNT = 10; // sample 10 frames across the video (tune as needed)
const NSFW_THRESHOLD = 0.6; // 0-1 confidence above which a frame is "flagged"
// NSFW model classes are commonly: ['drawing','hentai','neutral','porn','sexy']
// Adjust FLAGGED_CLASS_INDICES to match whatever classes YOUR model outputs.
const FLAGGED_CLASS_INDICES = [1, 3]; // e.g. hentai, porn

let cachedModel = null;

async function getModel() {
  if (cachedModel) return cachedModel;
  // Point this at your bundled .tflite model asset
  cachedModel = await loadTensorflowModel(
    require('../assets/models/nsfw_model.tflite'),
  );
  return cachedModel;
}

// ─────────────────────────────────────────────
// ⚠️ YOU NEED TO CONFIRM THIS FUNCTION AGAINST YOUR MODEL
// ─────────────────────────────────────────────
// This turns a frame image file into the Float32Array tensor your model
// expects. The exact input size / normalization depends on your specific
// .tflite model (commonly 224x224 or 299x299, values scaled 0-1 or -1..1).
//
// You need an image decode+resize step here. If you don't already have one
// in your project, the two common options are:
//   1. `@shopify/react-native-skia` (decode + resize + read pixels)
//   2. A small native helper (fastest — you already have MediaMetadataRetriever
//      returning Bitmaps in Kotlin, so resizing + tensor prep could happen
//      there instead, and you'd skip this JS step entirely)
//
// Below is the SHAPE of what this function must do — plug in your actual
// decode/resize call where marked.
async function frameToTensor(framePath, inputSize = 224) {
  // TODO: replace this with your actual image decode + resize + pixel read
  // e.g. using Skia:
  //   const data = await Skia.Data.fromURI(framePath);
  //   const image = Skia.Image.MakeImageFromEncoded(data);
  //   const resized = ... resize to inputSize x inputSize ...
  //   const pixels = resized.readPixels(); // Uint8Array RGBA

  throw new Error(
    'frameToTensor() is not implemented yet — wire up your image decode/resize step here.',
  );

  // Example of what the final shape should look like once you have pixels:
  // const float32Data = new Float32Array(inputSize * inputSize * 3);
  // for (let i = 0; i < inputSize * inputSize; i++) {
  //   float32Data[i * 3 + 0] = pixels[i * 4 + 0] / 255; // R
  //   float32Data[i * 3 + 1] = pixels[i * 4 + 1] / 255; // G
  //   float32Data[i * 3 + 2] = pixels[i * 4 + 2] / 255; // B
  // }
  // return float32Data;
}

async function runInferenceOnFrame(model, framePath) {
  const tensor = await frameToTensor(framePath);
  const output = model.runSync([tensor]);
  // output[0] is typically a Float32Array of class probabilities
  const scores = output[0];

  const flaggedScore = FLAGGED_CLASS_INDICES.reduce(
    (max, idx) => Math.max(max, scores[idx] ?? 0),
    0,
  );

  return flaggedScore;
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Analyzes a video for nudity by sampling frames and running them
 * through a TFLite model.
 *
 * @param {string} videoUri - file:// or content:// URI of the video
 * @param {(progress: number) => void} onProgress - called with 0-100
 * @returns {Promise<{ flagged: boolean, maxScore: number, framesChecked: number }>}
 */
export async function analyzeVideoForNudity(videoUri, onProgress) {
  let framePaths = [];

  try {
    onProgress?.(0);

    const model = await getModel();

    // 1. Extract frames natively (fast — file paths only, see earlier discussion)
    const frames = await extractFrames(videoUri, {
      frameCount: FRAME_COUNT,
      quality: 80,
      width: 224,
      height: 224,
      format: 'jpeg',
    });

    framePaths = frames.map(f => f.uri);

    if (frames.length === 0) {
      onProgress?.(100);
      return { flagged: false, maxScore: 0, framesChecked: 0 };
    }

    // 2. Run inference frame by frame, reporting progress
    let maxScore = 0;

    for (let i = 0; i < frames.length; i++) {
      const score = await runInferenceOnFrame(model, frames[i].uri);
      maxScore = Math.max(maxScore, score);

      const percent = Math.round(((i + 1) / frames.length) * 100);
      onProgress?.(percent);

      // Early exit: no need to keep checking once clearly flagged
      if (maxScore >= NSFW_THRESHOLD) {
        onProgress?.(100);
        break;
      }
    }

    return {
      flagged: maxScore >= NSFW_THRESHOLD,
      maxScore,
      framesChecked: frames.length,
    };
  } finally {
    // 3. Always clean up temp frame files, success or failure
    try {
      await clearFramesCache();
    } catch (e) {
      console.warn('Failed to clear frame cache:', e);
    }
  }
}