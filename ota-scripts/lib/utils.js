const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const AdmZip = require("adm-zip");

/** SHA-256 hash of a file's contents (hex string). */
function sha256File(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/** Zips an entire directory (bundle + assets) into a single .zip file. */
function zipDirectory(sourceDir, outZipPath) {
  return new Promise((resolve, reject) => {
    try {
      const zip = new AdmZip();
      zip.addLocalFolder(sourceDir);
      zip.writeZip(outZipPath);
      resolve(outZipPath);
    } catch (err) {
      reject(err);
    }
  });
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

module.exports = { sha256File, zipDirectory, ensureDir, readJson };