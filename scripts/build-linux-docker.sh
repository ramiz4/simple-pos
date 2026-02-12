#!/bin/bash

# Ensure we are in the root directory
cd "$(dirname "$0")/.."

echo "🚀 Building Docker image for Linux build..."
docker build -t simple-pos-linux-builder -f scripts/Dockerfile.linux .

echo "🛠 Running build inside container..."
echo "This will mount your current directory into the container."

docker run --rm -it \
  -v "$(pwd):/app" \
  simple-pos-linux-builder \
  /bin/bash -c "pnpm install && pnpm tauri:build"
