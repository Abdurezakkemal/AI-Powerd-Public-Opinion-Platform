# 📱 Mobile App Presentation Guide

**Presentation Date**: May 18, 2026  
**App**: Civic Engagement Mobile App (Citizen Features)  
**Backend IP**: 10.180.151.55:5002

---

## 🎯 Presentation Overview

This guide will walk you through demonstrating all mobile app features in a logical flow that showcases the complete citizen experience.

**Duration**: 15-20 minutes  
**Demo User**: citizen1@test.com / password123

---

## 📋 Pre-Presentation Checklist

### 1. Backend Setup ✅
```bash
cd backend
# Ensure backend is running
node server.js
```

### 2. Seed Bulk Data ✅
```bash
cd backend
# Run comprehensive seed script
node scripts/seed-presentation-demo.js
```

### 3. Mobile App Setup ✅
```bash
cd mobile/civic_engagement_app
# Ensure app is running
flutter run
```

### 4. Test Login ✅
- Email: `citizen1@test.com`
- Password: `password123`
- Verify you can login successfully

---

## 🎬 Presentation Flow (Step-by-Step)

### PART 1: Authentication & Onboarding (2 minutes)

#### Step 1: Launch App
1. Open the app (should show splash screen)
2. **Say**: "This is our civic engagement mobile application that allows citizens to participate in policy-making"

#### Step 2: Login Screen
1. Show the login screen
2. **Say**: "Citizens can login with email and password"
3. Enter credentials:
   - Email: `citizen1@test.com`
   - Password: `password123`
4. Tap "Login"
5. **Say**: "The app uses JWT authentication with secure token storage"

#### Step 3: Home Screen Overview
1. App navigates to home screen
2. **Say**: "After login, citizens see the main dashboard with active policies"
3. Point out the navigation:
   - Home tab
   - History tab
   - Notifications tab
   - Profile tab

---

### PART 2: Policy Browsing & Voting (4 minutes)

#### Step 4: Browse Active Policies
1. On Home screen, scroll through policies
2. **Say**: "Citizens can browse all active policies that are open for voting"
3. Point out policy cards showing:
   - Policy title
   - Policy code
   - Poll type (Binary, Rating, Ranking, Multiple Choice)
   - Status (Active)
   - Deadline

#### Step 5: View Policy Details
1. Tap on a **Binary policy** (e.g., "Agricultural Subsidies")
2. **Say**: "Each policy has detailed information"
3. Show:
   - Full description
   - Category
   - Deadline
   - Current vote statistics
   - Comments section

#### Step 6: Vote on Binary Policy
1. Scroll to voting section
2. **Say**: "For binary policies, citizens vote Yes or No"
3. Select "Yes" or "No"
4. Tap "Submit Vote"
5. **Say**: "Votes are recorded immediately and citizens can see updated statistics"
6. Show success message
7. Go back to home

#### Step 7: Vote on Rating Policy
1. Tap on a **Rating policy** (e.g., "Public Transport")
2. **Say**: "Rating policies allow citizens to rate from 1 to 5 stars"
3. Scroll to voting section
4. Select rating (e.g., 4 stars)
5. Tap "Submit Vote"
6. Show success message
7. Go back to home

#### Step 8: Vote on Multiple Choice Policy
1. Tap on a **Multiple Choice policy**
2. **Say**: "Multiple choice policies offer several options"
3. Scroll to voting section
4. Select an option
5. Tap "Submit Vote"
6. Show success message
7. Go back to home

#### Step 9: Vote on Ranking Policy
1. Tap on a **Ranking policy**
2. **Say**: "Ranking policies let citizens order options by preference"
3. Scroll to voting section
4. Drag and drop to reorder options
5. Tap "Submit Vote"
6. Show success message
7. Go back to home

---

### PART 3: Comments & Discussions (4 minutes)

#### Step 10: View Comments
1. Open any policy with comments
2. Scroll to comments section
3. **Say**: "Citizens can engage in discussions through comments"
4. Show existing comments with:
   - User name
   - Comment text
   - Timestamp
   - Sentiment indicator (positive/negative/neutral)

