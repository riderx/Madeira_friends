// This script generates a social share image for SEO purposes
// You would need to run this with Node.js

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const UNSPLASH_IMAGE_URL = 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?q=80&w=1200&h=630&auto=format';
const OUTPUT_PATH = path.join(projectRoot, 'public', 'assets', 'madeira-social-share.jpg');

// Create directories if they don't exist
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Download image
const downloadImage = (url, outputPath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${res.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(outputPath);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Image downloaded to ${outputPath}`);
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlinkSync(outputPath);
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

console.log('Downloading social share image...');
downloadImage(UNSPLASH_IMAGE_URL, OUTPUT_PATH)
  .then(() => {
    console.log('Social share image created successfully!');
  })
  .catch((err) => {
    console.error('Error creating social share image:', err);
  }); 
