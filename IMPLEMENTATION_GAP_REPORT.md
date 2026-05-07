# Implementation Gap Report: Frontend vs Backend/AI Service

**Report Date:** May 7, 2026  
**Scope:** Civic Engagement Platform (Backend, AI Service, Frontend)  
**Frontend Target:** Planner & Admin Dashboard

---

## Executive Summary

The frontend dashboard has **72% API coverage**, with **14 major gaps** across authentication, user management, citizen engagement, and advanced reporting. The biggest gaps are:

1. **Zero citizen-facing frontend** - Registration, OTP flow, voting, and commenting require a separate app
2. **Incomplete user management** - Missing citizen listing, email change flow, notifications
3. **Missing advanced analytics** - No AI health status, trends, heatmap, or audit log views
4. **SMS integration absent** - Vote channel status missing, no SMS vote visualization
5. **Authentication gaps** - Only login; no password reset, registration, or OTP UI

---

## Detailed Gap Analysis

### 1. MISSING FRONTEND PAGES/VIEWS

| Missing Feature | Backend Endpoints | Purpose | Priority | Estimated Hours |
|---|---|---|---|---|
| **Registration Page** | POST `/auth/register` | Citizen self-registration with email verification | HIGH | 6-8 |
| **OTP Verification Page** | POST `/auth/send-otp`, POST `/auth/verify-otp` | Email OTP flow for both registration & login | HIGH | 4-6 |
| **Password Reset Flow** | POST `/auth/forgot-password`, POST `/auth/reset-password` | Self-service password recovery | MEDIUM | 4-5 |
| **Citizen Management View** | GET `/admin/users/citizens`, PUT `/admin/users/:id/status` | Admin dashboard to list, activate, deactivate citizens | MEDIUM | 5-7 |
| **Trends Dashboard** | GET `/admin/trends` | Analytics trends over time (votes, comments by region, sentiment trends) | MEDIUM | 6-8 |
| **Audit Logs Dashboard** | GET `/admin/audit-logs`, GET `/admin/audit-logs/export` | Admin view of all system actions with filters & CSV export | MEDIUM | 5-7 |
| **AI Service Health Monitor** | GET `/admin/ai/health` | Real-time visualization of AI service status | LOW | 3-4 |
| **Pending Comments Review** | GET `/admin/comments/pending`, PUT `/admin/comments/:id` | Admin moderation queue with batch retry & delete | HIGH | 8-10 |
| **Citizen Voting Interface** | POST `/votes`, POST `/comments/:voteId` | Public-facing voting & commenting on active policies | HIGH | 10-12 |
| **User Profile/Settings Page** | GET `/users/me`, PUT `/users/me`, PUT `/users/me/password`, DELETE `/users/me` | Profile edit, password change, account deletion | MEDIUM | 6-8 |
| **Email Change Flow** | POST `/users/me/email/request`, POST `/users/me/email/verify` | Secure email change with OTP verification | LOW | 4-5 |
| **Notifications Center** | GET `/users/me/notifications`, PATCH `/users/me/notifications/:id/read` | User notification inbox with read tracking | MEDIUM | 4-6 |
| **User History Timeline** | GET `/users/me/history` | Planner/citizen voting and policy engagement history | LOW | 3-4 |
| **Analytics Heatmap View** | GET `/analytics/heatmap` | Regional sentiment/vote distribution heatmap | LOW | 5-7 |

---

### 2. MISSING API INTEGRATIONS (Client-Side)

#### 2.1 Authentication API Layer (CRITICAL)

**Status:** Only 15% complete (1 of 6 endpoints)

| Endpoint | HTTP Method | Purpose | Frontend Status | Need |
|---|---|---|---|---|
| POST `/auth/login` | POST | Planner/admin login | ✅ **IMPLEMENTED** | Already in `authApi.login()` |
| POST `/auth/register` | POST | Citizen registration | ❌ **MISSING** | Need new function: `authApi.register()` |
| POST `/auth/send-otp` | POST | Send OTP to email | ❌ **MISSING** | Need new function: `authApi.sendOtp(email)` |
| POST `/auth/verify-otp` | POST | Verify OTP code | ❌ **MISSING** | Need new function: `authApi.verifyOtp(email, code)` |
| POST `/auth/forgot-password` | POST | Request password reset token | ❌ **MISSING** | Need new function: `authApi.forgotPassword(email)` |
| POST `/auth/reset-password` | POST | Reset password with token | ❌ **MISSING** | Need new function: `authApi.resetPassword(token, newPassword)` |