#### Step 11: Post a Comment
1. Tap "Add Comment" button
2. **Say**: "Citizens can share their thoughts and opinions"
3. Type a comment: "I support this policy because it will benefit our community"
4. Tap "Submit"
5. **Say**: "Comments are analyzed by AI for sentiment and keywords"
6. Show the new comment appearing in the list
7. Point out sentiment indicator

#### Step 12: Reply to Comment
1. Find a comment with replies
2. Tap "Reply" button
3. **Say**: "Citizens can reply to create threaded discussions"
4. Type a reply: "I agree with your point"
5. Tap "Submit"
6. Show the reply appearing under the parent comment

#### Step 13: Edit Comment
1. Find your own comment
2. Tap the three-dot menu
3. Select "Edit"
4. **Say**: "Citizens can edit their comments"
5. Modify the text
6. Tap "Save"
7. Show the updated comment

#### Step 14: Report Comment
1. Find another user's comment
2. Tap the three-dot menu
3. Select "Report"
4. **Say**: "Citizens can report inappropriate comments"
5. Select reason (e.g., "Spam")
6. Add description (optional)
7. Tap "Submit Report"
8. Show success message
9. **Say**: "After 5 reports, comments are automatically hidden for review"

---

### PART 4: History & Tracking (2 minutes)

#### Step 15: View Voting History
1. Tap "History" tab in bottom navigation
2. **Say**: "Citizens can track all their past votes and comments"
3. Scroll through history items
4. Point out:
   - Policy title
   - Vote value
   - Comment (if any)
   - Sentiment
   - Timestamp

#### Step 16: View History Details
1. Tap on a history item
2. **Say**: "Citizens can view full details of their past participation"
3. Show:
   - Policy information
   - Their vote
   - Their comment
   - Timestamp

---

### PART 5: Notifications & Alerts (3 minutes)

#### Step 17: View Notifications
1. Tap "Notifications" tab
2. **Say**: "Citizens receive real-time notifications about policy updates and interactions"
3. Scroll through notifications
4. Point out different types:
   - Policy activated
   - Policy closed
   - Policy extended
   - Comment reply
   - Comment hidden
   - Vote surge alerts
   - Rating drop alerts
   - Emerging topics

#### Step 18: Filter Notifications
1. Tap "Unread Only" filter
2. **Say**: "Citizens can filter to see only unread notifications"
3. Show filtered list
4. Tap "All" to show all again

#### Step 19: Mark Notification as Read
1. Tap on any unread notification
2. **Say**: "Tapping a notification marks it as read"
3. Show notification details
4. Go back and show it's now marked as read

#### Step 20: Mark All as Read
1. Tap "Mark All Read" button
2. **Say**: "Citizens can mark all notifications as read at once"
3. Show all notifications now marked as read

#### Step 21: Real-Time Notification (Optional)
1. Keep app open
2. Have someone run: `node backend/scripts/create-test-notifications.js`
3. **Say**: "Notifications arrive in real-time via WebSocket"
4. Show new notification appearing instantly

---

### PART 6: Profile & Settings (2 minutes)

#### Step 22: View Profile
1. Tap "Profile" tab
2. **Say**: "Citizens can manage their profile and preferences"
3. Show profile information:
   - Email
   - Region
   - Age range
   - Gender
   - Occupation
   - Education
   - Preferred language

#### Step 23: Edit Profile
1. Tap "Edit Profile" button
2. **Say**: "Citizens can update their demographic information"
3. Change region or preferred language
4. Tap "Save"
5. Show success message

#### Step 24: Change Password
1. Tap "Change Password"
2. **Say**: "Citizens can update their password for security"
3. Enter:
   - Current password
   - New password
   - Confirm password
4. Tap "Change Password"
5. Show success message

#### Step 25: View Statistics (If Available)
1. Scroll to statistics section
2. **Say**: "Citizens can see their participation statistics"
3. Show:
   - Total votes
   - Total comments
   - Participation rate

---

