// package com.ecommereceverse.ota
package com.ecommereceverse.videoframes  
import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream

/**
 * OtaManager
 * -----------
 * All the "hard part" native logic lives here:
 *  - downloading a bundle zip from a signed URL
 *  - verifying its sha256 hash
 *  - extracting it to app-private storage
 *  - tracking which bundle is "current" via SharedPreferences
 *  - crash-loop rollback safety (revert to last-known-good bundle
 *    if the newly applied one fails to boot cleanly)
 *
 * Nothing here touches React Native APIs directly - OtaModule.kt is
 * the thin TurboModule bridge that calls into this.
 */
object OtaManager {

    private const val TAG = "OtaManager"
    private const val PREFS_NAME = "ota_prefs"

    private const val KEY_CURRENT_BUNDLE_ID = "current_bundle_id"
    private const val KEY_CURRENT_BUNDLE_PATH = "current_bundle_path"
    private const val KEY_LAST_GOOD_BUNDLE_ID = "last_good_bundle_id"
    private const val KEY_LAST_GOOD_BUNDLE_PATH = "last_good_bundle_path"
    private const val KEY_BOOT_ATTEMPT_COUNT = "boot_attempt_count"
    private const val KEY_BOOT_CONFIRMED = "boot_confirmed"
    private const val KEY_MIN_BUNDLE_ID = "min_bundle_id"
    private const val KEY_CHANNEL = "channel"

    private const val MAX_BOOT_ATTEMPTS = 2
    private const val BUNDLE_FILE_NAME = "index.android.bundle"

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private fun bundlesRootDir(context: Context): File =
        File(context.filesDir, "ota-bundles").apply { mkdirs() }

    // ---------------------------------------------------------------
    // Called from MainApplication.getJSBundleFile()
    // ---------------------------------------------------------------

    /**
     * Returns the file path RN should boot its JS from, or null to
     * fall back to the bundle embedded in the APK.
     *
     * This is also where crash-loop protection kicks in: if the
     * current bundle has failed to confirm a successful boot too
     * many times, we revert to the last-known-good bundle (or to
     * the embedded bundle if there isn't one) before returning.
     */
    fun getJSBundleFile(context: Context): String? {
        checkAndHandleBootFailure(context)

        val currentPath = prefs(context).getString(KEY_CURRENT_BUNDLE_PATH, null)
        if (currentPath == null) {
            Log.i(TAG, "No OTA bundle applied, using embedded bundle")
            return null
        }
        val file = File(currentPath)
        if (!file.exists()) {
            Log.w(TAG, "Current bundle path missing on disk, falling back to embedded")
            return null
        }

        // This counts as a boot *attempt* for the current bundle.
        // If markBootSuccess() isn't called before the next process
        // start, this counter increments again.
        incrementBootAttempt(context)

        Log.i(TAG, "Booting from OTA bundle: $currentPath")
        return currentPath
    }

    private fun checkAndHandleBootFailure(context: Context) {
        val p = prefs(context)
        val confirmed = p.getBoolean(KEY_BOOT_CONFIRMED, true)
        val attempts = p.getInt(KEY_BOOT_ATTEMPT_COUNT, 0)

        if (!confirmed && attempts >= MAX_BOOT_ATTEMPTS) {
            Log.w(TAG, "Bundle failed to confirm boot after $attempts attempts, rolling back")
            val lastGoodId = p.getString(KEY_LAST_GOOD_BUNDLE_ID, null)
            val lastGoodPath = p.getString(KEY_LAST_GOOD_BUNDLE_PATH, null)

            val failedBundleId = p.getString(KEY_CURRENT_BUNDLE_ID, null)

            val editor = p.edit()
            if (lastGoodId != null && lastGoodPath != null && File(lastGoodPath).exists()) {
                editor.putString(KEY_CURRENT_BUNDLE_ID, lastGoodId)
                editor.putString(KEY_CURRENT_BUNDLE_PATH, lastGoodPath)
            } else {
                // No safe bundle to fall back to -> use the embedded APK bundle
                editor.remove(KEY_CURRENT_BUNDLE_ID)
                editor.remove(KEY_CURRENT_BUNDLE_PATH)
            }
            editor.putBoolean(KEY_BOOT_CONFIRMED, true) // the rolled-back target is already "confirmed"
            editor.putInt(KEY_BOOT_ATTEMPT_COUNT, 0)
            editor.apply()

            // Best-effort cleanup of the bad bundle directory
            if (failedBundleId != null) {
                File(bundlesRootDir(context), failedBundleId).deleteRecursively()
            }
        }
    }

