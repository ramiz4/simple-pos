#!/bin/bash

# Bundle Analysis Script for Simple POS
# This script analyzes the production build bundle size and generates a report

echo "🔍 Analyzing Bundle Size..."
echo "=============================="
echo ""

# Build the application in production mode
echo "📦 Building application..."
pnpm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Please fix build errors first."
  exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""

# Analyze the dist directory
DIST_DIR="dist/simple-pos"

if [ ! -d "$DIST_DIR" ]; then
  echo "❌ Distribution directory not found: $DIST_DIR"
  exit 1
fi

echo "📊 Bundle Size Report"
echo "=============================="
echo ""

# Get total size
TOTAL_SIZE=$(du -sh "$DIST_DIR" | cut -f1)
echo "Total Bundle Size: $TOTAL_SIZE"
echo ""

# List all JavaScript chunks
echo "JavaScript Chunks:"
echo "----------------------------"
find "$DIST_DIR" -name "*.js" -type f -exec du -h {} \; | sort -hr | head -20
echo ""

# List all CSS files
echo "CSS Files:"
echo "----------------------------"
find "$DIST_DIR" -name "*.css" -type f -exec du -h {} \; | sort -hr
echo ""

# Count files by type
echo "File Count by Type:"
echo "----------------------------"
echo "JavaScript files: $(find "$DIST_DIR" -name "*.js" | wc -l)"
echo "CSS files: $(find "$DIST_DIR" -name "*.css" | wc -l)"
echo "HTML files: $(find "$DIST_DIR" -name "*.html" | wc -l)"
echo "Other files: $(find "$DIST_DIR" -type f ! -name "*.js" ! -name "*.css" ! -name "*.html" | wc -l)"
echo ""

# Identify largest files
echo "Top 10 Largest Files:"
echo "----------------------------"
find "$DIST_DIR" -type f -exec du -h {} \; | sort -hr | head -10
echo ""

# Check for lazy-loaded chunks
echo "Lazy-Loaded Chunks:"
echo "----------------------------"
find "$DIST_DIR" -name "chunk-*.js" -type f -exec basename {} \; | while read file; do
  SIZE=$(du -h "$DIST_DIR/$file" | cut -f1)
  echo "$file - $SIZE"
done
echo ""

# Recommendations
echo "💡 Recommendations:"
echo "=============================="
echo "1. Review large chunks and consider code splitting"
echo "2. Check for duplicate dependencies"
echo "3. Ensure tree-shaking is working correctly"
echo "4. Consider lazy loading more routes"
echo "5. Optimize images and assets"
echo ""

echo "✅ Analysis complete!"
