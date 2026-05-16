# Implementation Plan: Mobile UI Redesign

## Overview

This plan implements a visual-only redesign of the Civic Engagement Flutter app to match the website's design system. The backend integration, data layer, and business logic are complete and functional. This implementation focuses exclusively on updating the presentation layer: design system configuration, shared widget library, and screen redesigns for Authentication, Citizen, Planner, and Admin roles.

The implementation follows an incremental approach: establish the design foundation first, build reusable components, then update screens role-by-role. Each task is independently testable through visual verification and maintains all existing functionality.

---

## Tasks

### Phase 1: Design System Foundation

- [x] 1. Set up design system configuration files
  - Create `lib/presentation/shared/theme/` directory structure
  - Create `app_colors.dart` with all color constants (primary emerald-600, slate palette, status colors)
  - Create `app_typography.dart` with text style definitions (headline, title, body, caption, etc.)
  - Create `app_spacing.dart` with spacing and border radius constants
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Implement app theme configuration
  - Create `app_theme.dart` with complete ThemeData for light mode
  - Configure color scheme, scaffold, AppBar, card, input decoration themes
  - Configure button themes (elevated, outlined, text), FAB, chip, divider, snackbar themes
  - Apply theme globally in MaterialApp
  - _Requirements: 1.8, 17.7_

- [x] 3. Add dark mode theme support (optional)
  - Implement dark theme variant in `app_theme.dart`
  - Configure dark color palette (slate-900 background, slate-100 text, slate-700 cards)
  - Add system dark mode detection using MediaQuery.platformBrightness
  - Verify WCAG AA contrast ratios in dark mode
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7_

- [x] 4. Create responsive and animation utilities
  - Create `lib/presentation/shared/utils/responsive.dart` with breakpoint helpers
  - Create `lib/presentation/shared/utils/animations.dart` with duration and curve constants
  - Implement grid column calculator for mobile (2 cols) and tablet (4 cols)
  - _Requirements: 17.1, 17.2, 17.3, 17.6, 20.1, 20.2, 20.3, 20.4, 20.7, 20.8, 20.9_

---

### Phase 2: Shared Widget Library

- [x] 5. Implement status and region widgets
  - [x] 5.1 Create `StatusBadge` widget with color-coded status display
    - Implement status-to-color mapping (active/emerald, closed/rose, draft/slate, warning/amber)
    - Add compact mode option for smaller badges
    - Add semantic labels for accessibility
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 18.10_
  
  - [x] 5.2 Create `RegionChip` widget for region tags
    - Implement chip with slate-100 background and slate-700 text
    - Add selected state with emerald colors
    - Add tap callback for interactive mode
    - _Requirements: 2.9_

- [x] 6. Implement metric and policy card widgets
  - [x] 6.1 Create `MetricCard` widget for KPI display
    - Implement card with label, value, optional change indicator
    - Add icon support and trend indicators (up/down/neutral)
    - Use slate-50 background with rounded-xl corners
    - _Requirements: 2.5, 2.6_
  
  - [x] 6.2 Create `PolicyCard` widget for policy summaries
    - Implement card with code, title, status, description, regions, dates, rating, votes
    - Add optional action buttons support
    - Use white background with rounded-xl corners and slate-200 border
    - _Requirements: 2.7, 2.8_

- [x] 7. Implement rating and state widgets
  - [x] 7.1 Create `StarRating` widget for ratings
    - Implement 1-5 star display with amber color
    - Add interactive mode with tap callbacks
    - Support custom size and read-only mode
    - _Requirements: 2.10_
  
  - [x] 7.2 Create `EmptyState` widget for no-data scenarios
    - Implement centered layout with icon, message, subtitle, optional action
    - Use slate-300 icon color and consistent typography
    - _Requirements: 2.11, 19.1_
  
  - [x] 7.3 Create `ErrorState` widget for error handling
    - Implement error icon, message, and retry button
    - Use error colors and PrimaryButton for retry
    - _Requirements: 2.12, 19.3, 19.4_
  
  - [x] 7.4 Create `LoadingIndicator` widget for loading states
    - Implement centered CircularProgressIndicator with emerald-600 color
    - Add optional message display
    - _Requirements: 2.13, 19.1, 19.2_

- [x] 8. Implement utility widgets
  - [x] 8.1 Create `SectionHeader` widget for section titles
    - Implement title with consistent subtitle styling
    - Add optional action widget support
    - _Requirements: 2.14_
  
  - [x] 8.2 Create `PrimaryButton` widget for CTAs
    - Implement button with emerald-600 background and white text
    - Add loading state with spinner and "Submitting..." text
    - Add fullWidth option for full-width buttons
    - _Requirements: 2.15, 19.5, 19.6_

