// package com.ecommereceverse.ota
package com.ecommereceverse.videoframes  
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import java.util.concurrent.Executors

/**
 * OtaModule
 * ----------
 * TurboModule bridge. Thin by design - all real logic lives in
 * OtaManager. This class only marshals between JS <-> native and
 * moves blocking work (download/unzip) off the JS thread.
 *
 * NOTE ON CODEGEN:
 * With New Architecture, this class should extend the generated
 * spec base class (e.g. `NativeOtaModuleSpec`) produced by RN's
 * codegen from js/NativeOtaModule.ts. That generated class doesn't
 * exist until you:
 *   1. Add the codegenConfig block to package.json (see js/README)
 *   2. Run a build once (./gradlew build, or just `npx react-native run-android`)
 *      which triggers codegen and generates
 *      android/app/build/generated/source/codegen/java/.../NativeOtaModuleSpec.java
 *
 * Until then, this file will not compile as `extends NativeOtaModuleSpec`.
 * If you want to get moving before wiring up codegen, you can
 * temporarily extend ReactContextBaseJavaModule + implement
 * ReactMethod-annotated functions manually (old-arch style) - New
 * Architecture still supports this via the interop layer. Swap to
 * the generated spec once codegen is confirmed working.
 */
class OtaModule(reactContext: ReactApplicationContext) :
    NativeOtaModuleSpec(reactContext) {

    private val executor = Executors.newSingleThreadExecutor()

    override fun getName(): String = NAME

    override fun getAppVersion(): String {
        return OtaManager.getAppVersion(reactApplicationContext)
    }

    override fun getBundleId(): String {
        return OtaManager.getBundleId(reactApplicationContext)
    }

    override fun getMinBundleId(): String {
        return OtaManager.getMinBundleId(reactApplicationContext)
    }

    override fun getChannel(): String {
        return OtaManager.getChannel(reactApplicationContext)
    }

    override fun setChannel(channel: String) {
        OtaManager.setChannel(reactApplicationContext, channel)
    }

    override fun markBootSuccess() {
        OtaManager.markBootSuccess(reactApplicationContext)
    }

    override fun downloadAndApplyUpdate(
        bundleId: String,
        fileUrl: String,
        fileHash: String,
        minBundleId: String?,
        promise: Promise
    ) {
        executor.execute {
            try {
                val success = OtaManager.downloadAndApply(
                    reactApplicationContext,
                    bundleId,
                    fileUrl,
                    fileHash,
                    minBundleId
                )
                promise.resolve(success)
            } catch (e: Exception) {
                promise.reject("OTA_DOWNLOAD_FAILED", e.message, e)
            }
        }
    }

    companion object {
        const val NAME = "OtaModule"
    }
}