    private fun incrementBootAttempt(context: Context) {
        val p = prefs(context)
        if (!p.getBoolean(KEY_BOOT_CONFIRMED, true)) {
            val attempts = p.getInt(KEY_BOOT_ATTEMPT_COUNT, 0)
            p.edit().putInt(KEY_BOOT_ATTEMPT_COUNT, attempts + 1).apply()
        }
    }

    // ---------------------------------------------------------------
    // Called from JS via OtaModule after app renders successfully
    // ---------------------------------------------------------------

    fun markBootSuccess(context: Context) {
        val p = prefs(context)
        val currentId = p.getString(KEY_CURRENT_BUNDLE_ID, null) ?: return
        val currentPath = p.getString(KEY_CURRENT_BUNDLE_PATH, null) ?: return

        // The bundle that was "last good" up until now becomes the one
        // rollback-safety copy we keep around; everything older than
        // that gets pruned since it can never be rolled back to anyway.
        val previousGoodId = p.getString(KEY_LAST_GOOD_BUNDLE_ID, null)

        p.edit()
            .putBoolean(KEY_BOOT_CONFIRMED, true)
            .putInt(KEY_BOOT_ATTEMPT_COUNT, 0)
            .putString(KEY_LAST_GOOD_BUNDLE_ID, currentId)
            .putString(KEY_LAST_GOOD_BUNDLE_PATH, currentPath)
            .apply()

        Log.i(TAG, "Boot confirmed for bundle $currentId")
        pruneOldBundles(context, keepIds = setOfNotNull(currentId, previousGoodId))
    }

    /**
     * Deletes every bundle folder except the ones passed in. Called
     * after a successful boot confirmation so we don't accumulate an
     * unbounded number of old bundle folders in app storage.
     */
    private fun pruneOldBundles(context: Context, keepIds: Set<String>) {
        val root = bundlesRootDir(context)
        val dirs = root.listFiles() ?: return
        for (dir in dirs) {
            if (dir.isDirectory && dir.name !in keepIds) {
                Log.i(TAG, "Pruning old bundle: ${dir.name}")
                dir.deleteRecursively()
            }
        }
    }

    // ---------------------------------------------------------------
    // Called from JS via OtaModule to fetch + apply a new bundle
    // ---------------------------------------------------------------

