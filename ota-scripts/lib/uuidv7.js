const crypto = require("crypto");

/**
 * Generates a UUIDv7 (time-ordered UUID).
 * First 48 bits = current timestamp (ms), remaining bits = random.
 * This makes bundle IDs sortable by creation time using plain string
 * comparison, exactly how the `bundles.id` column is meant to be used
 * (ORDER BY id DESC == newest first).
 */
function createUUIDv7() {
  const timestampHex = Date.now().toString(16).padStart(12, "0");
  const randomBytes = crypto.randomBytes(10);
  const randomHex = randomBytes.toString("hex");

  const randA = randomHex.slice(0, 3);
  const randBHex = randomHex.slice(3, 19);
  const versionAndRandA = `7${randA}`;
  const variantAndFirstRandB = (
    0x80 | (parseInt(randBHex.slice(0, 2), 16) & 0x3f)
  )
    .toString(16)
    .padStart(2, "0");

  return [
    timestampHex.slice(0, 8),
    timestampHex.slice(8, 12),
    versionAndRandA,
    variantAndFirstRandB + randBHex.slice(2, 4),
    randBHex.slice(4, 16),
  ].join("-");
}

module.exports = { createUUIDv7 };