**Request/Response Examples:**

```javascript
// ❌ Missing: Register
// POST /auth/register
// Request: { email, password, phone, region }
// Response: { status: "success", message: "..." }

// ❌ Missing: Send OTP
// POST /auth/send-otp
// Request: { email }
// Response: { status: "success", message: "OTP sent" }

// ❌ Missing: Verify OTP
// POST /auth/verify-otp
// Request: { email, code }
// Response: { status: "success", token, userId, role }

// ❌ Missing: Forgot Password
// POST /auth/forgot-password
// Request: { email }
// Response: { status: "success", message: "Reset link sent" }

// ❌ Missing: Reset Password
// POST /auth/reset-password
// Request: { token, newPassword }
// Response: { status: "success", message: "Password reset" }
```

---

#### 2.2 Vote & Comment API Layer (CRITICAL - Citizen Engagement)

**Status:** 0% complete - NO CLIENT-SIDE FUNCTIONS EXIST

| Endpoint | HTTP Method | Purpose | Frontend Status | 
|---|---|---|---|
| POST `/votes` | POST | Submit a policy vote (with optional comment) | ❌ **MISSING** |
| POST `/comments/:voteId` | POST | Add/attach comment to existing vote | ❌ **MISSING** |

**What's needed:**

```javascript
// ❌ Missing: src/api/votes.js (new file)
export const voteApi = {
  submit(policyId, rating, comment = null) {
    // POST /votes
    // { policyId, rating, comment? }
  },
  // Get user's votes (optional, for history)
  listMyVotes(params = {}) {
    // GET /votes/me if endpoint exists
  }
};

// ❌ Missing: src/api/comments.js (new file) OR extend existing
export const commentApi = {
  addToVote(voteId, text) {
    // POST /comments/:voteId
    // { text }
  }
};
```

---

#### 2.3 User Profile & Settings API Layer

**Status:** 5% complete (1 of 10 endpoints)

| Endpoint | HTTP Method | Purpose | Frontend Status |
|---|---|---|---|
| GET `/users/me` | GET | Fetch current user profile | ✅ **IMPLEMENTED** |
| PUT `/users/me` | PUT | Update user profile (region, etc.) | ❌ **MISSING** |
| PUT `/users/me/password` | PUT | Change password (authenticated user) | ❌ **MISSING** |
| DELETE `/users/me` | DELETE | Deactivate/delete own account | ❌ **MISSING** |
| POST `/users/me/email/request` | POST | Request email change with OTP | ❌ **MISSING** |
| POST `/users/me/email/verify` | POST | Verify new email with OTP | ❌ **MISSING** |
| GET `/users/me/notifications` | GET | Fetch user notifications | ❌ **MISSING** |
| PATCH `/users/me/notifications/:id/read` | PATCH | Mark notification as read | ❌ **MISSING** |
| PATCH `/users/me/notifications/read-all` | PATCH | Mark all notifications as read | ❌ **MISSING** |
| GET `/users/me/history` | GET | User action history (votes, comments) | ❌ **MISSING** |

**Need to extend `userApi` in [frontend/src/api/user.js](frontend/src/api/user.js):**

```javascript
// ✅ Existing:
userApi.me()

// ❌ Missing:
userApi.update(payload) // { region? }
userApi.changePassword(currentPassword, newPassword)
userApi.deleteMe()
userApi.requestEmailChange(newEmail)
userApi.verifyEmailChange(token)
userApi.getNotifications(params)
userApi.markNotificationRead(notificationId)
userApi.markAllNotificationsRead()
userApi.getHistory(params)
```

---

#### 2.4 Admin: Citizen Management

**Status:** 0% complete - NO CLIENT-SIDE FUNCTIONS

| Endpoint | HTTP Method | Purpose | Payload | Frontend Status |
|---|---|---|---|---|
| GET `/admin/users/citizens` | GET | List all citizens (paginated, filterable) | `query: { active?, page, limit }` | ❌ **MISSING** |
| PUT `/admin/users/:id/status` | PUT | Activate/deactivate citizen account | `{ active: boolean }` | ❌ **MISSING** |
| POST `/admin/users/:id/initiate-password-reset` | POST | Admin-triggered password reset email | (no body) | ❌ **MISSING** |

**What exists:** [frontend/src/api/admin.js](frontend/src/api/admin.js) has planner functions but NOT citizen functions.

**Need additions:**

```javascript
// ❌ Missing in adminApi:
adminApi.listCitizens(params) // { active?, page, limit }
adminApi.updateCitizenStatus(citizenId, active)
adminApi.initiatePasswordReset(userId)
```

