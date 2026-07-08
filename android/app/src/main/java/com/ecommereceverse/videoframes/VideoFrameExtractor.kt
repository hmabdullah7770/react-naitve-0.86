package com.ecommereceverse.videoframes  

import android.content.Context
import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.util.Base64
import java.io.ByteArrayOutputStream
import java.io.File

data class FrameResult(
    val uri: String,
    val timestamp: Long,
    val width: Int,
    val height: Int
)

data class ExtractionOptions(
    val startTime: Long = 0L,
    val endTime: Long = -1L,
    val frameCount: Int = 10,
    val quality: Int = 80,
    val width: Int = -1,
    val height: Int = -1,
    val format: String = "jpeg", // "jpeg" | "png" | "base64"
    val outputDir: String? = null
)

class VideoFrameExtractor(private val context: Context) {

    private val retriever = MediaMetadataRetriever()

    fun extractFrames(
        videoPath: String,
        options: ExtractionOptions,
        onProgress: ((Int, Int) -> Unit)? = null
    ): List<FrameResult> {
        try {
            // Set data source
            setDataSource(videoPath)

            // Get video duration
            val durationStr = retriever.extractMetadata(
                MediaMetadataRetriever.METADATA_KEY_DURATION
            )
            val duration = durationStr?.toLongOrNull() ?: 0L

            // Get video dimensions
            val videoWidth = retriever.extractMetadata(
                MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH
            )?.toIntOrNull() ?: 1920

            val videoHeight = retriever.extractMetadata(
                MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT
            )?.toIntOrNull() ?: 1080

            val startTime = options.startTime
            val endTime = if (options.endTime < 0) duration else options.endTime
            val totalDuration = endTime - startTime

            if (totalDuration <= 0 || options.frameCount <= 0) {
                return emptyList()
            }

            // Calculate timestamps for each frame
            val timestamps = calculateTimestamps(
                startTime,
                endTime,
                options.frameCount
            )

            val results = mutableListOf<FrameResult>()
            val outputDirectory = getOutputDirectory(options.outputDir)

            timestamps.forEachIndexed { index, timestamp ->
                val bitmap = retriever.getFrameAtTime(
                    timestamp * 1000, // Convert ms to microseconds
                    MediaMetadataRetriever.OPTION_CLOSEST_SYNC
                )

                bitmap?.let {
                    val scaledBitmap = scaleBitmap(
                        it,
                        options.width,
                        options.height,
                        videoWidth,
                        videoHeight
                    )

                    val frameResult = when (options.format.lowercase()) {
                        "base64" -> saveAsBase64(scaledBitmap, timestamp, options.quality)
                        "png" -> saveToFile(
                            scaledBitmap,
                            timestamp,
                            index,
                            outputDirectory,
                            Bitmap.CompressFormat.PNG,
                            100
                        )
                        else -> saveToFile(
                            scaledBitmap,
                            timestamp,
                            index,
                            outputDirectory,
                            Bitmap.CompressFormat.JPEG,
                            options.quality
                        )
                    }

                    results.add(frameResult)

                    // Cleanup
                    if (scaledBitmap != it) scaledBitmap.recycle()
                    it.recycle()
                }

                onProgress?.invoke(index + 1, timestamps.size)
            }

            return results

        } finally {
            try {
                retriever.release()
            } catch (e: Exception) {
                // ignore
            }
        }
    }

    fun extractFrameAtTime(
        videoPath: String,
        timeMs: Long,
        options: ExtractionOptions
    ): FrameResult? {
        return try {
            setDataSource(videoPath)

            val videoWidth = retriever.extractMetadata(
                MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH
            )?.toIntOrNull() ?: 1920

            val videoHeight = retriever.extractMetadata(
                MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT
            )?.toIntOrNull() ?: 1080

            val bitmap = retriever.getFrameAtTime(
                timeMs * 1000,
                MediaMetadataRetriever.OPTION_CLOSEST_SYNC
            )

            bitmap?.let {
                val scaledBitmap = scaleBitmap(
                    it,
                    options.width,
                    options.height,
                    videoWidth,
                    videoHeight
                )

                val outputDirectory = getOutputDirectory(options.outputDir)

                val result = when (options.format.lowercase()) {
                    "base64" -> saveAsBase64(scaledBitmap, timeMs, options.quality)
                    "png" -> saveToFile(
                        scaledBitmap,
                        timeMs,
                        0,
                        outputDirectory,
                        Bitmap.CompressFormat.PNG,
                        100
                    )
                    else -> saveToFile(
                        scaledBitmap,
                        timeMs,
                        0,
                        outputDirectory,
                        Bitmap.CompressFormat.JPEG,
                        options.quality
                    )
                }

                if (scaledBitmap != it) scaledBitmap.recycle()
                it.recycle()

                result
            }
        } finally {
            try {
                retriever.release()
            } catch (e: Exception) {
                // ignore
            }
        }
    }

