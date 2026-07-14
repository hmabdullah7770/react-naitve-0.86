// frameToTensor.js
//
// Decodes a static image file (our extracted JPEG frame) into the
// Float32Array tensor shape react-native-fast-tflite expects.
// Requires: @shopify/react-native-skia

import { Skia, AlphaType, ColorType } from '@shopify/react-native-skia';
import RNFS from 'react-native-fs';

/**
 * @param {string} framePath - file:// path to a saved JPEG frame
 * @param {number} inputSize - model's expected width/height (e.g. 224)
 * @returns {Promise<Float32Array>} RGB float32 tensor, normalized 0-1
 */
export async function frameToTensor(framePath, inputSize = 224) {
  // 1. Read the file as base64 and load it into Skia
  const base64 = await RNFS.readFile(framePath, 'base64');
  const data = Skia.Data.fromBase64(base64);
  const image = Skia.Image.MakeImageFromEncoded(data);

  if (!image) {
    throw new Error(`Failed to decode image at ${framePath}`);
  }

  // 2. Draw it into an offscreen surface at the model's expected size
  //    (this does the resize for us)
  const surface = Skia.Surface.MakeOffscreen(inputSize, inputSize);
  const canvas = surface.getCanvas();

  const srcRect = { x: 0, y: 0, width: image.width(), height: image.height() };
  const dstRect = { x: 0, y: 0, width: inputSize, height: inputSize };
  canvas.drawImageRect(image, srcRect, dstRect, Skia.Paint());

  const snapshot = surface.makeImageSnapshot();

  // 3. Read raw RGBA pixels out of the resized image
  const pixels = snapshot.readPixels(0, 0, {
    width: inputSize,
    height: inputSize,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });

  if (!pixels) {
    throw new Error('Failed to read pixels from resized image');
  }

  // 4. Convert RGBA Uint8 pixels -> RGB Float32 tensor, normalized 0-1
  //    (drop alpha channel — most classifiers expect RGB only)
  const float32Data = new Float32Array(inputSize * inputSize * 3);
  for (let i = 0; i < inputSize * inputSize; i++) {
    float32Data[i * 3 + 0] = pixels[i * 4 + 0] / 255; // R
    float32Data[i * 3 + 1] = pixels[i * 4 + 1] / 255; // G
    float32Data[i * 3 + 2] = pixels[i * 4 + 2] / 255; // B
  }

  surface.dispose();

  return float32Data;
}