---

### Phase 3: Authentication Screens

- [x] 9. Redesign Login screen
  - Update screen layout with centered logo (64sp), app name, and tagline
  - Implement email and password fields with icons and outlined style
  - Add "Forgot Password?" link and "Sign Up" link in emerald-700
  - Add loading state to Sign In button
  - Add error message display below password field
  - Apply white background with subtle slate-50 gradient
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15_

- [x] 10. Redesign Register screen
  - Update AppBar with back button and "Create Account" title
  - Implement welcome message and subtitle
  - Add email, password, phone, and region fields with icons
  - Implement password strength indicator (weak/medium/strong with colored bar)
  - Add region dropdown with bottom sheet and search
  - Add terms text and "Sign In" link
  - Add loading state and field-level error messages
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 4.13, 4.14, 4.15_

- [x] 11. Redesign OTP Verification screen
  - Update AppBar with back button and "Verify Email" title
  - Add verification icon (80sp) and email display
  - Implement six individual TextField boxes for OTP with auto-focus
  - Add countdown timer display
  - Add "Resend" link with SnackBar feedback
  - Implement shake animation for invalid OTP
  - Add loading state and error display
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13, 5.14, 5.15_

- [x] 12. Checkpoint - Verify authentication screens
  - Test all three authentication screens visually
  - Verify loading states, error states, and navigation flows
  - Ensure all interactive elements meet 48dp touch target minimum
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 4: Citizen Screens

- [x] 13. Redesign Citizen Policy List screen
  - Update AppBar with "Active Policies" title and action icons
  - Render policies using PolicyCard widget
  - Implement EmptyState for no policies
  - Implement ErrorState with retry
  - Add pull-to-refresh with emerald-600 indicator
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12, 6.13_

- [x] 14. Redesign Citizen Policy Detail screen
  - Update AppBar with back button and policy code title
  - Implement policy header with code, title, and status badge
  - Add description, regions, timeline, and engagement sections using SectionHeader
  - Implement feedback form with StarRating and multi-line TextField
  - Add character counter (0 / 500 characters)
  - Add submit button with loading state
  - Implement SnackBar feedback for success, already voted, and voting closed
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12, 7.13, 7.14, 7.15, 7.16_

- [x] 15. Redesign Citizen Feedback History screen
  - Update AppBar with "Feedback History" title
  - Render history items in white cards with policy title, code, rating, comment
  - Display sentiment badge (emerald/positive, rose/negative, slate/neutral, amber/processing)
  - Add metadata display (channel, date)
  - Implement EmptyState for no feedback
  - Add pull-to-refresh
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11_

- [x] 16. Redesign Citizen Profile screen
  - Update AppBar with "Profile" title
  - Implement Account Information section with email and region fields
  - Add "Update Profile" button
  - Implement Change Password section with current and new password fields
  - Add "Change Password" button
  - Implement Danger Zone section with "Delete Account" button
  - Add SnackBar feedback for updates and confirmation dialog for delete
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11, 9.12, 9.13, 9.14_

- [x] 17. Redesign Citizen Notifications screen
  - Update AppBar with "Notifications" title and "Mark All as Read" action
  - Implement filter toggle (All / Unread Only) with chip buttons
  - Render notifications in white cards with icon, title, message, timestamp
  - Style unread notifications with slate-50 background and blue-500 left border
  - Add blue dot indicator for unread notifications
  - Implement EmptyState for no notifications
  - Add pull-to-refresh
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11, 10.12_

- [x] 18. Checkpoint - Verify citizen screens
  - Test all five citizen screens visually
  - Verify PolicyCard, StatusBadge, StarRating, and other widgets render correctly
  - Test pull-to-refresh, empty states, and error states
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 5: Planner Screens

- [ ] 19. Redesign Planner Dashboard screen
  - Update AppBar with "Policy Dashboard" title and hamburger menu
  - Implement status filter tabs (All, Draft, Active, Closed) as chips
  - Render policies using PolicyCard with action buttons (Analytics, Edit, Delete)
  - Add FloatingActionButton with emerald-600 background and plus icon
  - Implement EmptyState with "Create a new policy" subtitle
  - Add pull-to-refresh
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9_

- [ ] 20. Redesign Planner Policy Form screen
  - Update AppBar with "Create Policy" or "Edit Policy" title
  - Implement form fields: title, code, status, description, regions, dates
  - Add multi-select region chips with emerald-100 selected state
  - Add date picker fields with calendar icon
  - Implement Cancel and Create/Update buttons
  - Add field-level validation error display
  - Add SnackBar feedback on success
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10, 12.11, 12.12_