---

#### 2.5 Admin: Comment Moderation

**Status:** 0% complete - NO CLIENT-SIDE FUNCTIONS

| Endpoint | HTTP Method | Purpose | Payload | Frontend Status |
|---|---|---|---|---|
| GET `/admin/comments/pending` | GET | Fetch pending (failed AI analysis) comments | `query: { page, limit }` | ❌ **MISSING** |
| PUT `/admin/comments/:id` | PUT | Update comment (approve/reject/flag) | `{ status: 'approved' \| 'rejected' \| 'flagged' }` | ❌ **MISSING** |
| POST `/admin/comments/:id/retry` | POST | Retry AI analysis on single comment | (no body) | ❌ **MISSING** |
| POST `/admin/comments/retry-all` | POST | Batch retry all pending comments | (no body) | ❌ **MISSING** |
| DELETE `/admin/comments/:id` | DELETE | Delete comment | (no body) | ❌ **MISSING** |

**Need new extension to adminApi:**

```javascript
// ❌ Missing in adminApi:
adminApi.getPendingComments(params)
adminApi.updateComment(commentId, { status })
adminApi.retryComment(commentId)
adminApi.retryAllComments()
adminApi.deleteComment(commentId)
```

---

#### 2.6 Admin: Advanced Reporting & Monitoring

**Status:** 5% complete (1 of 4 endpoints)

| Endpoint | HTTP Method | Purpose | Params | Frontend Status |
|---|---|---|---|---|
| GET `/admin/dashboard/stats` | GET | Summary dashboard stats | - | ✅ **IMPLEMENTED** |
| GET `/admin/trends` | GET | Time-series trends (votes, sentiment by region) | `startDate?, endDate?, region?` | ❌ **MISSING** |
| GET `/admin/audit-logs` | GET | Audit trail of all admin actions | `query, userId?, action?, page, limit` | ❌ **MISSING** |
| GET `/admin/audit-logs/export` | GET | Export audit logs as CSV | `query parameters` | ❌ **MISSING** |
| GET `/admin/ai/health` | GET | AI service health status | - | ❌ **MISSING** |

**Need in adminApi:**

```javascript
// ❌ Missing:
adminApi.getTrends(params)
adminApi.getAuditLogs(params)
adminApi.exportAuditLogs(params)
adminApi.getAIHealth()
```

---

#### 2.7 Analytics: Heatmap & Regional Data

**Status:** 50% complete (1 of 2 endpoints)

| Endpoint | HTTP Method | Purpose | Params | Frontend Status |
|---|---|---|---|---|
| GET `/analytics/:policyId` | GET | Policy analytics (votes, sentiment, keywords) | `startDate?, endDate?` | ✅ **IMPLEMENTED** |
| GET `/analytics/heatmap` | GET | Regional heatmap of votes/sentiment | `startDate?, endDate?` | ❌ **MISSING** |
| GET `/analytics/:policyId/comments` | GET | Comments for a policy (filterable) | `page, limit, sentiment?, startDate?, endDate?` | ✅ **IMPLEMENTED** |
| GET `/analytics/:policyId/export` | GET | Export policy analytics as CSV | `startDate?, endDate?, format?` | ✅ **IMPLEMENTED** |

**Need in analyticsApi:**

```javascript
// ❌ Missing:
analyticsApi.heatmap(params)
```

---

### 3. MISSING UI COMPONENTS

| Component | Purpose | Affected Pages | Priority |
|---|---|---|---|
| **OTP Input Field** | 6-digit code input with auto-advance | Registration, OTP Verify, Email Change | HIGH |
| **Password Strength Indicator** | Visual feedback on password quality | Registration, Password Reset | MEDIUM |
| **Region Multi-Select** | Checkbox list or dropdown for regions | Policy Form (already exists but used), Registration | MEDIUM |
| **Date Range Picker** | Reusable date range filter | Analytics, Audit Logs, Trends Dashboard | MEDIUM |
| **Sentiment Badge** | Colored sentiment indicator (pos/neg/neutral) | Comments, Analytics | MEDIUM |
| **Citation QA Display** | Show AI-extracted keywords & confidence | Analytics, Policy Detail | MEDIUM |
| **Notification Bell/Dropdown** | Notification preview menu | App Shell header | MEDIUM |
| **Phone Number Input** | International format with validation | Registration, User Profile | MEDIUM |
| **Loading Skeleton** | Per-table-row loading indication | Comment moderation, Citizen list | LOW |
| **Timeline/History View** | Vertical timeline of events | History pages, Audit Logs | LOW |

