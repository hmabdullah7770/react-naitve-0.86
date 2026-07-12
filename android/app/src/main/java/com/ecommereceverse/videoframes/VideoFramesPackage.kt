package com.ecommereceverse.videoframes

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class VideoFramesPackage : TurboReactPackage() {
    // ↑ Changed: was ReactPackage

    override fun getModule(
        name: String,
        reactContext: ReactApplicationContext
    ): NativeModule? {
        return if (name == VideoFramesModule.NAME) {
            VideoFramesModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                VideoFramesModule.NAME to ReactModuleInfo(
                    VideoFramesModule.NAME,   // name
                    VideoFramesModule.NAME,   // className
                    false,                    // canOverrideExistingModule
                    false,                    // needsEagerInit
                    true,                     // hasConstants
                    false,                    // isCxxModule
                    true                      // isTurboModule ← key flag
                )
            )
        }
    }
}