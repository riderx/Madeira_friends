#!/bin/bash

# Make sure the scripts directory exists
mkdir -p scripts

# Install dependencies
npm install axios glob tsx

# Create a message
echo "Installing dependencies and running asset downloader..."

# Run the asset downloader
npm run download-assets

echo "All done! Assets have been downloaded to public/assets/ and references updated." 
