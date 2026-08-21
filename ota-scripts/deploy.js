#!/usr/bin/env node
/**
 * OTA Deploy Script
 * ------------------
 * Uploads the zip produced by `ota:build` to Supabase Storage, then
 * inserts a row into the `bundles` table describing it, so the edge
 * function can find and serve it to matching clients.
 *
 * Required env vars (put these in a local .env, not committed):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   <- service role, NOT anon key (bypasses RLS)
 *
 * Usage:
 *   node ota-scripts/deploy.js --platform android
 *   node ota-scripts/deploy.js --platform android --channel production
 *   node ota-scripts/deploy.js --platform android --app-version "^1.2.0"
 *   node ota-scripts/deploy.js --platform android --force-update --message "critical fix"
 *   node ota-scripts/deploy.js --platform android --disabled   (upload but don't serve yet)
 */

require("dotenv").config();
const path = require("path");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const { createUUIDv7 } = require("./lib/uuidv7");
const { readJson } = require("./lib/utils");

const BUCKET_NAME = "bundles";

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    platform: null,
    channel: "production",
    appVersion: null, // defaults to semver range matching current package.json version exactly
    forceUpdate: false,
    enabled: true,
    message: null,
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--platform") options.platform = args[++i];
    else if (arg === "--channel") options.channel = args[++i];
    else if (arg === "--app-version") options.appVersion = args[++i];
    else if (arg === "--force-update") options.forceUpdate = true;
    else if (arg === "--disabled") options.enabled = false;
    else if (arg === "--message") options.message = args[++i];
  }
  if (!options.platform || !["ios", "android"].includes(options.platform)) {
    console.error("Error: --platform ios|android is required");
    process.exit(1);
  }
  return options;
}

async function main() {
  const opts = parseArgs();
  const projectRoot = process.cwd();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error(
      "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (e.g. in a .env file)."
    );
    process.exit(1);
  }

  const zipPath = path.join(projectRoot, "ota-dist", `${opts.platform}.zip`);
  const manifestPath = path.join(
    projectRoot,
    "ota-dist",
    `${opts.platform}.manifest.json`
  );
  if (!fs.existsSync(zipPath) || !fs.existsSync(manifestPath)) {
    console.error(
      `Error: build artifacts not found. Run "npm run ota:build -- --platform ${opts.platform}" first.`
    );
    process.exit(1);
  }

  const manifest = readJson(manifestPath);
  const appVersion = opts.appVersion ?? manifest.appVersion;
  const bundleId = createUUIDv7();
  const storageKey = `${opts.platform}/${opts.channel}/${bundleId}.zip`;

  console.log(`\n[ota:deploy] Uploading ${opts.platform} bundle...`);
  console.log(`  bundleId: ${bundleId}`);
  console.log(`  channel:  ${opts.channel}`);
  console.log(`  version:  ${appVersion}`);

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const fileBuffer = fs.readFileSync(zipPath);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storageKey, fileBuffer, {
      contentType: "application/zip",
      upsert: false,
    });

  if (uploadError) {
    console.error("[ota:deploy] Storage upload failed:", uploadError.message);
    process.exit(1);
  }

  console.log("[ota:deploy] Upload complete. Inserting bundle record...");

  const { error: insertError } = await supabase.from("bundles").insert({
    id: bundleId,
    platform: opts.platform,
    channel: opts.channel,
    target_app_version: appVersion,
    should_force_update: opts.forceUpdate,
    enabled: opts.enabled,
    file_hash: manifest.fileHash,
    git_commit_hash: manifest.gitCommitHash,
    message: opts.message,
    storage_uri: `${BUCKET_NAME}/${storageKey}`,
    metadata: {},
  });

  if (insertError) {
    console.error(
      "[ota:deploy] Failed to insert bundle row:",
      insertError.message
    );
    console.error(
      "  (The file was already uploaded to storage at:",
      storageKey,
      "- you may want to clean it up manually.)"
    );
    process.exit(1);
  }

  console.log(`\n[ota:deploy] Done. Bundle ${bundleId} is live on channel "${opts.channel}".\n`);
}

main().catch((err) => {
  console.error("[ota:deploy] Unexpected error:", err);
  process.exit(1);
});
