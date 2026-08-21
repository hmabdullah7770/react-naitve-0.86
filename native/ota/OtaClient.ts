import NativeOtaModule from './NativeOtaModule';
import { Platform } from 'react-native';

export interface OtaClientConfig {
  /** e.g. "https://<project>.supabase.co/functions/v1/update-server" */
  baseURL: string;
  /** Supabase publishable/anon key, sent as Bearer token */
  authToken: string;
  channel?: string;
}

export type UpdateCheckResult =
  | { status: 'UP_TO_DATE' }
  | {
      status: 'UPDATE' | 'ROLLBACK';
      id: string;
      shouldForceUpdate: boolean;
      message: string | null;
      fileUrl: string;
      fileHash: string;
    };

/**
 * Asks your edge function whether there's an update for this device,
 * matching the /app-version/:platform/:appVersion/:channel/:minBundleId/:bundleId
 * route shape.
 */
export async function checkForUpdate(
  config: OtaClientConfig
): Promise<UpdateCheckResult | null> {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const appVersion = NativeOtaModule.getAppVersion();
  const channel = config.channel ?? NativeOtaModule.getChannel();
  const minBundleId = NativeOtaModule.getMinBundleId();
  const bundleId = NativeOtaModule.getBundleId();

  const url = `${config.baseURL}/app-version/${platform}/${encodeURIComponent(
    appVersion
  )}/${channel}/${minBundleId}/${bundleId}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${config.authToken}` },
  });

  if (!response.ok) {
    throw new Error(`Update check failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data || data.status === 'UP_TO_DATE') return { status: 'UP_TO_DATE' };
  return data as UpdateCheckResult;
}

/**
 * Full check -> download -> apply cycle. Call this from a
 * background effect (e.g. on app start, or on an interval) - it
 * does not block rendering and does not restart the app. The
 * downloaded bundle takes effect next time the app is naturally
 * relaunched.
 */
export async function syncUpdate(config: OtaClientConfig): Promise<void> {
  const result = await checkForUpdate(config);
  console.error('[OTA] checkForUpdate result:', JSON.stringify(result));
  if (!result || result.status === 'UP_TO_DATE') return;

  // ✅ Pass the device's current minBundleId through instead of
  // hardcoding null. OtaManager.downloadAndApply() only overwrites
  // KEY_MIN_BUNDLE_ID when a non-null value is passed in, so sending
  // null here meant the min-bundle rollout/rollback floor could
  // never advance past NIL_UUID, no matter how many updates were
  // applied.
  const minBundleId = NativeOtaModule.getMinBundleId();

  const applied = await NativeOtaModule.downloadAndApplyUpdate(
    result.id,
    result.fileUrl,
    result.fileHash,
    minBundleId
  );

  if (!applied) {
    throw new Error(`Failed to apply bundle ${result.id}`);
  }
}

/**
 * Call once after your app has successfully rendered its first
 * real screen. This confirms the current bundle is safe, so it
 * becomes the rollback target if a future update fails to boot.
 */
export function markBootSuccess(): void {
  NativeOtaModule.markBootSuccess();
}

export function getAppVersion(): string {
  return NativeOtaModule.getAppVersion();
}

export function getBundleId(): string {
  return NativeOtaModule.getBundleId();
}