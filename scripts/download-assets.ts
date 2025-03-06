import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import axios from "axios";
import { glob } from "glob";

// Configuration
const assetPattern =
  /(https?:\/\/.*?madeirafriends.*?\.(?:jpg|jpeg|png|gif|svg|webp))/gi;
const sourceGlob = "src/**/*.{vue,ts,js}";
const publicDir = path.resolve(process.cwd(), "public/assets");
const assetsMapFile = path.resolve(process.cwd(), "public/assets/map.json");

// Create assets directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Load existing assets map if it exists
let assetsMap: Record<string, string> = {};
if (fs.existsSync(assetsMapFile)) {
  assetsMap = JSON.parse(fs.readFileSync(assetsMapFile, "utf-8"));
}

async function downloadFile(url: string): Promise<string> {
  // Create a hash of the URL to use as filename
  const urlHash = crypto.createHash("md5").update(url).digest("hex");

  // Extract file extension from URL
  const extension = path.extname(url).toLowerCase() || ".jpg";

  // Create the local filename
  const filename = `${urlHash}${extension}`;
  const filePath = path.join(publicDir, filename);

  // Skip download if file already exists
  if (fs.existsSync(filePath)) {
    console.log(`File already exists: ${filename}`);
    return `/assets/${filename}`;
  }

  try {
    console.log(`Downloading: ${url}`);
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });

    fs.writeFileSync(filePath, Buffer.from(response.data));
    console.log(`Downloaded: ${filename}`);

    return `/assets/${filename}`;
  } catch (error) {
    console.error(`Failed to download ${url}:`, error);
    return url; // Return original URL if download fails
  }
}

async function processFiles() {
  try {
    // Find all source files
    const files = await glob(sourceGlob);

    for (const file of files) {
      let content = fs.readFileSync(file, "utf-8");
      let modified = false;

      // Find all madeirafriends URLs in the file
      const urls = content.match(assetPattern) || [];

      for (const url of urls) {
        // Skip if we already processed this URL
        if (assetsMap[url]) {
          content = content.replace(
            new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
            assetsMap[url],
          );
          modified = true;
          continue;
        }

        // Download the file and get local path
        const localPath = await downloadFile(url);

        // Save mapping
        assetsMap[url] = localPath;

        // Replace URL in content
        content = content.replace(
          new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
          localPath,
        );
        modified = true;
      }

      // Write updated content back to file
      if (modified) {
        fs.writeFileSync(file, content);
        console.log(`Updated: ${file}`);
      }
    }

    // Save updated assets map
    fs.writeFileSync(assetsMapFile, JSON.stringify(assetsMap, null, 2));
    console.log(`Assets map saved to ${assetsMapFile}`);

    console.log(
      "Done! All madeirafriends assets have been downloaded and replaced.",
    );
  } catch (error) {
    console.error("Error processing files:", error);
  }
}

processFiles();