    /**
     * Downloads the zip at fileUrl, verifies its sha256 against
     * fileHash, extracts it, and (if all that succeeds) switches the
     * "current bundle" pointer to it. Does NOT restart the app -
     * the new bundle takes effect on next natural app launch.
     *
     * Runs synchronously - call this from a background thread.
     */
    fun downloadAndApply(
        context: Context,
        bundleId: String,
        fileUrl: String,
        fileHash: String,
        minBundleId: String?
    ): Boolean {
        val targetDir = File(bundlesRootDir(context), bundleId)
        val zipFile = File(context.cacheDir, "$bundleId.zip")

        try {
            targetDir.deleteRecursively()
            targetDir.mkdirs()

            Log.i(TAG, "Downloading bundle $bundleId from $fileUrl")
            downloadFile(fileUrl, zipFile)

            val actualHash = sha256(zipFile)
            if (!actualHash.equals(fileHash, ignoreCase = true)) {
                Log.e(TAG, "Hash mismatch: expected $fileHash, got $actualHash")
                return false
            }

            unzip(zipFile, targetDir)

            val bundleFile = File(targetDir, BUNDLE_FILE_NAME)
            if (!bundleFile.exists()) {
                Log.e(TAG, "Extracted zip does not contain $BUNDLE_FILE_NAME")
                return false
            }

            // Switch pointer. Boot is NOT confirmed yet - that only
            // happens when JS calls markBootSuccess() after the app
            // has actually rendered on the new bundle.
            prefs(context).edit()
                .putString(KEY_CURRENT_BUNDLE_ID, bundleId)
                .putString(KEY_CURRENT_BUNDLE_PATH, bundleFile.absolutePath)
                .putBoolean(KEY_BOOT_CONFIRMED, false)
                .putInt(KEY_BOOT_ATTEMPT_COUNT, 0)
                .apply()
                .also { if (minBundleId != null) prefs(context).edit().putString(KEY_MIN_BUNDLE_ID, minBundleId).apply() }

            Log.i(TAG, "Bundle $bundleId applied, will take effect on next app launch")
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to download/apply bundle $bundleId", e)
            targetDir.deleteRecursively()
            return false
        } finally {
            zipFile.delete()
        }
    }

    private fun downloadFile(url: String, dest: File) {
        val connection = URL(url).openConnection() as HttpURLConnection
        connection.connectTimeout = 30_000
        connection.readTimeout = 30_000
        try {
            connection.connect()
            if (connection.responseCode !in 200..299) {
                throw Exception("Download failed with HTTP ${connection.responseCode}")
            }
            connection.inputStream.use { input ->
                FileOutputStream(dest).use { output ->
                    input.copyTo(output)
                }
            }
        } finally {
            connection.disconnect()
        }
    }

    private fun sha256(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { input ->
            val buffer = ByteArray(8192)
            var read: Int
            while (input.read(buffer).also { read = it } != -1) {
                digest.update(buffer, 0, read)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    private fun unzip(zipFile: File, destDir: File) {
        ZipInputStream(zipFile.inputStream()).use { zis ->
            var entry: ZipEntry? = zis.nextEntry
            while (entry != null) {
                val outFile = File(destDir, entry.name)
                // Zip-slip protection: ensure entry stays inside destDir
                if (!outFile.canonicalPath.startsWith(destDir.canonicalPath + File.separator) &&
                    outFile.canonicalPath != destDir.canonicalPath
                ) {
                    throw SecurityException("Zip entry outside target dir: ${entry.name}")
                }
                if (entry.isDirectory) {
                    outFile.mkdirs()
                } else {
                    outFile.parentFile?.mkdirs()
                    FileOutputStream(outFile).use { output -> zis.copyTo(output) }
                }
                zis.closeEntry()
                entry = zis.nextEntry
            }
        }
    }

    // ---------------------------------------------------------------
    // Simple getters used by JS to build update-check requests
    // ---------------------------------------------------------------

    fun getAppVersion(context: Context): String {
        return try {
            val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            pInfo.versionName ?: "unknown"
        } catch (e: Exception) {
            "unknown"
        }
    }

    fun getBundleId(context: Context): String {
        return prefs(context).getString(KEY_CURRENT_BUNDLE_ID, null) ?: NIL_UUID
    }

    fun getMinBundleId(context: Context): String {
        return prefs(context).getString(KEY_MIN_BUNDLE_ID, null) ?: NIL_UUID
    }

    fun getChannel(context: Context): String {
        return prefs(context).getString(KEY_CHANNEL, null) ?: "production"
    }

    fun setChannel(context: Context, channel: String) {
        prefs(context).edit().putString(KEY_CHANNEL, channel).apply()
    }

    const val NIL_UUID = "00000000-0000-0000-0000-000000000000"
}