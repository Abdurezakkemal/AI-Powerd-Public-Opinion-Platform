# Requirements Document

## Introduction

The Mobile UI Redesign feature updates the presentation layer of the existing civic engagement Flutter app to match the polished design patterns from the website. The backend integration and data layer are complete and functional. This redesign focuses exclusively on visual updates: screens, widgets, styling, and component libraries for Authentication, Citizen, Planner, and Admin roles. The goal is to create a consistent, accessible, and visually appealing mobile experience that mirrors the website's design system while maintaining all existing functionality.

## Glossary

- **App**: The Flutter mobile application being redesigned
- **Website**: The React-based web application whose design patterns are being replicated
- **Design_System**: The collection of colors, typography, spacing, and component patterns defined by the website
- **Widget_Library**: A collection of reusable Flutter widgets that implement the design system
- **Citizen_Screen**: Any screen accessible to users with the citizen role
- **Planner_Screen**: Any screen accessible to users with the planner role
- **Admin_Screen**: Any screen accessible to users with the admin role
- **Theme**: The Flutter ThemeData configuration that defines app-wide styling
- **Status_Badge**: A colored chip component displaying policy or user status
- **Metric_Card**: A card component displaying a single KPI with label, value, and optional change indicator
- **Policy_Card**: A card component displaying policy summary information
- **WCAG_AA**: Web Content Accessibility Guidelines Level AA compliance standard

---

## Requirements

### Requirement 1: Design System Foundation

**User Story:** As a developer, I want a centralized design system configuration, so that all screens use consistent colors, typography, and spacing.

#### Acceptance Criteria

