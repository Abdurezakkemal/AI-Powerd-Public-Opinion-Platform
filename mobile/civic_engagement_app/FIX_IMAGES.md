# Fix Landing Page Images Not Displaying

## Problem
The landing page images (`citizen_voting.jpg`, `citizen_diverse.jpg`, `citizen_engagement.jpg`) are not displaying in the mobile app.

## Root Cause
The images exist in the correct location (`assets/onboarding/`) and are properly declared in `pubspec.yaml`, but Flutter may need to rebuild to recognize them.

## Solution

### Option 1: Clean and Rebuild (Recommended)
Run these commands in the mobile app directory:

```bash
cd mobile/civic_engagement_app

# Clean the build
flutter clean

# Get dependencies (this will process the assets)
flutter pub get

# Rebuild the app
flutter run
```

### Option 2: Hot Restart
If you already have the app running:

1. Press `R` (capital R) in the terminal to perform a hot restart
2. Or stop the app completely and run `flutter run` again

### Option 3: Verify Image Files
Check if the image files are valid:

```bash
# List the image files
ls -lh assets/onboarding/

# Check file sizes (they should be > 0 bytes)
```

If any files are 0 bytes or corrupted, you'll need to replace them with valid images.

## Verification
After rebuilding, the landing page should display:
1. **Slide 1**: Voting image with "Vote on policies that matter" text
2. **Slide 2**: Diverse people image with "Available in multiple languages" text  
3. **Slide 3**: Engagement image with "Track policy progress" text

If images still don't load, the app shows a fallback gradient background with icons.

## Additional Notes
- Images are declared in `pubspec.yaml` under the `assets:` section
- The error handler in `landing_page.dart` provides a graceful fallback
- Images must be added before running `flutter pub get` to be bundled with the app
