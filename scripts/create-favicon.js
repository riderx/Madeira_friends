// This script creates a simple SVG favicon
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Create favicon directories
const faviconDir = path.join(projectRoot, 'public', 'assets', 'favicon');
if (!fs.existsSync(faviconDir)) {
  fs.mkdirSync(faviconDir, { recursive: true });
}

// Create a simple SVG favicon
const svgFavicon = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <style>
    .text { font: bold 50px sans-serif; fill: white; }
    @media (prefers-color-scheme: light) {
      .background { fill: #121212; }
    }
    @media (prefers-color-scheme: dark) {
      .background { fill: #121212; }
    }
  </style>
  <rect class="background" width="100" height="100" rx="20" />
  <text class="text" x="50" y="65" text-anchor="middle">MF</text>
</svg>`;

// Write the SVG file
fs.writeFileSync(path.join(faviconDir, 'favicon.svg'), svgFavicon);
console.log('SVG favicon created!');

// Create a simple favicon.ico placeholder (normally you'd use a tool like sharp or imagemagick)
// For now we'll just copy an existing image for demo purposes
try {
  // Copy SVG to root
  fs.writeFileSync(path.join(projectRoot, 'public', 'favicon.ico'), Buffer.from([0]));
  console.log('ICO placeholder created!');
  
  // Create placeholder apple touch icon
  fs.writeFileSync(path.join(faviconDir, 'apple-touch-icon.png'), Buffer.from([0]));
  console.log('Apple touch icon placeholder created!');
  
  // Create placeholder android icons
  fs.writeFileSync(path.join(faviconDir, 'android-chrome-192x192.png'), Buffer.from([0]));
  fs.writeFileSync(path.join(faviconDir, 'android-chrome-512x512.png'), Buffer.from([0]));
  console.log('Android chrome icons created!');
  
  console.log('All favicon assets created successfully!');
  console.log('Note: The .ico and .png files are just placeholders. Replace them with real images for production.');
} catch (err) {
  console.error('Error creating favicon assets:', err);
} 
