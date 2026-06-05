#!/bin/bash

# Script to fix landing page image display issues

echo "🔧 Fixing landing page image display issues..."
echo ""

cd "$(dirname "$0")"

echo "Step 1: Cleaning Flutter build cache..."
flutter clean

echo ""
echo "Step 2: Getting dependencies and processing assets..."
flutter pub get

echo ""
echo "✅ Build cache cleared and assets processed!"
echo ""
echo "Next steps:"
echo "  1. Run: flutter run"
echo "  2. Or if already running, press 'R' for hot restart"
echo ""
echo "The landing page images should now display correctly."
