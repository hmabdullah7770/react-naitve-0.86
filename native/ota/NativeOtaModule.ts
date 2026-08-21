import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  getAppVersion(): string;
  getBundleId(): string;
  getMinBundleId(): string;
  getChannel(): string;
  setChannel(channel: string): void;

  /**
   * Confirms the currently-running bundle booted successfully.
   * Call this once, after your app has rendered its first real
   * screen (not immediately on mount - give it a beat so a crash
   * during early render still counts as a failed boot).
   */
  markBootSuccess(): void;

  /**
   * Downloads the bundle at fileUrl, verifies it against fileHash
   * (sha256 hex), extracts it, and switches the boot pointer to it.
   * Resolves true on success. Does NOT restart the app - takes
   * effect on next natural launch.
   */
  downloadAndApplyUpdate(
    bundleId: string,
    fileUrl: string,
    fileHash: string,
    minBundleId: string | null
  ): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('OtaModule');