### PART 7: Advanced Features (2 minutes)

#### Step 26: Appeal Hidden Comment (If Available)
1. Go to Notifications
2. Find "Comment Hidden" notification
3. Tap on it
4. **Say**: "If a comment is hidden due to reports, citizens can appeal"
5. Tap "Appeal" button
6. Enter appeal reason
7. Tap "Submit Appeal"
8. Show success message

#### Step 27: Search/Filter Policies (If Available)
1. Go to Home screen
2. Use search or filter
3. **Say**: "Citizens can search and filter policies by category or status"
4. Show filtered results

#### Step 28: Offline Support (Optional)
1. Turn off WiFi/Data
2. **Say**: "The app caches data for offline viewing"
3. Browse previously loaded policies
4. Show that voting requires connection
5. Turn WiFi/Data back on

---

### PART 8: Wrap-Up (1 minute)

#### Step 29: Summary
**Say**: "To summarize, our mobile app provides citizens with:
1. ✅ Easy authentication and secure access
2. ✅ Multiple voting mechanisms (Binary, Rating, Ranking, Multiple Choice)
3. ✅ Rich discussion features with AI-powered sentiment analysis
4. ✅ Complete voting history tracking
5. ✅ Real-time notifications via WebSocket
6. ✅ Profile management and preferences
7. ✅ Content moderation with reporting and appeals
8. ✅ Responsive and intuitive user interface"

#### Step 30: Q&A
**Say**: "I'm happy to answer any questions about the implementation, architecture, or features."

---

## 🎨 Presentation Tips

### Visual Highlights
- **Smooth animations**: Point out transitions between screens
- **Loading states**: Show loading indicators during API calls
- **Error handling**: Demonstrate error messages (if safe)
- **Responsive design**: Show how UI adapts to content

### Technical Highlights
- **Architecture**: Flutter with BLoC pattern for state management
- **API Integration**: RESTful API with JWT authentication
- **Real-time**: WebSocket for live notifications
- **AI Integration**: Sentiment analysis and keyword extraction
- **Security**: Secure token storage, input validation

### Key Talking Points
1. **User Experience**: Intuitive navigation, clear feedback
2. **Engagement**: Multiple ways to participate (vote, comment, discuss)
3. **Transparency**: Full history and tracking
4. **Moderation**: Community-driven with appeal process
5. **Accessibility**: Clear labels, good contrast, readable fonts

---

## 🐛 Troubleshooting During Presentation

### Issue: Login fails
- **Check**: Backend is running on 10.180.151.55:5002
- **Check**: Credentials are correct (citizen1@test.com / password123)
- **Backup**: Use another test user (citizen2@test.com / password123)

### Issue: No policies showing
- **Check**: Seed script ran successfully
- **Check**: Backend database has data
- **Backup**: Refresh the app or restart

### Issue: Comments not loading
- **Check**: Policy has comments in database
- **Check**: Network connection is stable
- **Backup**: Navigate to another policy

### Issue: Notifications not showing
- **Check**: Notifications exist in database
- **Check**: User ID matches
- **Backup**: Run create-test-notifications.js script

### Issue: App crashes
- **Backup**: Restart the app
- **Backup**: Have screenshots/video ready as fallback

---

## 📊 Data to Highlight

After running seed script, you'll have:
- **20+ active policies** (various poll types)
- **100+ comments** with sentiment analysis
- **50+ notifications** (all types)
- **30+ votes** in history
- **Multiple users** for realistic data

---

## 🎥 Optional: Screen Recording

Consider recording the demo beforehand as backup:
```bash
# Use screen recording software
# Save as: mobile_app_demo.mp4
```

---

## ✅ Final Checklist

Before presentation:
- [ ] Backend running and accessible
- [ ] Seed script executed successfully
- [ ] Mobile app running smoothly
- [ ] Test login works
- [ ] All features accessible
- [ ] Phone/emulator charged
- [ ] Backup plan ready (screenshots/video)
- [ ] Questions prepared for Q&A

---

**Good luck with your presentation! 🎉**