1. THE App SHALL define a theme configuration file containing all color values from the website design system
2. THE Theme SHALL define primary color as emerald-600 (#10b981) for CTAs and active states
3. THE Theme SHALL define secondary colors: slate-900 (#0f172a) for primary text, slate-600 (#475569) for secondary text, slate-200 (#e2e8f0) for borders
4. THE Theme SHALL define status colors: emerald-100/700 for active/success, rose-100/700 for inactive/error, slate-100/700 for draft/neutral, amber-100/700 for warnings
5. THE Theme SHALL define typography scale: headline (24sp bold), title (18sp bold), body (14-16sp regular), caption (12-13sp medium)
6. THE Theme SHALL define spacing constants: base unit 4dp, card padding 16dp, section spacing 24dp, list item spacing 8-12dp
7. THE Theme SHALL define border radius values: small (8dp), medium (12dp), large (16dp), full (9999dp for pills)
8. THE Theme SHALL be applied globally through MaterialApp theme property

### Requirement 2: Shared Widget Library

**User Story:** As a developer, I want reusable UI components, so that screens are built consistently and efficiently.

#### Acceptance Criteria

1. THE Widget_Library SHALL provide a StatusBadge widget accepting status string and returning appropriately styled chip
2. THE StatusBadge SHALL render draft status with slate-100 background and slate-700 text
3. THE StatusBadge SHALL render active status with emerald-100 background and emerald-700 text
4. THE StatusBadge SHALL render closed status with rose-100 background and rose-700 text
5. THE Widget_Library SHALL provide a MetricCard widget displaying label, value, and optional change indicator
6. THE MetricCard SHALL use slate-50 background, rounded-xl corners, and slate-200 border
7. THE Widget_Library SHALL provide a PolicyCard widget displaying policy code, title, status, description, regions, dates, rating, and votes
8. THE PolicyCard SHALL use white background, rounded-xl corners, slate-200 border, and 16dp padding
9. THE Widget_Library SHALL provide a RegionChip widget with slate-100 background and slate-700 text
10. THE Widget_Library SHALL provide a StarRating widget for displaying and selecting 1-5 star ratings with amber color
11. THE Widget_Library SHALL provide an EmptyState widget accepting icon, message, and optional action button
12. THE Widget_Library SHALL provide an ErrorState widget accepting error message and retry callback
13. THE Widget_Library SHALL provide a LoadingIndicator widget with centered CircularProgressIndicator and optional message
14. THE Widget_Library SHALL provide a SectionHeader widget with consistent title styling
15. THE Widget_Library SHALL provide a PrimaryButton widget with emerald-600 background, white text, and rounded-lg corners

### Requirement 3: Login Screen Redesign

**User Story:** As a user, I want a visually appealing login screen, so that I can access the app with a professional first impression.

#### Acceptance Criteria

1. THE Login_Screen SHALL display app logo or icon centered at top with 64sp size
2. THE Screen SHALL display app name "Civic Platform" in text-2xl, font-bold, slate-900 below logo
3. THE Screen SHALL display tagline "Engage with your community" in text-sm, slate-600
4. THE Screen SHALL display "Email" label and outlined TextField with rounded-lg corners
5. THE Email_Field SHALL use slate-300 border with emerald-500 focus border
6. THE Email_Field SHALL display email icon as prefix with slate-400 color
7. THE Screen SHALL display "Password" label and outlined TextField with password obscuring
8. THE Password_Field SHALL display lock icon as prefix and visibility toggle icon as suffix
9. THE Screen SHALL display "Forgot Password?" link in text-sm, emerald-700, right-aligned
10. THE Screen SHALL display full-width PrimaryButton with text "Sign In"
11. THE Screen SHALL display horizontal divider with "OR" text in center
12. THE Screen SHALL display "Don't have an account?" text with "Sign Up" link in emerald-700
13. WHEN login is in progress, THE Sign_In_Button SHALL display loading indicator and be disabled
14. WHEN login fails, THE Screen SHALL display error message in red text below password field
15. THE Screen SHALL use white background with subtle gradient from slate-50 to white

### Requirement 4: Register Screen Redesign

**User Story:** As a new user, I want a clear registration screen, so that I can create an account easily.

#### Acceptance Criteria

1. THE Register_Screen SHALL display AppBar with back button and title "Create Account"
2. THE Screen SHALL display welcome message "Join the Civic Platform" in text-xl, font-bold, slate-900
3. THE Screen SHALL display subtitle "Participate in policy decisions" in text-sm, slate-600
4. THE Screen SHALL display "Email" label and outlined TextField with email icon prefix
5. THE Screen SHALL display "Password" label and outlined TextField with lock icon prefix and visibility toggle
6. THE Screen SHALL display password strength indicator below password field (weak/medium/strong)
7. THE Password_Strength_Indicator SHALL use colored bar: red for weak, amber for medium, emerald for strong
8. THE Screen SHALL display "Phone Number" label and outlined TextField with phone icon prefix
9. THE Screen SHALL display "Region" label and dropdown selector with location icon prefix
10. THE Region_Dropdown SHALL display available regions in a bottom sheet with search functionality
11. THE Screen SHALL display full-width PrimaryButton with text "Create Account"
12. THE Screen SHALL display terms text "By signing up, you agree to our Terms & Privacy Policy" in text-xs, slate-500
13. THE Screen SHALL display "Already have an account?" text with "Sign In" link in emerald-700
14. WHEN registration is in progress, THE Create_Account_Button SHALL display loading indicator and be disabled
15. WHEN registration fails, THE Screen SHALL display error messages below relevant fields in red text

### Requirement 5: OTP Verification Screen Redesign

**User Story:** As a new user, I want a clear OTP verification screen, so that I can verify my account easily.

#### Acceptance Criteria

1. THE OTP_Screen SHALL display AppBar with back button and title "Verify Email"
2. THE Screen SHALL display verification icon (email with checkmark) centered at top with 80sp size
3. THE Screen SHALL display message "We sent a code to" in text-base, slate-600
4. THE Screen SHALL display user's email address in text-base, font-semibold, slate-900
5. THE Screen SHALL display six individual TextField boxes for 6-digit OTP code
6. THE OTP_Fields SHALL use outlined style with rounded-lg corners and center-aligned text
7. THE OTP_Fields SHALL auto-focus next field when digit is entered
8. THE OTP_Fields SHALL use emerald-500 border when filled, slate-300 when empty
9. THE Screen SHALL display countdown timer "Code expires in 4:32" in text-sm, slate-500
10. THE Screen SHALL display full-width PrimaryButton with text "Verify Email"
11. THE Screen SHALL display "Didn't receive code?" text with "Resend" link in emerald-700
12. WHEN verification is in progress, THE Verify_Button SHALL display loading indicator and be disabled
13. WHEN OTP is invalid, THE Screen SHALL shake animation and display error message in red text
14. WHEN resend is clicked, THE Screen SHALL display green SnackBar "OTP sent successfully. It expires in 5 minutes."
15. WHEN timer expires, THE OTP_Fields SHALL be disabled and "Resend" link SHALL be highlighted

### Requirement 6: Citizen Policy List Screen Redesign

**User Story:** As a citizen, I want an attractive policy list screen, so that I can easily browse and select policies.

#### Acceptance Criteria

1. THE Citizen_Policy_List_Screen SHALL display an AppBar with title "Active Policies" and action icons for notifications, history, and profile
2. THE Citizen_Policy_List_Screen SHALL render each policy using the PolicyCard widget from the Widget_Library
3. THE PolicyCard SHALL display policy code in text-xs, uppercase, emerald-700 at the top
4. THE PolicyCard SHALL display policy title in text-lg, font-bold, slate-900
5. THE PolicyCard SHALL display status badge using the StatusBadge widget
6. THE PolicyCard SHALL display description in text-sm, slate-600, with maximum 3 lines and ellipsis overflow
7. THE PolicyCard SHALL display target regions as a horizontal wrap of RegionChip widgets
8. THE PolicyCard SHALL display date range with calendar icon and text-xs, slate-500
9. THE PolicyCard SHALL display rating using StarRating widget and vote count with text-sm, slate-600
10. THE PolicyCard SHALL display "View details →" button as outlined button with emerald-700 text and emerald-200 border
11. WHEN the policy list is empty, THE Screen SHALL display EmptyState widget with policy icon and message "No active policies in your region"
12. WHEN the policy list fails to load, THE Screen SHALL display ErrorState widget with retry button
13. THE Screen SHALL support pull-to-refresh with emerald-600 color indicator

### Requirement 7: Citizen Policy Detail Screen Redesign

**User Story:** As a citizen, I want a clear policy detail view, so that I can understand the policy and submit feedback easily.

#### Acceptance Criteria

1. THE Citizen_Policy_Detail_Screen SHALL display AppBar with back button and policy code as title
2. THE Screen SHALL display policy code in text-xs, uppercase, emerald-700
3. THE Screen SHALL display policy title in text-xl, font-bold, slate-900
4. THE Screen SHALL display status badge using StatusBadge widget
5. THE Screen SHALL display description section with SectionHeader "Description" and body text in text-base, slate-700
6. THE Screen SHALL display target regions section with SectionHeader "Target Regions" and RegionChip widgets
7. THE Screen SHALL display timeline section with SectionHeader "Timeline" and start/end dates in slate-50 background cards
8. THE Screen SHALL display engagement section with SectionHeader "Engagement" showing average rating and total votes
9. THE Screen SHALL display feedback form section with SectionHeader "Submit Your Feedback"
10. THE Feedback_Form SHALL display "Rating *" label and interactive StarRating widget with 32sp icons
11. THE Feedback_Form SHALL display "Comment (optional)" label and multi-line TextField with rounded-lg border
12. THE TextField SHALL display character counter "0 / 500 characters" in text-xs, slate-500, right-aligned
13. THE Feedback_Form SHALL display full-width PrimaryButton with text "Submit Feedback"
14. WHEN feedback submission succeeds, THE Screen SHALL display green SnackBar with message "Feedback recorded successfully. Thank you for your input."
15. WHEN user has already voted, THE Screen SHALL display orange SnackBar with message "You have already submitted feedback for this policy."
16. WHEN voting is closed, THE Screen SHALL display red SnackBar with message "Voting is not allowed for this policy at this time."

### Requirement 8: Citizen Feedback History Screen Redesign

**User Story:** As a citizen, I want an organized feedback history view, so that I can review my past submissions.

#### Acceptance Criteria

1. THE Citizen_Feedback_History_Screen SHALL display AppBar with title "Feedback History"
2. THE Screen SHALL render each history item in a white card with rounded-xl corners and slate-200 border
3. THE History_Card SHALL display policy title in font-semibold, 16sp, slate-900
4. THE History_Card SHALL display policy code in text-xs, uppercase, slate-500
5. THE History_Card SHALL display rating using StarRating widget and numeric value
6. THE History_Card SHALL display comment text in italic, 14sp, slate-600, with quotation styling
7. THE History_Card SHALL display sentiment badge using StatusBadge widget with emerald for positive, rose for negative, slate for neutral
8. WHEN sentiment is null, THE History_Card SHALL display amber-100/700 badge with text "Processing..."
9. THE History_Card SHALL display metadata (channel, date) in text-xs, slate-500, separated by bullet points
10. WHEN history list is empty, THE Screen SHALL display EmptyState widget with history icon and message "You have not submitted any feedback yet."
11. THE Screen SHALL support pull-to-refresh with emerald-600 color indicator

### Requirement 9: Citizen Profile Screen Redesign

**User Story:** As a citizen, I want a clean profile management interface, so that I can update my information easily.

#### Acceptance Criteria

1. THE Citizen_Profile_Screen SHALL display AppBar with title "Profile"
2. THE Screen SHALL display "Account Information" section header using SectionHeader widget
3. THE Account_Section SHALL display email and region input fields with outlined style and rounded-lg corners
4. THE Input_Fields SHALL use slate-300 border with emerald-500 focus border
5. THE Account_Section SHALL display PrimaryButton with text "Update Profile"
6. THE Screen SHALL display horizontal divider (slate-200, my-6) between sections
7. THE Screen SHALL display "Change Password" section header using SectionHeader widget
8. THE Password_Section SHALL display "Current Password" and "New Password" fields with password obscuring
9. THE Password_Section SHALL display PrimaryButton with text "Change Password"
10. THE Screen SHALL display "Danger Zone" section header using SectionHeader widget
11. THE Danger_Section SHALL display outlined button with red-600 border and text "Delete Account"
12. WHEN update succeeds, THE Screen SHALL display green SnackBar with message "Profile updated successfully."
13. WHEN password change succeeds, THE Screen SHALL display green SnackBar with message "Password changed successfully."
14. WHEN delete is confirmed, THE Screen SHALL display confirmation dialog with warning icon and two-step confirmation

### Requirement 10: Citizen Notifications Screen Redesign

**User Story:** As a citizen, I want a clear notifications view, so that I can stay informed about policy updates.

#### Acceptance Criteria

1. THE Citizen_Notifications_Screen SHALL display AppBar with title "Notifications" and "Mark All as Read" action
2. THE Screen SHALL display filter toggle with "All" and "Unread Only" options as chips
3. THE Filter_Chips SHALL use emerald-600 background when selected and slate-100 when unselected
4. THE Screen SHALL render each notification in a white card with rounded-xl corners
5. THE Notification_Card SHALL display icon (24sp) colored by type: info (blue), success (green), calendar (amber)
6. THE Notification_Card SHALL display title in font-semibold, 16sp, slate-900
7. THE Notification_Card SHALL display message text in 14sp, slate-600
8. THE Notification_Card SHALL display timestamp in text-xs, slate-500
9. WHEN notification is unread, THE Card SHALL use slate-50 background and blue-500 left border (4dp width)
10. WHEN notification is unread, THE Card SHALL display blue-500 dot (8sp circle) in top-right corner
11. WHEN notifications list is empty, THE Screen SHALL display EmptyState widget with notifications icon and message "No notifications yet."
12. THE Screen SHALL support pull-to-refresh with emerald-600 color indicator

### Requirement 11: Planner Dashboard Screen Redesign

**User Story:** As a planner, I want an organized dashboard, so that I can manage policies efficiently.

#### Acceptance Criteria

1. THE Planner_Dashboard_Screen SHALL display AppBar with title "Policy Dashboard" and hamburger menu icon
2. THE Screen SHALL display status filter tabs (All, Draft, Active, Closed) below AppBar as chips
3. THE Filter_Tabs SHALL use emerald-600 background when selected and slate-100 when unselected
4. THE Screen SHALL render each policy using PolicyCard widget with additional action buttons
5. THE PolicyCard SHALL display three icon buttons at bottom: Analytics (chart icon), Edit (pencil icon), Delete (trash icon)
6. THE Action_Buttons SHALL use 24sp icons with slate-600 color
7. THE Screen SHALL display FloatingActionButton in bottom-right with emerald-600 background and plus icon
8. WHEN policy list is empty, THE Screen SHALL display EmptyState widget with policy icon, message "No policies found", and subtitle "Create a new policy to get started"
9. THE Screen SHALL support pull-to-refresh with emerald-600 color indicator

### Requirement 12: Planner Policy Form Screen Redesign

**User Story:** As a planner, I want a clear policy creation form, so that I can create policies efficiently.

#### Acceptance Criteria

1. THE Planner_Policy_Form_Screen SHALL display AppBar with title "Create Policy" or "Edit Policy"
2. THE Form SHALL display "Poll Title *" label and outlined TextField with rounded-lg corners
3. THE Form SHALL display "Policy Code (optional)" label and TextField with placeholder "AUTO GENERATED"
4. THE Form SHALL display "Status" label and dropdown selector with rounded-lg border
5. THE Form SHALL display "Description *" label and multi-line TextField with minimum 4 lines
6. THE Form SHALL display "Target Regions *" label and multi-select chip interface
7. THE Region_Selector SHALL display available regions as tappable chips with emerald-100 background when selected
8. THE Form SHALL display "Start Date *" and "End Date *" labels with date picker fields
9. THE Date_Fields SHALL display calendar icon and formatted date text
10. THE Form SHALL display two buttons at bottom: "Cancel" (outlined, slate) and "Create Policy" or "Update Policy" (filled, emerald)
11. THE Form SHALL display validation errors in red text below relevant fields
12. WHEN form submission succeeds, THE Screen SHALL navigate to policy detail with green SnackBar "Policy created successfully."

### Requirement 13: Planner Analytics Screen Redesign

**User Story:** As a planner, I want visually appealing analytics, so that I can understand policy performance.

#### Acceptance Criteria

1. THE Planner_Analytics_Screen SHALL display AppBar with back button and policy code as title
2. THE Screen SHALL display overview section with four MetricCard widgets in a 2x2 grid
3. THE MetricCard SHALL display average rating, total votes, positive sentiment percentage, and top keyword
4. THE Screen SHALL display "Rating Distribution" section with SectionHeader and horizontal bar chart
5. THE Bar_Chart SHALL use emerald-600 for bars with slate-50 background
6. THE Screen SHALL display "Sentiment Breakdown" section with three colored cards (emerald for positive, rose for negative, slate for neutral)
7. THE Screen SHALL display "Top Keywords" section with keyword chips (slate-100 background, slate-700 text)
8. THE Screen SHALL display "Trends" section with line chart and interval selector (Day, Week, Month)
9. THE Interval_Selector SHALL use chip buttons with emerald-600 when selected
10. THE Screen SHALL display "Geographic Breakdown" section with region cards showing votes and average rating
11. THE Screen SHALL display "Recent Comments" section with paginated comment cards
12. THE Comment_Card SHALL display comment text, sentiment badge, keywords, and timestamp
13. THE Screen SHALL display "Export" button as outlined button with emerald-700 text
14. THE Screen SHALL support pull-to-refresh with emerald-600 color indicator

### Requirement 14: Admin Planner Management Screen Redesign

**User Story:** As an admin, I want a clear planner management interface, so that I can manage planner accounts efficiently.

#### Acceptance Criteria

1. THE Admin_Planner_Management_Screen SHALL display AppBar with title "Planner Management"
2. THE Screen SHALL display subtitle "Create planners and activate/deactivate accounts." in text-sm, slate-600
3. THE Screen SHALL display creation form in slate-50 background card with rounded-xl corners
4. THE Creation_Form SHALL display email and password input fields side-by-side on tablet/desktop
5. THE Creation_Form SHALL display "Create planner" button with slate-900 background and white text
6. THE Screen SHALL render each planner in a white card with rounded-xl corners and slate-200 border
7. THE Planner_Card SHALL display email in font-semibold, text-base, slate-900
8. THE Planner_Card SHALL display metadata (created date, verified status) in text-xs, slate-500
9. THE Planner_Card SHALL display toggle button: "Deactivate" (rose-100/700) when active, "Activate" (emerald-100/700) when inactive
10. WHEN planner creation succeeds, THE Screen SHALL display green SnackBar "Planner account created successfully."
11. WHEN email already exists, THE Screen SHALL display red SnackBar "A user with this email already exists."

### Requirement 15: Admin Citizen Management Screen Redesign

**User Story:** As an admin, I want a clear citizen management interface, so that I can manage citizen accounts efficiently.

#### Acceptance Criteria

1. THE Admin_Citizen_Management_Screen SHALL display AppBar with title "Citizen Management"
2. THE Screen SHALL display filter toggle with "All" and "Active Only" options as chips
3. THE Filter_Chips SHALL use emerald-600 background when selected and slate-100 when unselected
4. THE Screen SHALL render each citizen in a white card with rounded-xl corners and slate-200 border
5. THE Citizen_Card SHALL display email in font-semibold, text-base, slate-900
6. THE Citizen_Card SHALL display region, verified status, and registration date in text-xs, slate-500
7. THE Citizen_Card SHALL display toggle button: "Deactivate" (rose-100/700) when active, "Activate" (emerald-100/700) when inactive
8. THE Screen SHALL support pagination with page number display and previous/next buttons
9. THE Pagination_Controls SHALL use emerald-600 for active page and slate-300 for inactive
10. THE Screen SHALL support pull-to-refresh with emerald-600 color indicator

### Requirement 16: Admin Feedback Moderation Screen Redesign

**User Story:** As an admin, I want a clear moderation interface, so that I can review and process pending feedback efficiently.

#### Acceptance Criteria

1. THE Admin_Feedback_Moderation_Screen SHALL display AppBar with title "Feedback Moderation"
2. THE Screen SHALL display "Retry All" button as outlined button with emerald-700 text in top-right
3. THE Screen SHALL render each pending feedback item in a white card with rounded-xl corners
4. THE Feedback_Card SHALL display policy title in font-semibold, text-sm, slate-800
5. THE Feedback_Card SHALL display user email and submission date in text-xs, slate-500
6. THE Feedback_Card SHALL display comment text in text-sm, slate-600
7. THE Feedback_Card SHALL display "Retry" button as small outlined button with emerald-700 text
8. THE Feedback_Card SHALL display expandable manual review form with sentiment dropdown, keywords input, and "Update" button
9. THE Manual_Review_Form SHALL use outlined input fields with rounded-lg corners
10. WHEN retry succeeds, THE Screen SHALL display green SnackBar "Feedback queued for retry."
11. WHEN retry-all succeeds, THE Screen SHALL display green SnackBar "N feedback items queued for retry."
12. WHEN pending list is empty, THE Screen SHALL display EmptyState widget with checkmark icon and message "No pending feedback items."

### Requirement 17: Responsive Layout Adaptation

**User Story:** As a user, I want the app to adapt to different screen sizes, so that it works well on phones and tablets.

#### Acceptance Criteria

1. THE App SHALL use responsive grid layouts that adapt from single column on phones to multi-column on tablets
2. WHEN screen width is less than 600dp, THE MetricCard grid SHALL display 2 columns
3. WHEN screen width is 600dp or greater, THE MetricCard grid SHALL display 4 columns
4. WHEN screen width is less than 600dp, THE Form inputs SHALL stack vertically
5. WHEN screen width is 600dp or greater, THE Form inputs SHALL display side-by-side where appropriate
6. THE App SHALL use MediaQuery to determine screen size and apply appropriate layout
7. THE App SHALL maintain minimum touch target size of 48dp for all interactive elements
8. THE App SHALL use flexible spacing that scales with screen size

### Requirement 18: Accessibility Compliance

**User Story:** As a user with accessibility needs, I want the app to be accessible, so that I can use all features effectively.

#### Acceptance Criteria

1. THE App SHALL provide semantic labels for all interactive widgets using Semantics widget
2. THE App SHALL maintain minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text (WCAG_AA)
3. THE App SHALL provide text alternatives for all icon-only buttons using Tooltip or Semantics
4. THE App SHALL support dynamic text scaling up to 200% without loss of functionality
5. THE App SHALL use focus indicators with emerald-500 color for keyboard navigation
6. THE App SHALL provide clear error messages that are announced by screen readers
7. THE App SHALL use appropriate heading hierarchy with distinct text sizes
8. THE App SHALL ensure all form fields have associated labels
9. THE App SHALL provide sufficient spacing between interactive elements (minimum 8dp)
10. THE StatusBadge SHALL use both color and text to convey status (not color alone)

### Requirement 19: Loading and Error States

**User Story:** As a user, I want clear feedback during loading and errors, so that I understand what is happening.

#### Acceptance Criteria

1. WHEN any screen is loading data, THE Screen SHALL display LoadingIndicator widget with centered CircularProgressIndicator
2. THE LoadingIndicator SHALL use emerald-600 color for the progress indicator
3. WHEN a network request fails, THE Screen SHALL display ErrorState widget with error icon and message
4. THE ErrorState SHALL display retry button as PrimaryButton with text "Try Again"
5. WHEN a form submission is in progress, THE Submit button SHALL display loading indicator and be disabled
6. THE Loading_Button SHALL display CircularProgressIndicator (16sp) and text "Submitting..."
7. WHEN an action succeeds, THE App SHALL display SnackBar with green background and white text
8. WHEN an action fails, THE App SHALL display SnackBar with red background and white text
9. THE SnackBar SHALL auto-dismiss after 4 seconds
10. THE SnackBar SHALL display at bottom of screen with rounded-lg corners and 16dp margin

### Requirement 20: Animation and Transitions

**User Story:** As a user, I want smooth animations, so that the app feels polished and responsive.

#### Acceptance Criteria

1. THE App SHALL use fade-in animation for screen transitions with 300ms duration
2. THE App SHALL use scale animation for button press feedback with 100ms duration
3. THE App SHALL use slide animation for SnackBar appearance from bottom with 200ms duration
4. THE App SHALL use fade animation for loading state transitions with 200ms duration
5. THE StatusBadge SHALL use subtle scale animation on tap with 150ms duration
6. THE FloatingActionButton SHALL use rotation animation on tap with 200ms duration
7. THE App SHALL use implicit animations (AnimatedContainer, AnimatedOpacity) for state changes
8. THE App SHALL limit animation duration to maximum 400ms for accessibility
9. THE App SHALL use easing curves: easeOut for entrances, easeIn for exits, easeInOut for state changes

### Requirement 21: Dark Mode Support (Optional)

**User Story:** As a user, I want dark mode support, so that I can use the app comfortably in low-light conditions.

#### Acceptance Criteria

1. WHERE dark mode is enabled, THE Theme SHALL provide dark color variants: slate-900 background, slate-100 text, slate-700 cards
2. WHERE dark mode is enabled, THE Primary colors SHALL remain emerald-600 for consistency
3. WHERE dark mode is enabled, THE Status colors SHALL use darker variants: emerald-900/300, rose-900/300, slate-800/400
4. WHERE dark mode is enabled, THE Borders SHALL use slate-700 instead of slate-200
5. WHERE dark mode is enabled, THE App SHALL maintain WCAG_AA contrast ratios
6. THE App SHALL detect system dark mode preference using MediaQuery.platformBrightness
7. THE App SHALL apply dark theme automatically when system preference is dark