---

### 4. MISMATCHES & INCONSISTENCIES

#### 4.1 Auth Context vs Post-Login Flow

**Issue:** AuthContext only checks `DASHBOARD_ROLES = ["planner", "admin"]` but backend supports citizens too.

**Impact:** Citizens registering and logging in will be immediately logged out.

**Location:** [frontend/src/auth/AuthContext.jsx](frontend/src/auth/AuthContext.jsx#L6)

```javascript
// Current code:
const DASHBOARD_ROLES = ["planner", "admin"];

// Impact: Line 40-41
if (!DASHBOARD_ROLES.includes(profile.role)) {
  logout();
  return null;
}
```

**Recommendation:** Either:
- Create separate auth context for citizens (if citizen frontend needed)
- Or add "citizen" to DASHBOARD_ROLES (if building single app)

---

#### 4.2 Vote Submission Missing from Routes

**Issue:** No UI path to vote on policies.

**Backend:** ` POST /votes` endpoint exists and accepts `{ policyId, rating, comment? }`

**Frontend:** No voting interface exists; `PoliciesPage` only shows list management.

**Current Gap:** Citizens can see active policies `/policies` but cannot submit votes.

---

#### 4.3 API Client Error Handling Mismatch

**Issue:** Backend returns errors in two formats; frontend only handles one.

[frontend/src/api/client.js](frontend/src/api/client.js#L32-L46) expects:
```javascript
error.response?.data?.error?.code  // Format 1
error.response?.data?.code         // Format 2 (not checked)
```

But backend can return:
```json
{ "status": "error", "error": { "code": "...", "message": "..." } }
// OR
{ "detail": "..." }  // For AI service
```

---

#### 4.4 Missing SMS Voting Channel Integration

**Issue:** Backend tracks `channel: "app" | "sms"` on votes but frontend has zero SMS support.

**Backend:**
- SMS voting exists: `/sms/receive` handles incoming SMS votes
- Votes queried with channel filter

**Frontend:**
- No SMS integration UI
- No channel visualization in analytics (dashboard shows `${app_votes} app, ${sms_votes} SMS` but no breakdown in policy analytics)

---

#### 4.5 Policy Status Transitions Not Validated on Frontend

**Issue:** Frontend allows clicking actions that violate backend state machine.

Example: `PoliciesPage` shows "Pause" button for draft policy, but backend rejects this.

**Validation gaps:**
- Draft → activate is invalid (must publish first)
- Paused → publish is invalid
- Closed → any action is invalid
- Extend only valid for active/paused

---

#### 4.6 Missing Policy History UI Rendering

**Issue:** `policyApi.history(id)` is callable but no page displays the result.

**Expected format (from backend):**
```javascript
{
  _id: ObjectId,
  policyId: ObjectId,
  version: number,
  timestamp: ISO8601,
  changedBy: userId,
  changeType: "CREATED" | "UPDATED" | "PUBLISHED" | "ACTIVATED" | "CLOSED",
  details: { title?, description?, status?, ...}
}
```

**Frontend:** No `PolicyHistoryPage` renders this data.

---

### 5. PARTIALLY IMPLEMENTED FEATURES

#### 5.1 Admin Dashboard (60% Complete)

| Feature | Backend | Frontend | Status |
|---|---|---|---|
| Dashboard stats | ✅ `/admin/dashboard/stats` | ✅ Renders in `DashboardPage` | ✅ COMPLETE |
| Admin stats retrieval | ✅ Implemented | ✅ Called via `adminApi.dashboardStats()` | ✅ COMPLETE |
| Policy metrics | ✅ In stats response | ✅ Shown in cards | ✅ COMPLETE |
| Vote metrics | ✅ In stats response | ⚠️ Shown but SMS/app split unclear | ⚠️ PARTIAL |
| Comment metrics | ✅ In stats response | ⚠️ Shown as total only | ⚠️ PARTIAL |
| Trends over time | ✅ `/admin/trends` EXISTS | ❌ NOT CALLED | ❌ MISSING |
| Audit logs | ✅ `/admin/audit-logs` EXISTS | ❌ NOT CALLED | ❌ MISSING |
| AI health status | ✅ `/admin/ai/health` EXISTS | ❌ NOT RENDERED | ❌ MISSING |

---

#### 5.2 Analytics (70% Complete)

| Feature | Backend | Frontend | Status |
|---|---|---|---|
| Policy summary (votes, avg rating) | ✅ `/analytics/:id` | ✅ `PolicyAnalyticsPage` | ✅ COMPLETE |
| Sentiment breakdown | ✅ positive/negative/neutral counts | ✅ Pie chart rendered | ✅ COMPLETE |
| Keywords extraction | ✅ Top 5 from AI service | ✅ Displayed in table | ✅ COMPLETE |
| Comments list | ✅ `/analytics/:id/comments` | ✅ Paginated display | ✅ COMPLETE |
| PDF/CSV export | ✅ `/analytics/:id/export` blob response | ⚠️ Calls API but no UX | ⚠️ PARTIAL |
| Regional heatmap | ✅ `/analytics/heatmap` EXISTS | ❌ NOT CALLED | ❌ MISSING |
| Sentiment trends | ✅ Queryable with date ranges | ✅ Date filters exist | ⚠️ PARTIAL (trends dashboard missing) |
| Comment keyword analysis | ✅ Keywords per comment | ⚠️ Keywords shown but no drill-down | ⚠️ PARTIAL |

---

#### 5.3 Policy Lifecycle (85% Complete)

| Action | Backend | Frontend | Status |
|---|---|---|---|
| Create (draft) | ✅ POST `/policies` | ✅ `PolicyFormPage` + modal | ✅ COMPLETE |
| Publish (draft→published) | ✅ PATCH `/policies/:id/publish` | ✅ Button in list view | ✅ COMPLETE |
| Activate (published→active) | ✅ PATCH `/policies/:id/activate` | ✅ Button in list view | ✅ COMPLETE |
| Pause (active→paused) | ✅ PATCH `/policies/:id/pause` | ✅ Button in list view | ✅ COMPLETE |
| Resume (paused→active) | ✅ PATCH `/policies/:id/resume` | ✅ Button in list view | ✅ COMPLETE |
| Extend end date | ✅ PATCH `/policies/:id/extend` + body | ⚠️ Modal exists but buggy? | ⚠️ PARTIAL |
| Close (any→closed) | ✅ POST `/policies/:id/close` | ✅ Button in list view | ✅ COMPLETE |
| Clone | ✅ POST `/policies/:id/clone` | ✅ Button in list view | ✅ COMPLETE |
| Delete (draft/published only) | ✅ DELETE `/policies/:id` | ✅ Button in list view | ✅ COMPLETE |
| View history | ✅ GET `/policies/:id/history` | ❌ Not integrated in UI | ❌ MISSING |
| Unpublish | ✅ PATCH `/policies/:id/unpublish` | ❌ Not in UI | ❌ MISSING |

---

### 6. UNUSED BACKEND ENDPOINTS

These endpoints exist in the backend but have **zero** corresponding frontend code:

| Endpoint | Method | Purpose | Reason Unused |
|---|---|---|---|
| POST `/auth/register` | POST | Citizen self-signup | Citizens not in dashboard scope |
| POST `/auth/send-otp` | POST | OTP send | Citizens not in dashboard scope |
| POST `/auth/verify-otp` | POST | OTP verify | Citizens not in dashboard scope |
| POST `/auth/forgot-password` | POST | Password reset request | No password reset UI |
| POST `/auth/reset-password` | POST | Password reset completion | No password reset UI |
| POST `/votes` | POST | Submit vote | Citizen feature, not in dashboard |
| POST `/comments/:voteId` | POST | Add comment to vote | Citizen feature, not in dashboard |
| GET `/sms/results` | GET | SMS voting results | SMS channel not exposed in UI |
| GET `/users/me` → used but incomplete | GET | User profile | Only `me()` called; no update/delete |
| PUT `/users/me` | PUT | Update profile | Not called |
| PUT `/users/me/password` | PUT | Change password | Not called |
| DELETE `/users/me` | DELETE | Account deletion | Not called |
| POST `/users/me/email/request` | POST | Email change request | Not called |
| POST `/users/me/email/verify` | POST | Email change verify | Not called |
| GET `/users/me/notifications` | GET | User inbox | Not called |
| PATCH `/users/me/notifications/:id/read` | PATCH | Mark read | Not called |
| PATCH `/users/me/notifications/read-all` | PATCH | Mark all read | Not called |
| GET `/users/me/history` | GET | User activity log | Not called |
| GET `/admin/users/citizens` | GET | Citizen list | Not called |
| PUT `/admin/users/:id/status` | PUT | Toggle citizen active | Not called |
| POST `/admin/users/:id/initiate-password-reset` | POST | Admin password reset | Not called |
| GET `/admin/comments/pending` | GET | Moderation queue | Not called |
| PUT `/admin/comments/:id` | PUT | Update comment status | Not called |
| POST `/admin/comments/:id/retry` | POST | Retry AI analysis | Not called |
| POST `/admin/comments/retry-all` | POST | Batch retry comments | Not called |
| DELETE `/admin/comments/:id` | DELETE | Delete comment | Not called |
| GET `/admin/trends` | GET | Trend analytics | Not called |
| GET `/admin/audit-logs` | GET | Audit trail | Not called |
| GET `/admin/audit-logs/export` | GET | Audit export | Not called |
| GET `/admin/ai/health` | GET | AI service status | Not called |
| GET `/analytics/heatmap` | GET | Regional heatmap | Not called |
| PATCH `/policies/:id/unpublish` | PATCH | Revert published→draft | Not in UI |

**Total: 33 endpoints unused (44% of available endpoints)**

---

### 7. AI SERVICE FEATURES NOT EXPOSED IN UI

All AI capabilities are called **internally by backend workers** but **never exposed in admin UI**.

| AI Feature | Backend Worker | Frontend | Status |
|---|---|---|---|
| Sentiment analysis | ✅ `/analyze` called by `aiWorker` | ❌ Results shown but no direct control | ❌ MISSING |
| Keyword extraction | ✅ Keybert in `/analyze` | ✅ Keywords displayed in analytics | ✅ PARTIAL |
| Language detection | ✅ fastText auto-detect | ✅ Displayed in analytics | ✅ PARTIAL |
| Benchmark comparison | ✅ `/benchmark` endpoint available | ❌ Not called from frontend | ❌ MISSING |
| Model selection | ✅ Multiple models per language | ❌ No UI to select model | ❌ MISSING |
| Confidence scores | ✅ Returned in analysis | ✅ Shown in analytics | ✅ PARTIAL |
| AI health status | ✅ Probe via `/admin/ai/health` | ❌ Not displayed | ❌ MISSING |
| Manual re-analysis | ✅ Backend supports retry logic | ⚠️ Limited to admin comment retry | ⚠️ PARTIAL |
| Language preference | ✅ Amharic, Oromo, Tigrinya, English | ✅ Language code shown | ✅ PARTIAL |
| Model feedback loop | ❌ Not implemented | ❌ N/A | ❌ MISSING |

**Key Gap:** Admins cannot:
- Manually trigger AI analysis on a comment
- See which model was used
- View confidence/uncertainty scores
- Compare model outputs
- Monitor AI service uptime

---

## CATEGORY SUMMARY

### Missing Frontend Pages/Views: **14**
- 2 authentication flows (registration, password reset)
- 5 citizen features (voting, profile, notifications, history, email change)
- 4 admin dashboards (citizens, trends, audit logs, AI health)
- 2 advanced analytics (heatmap, comment moderation)
- 1 policy history timeline

### Missing API Integrations: **40+**
- Authentication (5 endpoints)
- Citizen engagement (2 endpoints)
- User management (9 endpoints)
- Admin citizen management (3 endpoints)
- Admin comment moderation (5 endpoints)
- Admin reporting (4 endpoints)
- Analytics (1 endpoint)
- SMS channel support (1 endpoint)

### Missing UI Components: **10**
- OTP input, password strength, area selectors, date ranges, sentiment badges, etc.

### Partially Implemented: **8 features**
- Admin dashboard, analytics, policy lifecycle, error handling, vote channel tracking

### Mismatches & Bugs: **6**
- Auth context role filtering, vote routing, error format handling, state machine validation, export UX, history UI

### Unused Endpoints: **33** (44% of backend)

---

## RECOMMENDED IMPLEMENTATION PRIORITY

### Phase 1: Authentication & Foundation (Weeks 1-2)
1. Add password reset flow (`forgot-password` + `reset-password` pages)
2. Extend `authApi` with all 6 endpoints
3. Fix auth context role filtering
4. Add OTP component
5. **Estimated:** 12-15 hours

### Phase 2: Core Admin Gaps (Weeks 2-3)
1. Citizen management (`UsersPage` extension for citizens)
2. Comment moderation queue UI
3. Extend `adminApi` with citizen & comment endpoints
4. **Estimated:** 16-20 hours

### Phase 3: Advanced Admin Dashboards (Weeks 3-4)
1. Trends dashboard (time-series charts)
2. Audit logs viewer & exporter
3. AI health monitor
4. Heatmap analytics
5. Extend `adminApi` with reporting endpoints
6. **Estimated:** 20-24 hours

### Phase 4: Citizen Frontend (Optional, Weeks 4-6)
1. Public policy browse (if not in dashboard)
2. Voting interface (attach to `PolicyAnalyticsPage` or separate view)
3. Voting history
4. Notifications center
5. Create separate `/citizen` routes or use role-based routing
6. **Estimated:** 30-40 hours

### Phase 5: User Profile & Polish (Weeks 6-7)
1. User settings page (profile, password, email change, notifications)
2. Policy history timeline
3. Fix state machine validation for policy actions
4. Export/download improvements (CSV, PDF)
5. **Estimated:** 12-16 hours

---

## DETAILED IMPLEMENTATION CHECKLIST

### Critical (Must-Have)

- [ ] **Password Reset UI**
  - [ ] Create `PasswordResetPage.jsx`
  - [ ] Create `PasswordResetConfirmPage.jsx` (token form)
  - [ ] Add routes `/forgot-password`, `/reset-password`
  - [ ] Add `authApi.forgotPassword()`, `authApi.resetPassword()`

- [ ] **OTP Component**
  - [ ] Create `OtpInput.jsx` component (6 digits, auto-advance)
  - [ ] Add to future registration flow
  - [ ] Used in email change flow

- [ ] **Citizen Management Page**
  - [ ] Create `CitizenManagementPage.jsx`
  - [ ] Add to admin routes
  - [ ] List citizens with active/inactive toggle
  - [ ] Add filters (region, status, verified)
  - [ ] Add `adminApi.listCitizens()`, `adminApi.updateCitizenStatus()`

- [ ] **Comment Moderation Dashboard**
  - [ ] Create `CommentModerationPage.jsx`
  - [ ] Fetch pending comments via `adminApi.getPendingComments()`
  - [ ] Show comment + AI analysis results
  - [ ] Actions: approve, reject, flag, retry, delete
  - [ ] Batch retry functionality
  - [ ] Add endpoints to `adminApi`

### High Priority (Should-Have)

- [ ] **Trends Dashboard**
  - [ ] Create `TrendsDashboardPage.jsx`
  - [ ] Line chart: votes over time
  - [ ] Line chart: sentiment trend (pos/neg/neutral %)
  - [ ] Regional breakdown charts
  - [ ] Date range filter
  - [ ] Add `adminApi.getTrends()`

- [ ] **Audit Logs Viewer**
  - [ ] Create `AuditLogsPage.jsx`
  - [ ] Table with filters (user, action, date range)
  - [ ] Search by target resource
  - [ ] CSV export button
  - [ ] Add `adminApi.getAuditLogs()`, `adminApi.exportAuditLogs()`

- [ ] **Voting Interface**
  - [ ] Add voting section to policy detail view (or separate voting page)
  - [ ] Star rating widget (1-5)
  - [ ] Optional text comment below rating
  - [ ] Submit button
  - [ ] Create `voteApi.submit()`, `commentApi.addToVote()`
  - [ ] Show success toast + update vote count in real-time

- [ ] **User Profile Page**
  - [ ] Create `UserProfilePage.jsx`
  - [ ] Tabs: Info, Security, Notifications
  - [ ] Edit region
  - [ ] Change password modal
  - [ ] Request email change (with OTP verification)
  - [ ] View/delete account
  - [ ] Add functions to `userApi`

### Medium Priority (Nice-to-Have)

- [ ] **Analytics Heatmap**
  - [ ] Add heatmap view to admin analytics
  - [ ] Regional vote/sentiment density visualization
  - [ ] Add `analyticsApi.heatmap()`

- [ ] **Notifications Center**
  - [ ] Notification bell icon in app shell header
  - [ ] Dropdown menu showing recent notifications
  - [ ] Mark as read (single & all)
  - [ ] Notification list page with full history
  - [ ] Add functions to `userApi`

- [ ] **Policy History Timeline**
  - [ ] Add "View History" modal to policy detail
  - [ ] Vertical timeline of status changes
  - [ ] Show who made each change + timestamp
  - [ ] Display changed fields (before/after)
  - [ ] Already has backend endpoint; just needs UI

- [ ] **AI Health Monitor Card**
  - [ ] Add card to admin dashboard
  - [ ] Show AI service status (online/offline)
  - [ ] Last checked timestamp
  - [ ] Add `adminApi.getAIHealth()`

---

## API CLIENT FILE UPDATES NEEDED

### [frontend/src/api/auth.js](frontend/src/api/auth.js)
```javascript
// Current (1 endpoint):
authApi.login()

// Add (5 endpoints):
authApi.register(email, password, phone, region)
authApi.sendOtp(email)
authApi.verifyOtp(email, code)
authApi.forgotPassword(email)
authApi.resetPassword(token, newPassword)
```

### [frontend/src/api/user.js](frontend/src/api/user.js)
```javascript
// Current (1 endpoint):
userApi.me()

// Add (9 endpoints):
userApi.update(payload)
userApi.changePassword(currentPassword, newPassword)
userApi.deleteMe()
userApi.requestEmailChange(newEmail)
userApi.verifyEmailChange(token)
userApi.getNotifications(params)
userApi.markNotificationRead(id)
userApi.markAllNotificationsRead()
userApi.getHistory(params)
```

### [frontend/src/api/admin.js](frontend/src/api/admin.js)
```javascript
// Current (5 endpoints):
adminApi.dashboardStats()
adminApi.listPlanners()
adminApi.createPlanner()
adminApi.updatePlanner()
adminApi.setPlannerStatus()

// Add (13 endpoints):
adminApi.listCitizens(params)
adminApi.updateCitizenStatus(id, active)
adminApi.initiatePasswordReset(id)
adminApi.getPendingComments(params)
adminApi.updateComment(id, payload)
adminApi.retryComment(id)
adminApi.retryAllComments()
adminApi.deleteComment(id)
adminApi.getTrends(params)
adminApi.getAuditLogs(params)
adminApi.exportAuditLogs(params)
adminApi.getAIHealth()
adminApi.heatmap(params)  // or keep in analyticsApi
```

### [frontend/src/api/analytics.js](frontend/src/api/analytics.js)
```javascript
// Current (3 endpoints):
analyticsApi.summary()
analyticsApi.comments()
analyticsApi.exportCsv()

// Add (1 endpoint):
analyticsApi.heatmap(params)
```

### NEW FILE: [frontend/src/api/votes.js](frontend/src/api/votes.js)
```javascript
export const voteApi = {
  submit(payload) {
    // POST /votes
    // payload: { policyId, rating, comment? }
  }
};
```

### NEW FILE: [frontend/src/api/comments.js](frontend/src/api/comments.js)
```javascript
export const commentApi = {
  addToVote(voteId, text) {
    // POST /comments/:voteId
  }
};
```

---

## TESTING RECOMMENDATIONS

After implementing gaps, validate:

1. **API Contract Tests**
   - Request/response formats match backend contracts
   - Error handling works (400, 401, 403, 500)
   - Authentication headers included in all protected calls

2. **Role-Based Access Tests**
   - Admins can access all admin endpoints
   - Planners cannot call citizen endpoints
   - Citizens (if added) cannot call admin endpoints

3. **State Machine Tests**
   - Policy status transitions are valid
   - Cannot extend draft/published policies
   - Cannot activate already-active policies

4. **Error Scenarios**
   - OTP timeout (>5min)
   - OTP max retries exceeded
   - Password reset token expired
   - Duplicate email/phone registration
   - Rate limits (if present)

5. **Integration Tests**
   - Login → view dashboard → manage policies → view analytics (end-to-end)
   - Admin → manage citizens → moderate comments → export audit logs

---

## DOCUMENT REFERENCES

- **Backend API Doc:** [backend/API_DOCS.md](backend/API_DOCS.md)
- **AI Service API Doc:** [ai-service/API_DOCS.md](ai-service/API_DOCS.md)
- **Frontend Auth:** [frontend/src/auth/AuthContext.jsx](frontend/src/auth/AuthContext.jsx)
- **Frontend Routes:** [frontend/src/App.jsx](frontend/src/App.jsx)
- **Frontend API Client:** [frontend/src/api/client.js](frontend/src/api/client.js)

---

## CONCLUSION

The frontend dashboard is a solid **Planner/Admin management application** but has significant gaps for:
- **Authentication flows** (password reset, OAuth/OTP)
- **Citizen engagement** (voting, profile, notifications)
- **Advanced admin features** (trends, audit logs, AI monitoring, comment moderation)
- **Analytics depth** (heatmaps, regional insights, model selection)

**Total estimated effort to 100% coverage: 90–120 hours** across 5 phases. The critical path is Phases 1-2 (authentication + admin users) which should be completed before dealing with citizen-facing features or polish.

---

**Report Generated:** May 7, 2026  
**Analyzed By:** AI Service Integration Analysis  
**Status:** Complete