    fun getVideoMetadata(videoPath: String): Map<String, Any> {
        return try {
            setDataSource(videoPath)

            val duration = retriever.extractMetadata(
                MediaMetadataRetriever.METADATA_KEY_DURATION
            )?.toLongOrNull() ?: 0L

            val width = retriever.extractMetadata(
                MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH
            )?.toIntOrNull() ?: 0

            val height = retriever.extractMetadata(
                MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT
            )?.toIntOrNull() ?: 0

            val frameRate = retriever.extractMetadata(
                MediaMetadataRetriever.METADATA_KEY_CAPTURE_FRAMERATE
            )?.toFloatOrNull() ?: 0f

            val bitrate = retriever.extractMetadata(
                MediaMetadataRetriever.METADATA_KEY_BITRATE
            )?.toIntOrNull() ?: 0

            val rotation = retriever.extractMetadata(
                MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION
            )?.toIntOrNull() ?: 0

            mapOf(
                "duration" to duration,
                "width" to width,
                "height" to height,
                "frameRate" to frameRate,
                "bitrate" to bitrate,
                "rotation" to rotation
            )
        } finally {
            try {
                retriever.release()
            } catch (e: Exception) {
                // ignore
            }
        }
    }

    // ─────────────────────────────────────────────
    // Private Helpers
    // ─────────────────────────────────────────────

    private fun setDataSource(videoPath: String) {
        when {
            videoPath.startsWith("content://") -> {
                retriever.setDataSource(context, Uri.parse(videoPath))
            }
            videoPath.startsWith("http://") ||
            videoPath.startsWith("https://") -> {
                retriever.setDataSource(videoPath, HashMap())
            }
            videoPath.startsWith("file://") -> {
                retriever.setDataSource(videoPath.removePrefix("file://"))
            }
            else -> {
                retriever.setDataSource(videoPath)
            }
        }
    }

    private fun calculateTimestamps(
        startTime: Long,
        endTime: Long,
        frameCount: Int
    ): List<Long> {
        if (frameCount == 1) return listOf(startTime)

        val duration = endTime - startTime
        val interval = duration.toDouble() / (frameCount - 1)

        return (0 until frameCount).map { i ->
            (startTime + (i * interval)).toLong()
        }
    }

    private fun scaleBitmap(
        bitmap: Bitmap,
        targetWidth: Int,
        targetHeight: Int,
        originalWidth: Int,
        originalHeight: Int
    ): Bitmap {
        if (targetWidth <= 0 && targetHeight <= 0) return bitmap

        val (newWidth, newHeight) = when {
            targetWidth > 0 && targetHeight > 0 -> {
                Pair(targetWidth, targetHeight)
            }
            targetWidth > 0 -> {
                val ratio = targetWidth.toFloat() / originalWidth
                Pair(targetWidth, (originalHeight * ratio).toInt())
            }
            else -> {
                val ratio = targetHeight.toFloat() / originalHeight
                Pair((originalWidth * ratio).toInt(), targetHeight)
            }
        }

        return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
    }

    private fun saveToFile(
        bitmap: Bitmap,
        timestamp: Long,
        index: Int,
        outputDir: File,
        format: Bitmap.CompressFormat,
        quality: Int
    ): FrameResult {
        val extension = if (format == Bitmap.CompressFormat.PNG) "png" else "jpg"
        val fileName = "frame_${timestamp}_${index}.$extension"
        val file = File(outputDir, fileName)

        file.outputStream().use { out ->
            bitmap.compress(format, quality, out)
        }

        return FrameResult(
            uri = "file://${file.absolutePath}",
            timestamp = timestamp,
            width = bitmap.width,
            height = bitmap.height
        )
    }

    private fun saveAsBase64(
        bitmap: Bitmap,
        timestamp: Long,
        quality: Int
    ): FrameResult {
        val byteArrayOutputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, quality, byteArrayOutputStream)
        val byteArray = byteArrayOutputStream.toByteArray()
        val base64String = Base64.encodeToString(byteArray, Base64.NO_WRAP)

        return FrameResult(
            uri = "data:image/jpeg;base64,$base64String",
            timestamp = timestamp,
            width = bitmap.width,
            height = bitmap.height
        )
    }

    private fun getOutputDirectory(customPath: String?): File {
        val dir = if (customPath != null) {
            File(customPath)
        } else {
            File(context.cacheDir, "video_frames")
        }

        if (!dir.exists()) {
            dir.mkdirs()
        }

        return dir
    }
}