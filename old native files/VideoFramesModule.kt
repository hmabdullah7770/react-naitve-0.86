package com.ecommereceverse.videoframes  

import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import kotlinx.coroutines.*

@ReactModule(name = VideoFramesModule.NAME)
class VideoFramesModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "VideoFrames"
    }

    private val moduleScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun getName(): String = NAME

    override fun invalidate() {
        super.invalidate()
        moduleScope.cancel()
    }

    // ─────────────────────────────────────────────
    // Get Video Metadata
    // ─────────────────────────────────────────────

    @ReactMethod
    fun getMetadata(
        videoPath: String,
        promise: Promise
    ) {
        moduleScope.launch {
            try {
                val extractor = VideoFrameExtractor(reactContext)
                val metadata = extractor.getVideoMetadata(videoPath)

                val result = Arguments.createMap().apply {
                    putDouble("duration", (metadata["duration"] as Long).toDouble())
                    putInt("width", metadata["width"] as Int)
                    putInt("height", metadata["height"] as Int)
                    putDouble("frameRate", (metadata["frameRate"] as Float).toDouble())
                    putInt("bitrate", metadata["bitrate"] as Int)
                    putInt("rotation", metadata["rotation"] as Int)
                }

                withContext(Dispatchers.Main) {
                    promise.resolve(result)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("METADATA_ERROR", e.message, e)
                }
            }
        }
    }

    // ─────────────────────────────────────────────
    // Extract Multiple Frames
    // ─────────────────────────────────────────────

    @ReactMethod
    fun extractFrames(
        videoPath: String,
        optionsMap: ReadableMap,
        promise: Promise
    ) {
        moduleScope.launch {
            try {
                val options = parseOptions(optionsMap)
                val extractor = VideoFrameExtractor(reactContext)

                val frames = extractor.extractFrames(
                    videoPath,
                    options,
                    onProgress = { current, total ->
                        sendProgressEvent(current, total)
                    }
                )

                val resultArray = Arguments.createArray()
                frames.forEach { frame ->
                    resultArray.pushMap(frameToMap(frame))
                }

                withContext(Dispatchers.Main) {
                    promise.resolve(resultArray)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("EXTRACT_ERROR", e.message, e)
                }
            }
        }
    }

    // ─────────────────────────────────────────────
    // Extract Single Frame at Time
    // ─────────────────────────────────────────────

    @ReactMethod
    fun extractFrameAtTime(
        videoPath: String,
        timeMs: Double,
        optionsMap: ReadableMap,
        promise: Promise
    ) {
        moduleScope.launch {
            try {
                val options = parseOptions(optionsMap)
                val extractor = VideoFrameExtractor(reactContext)

                val frame = extractor.extractFrameAtTime(
                    videoPath,
                    timeMs.toLong(),
                    options
                )

                withContext(Dispatchers.Main) {
                    if (frame != null) {
                        promise.resolve(frameToMap(frame))
                    } else {
                        promise.reject("FRAME_ERROR", "Could not extract frame at time $timeMs")
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("FRAME_ERROR", e.message, e)
                }
            }
        }
    }

    // ─────────────────────────────────────────────
    // Clear Cache
    // ─────────────────────────────────────────────

    @ReactMethod
    fun clearCache(promise: Promise) {
        moduleScope.launch {
            try {
                val cacheDir = java.io.File(reactContext.cacheDir, "video_frames")
                if (cacheDir.exists()) {
                    cacheDir.deleteRecursively()
                }
                withContext(Dispatchers.Main) {
                    promise.resolve(true)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("CACHE_ERROR", e.message, e)
                }
            }
        }
    }

    // ─────────────────────────────────────────────
    // Private Helpers
    // ─────────────────────────────────────────────

    private fun parseOptions(map: ReadableMap): ExtractionOptions {
        return ExtractionOptions(
            startTime = if (map.hasKey("startTime"))
                map.getDouble("startTime").toLong() else 0L,
            endTime = if (map.hasKey("endTime"))
                map.getDouble("endTime").toLong() else -1L,
            frameCount = if (map.hasKey("frameCount"))
                map.getInt("frameCount") else 10,
            quality = if (map.hasKey("quality"))
                map.getInt("quality") else 80,
            width = if (map.hasKey("width"))
                map.getInt("width") else -1,
            height = if (map.hasKey("height"))
                map.getInt("height") else -1,
            format = if (map.hasKey("format"))
                map.getString("format") ?: "jpeg" else "jpeg",
            outputDir = if (map.hasKey("outputDir"))
                map.getString("outputDir") else null
        )
    }

    private fun frameToMap(frame: FrameResult): WritableMap {
        return Arguments.createMap().apply {
            putString("uri", frame.uri)
            putDouble("timestamp", frame.timestamp.toDouble())
            putInt("width", frame.width)
            putInt("height", frame.height)
        }
    }

    private fun sendProgressEvent(current: Int, total: Int) {
        val params = Arguments.createMap().apply {
            putInt("current", current)
            putInt("total", total)
        }
        reactContext
            .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("VideoFramesProgress", params)
    }
}