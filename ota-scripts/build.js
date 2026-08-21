#!/usr/bin/env node
/**
 * OTA Build Script
 * -----------------
 * Bundles the JS + assets for a given platform using the standard
 * `react-native bundle` command, then zips the output so it's ready
 * to upload with `ota:deploy`.
 *
 * Usage:
 *   node ota-scripts/build.js --platform android
 *   node ota-scripts/build.js --platform ios
 *   node ota-scripts/build.js --platform android --entry-file index.js --dev false
 *
 * Output:
 *   ota-dist/<platform>/index.<platform>.bundle
 *   ota-dist/<platform>/assets/...
 *   ota-dist/<platform>.zip        <- this is what ota:deploy uploads
 *   ota-dist/<platform>.manifest.json
 *
 * IMPORTANT:
 *   fileHash is computed from the FINAL .zip, not the raw bundle
 *   file. OtaManager.kt downloads the .zip and verifies its sha256
 *   against manifest.fileHash BEFORE unzipping, so the two hashes
 *   must refer to the same artifact. Hashing the raw bundle here
 *   instead of the zip will cause every download to fail hash
 *   verification on-device.
 */

const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const { sha256File, zipDirectory, ensureDir, readJson } = require("./lib/utils");

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    platform: null,
    entryFile: "index.js",
    dev: "false",
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--platform") options.platform = args[++i];
    else if (arg === "--entry-file") options.entryFile = args[++i];
    else if (arg === "--dev") options.dev = args[++i];
  }
  if (!options.platform || !["ios", "android"].includes(options.platform)) {
    console.error("Error: --platform ios|android is required");
    process.exit(1);
  }
  return options;
}

async function main() {
  const { platform, entryFile, dev } = parseArgs();
  const projectRoot = process.cwd();
  const pkg = readJson(path.join(projectRoot, "package.json"));
  const appVersion = pkg.version;

  const outDir = path.join(projectRoot, "ota-dist", platform);
  const assetsDir = path.join(outDir, "assets");
  const bundleFileName =
    platform === "ios" ? "main.jsbundle" : "index.android.bundle";
  const bundleOutput = path.join(outDir, bundleFileName);
  const sourcemapOutput = path.join(outDir, `${bundleFileName}.map`);

  // Fresh output dir each build
  fs.rmSync(outDir, { recursive: true, force: true });
  ensureDir(assetsDir);

  console.log(`\n[ota:build] Bundling for ${platform} (app version ${appVersion})...`);

  execFileSync(
    "npx",
    [
      "react-native",
      "bundle",
      "--platform",
      platform,
      "--dev",
      dev,
      "--entry-file",
      entryFile,
      "--bundle-output",
      bundleOutput,
      "--assets-dest",
      assetsDir,
      "--sourcemap-output",
      sourcemapOutput,
    ],
    { stdio: "inherit", cwd: projectRoot, shell: true }
  );

  console.log("[ota:build] Bundle created.");
  console.log("[ota:build] Zipping bundle + assets...");
  const zipPath = path.join(projectRoot, "ota-dist", `${platform}.zip`);
  fs.rmSync(zipPath, { force: true });

  try {
    await zipDirectory(outDir, zipPath);

    // ✅ Hash the ZIP, not the raw bundle file. This is the artifact
    // that actually gets downloaded and verified on-device in
    // OtaManager.downloadAndApply() via sha256(zipFile), so the
    // manifest's fileHash must match it exactly.
    console.log("[ota:build] Computing file hash of zip...");
    const fileHash = sha256File(zipPath);

    const manifest = {
      platform,
      appVersion,
      bundleFileName,
      fileHash,
      gitCommitHash: getGitCommitHash(),
      createdAt: new Date().toISOString(),
    };
    const manifestPath = path.join(
      projectRoot,
      "ota-dist",
      `${platform}.manifest.json`
    );
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`\n[ota:build] Done.`);
    console.log(`  zip:      ${zipPath}`);
    console.log(`  manifest: ${manifestPath}`);
    console.log(`  fileHash: ${fileHash}`);
    console.log(`\nNext: npm run ota:deploy -- --platform ${platform}\n`);
  } catch (err) {
    console.error("[ota:build] Failed to zip/hash bundle:", err);
    process.exit(1);
  }
}

function getGitCommitHash() {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"])
      .toString()
      .trim();
  } catch {
    return null;
  }
}

main().catch((err) => {
  console.error("[ota:build] Unexpected error:", err);
  process.exit(1);
});