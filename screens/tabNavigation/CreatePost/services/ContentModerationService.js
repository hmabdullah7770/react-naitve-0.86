// screens/CreatePost/services/ContentModerationService.js

import {loadTensorflowModel} from 'react-native-fast-tflite';
import {extractFrameAtTime, getVideoMetadata} from '../../../native/index';

const NSFW_LABELS = ['drawings', 'hentai', 'neutral', 'porn', 'sexy'];

const THRESHOLDS = {
  porn: 0.55,
  hentai: 0.55,
  sexy: 0.70,
};

class ContentModerationService {
  constructor() {
    this.model = null;
    this.isLoaded = false;
    this.isLoading = false;
  }

  async loadModel() {
    if (this.isLoaded) return;
    if (this.isLoading) {
      // Wait for existing load to complete
      await new Promise(resolve => {
        const check = setInterval(() => {
          if (!this.isLoading) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      });
      return;
    }

    try {
      this.isLoading = true;
      console.log('🧠 Loading moderation model...');

      this.model = await loadTensorflowModel(
        require('../../../assets/models/nsfw_mobilenet.tflite'),
      );

      this.isLoaded = true;
      console.log('✅ Model loaded');
    } catch (error) {
      console.error('❌ Model load failed:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async runInference(float32Input) {
    if (!this.model) throw new Error('Model not loaded');
    const outputs = await this.model.run([float32Input]);
    const scores = Array.from(outputs[0]);
    return NSFW_LABELS.map((label, i) => ({
      label,
      confidence: scores[i] ?? 0,
    }));
  }

  analyzeResult(predictions) {
    const porn = predictions.find(p => p.label === 'porn')?.confidence ?? 0;
    const hentai = predictions.find(p => p.label === 'hentai')?.confidence ?? 0;
    const sexy = predictions.find(p => p.label === 'sexy')?.confidence ?? 0;
    const top = predictions.reduce((a, b) =>
      a.confidence > b.confidence ? a : b,
    );

    if (porn >= THRESHOLDS.porn) {
      return {
        isSafe: false,
        isBlocked: true,
        reason: `Explicit content detected (${(porn * 100).toFixed(0)}%)`,
        topLabel: top.label,
      };
    }
    if (hentai >= THRESHOLDS.hentai) {
      return {
        isSafe: false,
        isBlocked: true,
        reason: `Inappropriate content detected (${(hentai * 100).toFixed(0)}%)`,
        topLabel: top.label,
      };
    }
    if (sexy >= THRESHOLDS.sexy) {
      return {
        isSafe: false,
        isBlocked: false, // warn only
        reason: `Sensitive content detected (${(sexy * 100).toFixed(0)}%)`,
        topLabel: top.label,
      };
    }

    return {isSafe: true, isBlocked: false, reason: null, topLabel: top.label};
  }

  async uriToFloat32(imageUri) {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const base64 = reader.result.split(',')[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          // Normalize to [0,1] — model expects 224x224x3 float32
          const floatArr = new Float32Array(224 * 224 * 3);
          for (let i = 0; i < floatArr.length; i++) {
            floatArr[i] = (bytes[i] ?? 0) / 255.0;
          }
          resolve(floatArr);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // ─── Check single image ───
  async checkImage(imageUri) {
    await this.loadModel();
    try {
      const input = await this.uriToFloat32(imageUri);
      const predictions = await this.runInference(input);
      return this.analyzeResult(predictions);
    } catch (error) {
      console.warn('Image check error (allowing):', error);
      return {isSafe: true, isBlocked: false, reason: null};
    }
  }

  // ─── Check video by sampling frames ───
  async checkVideo(videoUri, onProgress) {
    await this.loadModel();
    try {
      const metadata = await getVideoMetadata(videoUri);
      const duration = metadata.duration; // ms

      // Sample at 5 points
      const samplePoints = [0.1, 0.25, 0.5, 0.75, 0.9];
      const timestamps = samplePoints.map(p => Math.floor(duration * p));

      console.log(`🎬 Checking ${timestamps.length} frames from video...`);

      for (let i = 0; i < timestamps.length; i++) {
        onProgress?.({current: i + 1, total: timestamps.length});

        try {
          // Use our custom native module to extract frame
          const frame = await extractFrameAtTime(videoUri, timestamps[i], {
            quality: 60,
            width: 224,
            height: 224,
            format: 'jpeg',
          });

          const input = await this.uriToFloat32(frame.uri);
          const predictions = await this.runInference(input);
          const result = this.analyzeResult(predictions);

          if (result.isBlocked) {
            console.log(`🚫 Blocked at ${timestamps[i]}ms`);
            return result;
          }

          if (!result.isSafe) {
            // Sensitive content — return warning result
            return result;
          }
        } catch (frameError) {
          console.warn(`Frame skip at ${timestamps[i]}ms:`, frameError);
        }
      }

      return {isSafe: true, isBlocked: false, reason: null};
    } catch (error) {
      console.warn('Video check error (allowing):', error);
      return {isSafe: true, isBlocked: false, reason: null};
    }
  }
}

export default new ContentModerationService();