- [ ] 21. Redesign Planner Analytics screen
  - Update AppBar with back button and policy code title
  - Implement overview section with 2x2 MetricCard grid (rating, votes, sentiment, keyword)
  - Add Rating Distribution section with horizontal bar chart
  - Add Sentiment Breakdown section with three colored cards
  - Add Top Keywords section with keyword chips
  - Add Trends section with line chart and interval selector (Day, Week, Month)
  - Add Geographic Breakdown section with region cards
  - Add Recent Comments section with paginated comment cards
  - Add Export button as outlined button
  - Add pull-to-refresh
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10, 13.11, 13.12, 13.13, 13.14_

- [ ] 22. Checkpoint - Verify planner screens
  - Test all three planner screens visually
  - Verify filter tabs, action buttons, and FAB functionality
  - Test form validation and analytics data display
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 6: Admin Screens

- [ ] 23. Redesign Admin Planner Management screen
  - Update AppBar with "Planner Management" title
  - Add subtitle "Create planners and activate/deactivate accounts."
  - Implement creation form in slate-50 card with email and password fields
  - Add "Create planner" button with slate-900 background
  - Render planners in white cards with email, metadata, and toggle button
  - Style toggle button: rose-100/700 for Deactivate, emerald-100/700 for Activate
  - Add SnackBar feedback for creation success and email exists error
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.10, 14.11_

- [ ] 24. Redesign Admin Citizen Management screen
  - Update AppBar with "Citizen Management" title
  - Implement filter toggle (All / Active Only) with chip buttons
  - Render citizens in white cards with email, region, verified status, date
  - Add toggle button for activate/deactivate
  - Implement pagination controls with page numbers and prev/next buttons
  - Style active page with emerald-600, inactive with slate-300
  - Add pull-to-refresh
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10_

- [ ] 25. Redesign Admin Feedback Moderation screen
  - Update AppBar with "Feedback Moderation" title
  - Add "Retry All" button as outlined button in top-right
  - Render pending feedback in white cards with policy title, user email, date, comment
  - Add "Retry" button for each item
  - Implement expandable manual review form with sentiment dropdown and keywords input
  - Add SnackBar feedback for retry success
  - Implement EmptyState for no pending feedback
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.9, 16.10, 16.11, 16.12_

- [ ] 26. Checkpoint - Verify admin screens
  - Test all three admin screens visually
  - Verify creation forms, toggle buttons, and pagination
  - Test filter toggles and manual review forms
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 7: Polish & Accessibility

- [x] 27. Implement responsive layouts
  - Update MetricCard grids to use Responsive.getGridColumns (2 on mobile, 4 on tablet)
  - Update form layouts to stack vertically on mobile, side-by-side on tablet
  - Apply responsive screen padding using Responsive.getScreenPadding
  - Verify all layouts adapt correctly at 600dp breakpoint
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.8_

- [x] 28. Add animations and transitions
  - Implement fade-in animation for screen transitions (300ms)
  - Add scale animation for button press feedback (100ms)
  - Add slide animation for SnackBar appearance (200ms)
  - Add fade animation for loading state transitions (200ms)
  - Add scale animation for StatusBadge tap (150ms)
  - Add rotation animation for FAB tap (200ms)
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.9_

- [x] 29. Enhance accessibility compliance
  - Add semantic labels to all interactive widgets using Semantics
  - Add tooltips or semantic labels to all icon-only buttons
  - Verify minimum contrast ratios (4.5:1 for normal text, 3:1 for large text)
  - Test dynamic text scaling up to 200%
  - Add focus indicators with emerald-500 color
  - Verify all form fields have associated labels
  - Verify minimum 8dp spacing between interactive elements
  - Test with screen reader to ensure error messages are announced
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9, 18.10_

- [x] 30. Implement SnackBar feedback system
  - Standardize SnackBar styling (green for success, red for error)
  - Configure auto-dismiss after 4 seconds
  - Apply rounded-lg corners and 16dp margin
  - Ensure SnackBars appear at bottom of screen
  - Test SnackBar display across all screens
  - _Requirements: 19.7, 19.8, 19.9, 19.10_

- [x] 31. Final checkpoint - Complete visual verification
  - Test all screens across different screen sizes (phone and tablet)
  - Verify design system consistency (colors, typography, spacing)
  - Test all loading states, error states, and empty states
  - Verify all animations are smooth and within 400ms limit
  - Test accessibility with screen reader and keyboard navigation
  - Verify WCAG AA compliance for contrast ratios
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at the end of each phase
- This is a visual-only redesign - no backend or data layer changes
- All existing functionality (BLoC, routing, API integration) remains unchanged
- Focus on incremental, testable updates one screen or component at a time
- Use visual verification for each task (run app and navigate to updated screens)
