#!/bin/bash

# Script to verify landing page image assets

echo "🔍 Verifying landing page images..."
echo ""

ASSETS_DIR="assets/onboarding"
REQUIRED_IMAGES=("citizen_voting.jpg" "citizen_diverse.jpg" "citizen_engagement.jpg")

all_ok=true

for image in "${REQUIRED_IMAGES[@]}"; do
    filepath="$ASSETS_DIR/$image"
    
    if [ -f "$filepath" ]; then
        size=$(stat -f%z "$filepath" 2>/dev/null || stat -c%s "$filepath" 2>/dev/null)
        if [ "$size" -gt 0 ]; then
            echo "✅ $image exists ($(numfmt --to=iec-i --suffix=B $size 2>/dev/null || echo "${size} bytes"))"
        else
            echo "❌ $image exists but is empty (0 bytes)"
            all_ok=false
        fi
    else
        echo "❌ $image is missing"
        all_ok=false
    fi
done

echo ""

if [ "$all_ok" = true ]; then
    echo "✅ All images are present and valid!"
    echo ""
    echo "If images still don't display, run:"
    echo "  flutter clean && flutter pub get && flutter run"
else
    echo "⚠️  Some images are missing or corrupted."
    echo "Please add valid JPG images to the $ASSETS_DIR directory."
fi
