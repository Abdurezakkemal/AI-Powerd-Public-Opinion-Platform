# API Documentation – Civic Engagement Platform

## 1. Overview

### 1.1 Base URLs

| Environment       | URL                                              |
| ----------------- | ------------------------------------------------ |
| Local development | `http://localhost:5000/api`                      |
| Production        | `https://your-domain.com/api` (to be configured) |

All endpoints are prefixed with /api. For example: http://localhost:5000/api/auth/login.

### 1.2 Authentication

Most endpoints require a Bearer token obtained after successful login or OTP verification.

Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

Tokens expire after 7 days. After expiry, the user must log in again.

### 1.3. Uniform Response Format

Every JSON response follows this exact structure:

Success response:

```json
{
  "status": "success",
  "data": { ... },          // can be an object, array, or null
  "message": "Human-readable message",
  "timestamp": "2026-04-09T12:00:00Z"
}
```

Error response:

```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Detailed description"
  },
  "timestamp": "..."
}
```

### 1.4 Common Error Codes

| Code                    | HTTP status | Meaning                                      |
| ----------------------- | ----------- | -------------------------------------------- |
| `VALIDATION_ERROR`      | 400         | Missing or invalid input fields              |
| `UNAUTHORIZED`          | 401         | Missing or invalid token                     |
| `FORBIDDEN`             | 403         | Insufficient permissions or account disabled |
| `NOT_FOUND`             | 404         | Resource does not exist                      |
| `DUPLICATE_ENTRY`       | 409         | Email or phone already registered            |
| `RATE_LIMIT_EXCEEDED`   | 429         | Too many requests from this IP/phone         |
| `ACCOUNT_DISABLED`      | 403         | User account deactivated by admin            |
| `NOT_VERIFIED`          | 403         | OTP verification not completed               |
| `VOTING_CLOSED`         | 400         | Policy voting period has ended               |
| `ALREADY_VOTED`         | 409         | User already voted on this policy            |
| `INTERNAL_SERVER_ERROR` | 500         | Server error – try again later               |

### 1.5 Rate Limiting

| Endpoint group                    | Limit        | Time window | Scope             |
| --------------------------------- | ------------ | ----------- | ----------------- |
| `/auth/login`, `/auth/verify-otp` | 10 requests  | 15 minutes  | Per IP            |
| `/auth/send-otp`                  | 3 requests   | 1 hour      | Per IP            |
| `/auth/forgot-password`           | 3 requests   | 1 hour      | Per IP            |
| `/auth/reset-password`            | 5 requests   | 15 minutes  | Per IP            |
| `/votes` (POST)                   | 30 requests  | 1 hour      | Per user (by JWT) |
| `/comments` (POST)                | 10 requests  | 1 minute    | Per user (by JWT) |
| `/planners/request`               | 1 request    | 24 hours    | Per user (by JWT) |
| All other `/api` endpoints        | 100 requests | 15 minutes  | Per IP            |
| `/sms/receive`                    | 3 votes      | 24 hours    | Per phone number  |

When a limit is exceeded, the API returns `429 RATE_LIMIT_EXCEEDED` with a human-readable message.

## 2. Authentication Endpoints

These endpoints are public (no token required).

### 2.1 Register a new citizen

**`POST /auth/register`**

Creates a new citizen account. An OTP is sent to the provided email address (not phone). The phone number is stored for channel exclusivity (to prevent app users from voting via SMS).

Request body:

```json
{
  "email": "user@example.com",
  "password": "strongPass123",
  "phone": "+251912345678",
  "region": "Addis Ababa",
  "ageRange": "25-34",
  "gender": "male",
  "occupation": "private-sector",
  "education": "bachelors"
}
```

| Field      | Type   | Required | Description                                                                                     |
| ---------- | ------ | -------- | ----------------------------------------------------------------------------------------------- |
| email      | string | yes      | Valid email address                                                                             |
| password   | string | yes      | Min 8 characters, at least one uppercase, one lowercase, one number, one special                |
| phone      | string | yes      | Ethiopian phone number, international format recommended (+2519...)                             |
| region     | string | yes      | City/region name (e.g., "Addis Ababa", "Oromia")                                                |
| ageRange   | string | yes      | One of: `18-24`, `25-34`, `35-44`, `45-54`, `55+`                                               |
| gender     | string | yes      | `male`, `female`, `non-binary`, `prefer-not-to-say`                                             |
| occupation | string | yes      | `student`, `farmer`, `merchant`, `government-employee`, `private-sector`, `unemployed`, `other` |
| education  | string | yes      | `no-formal`, `primary`, `secondary`, `diploma`, `bachelors`, `postgraduate`                     |

**Response (201 Created):**

```json
{
  "status": "success",
  "data": { "userId": "67f1a2b3c4d5e6f7a8b9c0d1" },
  "message": "User registered successfully. A 6-digit OTP has been sent to your email for verification.",
  "timestamp": "2026-04-09T12:00:00Z"
}
```

**Error responses:**

| Status | Code                    | Message example                                                                                      |
| ------ | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`      | `"Missing required fields: email, password, phone, region, ageRange, gender, occupation, education"` |
| 409    | `DUPLICATE_ENTRY`       | `"Email already registered. Please use a different email."`                                          |
| 500    | `INTERNAL_SERVER_ERROR` | `"Unable to complete registration. Please try again later."`                                         |

### 2.2 Send OTP

**`POST /auth/send-otp`**

Sends a 6‑digit OTP to the user's registered email address.  
**Rate limit:** 3 requests per hour per IP. If the limit is exceeded, the API returns `429 RATE_LIMIT_EXCEEDED` with message `"Too many requests. Please wait 60 minutes."`
**Resend cooldown:** If an OTP already exists and has more than 30 seconds of life remaining (i.e., TTL > 270 seconds), the request is rejected with a `RATE_LIMIT_EXCEEDED` error. After 30 seconds, a new OTP can be sent (overwriting the previous one).

**Request body:**

```json
{
  "email": "user@example.com"
}
```

Response (200 OK):

```json
{
  "status": "success",
  "data": null,
  "message": "OTP sent successfully. It expires in 5 minutes.",
  "timestamp": "..."
}
```

**Error responses (new/updated):**

| Status | Code                  | Message                                                                                                                                     |
| ------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 429    | `RATE_LIMIT_EXCEEDED` | `"An OTP has already been sent and is valid for X more seconds. Please use that code or wait for it to expire."` (when resending too early) |
| 429    | `RATE_LIMIT_EXCEEDED` | `"Too many OTP requests. Please wait 5 minutes."` (rate limit hit)                                                                          |

### 2.3 Verify OTP

**`POST /auth/verify-otp`**

Verifies the OTP and returns a JWT token. After successful verification, the user's verified flag becomes true, allowing login.

**Rate limit:** 5 requests per 15 minutes per IP. After 5 failed attempts, you must wait 15 minutes.

Request body:

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

Response (200 OK):

```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "role": "citizen"
  },
  "message": "Email verified successfully. You can now log in.",
  "timestamp": "..."
}
```

Error responses:

| Status | Code                  | Message                                                    |
| ------ | --------------------- | ---------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`    | `"Invalid or expired OTP. Please request a new one."`      |
| 429    | `RATE_LIMIT_EXCEEDED` | `"Too many verification attempts. Please wait 5 minutes."` |

### 2.4 Login

**`POST /auth/login`**

Authenticates a user with email and password. Returns a JWT token valid for 7 days.

```json
{
  "email": "user@example.com",
  "password": "strongPass123"
}
```

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "role": "citizen",
    "userId": "67f1a2b3..."
  },
  "message": "Login successful.",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code                  | Message                                                                         |
| ------ | --------------------- | ------------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`    | `"Email and password are required"`                                             |
| 401    | `INVALID_CREDENTIALS` | `"Invalid email or password."`                                                  |
| 403    | `ACCOUNT_DISABLED`    | `"Your account has been deactivated. Please contact an administrator."`         |
| 403    | `NOT_VERIFIED`        | `"Your email address is not verified. Please complete OTP verification first."` |

### 2.5 Password Reset

### 2.5.1 Request password reset (user self‑service)

**`POST /auth/forgot-password`**

Sends a secure reset token to the user’s registered email address. The token is valid for 1 hour and can be used with `/auth/reset-password`.

**Rate limit:** 3 requests per hour per IP. This limit is enforced by the global rate limiter (see 1.5).

**Request body:**

```json
{
  "email": "user@example.com"
}
```

Response (200 OK):  
The same message is returned regardless of whether the email exists, to prevent user enumeration.

```json
{
  "status": "success",
  "data": null,
  "message": "If an account with that email exists, a password reset link has been sent.",
  "timestamp": "2026-04-28T12:00:00Z"
}
```

**Error responses:**

| Status | Code                    | Message                                                       |
| ------ | ----------------------- | ------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`      | `"Email is required"`                                         |
| 429    | `RATE_LIMIT_EXCEEDED`   | `"Too many password reset requests. Please try again later."` |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to process password reset request"`                  |

---

### 2.5.2 Reset password using token

**`POST /auth/reset-password`**

**Request body:**

```json
{
  "token": "hex_token_from_email",
  "newPassword": "NewSecurePass123"
}
```

**Response (200 OK):**

```json
{
  "status": "success",
  "data": null,
  "message": "Password has been reset successfully. You can now log in with your new password.",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code                    | Message                                                           |
| ------ | ----------------------- | ----------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`      | `"Token and new password are required"`                           |
| 400    | `VALIDATION_ERROR`      | `"Password must be at least 8 characters long"`                   |
| 400    | `VALIDATION_ERROR`      | `"New password must be different from current password"`          |
| 400    | `VALIDATION_ERROR`      | `"Invalid or expired reset token. Please request a new one."`     |
| 404    | `NOT_FOUND`             | `"User not found"`                                                |
| 429    | `RATE_LIMIT_EXCEEDED`   | `"Too many password reset attempts. Please request a new token."` |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to reset password"`                                      |

---

### 2.5.3 Admin‑initiated password reset

**`POST /admin/users/:id/initiate-password-reset`**

**Role required:** `admin`

Triggers a password reset email for the specified user (citizen or planner). The admin never sees or sets the password; the user receives a token and must use `/auth/reset-password` to choose a new password themselves.  
The admin cannot reset their own password through this endpoint – they must use the normal forgot‑password flow.

**Path parameter:**

| Parameter | Type   | Description                                        |
| --------- | ------ | -------------------------------------------------- |
| `id`      | string | User ID (MongoDB ObjectId) of a citizen or planner |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": null,
  "message": "Password reset email sent to user@example.com. The user will receive a link to set a new password.",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code                    | Message                                                  |
| ------ | ----------------------- | -------------------------------------------------------- |
| 403    | `FORBIDDEN`             | `"Use /auth/forgot-password to reset your own password"` |
| 404    | `NOT_FOUND`             | `"User not found"`                                       |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to initiate password reset"`                    |

## 3. Policy Endpoints

| Role    | View own draft/published? | View others' draft/published? | View others' active/paused/closed?      | Create / Update / Delete (own) | Publish / Unpublish (own) | Activate / Pause / Resume / Close / Extend (own)      |
| ------- | ------------------------- | ----------------------------- | --------------------------------------- | ------------------------------ | ------------------------- | ----------------------------------------------------- |
| Citizen | No                        | No                            | Yes (`active` and `paused`, own region) | No                             | No                        | No                                                    |
| Planner | Yes (all statuses)        | **No (404)**                  | Yes                                     | Yes (draft/published only)     | Yes (draft → published)   | Yes (published → active, active/paused → close, etc.) |
| Admin   | Yes (all)                 | Yes (all)                     | Yes                                     | Yes (any policy)               | Yes (any policy)          | Yes (any policy)                                      |

**Important visibility rules:**

- **Citizens** can only see policies with status `active` or `paused` that target their region. Any other policy (different status, different region) returns **`404 Not Found`** when accessed directly – citizens are never told that such a policy exists.
- **Planners** see their own policies (any status). For other planners' policies, only `active`, `paused`, and `closed` are visible; **draft** and **published** policies of others return **`404 Not Found`** on any endpoint.
- **Admins** can see all policies.

**Notes on actions:**

- Delete allowed only for `draft` or `published` policies. Update only for `draft` policies.
- Extend works on `active` or `paused`. Pause works on `active`, Resume on `paused`. Close works on `active` or `paused`.
- Activate moves a `published` policy to `active` (within voting window). Auto‑activation also does this on startDate.
- Publish moves a `draft` policy to `published` (or directly to `active` if startDate already passed).
- Unpublish moves a `published` policy back to `draft`.

### 3.1 List policies

**`GET /policies`**

Query parameters (all optional):

| Parameter | Type    | Default | Description                                                                                                                                                                                                                                                                                                                          |
| --------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `status`  | string  | none    | Filter by `draft`, `published`, `active`, `paused`, or `closed`. Citizens cannot see `draft`, `published`, or `closed`; they see only `active` and `paused`.                                                                                                                                                                         |
| `region`  | string  | none    | Filter by target region (planners/admins only).                                                                                                                                                                                                                                                                                      |
| `owner`   | string  | none    | **Planners only.** Use `owner=me` to see only policies owned by the logged‑in planner (any status). Without this, planners see their own policies (all statuses) **plus** other planners' `active`, `paused`, and `closed` policies. **Other planners' draft and published policies are excluded** – they do not appear in the list. |
| `page`    | integer | 1       | Page number (1‑based).                                                                                                                                                                                                                                                                                                               |
| `limit`   | integer | 20      | Items per page (max 100).                                                                                                                                                                                                                                                                                                            |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "policies": [
      {
        "id": "67f1a2b3c4d5e6f7a8b9c0d1",
        "title": "Clean Water Initiative",
        "description": "Improving access to clean water in rural areas",
        "policyCode": "CLEAN123",
        "targetRegions": ["Addis Ababa", "Oromia"],
        "startDate": "2026-05-01T00:00:00Z",
        "endDate": "2026-06-30T23:59:59Z",
        "status": "active",
        "pollType": "rating",
        "averageRating": 0,
        "totalVotes": 0
      }
    ],
    "total": 10,
    "page": 1
  },
  "message": "Policies retrieved successfully",
  "timestamp": "2026-05-09T12:00:00Z"
}
```

### 3.2 Get single policy

**`GET /policies/:id`**

**Path parameter:**

| Parameter | Type   | Description                  |
| --------- | ------ | ---------------------------- |
| `id`      | string | Policy ID (MongoDB ObjectId) |

**Access rules:** Same as visibility table.

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "id": "67f1a2b3c4d5e6f7a8b9c0d1",
    "title": "Clean Water Initiative",
    "description": "Improving access to clean water in rural areas",
    "policyCode": "CLEAN123",
    "targetRegions": ["Addis Ababa", "Oromia"],
    "startDate": "2026-05-01T00:00:00Z",
    "endDate": "2026-06-30T23:59:59Z",
    "status": "active",
    "pollType": "multipleChoice",
    "pollOptions": [
      { "id": "edu", "text": "Education", "shortCode": "1" },
      { "id": "health", "text": "Healthcare", "shortCode": "2" }
    ],
    "maxSelections": 2,
    "likertLabels": [
      "Very Dissatisfied",
      "Dissatisfied",
      "Neutral",
      "Satisfied",
      "Very Satisfied"
    ],
    "rankedChoiceMaxRank": 3,
    "relevanceFactors": {
      "women": false,
      "youth": true,
      "farmers": false,
      "urban": false,
      "rural": false,
      "privateSector": false,
      "government": false
    },
    "citizenAnalyticsVisibility": {
      "showResults": true,
      "showBreakdown": false,
      "showComments": false,
      "showSentiment": false,
      "allowTimeFilter": false
    },
    "topics": ["Water", "Infrastructure"],
    "createdBy": "planner@example.com",
    "createdAt": "2026-05-01T10:00:00Z"
  },
  "message": "Policy retrieved successfully",
  "timestamp": "2026-05-09T12:00:00Z"
}
```

**Error responses (404):** Policy not found (or hidden due to visibility rules).

### 3.3 Create policy

**`POST /policies`**

**Roles:** planner, admin
**Request body:**

```json
{
  "title": "Binary Test 2026",
  "description": "Vote yes/no",
  "targetRegions": ["Addis Ababa"],
  "startDate": "2026-06-01T00:00:00Z",
  "endDate": "2026-12-31T23:59:59Z",
  "pollType": "binary", // one of: binary, multipleChoice, likert, approval, rating, rankedChoice
  "pollOptions": [
    // required for multipleChoice and rankedChoice
    { "id": "opt1", "text": "Option 1", "shortCode": "1" }
  ],
  "maxSelections": 1, // for multipleChoice
  "likertLabels": [
    // for likert, 5 strings
    "Very Dissatisfied",
    "Dissatisfied",
    "Neutral",
    "Satisfied",
    "Very Satisfied"
  ],
  "rankedChoiceMaxRank": 3, // for rankedChoice
  "relevanceFactors": {
    // all default false
    "women": false,
    "youth": true,
    "farmers": false,
    "urban": false,
    "rural": false,
    "privateSector": false,
    "government": false
  },
  "citizenAnalyticsVisibility": {
    "showResults": true,
    "showBreakdown": false,
    "showComments": false,
    "showSentiment": false,
    "allowTimeFilter": false
  },
  "topics": ["Agriculture", "Water"]
}
```

**Response (201 Created):**

```json
{
  "status": "success",
  "data": { "id": "67f1a2b3...", "policyCode": "CLEAN123" },
  "message": "Policy created as draft. You can edit it before activating.",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code               | Message                                                                            |
| ------ | ------------------ | ---------------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | `"Missing required fields: title, description, targetRegions, startDate, endDate"` |
| 400    | `VALIDATION_ERROR` | `"Start date cannot be in the past."`                                              |
| 400    | `VALIDATION_ERROR` | `"Start date must be before end date"`                                             |
| 400    | `VALIDATION_ERROR` | `"multipleChoice requires pollOptions and maxSelections >=1"`                      |
| 400    | `VALIDATION_ERROR` | `"likertLabels must have exactly 5 strings"`                                       |
| 409    | `DUPLICATE_ENTRY`  | `"Policy code already exists"` (rare)                                              |
| 500    | `INTERNAL`         | `"Failed to create policy"`                                                        |

### 3.4 Update policy (draft only)

**`PUT /policies/:id`**

**Roles:** policy owner (planner) or admin  
**Condition:** Policy status must be `draft`.

**Request body:** same fields as create (all optional). Partial updates allowed.

**Response (200 OK):** returns the updated policy object (same shape as `GET /policies/:id`).

**Error responses:**

| Status | Code               | Message                                                  |
| ------ | ------------------ | -------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | `"Start date cannot be in the past."`                    |
| 400    | `VALIDATION_ERROR` | `"Start date must be before end date"`                   |
| 403    | `FORBIDDEN`        | `"Only draft policies can be edited."`                   |
| 403    | `FORBIDDEN`        | `"You do not have permission to edit this policy"`       |
| 404    | `NOT_FOUND`        | `"Policy not found"` (or hidden due to visibility rules) |

### 3.5 Publish policy (draft → published/active)

**`PATCH /policies/:id/publish`**

**Roles:** policy owner (planner) or admin  
**Condition:** Policy status must be `draft`.

**Behaviour:**

- If current date is within `startDate` and `endDate` → status becomes `active` immediately.
- If current date is before `startDate` → status becomes `published` (auto‑activation will happen later).
- If current date is after `endDate` → error (cannot publish ended policy).

**Response (200 OK):**

```json
{
  "status": "success",
  "data": { "id": "...", "status": "active" },
  "message": "Policy activated immediately because its start date has already passed.",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code               | Message                                                       |
| ------ | ------------------ | ------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | `"Only draft policies can be published. Current status: ..."` |
| 400    | `VALIDATION_ERROR` | `"Cannot publish a policy that has already ended."`           |
| 403    | `FORBIDDEN`        | `"You do not have permission to publish this policy"`         |
| 404    | `NOT_FOUND`        | `"Policy not found"`                                          |

### 3.6 Unpublish policy (published → draft)

**`PATCH /policies/:id/unpublish`**

**Roles:** policy owner (planner) or admin  
**Condition:** Policy status must be `published`.

**Response (200 OK):**

```json
{
  "status": "success",
  "data": { "id": "...", "status": "draft" },
  "message": "Policy unpublished and moved back to draft.",
  "timestamp": "..."
}
```

### 3.7 Activate policy (published → active)

**`PATCH /policies/:id/activate`**

**Roles:** policy owner (planner) or admin  
**Condition:** Policy status must be `published`. Current date must be within `startDate` and `endDate`.

**Response (200 OK):**

```json
{
  "status": "success",
  "data": { "id": "...", "status": "active" },
  "message": "Policy activated successfully. Voting is now open.",
  "timestamp": "..."
}
```

### 3.8 Pause policy (active → paused)

**`PATCH /policies/:id/pause`**

**Roles:** policy owner (planner) or admin  
**Condition:** Policy status must be `active`.

**Response (200 OK):**

```json
{
  "status": "success",
  "data": { "id": "...", "status": "paused" },
  "message": "Policy paused. Voting temporarily disabled.",
  "timestamp": "..."
}
```

### 3.9 Resume policy (paused → active)

**`PATCH /policies/:id/resume`**

**Roles:** policy owner (planner) or admin  
**Condition:** Policy status must be `paused`. Current date must be within `startDate` and `endDate`.

**Response (200 OK):**

```json
{
  "status": "success",
  "data": { "id": "...", "status": "active" },
  "message": "Policy resumed. Voting enabled.",
  "timestamp": "..."
}
```

### 3.10 Close policy (active/paused → closed)

**`POST /policies/:id/close`**

**Roles:** policy owner (planner) or admin  
**Condition:** Policy status must be `active` or `paused`.

**Response (200 OK):**

```json
{
  "status": "success",
  "data": { "id": "...", "status": "closed" },
  "message": "Policy closed successfully. No more votes will be accepted.",
  "timestamp": "..."
}
```

### 3.11 Extend policy end date

**`PATCH /policies/:id/extend`**

**Roles:** policy owner (planner) or admin  
**Condition:** Policy status must be `active` or `paused`.

**Request body:**

```json
{ "newEndDate": "2026-07-31T23:59:59Z" }
```

**Response (200 OK):**

```json
{
  "status": "success",
  "data": { "id": "...", "endDate": "2026-07-31T23:59:59Z" },
  "message": "Policy end date updated successfully.",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code               | Message                                                |
| ------ | ------------------ | ------------------------------------------------------ |
| 400    | `VALIDATION_ERROR` | `"newEndDate must be after start date"`                |
| 400    | `VALIDATION_ERROR` | `"New end date cannot be in the past"`                 |
| 403    | `FORBIDDEN`        | `"Only active or paused policies can change end date"` |

### 3.12 Delete policy (draft or published only)

**`DELETE /policies/:id`**

**Roles:** policy owner (planner) or admin  
**Condition:** Policy status must be `draft` or `published` (not `active`, `paused`, or `closed`).

**Response (200 OK):**

```json
{
  "status": "success",
  "data": null,
  "message": "Policy deleted successfully",
  "timestamp": "..."
}
```

### 3.13 Clone policy

**`POST /policies/:id/clone`**

**Roles:** planner or admin (any policy they can view)

**Behaviour:**

- Creates a new draft policy as a copy of the original.
- Title becomes `original.title + " (Copy)"` (truncated to 200 chars).
- A fresh, unique policy code is generated.
- The logged‑in user becomes the `createdBy` owner.
- All fields (pollType, pollOptions, relevanceFactors, etc.) are copied.
- Status set to `draft`.

**Response (201 Created):**

```json
{
  "status": "success",
  "data": { "id": "...", "policyCode": "NEWCODE" },
  "message": "Policy cloned successfully. Edit the copy before activating.",
  "timestamp": "..."
}
```

### 3.14 Policy history

**`GET /policies/:id/history`**

**Roles:** policy owner (planner) or admin

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "events": [
      {
        "action": "CREATE_POLICY",
        "userId": "67f1a2b3...",
        "userRole": "planner",
        "details": {
          "title": "Clean Water Initiative",
          "policyCode": "CLEAN123"
        },
        "timestamp": "2026-05-01T10:00:00Z"
      },
      {
        "action": "ACTIVATE_POLICY",
        "userId": "67f1a2b3...",
        "userRole": "planner",
        "details": { "policyCode": "CLEAN123" },
        "timestamp": "2026-05-02T11:00:00Z"
      }
    ]
  },
  "message": "Policy history retrieved successfully",
  "timestamp": "..."
}
```

## 4. Voting & Comment Endpoints

All endpoints in this section require authentication with a valid JWT token (citizen, planner, or admin as noted).

### 4.1 Submit a vote (supports all poll types)

**`POST /votes`**

**Roles:** citizen  
**Rate limit:** 30 votes per hour per user (already in global table)

**Request body:**

```json
    {
      "policyId": "67f1a2b3c4d5e6f7a8b9c0d1",
      "value": ... ,   // format depends on pollType (see table below)
      "comment": "Optional comment (max 2000 characters)"
    }
```

**`value` formats per poll type**

| Poll Type        | `value` format                                                                  | Example                    |
| ---------------- | ------------------------------------------------------------------------------- | -------------------------- |
| `binary`         | `"yes"` or `"no"`                                                               | `"yes"`                    |
| `multipleChoice` | Array of option IDs (strings)                                                   | `["opt1", "opt3"]`         |
| `likert`         | Integer 1‑5                                                                     | `4`                        |
| `approval`       | `"approve"`, `"reject"`, or `"abstain"`                                         | `"approve"`                |
| `rating`         | Integer 1‑5                                                                     | `5`                        |
| `rankedChoice`   | Array of option IDs in order of preference (max length = `rankedChoiceMaxRank`) | `["opt2", "opt1", "opt3"]` |

**Response (201 Created):**

```json
{
  "status": "success",
  "data": {
    "voteId": "67f1a2b3...",
    "commentId": "67f1a2b3...", // or null if no comment provided
    "value": "yes"
  },
  "message": "Vote recorded successfully",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code                    | Message                                                              |
| ------ | ----------------------- | -------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`      | `"Invalid vote value for poll type binary"` (or other type mismatch) |
| 400    | `VALIDATION_ERROR`      | `"Comment too long (max 2000 characters)"`                           |
| 403    | `NOT_VERIFIED`          | `"Please verify your phone number first"`                            |
| 403    | `FORBIDDEN`             | `"Voting is temporarily paused for this policy"` (status = `paused`) |
| 403    | `FORBIDDEN`             | `"This policy is closed for voting"` (status = `closed`)             |
| 404    | `NOT_FOUND`             | `"Policy not found"` (or policy is not `active`/`paused`)            |
| 409    | `ALREADY_VOTED`         | `"You have already voted on this policy"`                            |
| 429    | `RATE_LIMIT_EXCEEDED`   | `"Too many votes. Please wait X minutes."`                           |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to submit vote"`                                            |

### 4.2 Post a comment (top‑level or reply)

**`POST /comments`**

**Roles:** citizen, planner, admin  
**Rate limit:** 10 per minute per user

**Request body:**

```json
{
  "policyId": "67f1a2b3c4d5e6f7a8b9c0d1",
  "parentCommentId": null, // or an existing comment ID to reply to
  "text": "This is a comment (1‑2000 characters)"
}
```

**Behaviour:**

- Top‑level comments (`parentCommentId` = `null`) are queued for AI processing (sentiment, keywords). Status initially `processing`.
- Replies (`parentCommentId` provided) are immediately `approved` (no AI processing, but subject to profanity filter).
- If reply, the parent comment author receives an in‑app notification (`type: "COMMENT_REPLY"`).

**Response (201 Created):**

```json
{
  "status": "success",
  "data": { "commentId": "67f1a2b3..." },
  "message": "Comment posted",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code                  | Message                                                        |
| ------ | --------------------- | -------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`    | `"policyId and text are required"`                             |
| 400    | `VALIDATION_ERROR`    | `"Comment must be 1–2000 characters"`                          |
| 403    | `FORBIDDEN`           | `"Comments only allowed on active/paused policies"`            |
| 404    | `NOT_FOUND`           | `"Policy not found"` or `"Parent comment not found in policy"` |
| 429    | `RATE_LIMIT_EXCEEDED` | `"Too many comments. Please wait a moment."`                   |

### 4.3 Report a comment

**`POST /comments/:commentId/report`**

**Roles:** any authenticated user  
**Rate limit:** 5 reports per minute per user

**Path parameter:**

| Parameter   | Type   | Description |
| ----------- | ------ | ----------- |
| `commentId` | string | Comment ID  |

**Request body:**

```json
{ "reason": "spam" } // one of: spam, hate speech, off‑topic, other
```

**Behaviour:**

- Increments `reportCount` on the comment.
- When `reportCount >= 3`, comment status changes to `flagged` and moderators (policy owner + associates) receive a notification (`type: "COMMENT_FLAGGED"`).

**Response (200 OK):**

```json
{
  "status": "success",
  "data": null,
  "message": "Comment reported. Moderators will review.",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code                  | Message                            |
| ------ | --------------------- | ---------------------------------- |
| 400    | `VALIDATION_ERROR`    | `"Reason required"`                |
| 404    | `NOT_FOUND`           | `"Comment not found"`              |
| 429    | `RATE_LIMIT_EXCEEDED` | `"Too many reports. Please wait."` |

### 4.4 Moderate a comment (planner/admin only)

**`PUT /comments/:commentId/moderate`**

**Roles:** policy owner (planner) or admin  
**Rate limit:** 30 per minute per user

**Path parameter:**

| Parameter   | Type   | Description |
| ----------- | ------ | ----------- |
| `commentId` | string | Comment ID  |

**Request body (all fields optional):**

```json
{
  "status": "approved", // or "flagged", "deleted"
  "sentiment": { "label": "positive", "confidence": 0.95 },
  "keywords": ["water", "access"],
  "text": "New comment text (if editing)"
}
```

**Response (200 OK):**

```json
{
  "status": "success",
  "data": { "commentId": "...", "status": "approved" },
  "message": "Comment moderated",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code        | Message                                    |
| ------ | ----------- | ------------------------------------------ |
| 403    | `FORBIDDEN` | `"No permission to moderate this comment"` |
| 404    | `NOT_FOUND` | `"Comment not found"`                      |

### 4.5 Appeal a moderation decision (citizen)

**`POST /comments/:commentId/appeal`**

**Roles:** only the original author of the comment  
**Rate limit:** 3 appeals per day per user

**Path parameter:**

| Parameter   | Type   | Description |
| ----------- | ------ | ----------- |
| `commentId` | string | Comment ID  |

**Request body:**

```json
{ "reason": "The comment was not offensive. Please reinstate." }
```

**Behaviour:**

- Creates an embedded appeal record on the comment with status `pending`.
- Notifies the policy owner (`type: "COMMENT_APPEAL"`).

**Response (200 OK):**

```json
{
  "status": "success",
  "data": null,
  "message": "Appeal submitted. The policy maker will review.",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code                  | Message                                              |
| ------ | --------------------- | ---------------------------------------------------- |
| 400    | `VALIDATION_ERROR`    | `"Appeal reason required"`                           |
| 403    | `FORBIDDEN`           | `"You can only appeal your own comments"`            |
| 400    | `VALIDATION_ERROR`    | `"Only flagged or deleted comments can be appealed"` |
| 429    | `RATE_LIMIT_EXCEEDED` | `"Too many appeals. Please try again tomorrow."`     |

### 4.6 Resolve an appeal (planner/admin)

**`POST /comments/:commentId/resolve-appeal`**

**Roles:** policy owner (planner) or admin

**Path parameter:**

| Parameter   | Type   | Description |
| ----------- | ------ | ----------- |
| `commentId` | string | Comment ID  |

**Request body:**

```json
{
  "decision": "approve", // or "reject"
  "note": "After review, the comment is acceptable."
}
```

**Behaviour:**

- If `approve`: comment status becomes `approved` and appeal status `resolved_approved`.
- If `reject`: comment status remains `flagged` and appeal status `resolved_rejected`.
- Notifies the comment author (`type: "APPEAL_RESOLVED"`).

**Response (200 OK):**

```json
{
  "status": "success",
  "data": null,
  "message": "Appeal approved. Comment status updated.",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code               | Message                                  |
| ------ | ------------------ | ---------------------------------------- |
| 400    | `VALIDATION_ERROR` | `"Decision must be approve or reject"`   |
| 403    | `FORBIDDEN`        | `"No permission to resolve this appeal"` |
| 404    | `NOT_FOUND`        | `"Comment not found"`                    |
| 400    | `VALIDATION_ERROR` | `"No pending appeal for this comment"`   |

## 5. Analytics Endpoints

**Roles required:** planner or admin (all endpoints in this section)

**Access rules for analytics endpoints (all endpoints under /analytics):**

- For **draft** or **published** policies:
  - The **policy owner** (planner who created it) can access analytics (but will receive a 400 error with message "Policy is not active yet (no analytics available)").
  - Any **other planner** receives a 404 Not Found (the policy is hidden).

- For **active**, **paused**, or **closed** policies:
  - The **policy owner** has full access.
  - Any **associate** (planner assigned via `/planners/policies/:policyId/associates`) with the `view_analytics` permission has access to all analytics endpoints (including export if `export_data` is also granted).
  - Any **other planner** (not owner, not associate) receives a 404 Not Found.

- **Admins** always have full access to all analytics, regardless of policy status or ownership.

**Note for associates:** To grant an associate access to a specific analytics endpoint, they must have the corresponding permission (`view_analytics` for viewing, `export_data` for CSV export). The permissions are checked by the middleware before the request is processed.

### 5.1 Policy analytics (summary)

**`GET /analytics/:policyId`**

**Query parameters (all optional):**

| Parameter    | Type   | Description                                                                                     |
| ------------ | ------ | ----------------------------------------------------------------------------------------------- |
| `startDate`  | string | ISO date (e.g., `2026-04-01`). Filters votes & comments created on or after this date.          |
| `endDate`    | string | ISO date. Filters votes & comments created on or before this date.                              |
| `gender`     | string | `male`, `female`, `non-binary`, `prefer-not-to-say`                                             |
| `ageRange`   | string | `18-24`, `25-34`, `35-44`, `45-54`, `55+`                                                       |
| `occupation` | string | `student`, `farmer`, `merchant`, `government-employee`, `private-sector`, `unemployed`, `other` |
| `education`  | string | `no-formal`, `primary`, `secondary`, `diploma`, `bachelors`, `postgraduate`                     |
| `region`     | string | Region name (e.g., `Addis Ababa`)                                                               |

**Response (200 OK) – example for `binary` policy:**

```json
{
  "status": "success",
  "data": {
    "policyId": "67f1a2b3c4d5e6f7a8b9c0d1",
    "title": "Binary Test 2026",
    "pollType": "binary",
    "totalVotes": 1,
    "yesCount": 1,
    "noCount": 0,
    "yesPercentage": "100.0",
    "noPercentage": "0.0",
    "sentimentCounts": { "positive": 0, "negative": 0, "neutral": 0 },
    "topKeywords": []
  },
  "message": "Analytics retrieved successfully",
  "timestamp": "..."
}
```

**Response for `multipleChoice` policy:**

```json
    {
      "status": "success",
      "data": {
        "policyId": "...",
        "title": "Sector Funding",
        "pollType": "multipleChoice",
        "totalVotes": 100,
        "results": [
          { "id": "edu", "text": "Education", "count": 45, "percentage": "45.0" },
          { "id": "health", "text": "Healthcare", "count": 30, "percentage": "30.0" }
        ],
        "sentimentCounts": { ... },
        "topKeywords": [...]
      }
    }
```

**Response for `likert`/`rating` policy:**

```json
{
  "data": {
    "pollType": "rating",
    "totalVotes": 120,
    "average": 4.2,
    "distribution": { "1": 5, "2": 10, "3": 20, "4": 35, "5": 50 }
  }
}
```

**Response for `approval` policy:**

```json
{
  "data": {
    "pollType": "approval",
    "totalVotes": 80,
    "approveCount": 40,
    "rejectCount": 25,
    "abstainCount": 15,
    "approvePercentage": "50.0",
    "rejectPercentage": "31.2",
    "abstainPercentage": "18.8",
    "netApproval": 15
  }
}
```

**Response for `rankedChoice` policy (simplified):**

```json
{
  "data": {
    "pollType": "rankedChoice",
    "totalVotes": 60,
    "firstChoiceResults": [
      {
        "id": "opt1",
        "text": "Roads",
        "firstChoiceCount": 20,
        "percentage": "33.3"
      }
    ]
  }
}
```

### 5.2 Export analytics as CSV

**`GET /analytics/:policyId/export`**

**Query parameters:** same as 5.1 (`startDate`, `endDate`, `gender`, `ageRange`, `occupation`, `education`, `region`).

**Response:** `text/csv` file attachment. Example content:

    voteId,channel,value,region,ageRange,gender,occupation,education,createdAt
    67f1a2b3...,app,opt1|opt2,Addis Ababa,25-34,male,private-sector,bachelors,2026-05-09T01:05:48.370Z

### 5.3 Get paginated comments (with filters)

**`GET /analytics/:policyId/comments`**

**Query parameters (all optional):**

| Parameter         | Type    | Default | Description                                          |
| ----------------- | ------- | ------- | ---------------------------------------------------- |
| `page`            | integer | 1       | Page number (1‑based)                                |
| `limit`           | integer | 20      | Items per page (max 100)                             |
| `sentiment`       | string  | none    | Filter by `positive`, `negative`, or `neutral`       |
| `status`          | string  | none    | Filter by `approved`, `flagged`, `deleted`           |
| `language`        | string  | none    | Filter by detected language (`am`, `om`, `ti`, `en`) |
| `parentCommentId` | string  | none    | Filter replies to a specific top‑level comment       |
| `startDate`       | string  | none    | ISO date                                             |
| `endDate`         | string  | none    | ISO date                                             |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "comments": [
      {
        "id": "67f1a2b3...",
        "text": "This policy is excellent!",
        "sentiment": { "label": "positive", "confidence": 0.95 },
        "keywords": ["excellent"],
        "status": "approved",
        "isOfficialReply": false,
        "createdAt": "2026-05-09T01:17:31.540Z",
        "userEmail": "citizen@example.com"
      }
    ],
    "total": 50,
    "page": 1
  },
  "message": "Comments retrieved successfully",
  "timestamp": "..."
}
```

### 5.4 Heatmap (unified geographic & time‑series)

**`GET /analytics/heatmap`**

This endpoint aggregates voting data over time and optionally by region.

**Roles:** planner, admin

**Query parameters (all optional):**

| Parameter   | Type    | Default | Description                                                                                                                                                   |
| ----------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `startDate` | string  | none    | ISO date. Filters votes and comments created on or after this date.                                                                                           |
| `endDate`   | string  | none    | ISO date. Filters votes and comments created on or before this date.                                                                                          |
| `interval`  | string  | `week`  | Grouping interval: `day`, `week`, or `month`.                                                                                                                 |
| `policyId`  | string  | none    | If provided, only votes/comments belonging to that policy are included. Otherwise, data for **all policies** (subject to planner's visibility) is aggregated. |
| `byRegion`  | boolean | `false` | If `true`, the response is grouped by region within each time bucket (geographic heatmap). If `false`, the response is a simple time series (global totals).  |
| `regions`   | string  | none    | Comma‑separated list of region names, e.g., `Addis Ababa,Oromia`. Only applicable when `byRegion=true`.                                                       |

**Response when `byRegion=false` (global time series):**

```json
{
  "status": "success",
  "data": {
    "interval": "week",
    "data": [
      {
        "period": "2026-19",
        "totalVotes": 8,
        "averageRating": 4.1,
        "yesPercentage": "62.5" // for binary policies
      }
    ]
  },
  "message": "Heatmap retrieved",
  "timestamp": "..."
}
```

**Response when `byRegion=true` (geographic heatmap):**

```json
{
  "status": "success",
  "data": {
    "interval": "week",
    "data": [
      {
        "period": "2026-19",
        "region": "Addis Ababa",
        "totalVotes": 6,
        "averageRating": "4.50",
        "yesPercentage": "16.7"
      }
    ]
  },
  "message": "Heatmap retrieved",
  "timestamp": "..."
}
```

### 5.5 Timeseries (vote count and ratings over time)

**`GET /analytics/:policyId/timeseries`**

**Roles:** planner, admin

**Query parameters (all optional):**

| Parameter   | Type   | Default | Description                       |
| ----------- | ------ | ------- | --------------------------------- |
| `bucket`    | string | `day`   | `hour`, `day`, `week`, or `month` |
| `startDate` | string | none    | ISO date                          |
| `endDate`   | string | none    | ISO date                          |

**Response (200 OK) – for binary policy:**

```json
{
  "status": "success",
  "data": {
    "bucket": "week",
    "data": [
      { "bucket": "2026-19", "totalVotes": 5, "yesCount": 3, "noCount": 2 }
    ]
  },
  "message": "Timeseries retrieved",
  "timestamp": "..."
}
```

**Response for rating/likert policy:**

```json
{
  "data": {
    "bucket": "day",
    "data": [{ "bucket": "2026-05-09", "totalVotes": 10, "averageRating": 4.2 }]
  }
}
```

### 5.6 Correlation (for multipleChoice policies only)

**`GET /analytics/:policyId/correlation`**

**Roles:** planner, admin

**Query parameters:**

| Parameter    | Type    | Default | Description                            |
| ------------ | ------- | ------- | -------------------------------------- |
| `minSupport` | integer | 10      | Minimum co‑occurrence count to include |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "correlations": [
      {
        "optionA": "edu",
        "optionB": "health",
        "coOccurrenceCount": 15,
        "percentage": "25.0"
      }
    ],
    "totalVotes": 100
  },
  "message": "Correlation matrix retrieved",
  "timestamp": "..."
}
```

### 5.7 Demographic breakdown

**`GET /analytics/:policyId/demographics`**

**Roles:** planner, admin

**Query parameters:**

| Parameter   | Type   | Required | Description (one of)                                      |
| ----------- | ------ | -------- | --------------------------------------------------------- |
| `dimension` | string | yes      | `ageRange`, `gender`, `occupation`, `education`, `region` |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "dimension": "ageRange",
    "data": [
      { "ageRange": "25-34", "totalVotes": 20, "averageRating": 4.2 },
      { "ageRange": "35-44", "totalVotes": 12, "averageRating": 3.8 }
    ]
  },
  "message": "Demographic breakdown retrieved",
  "timestamp": "..."
}
```

## 6. Admin Endpoints

Role required: **`admin`** (all endpoints in this section)

### 6.1 Planner Management

#### 6.1.1 List planners

**`GET /admin/planners`**

Query parameters (all optional):

| Parameter | Type    | Default | Description                                    |
| --------- | ------- | ------- | ---------------------------------------------- |
| active    | boolean | none    | Filter by true (active) or false (deactivated) |
| page      | integer | 1       | Page number (1‑based)                          |
| limit     | integer | 10      | Items per page (max 100)                       |

Response (200 OK):

```json
{
  "status": "success",
  "data": {
    "total": 5,
    "page": 1,
    "pages": 1,
    "planners": [
      {
        "_id": "...",
        "email": "planner@example.com",
        "region": "",
        "role": "planner",
        "verified": true,
        "active": true,
        "createdAt": "..."
      }
    ]
  },
  "message": "Planners retrieved successfully",
  "timestamp": "..."
}
```

Error responses:

| Status | Code                  | Message                                                |
| ------ | --------------------- | ------------------------------------------------------ |
| 403    | FORBIDDEN             | "Access denied. Insufficient permissions."             |
| 500    | INTERNAL_SERVER_ERROR | "Failed to retrieve planners. Please try again later." |

#### 6.1.2 Create planner

**`POST /admin/planners`**

Request body:

| Field    | Type   | Required | Description                          |
| -------- | ------ | -------- | ------------------------------------ |
| email    | string | yes      | Valid email address (must be unique) |
| password | string | yes      | Min 6 characters                     |

Response (201 Created):

```json
{
  "status": "success",
  "data": {
    "id": "...",
    "email": "newplanner@example.com"
  },
  "message": "Planner account created successfully",
  "timestamp": "..."
}
```

Error responses:

| Status | Code                  | Message                                       |
| ------ | --------------------- | --------------------------------------------- |
| 400    | VALIDATION_ERROR      | "Email and password are required"             |
| 409    | DUPLICATE_ENTRY       | "A user with this email already exists"       |
| 500    | INTERNAL_SERVER_ERROR | "Failed to create planner. Please try again." |

#### 6.1.3 Update planner

**`PUT /admin/planners/:id`**

Path parameter:

| Parameter | Type   | Description     |
| --------- | ------ | --------------- |
| id        | string | Planner user ID |

Request body (fields optional):

| Field    | Type    | Description                                  |
| -------- | ------- | -------------------------------------------- |
| password | string  | New password (min 6 chars)                   |
| active   | boolean | Set to false to deactivate, true to activate |

Response (200 OK):

```json
{
  "status": "success",
  "data": {
    "id": "...",
    "email": "planner@example.com",
    "active": true
  },
  "message": "Planner updated successfully",
  "timestamp": "..."
}
```

Error responses:

| Status | Code                  | Message                                       |
| ------ | --------------------- | --------------------------------------------- |
| 404    | NOT_FOUND             | "Planner not found"                           |
| 500    | INTERNAL_SERVER_ERROR | "Failed to update planner. Please try again." |

#### 6.1.4 Toggle planner status

**`PUT /admin/planners/:id/status`**

Path parameter:

| Parameter | Type   | Description     |
| --------- | ------ | --------------- |
| id        | string | Planner user ID |

Request body:

| Field  | Type    | Required | Description                           |
| ------ | ------- | -------- | ------------------------------------- |
| active | boolean | yes      | true to activate, false to deactivate |

Response (200 OK):

```json
{
  "status": "success",
  "data": {
    "plannerId": "...",
    "active": false
  },
  "message": "Planner account deactivated successfully",
  "timestamp": "..."
}
```

Error responses:

| Status | Code                  | Message                                 |
| ------ | --------------------- | --------------------------------------- |
| 400    | VALIDATION_ERROR      | "active field is required (true/false)" |
| 404    | NOT_FOUND             | "Planner not found"                     |
| 500    | INTERNAL_SERVER_ERROR | "Failed to update planner status"       |

### 6.2 Citizen Management

#### 6.2.1 List citizens

**`GET /admin/users/citizens`**

Query parameters (all optional):

| Parameter | Type    | Default | Description                                    |
| --------- | ------- | ------- | ---------------------------------------------- |
| active    | boolean | none    | Filter by true (active) or false (deactivated) |
| page      | integer | 1       | Page number (1‑based)                          |
| limit     | integer | 10      | Items per page (max 100)                       |

Response (200 OK):

```json
{
  "status": "success",
  "data": {
    "total": 25,
    "page": 1,
    "pages": 3,
    "citizens": [
      {
        "_id": "...",
        "email": "citizen@example.com",
        "region": "Addis Ababa",
        "role": "citizen",
        "verified": true,
        "active": true,
        "createdAt": "..."
      }
    ]
  },
  "message": "Citizens retrieved successfully",
  "timestamp": "..."
}
```

Error responses:

| Status | Code                  | Message                       |
| ------ | --------------------- | ----------------------------- |
| 500    | INTERNAL_SERVER_ERROR | "Failed to retrieve citizens" |

#### 6.2.2 Toggle citizen status

**`PUT /admin/users/:id/status`**

Path parameter:

| Parameter | Type   | Description     |
| --------- | ------ | --------------- |
| id        | string | Citizen user ID |

Request body:

| Field  | Type    | Required | Description                           |
| ------ | ------- | -------- | ------------------------------------- |
| active | boolean | yes      | true to activate, false to deactivate |

Response (200 OK):

```json
{
  "status": "success",
  "data": {
    "userId": "...",
    "active": false
  },
  "message": "Citizen account deactivated successfully",
  "timestamp": "..."
}
```

Error responses:

| Status | Code                  | Message                                 |
| ------ | --------------------- | --------------------------------------- |
| 400    | VALIDATION_ERROR      | "active field is required (true/false)" |
| 404    | NOT_FOUND             | "Citizen not found"                     |
| 500    | INTERNAL_SERVER_ERROR | "Failed to update citizen status"       |

### 6.3 Comment Moderation

All endpoints in this section require the **Admin** role.

#### 6.3.1 Get pending comments

**`GET /admin/comments/pending`**

Returns all comments that the AI could not process and are awaiting manual review.

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "comments": [
      {
        "_id": "67f1a2b3...",
        "voteId": "67f1a2b3...",
        "policyId": {
          "_id": "...",
          "title": "Clean Water Initiative"
        },
        "userId": {
          "_id": "...",
          "email": "user@example.com"
        },
        "comment": "Text that AI could not process",
        "status": "pending_review",
        "createdAt": "2026-04-01T10:00:00Z"
      }
    ]
  },
  "message": "Pending comments retrieved successfully",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code                    | Message                                 |
| ------ | ----------------------- | --------------------------------------- |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to retrieve pending comments"` |

#### 6.3.2 Update comment (manual review)

**`PUT /admin/comments/:id`**

Path parameter:

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Comment ID  |

Request body (fields optional):

| Field       | Type             | Description                                                    |
| ----------- | ---------------- | -------------------------------------------------------------- |
| `sentiment` | object           | `{ "label": "positive/negative/neutral", "confidence": 0.95 }` |
| `keywords`  | array of strings | e.g., `["water", "access"]`                                    |
| `processed` | boolean          | Set to `true` after manual review                              |
| `status`    | string           | `"processed"` or `"pending_review"`                            |

**Response (200 OK):** returns the updated comment object (same structure as in 6.3.1 but with the modified fields).

**Error responses:**

| Status | Code                    | Message                      |
| ------ | ----------------------- | ---------------------------- |
| 404    | `NOT_FOUND`             | `"Comment not found"`        |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to update comment"` |

#### 6.3.3 Retry single comment

**`POST /admin/comments/:id/retry`**

Path parameter:

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Comment ID  |

Resets the comment to `"processing"` so that the AI worker will attempt to analyze it again.

**Response (200 OK):**

```json
{
  "status": "success",
  "data": { "commentId": "..." },
  "message": "Comment queued for retry. The AI worker will process it shortly.",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code                    | Message                               |
| ------ | ----------------------- | ------------------------------------- |
| 404    | `NOT_FOUND`             | `"Comment not found"`                 |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to queue comment for retry"` |

#### 6.3.4 Retry all pending comments

**`POST /admin/comments/retry-all`**

Resets all comments with `status: "pending_review"` to `"processing"` so they will be reprocessed by the AI worker.

**Response (200 OK):**

```json
{
  "status": "success",
  "data": { "updatedCount": 5 },
  "message": "5 comments queued for retry",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code                    | Message                                |
| ------ | ----------------------- | -------------------------------------- |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to queue comments for retry"` |

### 6.3.5 Delete comment

**`DELETE /admin/comments/:id`**

Permanently removes a comment. The associated vote remains unchanged (the vote rating and channel stay).

**Path parameter:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Comment ID  |

**Role required:** `admin`

**Response (200 OK):**

```json
{
  "status": "success",
  "data": null,
  "message": "Comment deleted successfully",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code        | Message                      |
| ------ | ----------- | ---------------------------- |
| 404    | `NOT_FOUND` | `"Comment not found"`        |
| 500    | `INTERNAL`  | `"Failed to delete comment"` |

## 6.4 Admin Dashboard & Monitoring

### 6.4.1 Dashboard statistics

**`GET /admin/dashboard/stats`**

Returns platform-wide counts and AI health.

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "users": { "total": 22, "active": 22, "verified": 22 },
    "planners": { "total": 2, "active": 2 },
    "policies": { "total": 6, "draft": 0, "active": 5, "closed": 1 },
    "votes": { "total": 123, "app": 98, "sms": 25, "averageRating": 4.2 },
    "comments": { "total": 80, "pendingReview": 3, "processed": 77 },
    "aiHealth": { "status": "ok", "pendingComments": 3, "failedComments": 0 }
  },
  "message": "Dashboard statistics retrieved successfully",
  "timestamp": "..."
}
```

**Notes:**

- `aiHealth.status` is `"ok"` when AI service is reachable, otherwise `"unreachable"`.
- `aiHealth.pendingComments` and `aiHealth.failedComments` are from your database, not the AI service.

### 6.4.2 Platform trends

**`GET /admin/trends`**

Query parameters (all optional):

| Parameter  | Type    | Default | Description                         |
| ---------- | ------- | ------- | ----------------------------------- |
| `interval` | string  | `day`   | Grouping: `day`, `week`, or `month` |
| `days`     | integer | 30      | Number of days to look back         |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "interval": "day",
    "data": [
      { "date": "2026-04-27", "votes": 1, "avgRating": 4.0, "newUsers": 22 }
    ]
  },
  "message": "Trends retrieved successfully",
  "timestamp": "..."
}
```

`date` format depends on `interval`:

- `day`: `YYYY-MM-DD`
- `week`: `YYYY-Www` (e.g., `2026-W17`)
- `month`: `YYYY-MM`

## 6.4.3 View audit logs

**`GET /admin/audit-logs`**

Query parameters (all optional):

| Parameter   | Type    | Description                                        |
| ----------- | ------- | -------------------------------------------------- |
| `page`      | integer | Page number (default 1)                            |
| `limit`     | integer | Items per page (default 20, max 100)               |
| `action`    | string  | Filter by action (e.g., `LOGIN`, `CREATE_PLANNER`) |
| `userId`    | string  | Filter by user ID (MongoDB ObjectId)               |
| `startDate` | string  | ISO date (e.g., `2026-04-01T00:00:00Z`)            |
| `endDate`   | string  | ISO date                                           |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "logs": [
      {
        "_id": "...",
        "userId": { "_id": "...", "email": "admin@...", "role": "admin" },
        "userRole": "admin",
        "action": "CREATE_PLANNER",
        "targetType": "User",
        "targetId": "...",
        "details": { "email": "planner@..." },
        "ipAddress": "::1",
        "userAgent": "PostmanRuntime/...",
        "timestamp": "..."
      }
    ],
    "total": 110,
    "page": 1,
    "pages": 11
  },
  "message": "Audit logs retrieved successfully",
  "timestamp": "..."
}
```

### 6.4.4 Export audit logs (CSV)

**`GET /admin/audit-logs/export`**

Same query parameters as `GET /admin/audit-logs` (page/limit ignored – exports all matching logs).

**Response (200 OK):**

- Content‑Type: `text/csv`
- Content‑Disposition: `attachment; filename="audit-logs-<timestamp>.csv"`

### 6.4.5 AI service health

**`GET /admin/ai/health`**

Returns the health status of the AI service plus comment queue statistics.

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "status": "ok", // or "unreachable"
    "pendingComments": 3,
    "failedComments": 0
  },
  "message": "AI service health retrieved",
  "timestamp": "..."
}
```

If the AI service is unreachable, `status` is `"unreachable"` and an `error` field may be present (e.g., `"Request failed with status code 404"`).

## 6.5 Password Reset (Admin) – Admin‑initiated

### 6.5.1 Initiate password reset for a user

**`POST /admin/users/:id/initiate-password-reset`**

**Role required:** `admin`

Sends a password reset email to the target user (citizen or planner). The email contains a secure token that the user can use with `POST /auth/reset-password` to set a new password. The admin never sees the password.

**Path parameter:**

| Parameter | Type   | Description                  |
| --------- | ------ | ---------------------------- |
| `id`      | string | User ID (citizen or planner) |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": null,
  "message": "Password reset email sent to user@example.com. The user will receive a link to set a new password.",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code                    | Message                                                  |
| ------ | ----------------------- | -------------------------------------------------------- |
| 403    | `FORBIDDEN`             | `"Use /auth/forgot-password to reset your own password"` |
| 404    | `NOT_FOUND`             | `"User not found"`                                       |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to initiate password reset"`                    |

**Note:** This endpoint does not return a token to the admin. The reset link is sent directly to the user’s email.

## 7. User Profile Endpoints

Role required: authenticated (citizen, planner, or admin) – all endpoints in this section

### 7.1 Get own profile

**`GET /users/me`**

Response (200 OK):

```json
{
  "status": "success",
  "data": {
    "\_id": "...",
    "email": "user@example.com",
    "region": "Addis Ababa",
    "role": "citizen",
    "verified": true,
    "active": true,
    "createdAt": "..."
  },
  "message": "User profile retrieved successfully",
  "timestamp": "..."
}
```

Notes:

-passwordHash and phoneHash are never returned.
-verified indicates if OTP verification is complete.
-active indicates if account is enabled (deactivated users cannot log in).

Error responses:

| Status | Code                  | Message                             |
| ------ | --------------------- | ----------------------------------- |
| 401    | UNAUTHORIZED          | "Access denied. No token provided." |
| 404    | NOT_FOUND             | "User not found"                    |
| 500    | INTERNAL_SERVER_ERROR | "Failed to retrieve user profile"   |

### 7.2 Update profile

**`PUT /users/me`**

Request body (only `region` allowed):

```json
{
  "region": "Oromia"
}
```

Response (200 OK): returns the updated user object (same shape as GET /users/me).

**Error if `email` is provided:**

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "No valid fields provided for update (only region is allowed)"
  }
}
```

**Error if `email` is provided:**

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "No valid fields provided for update (only region is allowed)"
  }
}
```

**Error responses (other):**
| Status | Code | Message |
| ------ | --------------------- | ------------------------------------- |
| 400 | VALIDATION_ERROR | "No valid fields provided for update" |
| 404 | NOT_FOUND | "User not found" |
| 500 | INTERNAL_SERVER_ERROR | "Failed to update user profile" |

### 7.3 Change password

**`PUT /users/me/password`**

Request body:

| Field           | Type   | Required | Description                     |
| --------------- | ------ | -------- | ------------------------------- |
| currentPassword | string | yes      | User's current password         |
| newPassword     | string | yes      | New password (min 6 characters) |

Response (200 OK):

```json
{
  "status": "success",
  "data": null,
  "message": "Password changed successfully",
  "timestamp": "..."
}
```

Error responses:

| Status | Code                  | Message                                          |
| ------ | --------------------- | ------------------------------------------------ |
| 400    | VALIDATION_ERROR      | "Current password and new password are required" |
| 401    | INVALID_CREDENTIALS   | "Current password is incorrect"                  |
| 404    | NOT_FOUND             | "User not found"                                 |
| 500    | INTERNAL_SERVER_ERROR | "Failed to change password"                      |

### 7.4 Get user history (votes and comments)

**`GET /users/me/history`**

Returns all votes cast by the authenticated user. For each vote, if a comment was added (either immediately or later), the comment text and AI sentiment analysis are included.

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "history": [
      {
        "id": "67f1a2b3c4d5e6f7a8b9c0d1",
        "policy": {
          "id": "67f1a2b3c4d5e6f7a8b9c0d2",
          "title": "Clean Water Initiative",
          "policyCode": "CLEAN123"
        },
        "rating": 5,
        "comment": "Great policy!",
        "channel": "app",
        "sentiment": "positive",
        "createdAt": "2026-04-01T10:00:00Z"
      }
    ]
  },
  "message": "User history retrieved successfully",
  "timestamp": "..."
}
```

**Notes:**

- `sentiment` may be `null` if AI processing hasn't completed or if the vote has no comment.
- `policy` may be `null` if the policy was deleted (the vote remains for analytics).
- `comment` is `null` for votes that never received a comment.

**Error responses:**

| Status | Code                    | Message                        |
| ------ | ----------------------- | ------------------------------ |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to retrieve history"` |

### 7.5 Delete account (anonymise)

**`DELETE /users/me`**

Permanently anonymises and deactivates the user account. The user cannot log in again. All feedback submissions remain (for analytics) but are disassociated from the user (userId is removed).

Response (200 OK):

```json
{
  "status": "success",
  "data": null,
  "message": "Account deleted successfully. Your data has been anonymized.",
  "timestamp": "..."
}
```

Error responses:

| Status | Code                  | Message                    |
| ------ | --------------------- | -------------------------- |
| 404    | NOT_FOUND             | "User not found"           |
| 500    | INTERNAL_SERVER_ERROR | "Failed to delete account" |

### 7.6 Request email change

**`POST /users/me/email/request`**

**Authentication required (citizen, planner, admin).**  
Sends an OTP to the **new email address** to verify ownership. The old email remains unchanged until the OTP is verified.  
**Rate limit:** 3 requests per hour per user.

**Request body:**

```json
{
  "newEmail": "newaddress@example.com"
}
```

Response (200 OK):

```json
{
  "status": "success",
  "data": null,
  "message": "Verification code sent to the new email address. It expires in 5 minutes.",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code                | Message                                                   |
| ------ | ------------------- | --------------------------------------------------------- |
| 400    | VALIDATION_ERROR    | "New email is required"                                   |
| 409    | DUPLICATE_ENTRY     | "Email already in use by another account"                 |
| 429    | RATE_LIMIT_EXCEEDED | "Too many email change requests. Please try again later." |

### 7.7 Verify email change

**`POST /users/me/email/verify`**

**Authentication required.**  
Verifies the OTP sent to the new email and updates the user's email address permanently.

**Request body:**

```json
{
  "code": "123456"
}
```

Response (200 OK):

```json
{
  "status": "success",
  "data": null,
  "message": "Email address updated successfully.",
  "timestamp": "..."
}
```

**Error responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | `"Verification code is required"` |
| 400 | `VALIDATION_ERROR` | `"No pending email change request or code expired. Please request a new one."` |
| 400 | `VALIDATION_ERROR` | `"Invalid verification code"` |
| 429 | `RATE_LIMIT_EXCEEDED` | `"Too many verification attempts. Please request a new code."` |

### 7.8 Get notifications

**`GET /users/me/notifications`**

**Authentication required** (citizen, planner, admin).

Query parameters (all optional):

| Parameter    | Type    | Default | Description                                |
| ------------ | ------- | ------- | ------------------------------------------ |
| `page`       | integer | 1       | Page number (1‑based)                      |
| `limit`      | integer | 20      | Items per page (max 100)                   |
| `unreadOnly` | boolean | false   | If true, returns only unread notifications |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "notifications": [
      {
        "_id": "67f1a2b3...",
        "type": "POLICY_CLOSED",
        "title": "Policy closed: Clean Water Initiative",
        "message": "The policy \"Clean Water Initiative\" has closed. Final average rating: 4.2 stars (87 votes).",
        "data": { "policyId": "...", "avgRating": 4.2, "totalVotes": 87 },
        "read": false,
        "createdAt": "2026-04-29T12:00:00Z"
      }
    ],
    "total": 1,
    "page": 1
  },
  "message": "Notifications retrieved successfully",
  "timestamp": "..."
}
```

**Error responses:**
| Status | Code | Message |
| ------ | ----------------------- | ------------------------------- |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 500 | `INTERNAL_SERVER_ERROR` | `"Failed to retrieve notifications"` |

### 7.9 Mark a single notification as read

**`PATCH /users/me/notifications/:id/read`**

**Authentication required.**

**Path parameter:**

| Parameter | Type   | Description     |
| --------- | ------ | --------------- |
| `id`      | string | Notification ID |

**Response (200 OK):** returns the updated notification object with `"read": true`.

**Error responses:**

| Status | Code        | Message                                 |
| ------ | ----------- | --------------------------------------- |
| 404    | `NOT_FOUND` | `"Notification not found"`              |
| 500    | `INTERNAL`  | `"Failed to mark notification as read"` |

### 7.10 Mark all notifications as read

**`PATCH /users/me/notifications/read-all`**

**Authentication required.**

**Response (200 OK):**

```json
{
  "status": "success",
  "data": { "modifiedCount": 5 },
  "message": "All notifications marked as read",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code       | Message                                  |
| ------ | ---------- | ---------------------------------------- |
| 500    | `INTERNAL` | `"Failed to mark notifications as read"` |

## 8. SMS Simulation (Public)

These endpoints simulate an SMS gateway. They return plain text, not JSON.

- **Rate limiting:** Only the `RATE` command is limited to 3 votes per 24 hours per phone number(using Redis).
- All other commands (`HELP`, `SUBSCRIBE`, `STOP`, `POLICIES`, `STATUS`, `MYVOTES`, `RESULTS`) are not subject to the daily vote limit, but are still protected by the global IP rate limit (100 requests per 15 minutes).

**Subscription required** for most commands.  
A user must first send `SUBSCRIBE` to register their phone number. Once subscribed, they can use all commands.  
Unsubscribed users who send any command other than `SUBSCRIBE` or `STOP` receive a reminder to subscribe.

### 8.1 Send SMS command

**`POST /sms/receive`**

**Request body** (JSON or form‑encoded):

| Field     | Type   | Required | Description                        |
| --------- | ------ | -------- | ---------------------------------- |
| `phone`   | string | yes      | Phone number (e.g., +251912345678) |
| `message` | string | yes      | Command (case‑insensitive)         |

**Supported commands (for subscribed users):**

| Command    | Format              | Description                                        |
| ---------- | ------------------- | -------------------------------------------------- |
| `RATE`     | `RATE <code> <1-5>` | Vote on an active policy (max 3 votes/day)         |
| `STATUS`   | `STATUS <code>`     | Get current average rating of an active policy     |
| `POLICIES` | `POLICIES`          | List all currently active policies (code + title)  |
| `MYVOTES`  | `MYVOTES`           | Show policies you have voted on, with their status |
| `RESULTS`  | `RESULTS <code>`    | Get final results of a closed policy               |
| `HELP`     | `HELP`              | Show this help message                             |

**SMS vote limitations by poll type:**

| Poll Type        | SMS support | Behaviour                                                                           |
| ---------------- | ----------- | ----------------------------------------------------------------------------------- |
| `binary`         | Yes         | `RATE CODE YES` or `RATE CODE NO`                                                   |
| `multipleChoice` | **No**      | `"This policy requires multiple choice voting. Please use the mobile app to vote."` |
| `likert`         | Yes         | `RATE CODE 1` to `5`                                                                |
| `approval`       | Yes         | `RATE CODE APPROVE`, `REJECT`, or `ABSTAIN`                                         |
| `rating`         | Yes         | `RATE CODE 1` to `5`                                                                |
| `rankedChoice`   | **No**      | `"This policy requires ranked choice voting. Please use the mobile app to vote."`   |

**Subscription commands (always allowed, even for unsubscribed numbers):**

| Command     | Description                                       |
| ----------- | ------------------------------------------------- |
| `SUBSCRIBE` | Register for the service (creates a subscription) |
| `STOP`      | Unsubscribe (no further commands allowed)         |

---

### 8.2 Example interactions

**Unsubscribed user sends `POLICIES`:**

You are not subscribed to this service. Send SUBSCRIBE to register for SMS voting.

**Subscribe:**
SUBSCRIBE
< Welcome to the Civic Engagement SMS service.
You can now vote on policies, check status, and receive closure notifications.
Send HELP for available commands.

**After subscription – `POLICIES`:**
Active policies:
CLEAN123 - Clean Water Initiative
RURAL456 - Rural Road Development

**`RATE` (first vote):**
RATE CLEAN123 4
< You voted 4 stars for "Clean Water Initiative".
Current average: 4.00 stars (1 votes).
2 vote(s) left today.

**`MYVOTES` (after voting on one policy):**
Policies you voted on:
CLEAN123 (Clean Water Initiative): Active - voting open

**`STATUS`:**
Policy: Clean Water Initiative
Average rating: 3.33 stars (3 votes)

**`RESULTS` (after policy is closed):**
Policy: Clean Water Initiative
Final average rating: 3.80 stars (150 votes)

**`STOP` (unsubscribe):**
You have unsubscribed from SMS voting. You will no longer receive notifications or be able to vote. Send SUBSCRIBE to rejoin.

**`HELP` (subscribed user):**
Commands:
SUBSCRIBE - Register for SMS voting
STOP - Unsubscribe
POLICIES - List active policies
STATUS <code> - Current average rating
RATE <code> <1-5> - Vote (max 3 per day)
MYVOTES - Policies you voted on
RESULTS <code> - Final results (closed policy)
HELP - This message

### 8.3 Error responses (plain text)

| Status  | Text                                                                                   |
| ------- | -------------------------------------------------------------------------------------- |
| 400     | `"Phone and message are required"`                                                     |
| 400     | `"Invalid format. Use: RATE code rating (e.g., RATE POL123 4)"`                        |
| 400     | `"Unknown command. Send HELP for available commands."`                                 |
| 403     | `"This number is registered with the app. Please use the app to vote."`                |
| 404     | `"Policy not found or not active."`                                                    |
| 409     | `"You have already voted on this policy via SMS."`                                     |
| 429     | `"Daily limit of 3 votes reached. Try again in X hour(s)."`                            |
| (other) | `"You are not subscribed to this service. Send SUBSCRIBE to register for SMS voting."` |

### 8.4 Get results (alternative)

**`GET /sms/results`**  
Works exactly as before (no subscription required, but only for closed policies).  
Query parameters: `code` (required), `phone` (optional, for logging). Returns plain text with final results.

## 9. Health Check

### 9.1 Backend health

**`GET /health (public)`**

Response (200 OK):

```json
{
  "status": "ok",
  "timestamp": "2026-04-09T12:00:00Z"
}
```

## 10. Planner Onboarding

These endpoints allow citizens to request planner status, admins to review and approve/reject, and new planners to complete mandatory training.

### 10.1 Citizen requests to become planner

`POST /planners/request`

**Roles:** citizen (authenticated)  
**Rate limit:** 1 request per 24 hours per user (returns 429 if exceeded).

**Request body:**

```json
{
  "organization": "Ministry of Education",
  "reason": "I have been working in education policy for 5 years and want to create policies about school funding. This is a long enough reason to exceed the 50 character minimum requirement.",
  "proofFile": null
}
```

| Field        | Type   | Required | Description                                                       |
| ------------ | ------ | -------- | ----------------------------------------------------------------- |
| organization | string | no       | Name of affiliated organization (if any)                          |
| reason       | string | yes      | Min 50 characters, explains why the user needs planner privileges |
| proofFile    | string | no       | Base64 encoded document (PDF/image) for verification (future use) |

**Response (201 Created):**

```json
{
  "status": "success",
  "data": { "requestId": "67f1a2b3c4d5e6f7a8b9c0d2" },
  "message": "Your request has been submitted. Admins will review it.",
  "timestamp": "2026-05-09T12:00:00Z"
}
```

**Error responses:**

| Status | Code                  | Message                                                               |
| ------ | --------------------- | --------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`    | `"Reason must be at least 50 characters."`                            |
| 409    | `DUPLICATE_ENTRY`     | `"You already have a pending request. Please wait for admin review."` |
| 429    | `RATE_LIMIT_EXCEEDED` | `"Too many requests. You can only submit one request per day."`       |

### 10.2 Planner completes mandatory training

`POST /planners/training/complete`

**Roles:** planner (authenticated, must have role `planner` but training not yet completed)  
**Behaviour:** Marks the planner as having completed the required training. After this, they can create policies.

**Request body:** none

**Response (200 OK):**

```json
{
  "status": "success",
  "data": null,
  "message": "Training completed. You can now create policies.",
  "timestamp": "2026-05-09T12:00:00Z"
}
```

**Error responses:**

| Status | Code               | Message                                  |
| ------ | ------------------ | ---------------------------------------- |
| 403    | `FORBIDDEN`        | `"Only planners can complete training."` |
| 400    | `VALIDATION_ERROR` | `"Training already completed."`          |

### 10.3 Admin lists pending planner requests

`GET /planners/requests/pending`

**Roles:** admin

**Query parameters:** none

**Response (200 OK):**

```json
{
  "status": "success",
  "data": [
    {
      "_id": "67f1a2b3c4d5e6f7a8b9c0d2",
      "userId": {
        "_id": "67f1a2b3c4d5e6f7a8b9c0d1",
        "email": "citizen@example.com",
        "region": "Addis Ababa",
        "ageRange": "25-34",
        "gender": "male",
        "occupation": "private-sector",
        "education": "bachelors",
        "createdAt": "2026-05-01T00:00:00Z"
      },
      "organization": "Ministry of Education",
      "reason": "I have been working in education policy for 5 years...",
      "status": "pending",
      "createdAt": "2026-05-09T00:00:00Z"
    }
  ],
  "message": "Pending requests retrieved successfully",
  "timestamp": "2026-05-09T12:00:00Z"
}
```

**Error responses:**

| Status | Code                    | Message                                      |
| ------ | ----------------------- | -------------------------------------------- |
| 403    | `FORBIDDEN`             | `"Access denied. Insufficient permissions."` |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to fetch requests"`                 |

### 10.4 Admin approves a planner request

`POST /planners/requests/:id/approve`

**Roles:** admin

**Path parameter:**

| Parameter | Type   | Description                   |
| --------- | ------ | ----------------------------- |
| `id`      | string | Planner request ID (ObjectId) |

**Request body:** none

**Response (200 OK):**

```json
{
  "status": "success",
  "data": null,
  "message": "Planner request approved. User role updated.",
  "timestamp": "2026-05-09T12:00:00Z"
}
```

**What happens:**

- The user's role changes from `citizen` to `planner`.
- The user's `tokenVersion` increments (invalidates old JWTs).
- An email is sent to the user (or mock in development).
- The request status becomes `approved`.

**Error responses:**

| Status | Code               | Message                                    |
| ------ | ------------------ | ------------------------------------------ |
| 404    | `NOT_FOUND`        | `"Request not found"`                      |
| 400    | `VALIDATION_ERROR` | `"Request already approved"` (or rejected) |

### 10.5 Admin rejects a planner request

`POST /planners/requests/:id/reject`

**Roles:** admin

**Path parameter:** same as approval.

**Request body:**

```json
{
  "rejectionReason": "Your organization could not be verified. Please provide a valid letter of appointment."
}
```

| Field           | Type   | Required | Description                              |
| --------------- | ------ | -------- | ---------------------------------------- |
| rejectionReason | string | yes      | Min 10 characters, explains why rejected |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": null,
  "message": "Request rejected.",
  "timestamp": "2026-05-09T12:00:00Z"
}
```

**Error responses:**

| Status | Code               | Message                                              |
| ------ | ------------------ | ---------------------------------------------------- |
| 404    | `NOT_FOUND`        | `"Request not found"`                                |
| 400    | `VALIDATION_ERROR` | `"Rejection reason must be at least 10 characters."` |

## 11. Delegation & Internal Messaging

These endpoints allow planners to collaborate by assigning associates to policies, searching for collaborators by language, and sending internal messages.

**Roles required:** planner or admin (except where noted).

All endpoints in this section require authentication with a planner or admin token.

---

### 11.1 Search planners by spoken language

**GET /planners/search**

**Query parameter:**

- `language` (required) – one of: `am` (Amharic), `om` (Oromo), `ti` (Tigrinya), `en` (English)

**Response (200 OK):**

```json
{
  "status": "success",
  "data": [
    {
      "\_id": "67f1a2b3c4d5e6f7a8b9c0d1",
      "email": "planner@example.com",
      "region": "Addis Ababa",
      "languagesSpoken": ["am", "en"],
      "trainingCompletedAt": "2026-05-01T00:00:00Z"
    }
  ],
  "message": "Planners found",
  "timestamp": "2026-05-09T12:00:00Z"
}
```

**Error responses:**

| Status | Code             | Message                                             |
| ------ | ---------------- | --------------------------------------------------- |
| 400    | VALIDATION_ERROR | "Valid language code required (am, om, ti, en)"     |
| 403    | FORBIDDEN        | "Access denied. Only planners can search planners." |

---

### 11.2 Add an associate to a policy

**POST /planners/policies/:policyId/associates**

**Roles:** policy owner (planner) or admin

**Path parameter:**

- `policyId` – MongoDB ObjectId of the policy

**Request body:**

```json
{
  "plannerEmail": "collaborator@example.com",
  "permissions": [
    "view_analytics",
    "moderate_comments",
    "reply_official",
    "export_data"
  ]
}
```

**Permissions array options:**

| Permission          | Description                                                         |
| ------------------- | ------------------------------------------------------------------- |
| `view_analytics`    | Access analytics for the policy (timeseries, export, heatmap, etc.) |
| `moderate_comments` | Edit, delete, approve, flag comments; retry AI processing           |
| `reply_official`    | Post official replies (marked with a badge)                         |
| `export_data`       | Download CSV exports of votes and comments                          |

**Response (201 Created):**

```json
{
  "status": "success",
  "data": {
    "\_id": "67f1a2b3c4d5e6f7a8b9c0d2",
    "policyId": "67f1a2b3c4d5e6f7a8b9c0d1",
    "plannerId": "67f1a2b3c4d5e6f7a8b9c0d3",
    "permissions": ["view_analytics", "moderate_comments"],
    "assignedBy": "67f1a2b3c4d5e6f7a8b9c0d0",
    "revokedAt": null,
    "assignedAt": "2026-05-09T12:00:00Z"
  },
  "message": "Associate added successfully",
  "timestamp": "2026-05-09T12:00:00Z"
}
```

**Error responses:**

| Status | Code             | Message                                                                      |
| ------ | ---------------- | ---------------------------------------------------------------------------- |
| 400    | VALIDATION_ERROR | "plannerEmail and permissions array required"                                |
| 403    | FORBIDDEN        | "Only policy owner can add associates"                                       |
| 404    | NOT_FOUND        | "Policy not found" or "Planner not found with that email"                    |
| 409    | DUPLICATE_ENTRY  | "This planner is already an associate (active). Update permissions instead." |

---

### 11.3 List associates of a policy

**GET /planners/policies/:policyId/associates**

**Roles:** policy owner (planner) or admin

**Path parameter:**

- `policyId` – Policy ID

**Response (200 OK):**

```json
{
  "status": "success",
  "data": [
    {
      "\_id": "67f1a2b3c4d5e6f7a8b9c0d2",
      "policyId": "67f1a2b3c4d5e6f7a8b9c0d1",
      "plannerId": {
        "\_id": "...",
        "email": "associate@example.com",
        "region": "Addis Ababa",
        "languagesSpoken": ["en"]
      },
      "permissions": ["view_analytics"],
      "assignedBy": {
        "\_id": "...",
        "email": "owner@example.com"
      },
      "revokedAt": null,
      "assignedAt": "2026-05-09T12:00:00Z"
    }
  ],
  "message": "Associates retrieved",
  "timestamp": "2026-05-09T12:00:00Z"
}
```

**Error responses:**

| Status | Code      | Message                                 |
| ------ | --------- | --------------------------------------- |
| 403    | FORBIDDEN | "Only policy owner can view associates" |
| 404    | NOT_FOUND | "Policy not found"                      |

---

### 11.4 Update associate permissions

**PATCH /planners/policies/:policyId/associates/:associateId**

**Roles:** policy owner (planner) or admin

**Path parameters:**

- `policyId` – Policy ID
- `associateId` – Associate record ID (not planner ID)

**Request body:**

```json
{
  "permissions": ["view_analytics"]
}
```

| Permission          | Description                                    |
| ------------------- | ---------------------------------------------- |
| `view_analytics`    | View all analytics for the policy              |
| `moderate_comments` | Edit, delete, approve, flag comments; retry AI |
| `reply_official`    | Post replies marked as official responses      |
| `export_data`       | Download CSV exports of votes and comments     |

**Note:** The `permissions` array replaces the existing permissions entirely. To add a permission, include all existing ones plus the new one.

**Response (200 OK):** returns the updated associate object (same shape as POST response).

**Error responses:**

| Status | Code             | Message                                            |
| ------ | ---------------- | -------------------------------------------------- |
| 400    | VALIDATION_ERROR | "permissions array required"                       |
| 403    | FORBIDDEN        | "Only policy owner can update permissions"         |
| 404    | NOT_FOUND        | "Policy not found" or "Active associate not found" |

---

### 11.5 Revoke an associate

**DELETE /planners/policies/:policyId/associates/:associateId**

**Roles:** policy owner (planner) or admin

**Path parameters:** same as 11.4

**Response (200 OK):**

```json
{
  "status": "success",
  "data": null,
  "message": "Associate revoked",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code      | Message                                            |
| ------ | --------- | -------------------------------------------------- |
| 403    | FORBIDDEN | "Only policy owner can revoke associates"          |
| 404    | NOT_FOUND | "Policy not found" or "Active associate not found" |

---

### 11.6 Send a message

**POST /api/messages**

**Roles:** planner or admin

**Rate limit:** 10 messages per minute per user (shared with comment limit).

**Request body:**

```json
{
  "recipientId": "67f1a2b3c4d5e6f7a8b9c0d3",
  "subject": "Policy collaboration request",
  "body": "I would like your help moderating comments on the Clean Water policy."
}
```

**Response (201 Created):**

```json
{
  "status": "success",
  "data": { "messageId": "67f1a2b3c4d5e6f7a8b9c0d4" },
  "message": "Message sent",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code                | Message                                      |
| ------ | ------------------- | -------------------------------------------- |
| 400    | VALIDATION_ERROR    | "recipientId, subject, body required"        |
| 404    | NOT_FOUND           | "Recipient not found or not a planner/admin" |
| 429    | RATE_LIMIT_EXCEEDED | "Too many messages. Please wait a moment."   |

---

### 11.7 Get my inbox

**GET /api/messages/inbox**

**Roles:** planner or admin

**Query parameters:**

- `page` – page number (default 1)
- `limit` – items per page (default 20, max 100)

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "messages": [
      {
        "_id": "67f1a2b3c4d5e6f7a8b9c0d4",
        "senderId": { "_id": "...", "email": "plannerA@example.com" },
        "recipientId": "67f1a2b3c4d5e6f7a8b9c0d3",
        "subject": "Policy collaboration request",
        "body": "I would like your help...",
        "read": false,
        "replyToId": null,
        "createdAt": "2026-05-09T12:00:00Z"
      }
    ],
    "total": 5,
    "page": 1
  },
  "message": "Inbox retrieved",
  "timestamp": "..."
}
```

---

### 11.8 Get a single message (and mark as read)

**GET /api/messages/:messageId**

**Roles:** must be sender or recipient

**Path parameter:**

- `messageId` – Message ID

**Behaviour:** Automatically sets `read: true` if the requesting user is the recipient and the message was unread.

**Response (200 OK):** returns the full message object with populated sender and recipient.

**Error responses:**

| Status | Code      | Message             |
| ------ | --------- | ------------------- |
| 403    | FORBIDDEN | "Access denied"     |
| 404    | NOT_FOUND | "Message not found" |

---

### 11.9 Reply to a message

**POST /api/messages/:messageId/reply**

**Roles:** must be sender or recipient of the original message

**Path parameter:**

- `messageId` – Original message ID

**Request body:**

```json
{
  "body": "Sure, I can help. Let me review the policy first."
}
```

**Response (201 Created):**

```json
{
  "status": "success",
  "data": { "messageId": "67f1a2b3c4d5e6f7a8b9c0d5" },
  "message": "Reply sent",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code             | Message                            |
| ------ | ---------------- | ---------------------------------- |
| 400    | VALIDATION_ERROR | "body required"                    |
| 403    | FORBIDDEN        | "You cannot reply to this message" |
| 404    | NOT_FOUND        | "Original message not found"       |

## 12. Notifications & Smart Alerts (Real‑time)

### 12.1 Overview

The platform generates in‑app notifications for important events: policy closures, comment replies, appeal resolutions, associate assignments, messages, and **smart alerts** (vote surges, rating drops, emerging topics).
All notifications are stored in the database and can be retrieved via the endpoints described in section 7.8–7.10.

In addition, the backend uses **Socket.IO** to push notifications instantly to connected front‑end clients (web or mobile). No polling is required.

### 12.2 WebSocket Connection

**Endpoint:** `ws://your-domain.com` (or `http://localhost:5000` for local development)
Use the Socket.IO client library in your frontend.

**Authentication:**
Pass the user’s JWT token as an `auth` object during connection:

```javascript
const socket = io("http://localhost:5000", {
  auth: { userId: "your_user_id" }, // userId is the MongoDB ObjectId
});
```

**Note:** The backend expects `userId` in the handshake. It then joins a room named `user:<userId>` and sends all notifications for that user to that room only.

**Events:**

| Event name       | Payload                                | Description                                                         |
| ---------------- | -------------------------------------- | ------------------------------------------------------------------- |
| `notification`   | A full `Notification` object (JSON)    | Sent whenever a new notification is created for the connected user. |
| (future) `alert` | Custom alert object (to be documented) | Reserved for future critical real‑time alerts.                      |

**Example front‑end listener (Socket.IO v4):**

```javascript
socket.on("notification", (notification) => {
  console.log("New notification:", notification);
  // display in UI, update badge, etc.
});
```

### 12.3 Notification Types (enum)

The `type` field of a notification can be one of the following values:

| Type                 | Trigger                                                                                           | Severity  |
| -------------------- | ------------------------------------------------------------------------------------------------- | --------- |
| `POLICY_ACTIVATED`   | Policy becomes active (auto‑activation or manual).                                                | `info`    |
| `POLICY_CLOSED`      | Policy ends (auto‑closure or manual).                                                             | `info`    |
| `POLICY_EXTENDED`    | End date of a policy is extended.                                                                 | `info`    |
| `ASSOCIATE_ASSIGNED` | A planner is assigned as associate to another planner’s policy.                                   | `info`    |
| `MESSAGE_RECEIVED`   | A new internal message is received.                                                               | `info`    |
| `COMMENT_REPLY`      | Someone replies to a comment you wrote.                                                           | `info`    |
| `COMMENT_FLAGGED`    | A comment reaches 3 reports and is flagged for moderation.                                        | `warning` |
| `COMMENT_APPEAL`     | A citizen appeals a moderation decision.                                                          | `info`    |
| `APPEAL_RESOLVED`    | A planner resolves an appeal.                                                                     | `info`    |
| `VOTE_SURGE`         | Real‑time anomaly: vote rate exceeds 3× the baseline (last 6h).                                   | `warning` |
| `RATING_DROP`        | Real‑time anomaly: average rating drops by more than 1.0 point within an hour.                    | `warning` |
| `EMERGING_TOPIC`     | A keyword’s frequency increases >200% compared to the 7‑day baseline and appears >5 times in 24h. | `info`    |

### 12.4 Notification Fields

Each notification document returned by the API (section 7.8) contains the following fields:

| Field       | Type    | Description                                                           |
| ----------- | ------- | --------------------------------------------------------------------- |
| `_id`       | string  | Unique notification ID.                                               |
| `userId`    | string  | User for whom the notification is intended.                           |
| `userRole`  | string  | `citizen`, `planner`, or `admin` (denormalised for easier filtering). |
| `type`      | string  | One of the enum values above.                                         |
| `title`     | string  | Short headline.                                                       |
| `message`   | string  | Detailed text.                                                        |
| `data`      | object  | Optional additional data (e.g., `{ policyId, commentId }`).           |
| `read`      | boolean | `true` if the user has viewed the notification.                       |
| `severity`  | string  | `info`, `warning`, or `critical`. Smart alerts are usually `warning`. |
| `source`    | string  | `system` (regular user‑triggered) or `alert` (automated anomaly).     |
| `createdAt` | string  | ISO timestamp.                                                        |

### 12.5 Smart Alerts (Automated Anomaly Detection)

The system continuously monitors voting activity in real time (after each vote) and runs a background cron job every 6 hours for emerging topics.

#### 12.5.1 Vote Surge

- **Detection:** After each vote, the backend counts the number of votes cast in the last hour and compares it to the average of the previous 6 hours (excluding the last hour).
- **Threshold:** Surge = `current_hour_votes > 3 * baseline_hourly_rate`.
- **Notification:** Sent to the policy owner and all associates with `view_analytics` permission.
- **Example message:** _Policy “Clean Water Initiative” received 45 votes in the last hour (5× normal)._

#### 12.5.2 Rating Drop

- **Detection:** Only for numeric poll types (`rating`, `likert`). Compares the average rating of the last hour with the average of the previous 6 hours (excluding last hour).
- **Threshold:** `baseline_avg - last_hour_avg > 1.0`.
- **Notification:** Sent to the policy owner and all associates (same as surge).
- **Example message:** _Policy “Clean Water Initiative” average rating dropped from 4.2 to 2.9 in the last hour._

#### 12.5.3 Emerging Topics

- **Detection:** Every 6 hours, the cron job analyses keywords from all approved comments of the last 24 hours.
  Keywords are extracted from the AI analysis of top‑level comments.
  It compares frequencies with a rolling 7‑day baseline stored in Redis.
- **Threshold:** Keyword count > 5 and increase > 200% relative to baseline.
- **Notification:** Sent to **all planners** (all planners receive a single notification about the emerging topic).
- **Example message:** _New trending topic: “drought” (12 mentions, +300%)._

### 12.6 Notification Endpoints (Already Documented)

- `GET /users/me/notifications` – list notifications (7.8)
- `PATCH /users/me/notifications/:id/read` – mark single as read (7.9)
- `PATCH /users/me/notifications/read-all` – mark all as read (7.10)

These endpoints work for all notification types, including smart alerts.

## Appendix: Rate Limiting Summary

| Endpoint group                               | Limit        | Time window | Scope             |
| -------------------------------------------- | ------------ | ----------- | ----------------- |
| `/auth/login`, `/auth/verify-otp`            | 10 requests  | 15 minutes  | Per IP            |
| `/auth/send-otp`                             | 3 requests   | 1 hour      | Per IP            |
| `/auth/forgot-password`                      | 3 requests   | 1 hour      | Per IP            |
| `/auth/reset-password`                       | 5 requests   | 15 minutes  | Per IP            |
| `/votes` (POST)                              | 30 requests  | 1 hour      | Per user (by JWT) |
| `/comments` (POST)                           | 10 requests  | 1 minute    | Per user (by JWT) |
| `POST /comments/:commentId/report`           | 5 requests   | 1 minute    | Per user (by JWT) |
| `POST /comments/:commentId/appeal`           | 3 requests   | 24 hours    | Per user (by JWT) |
| `PUT /comments/:commentId/moderate`          | 30 requests  | 1 minute    | Per user (by JWT) |
| `GET /analytics/*` (all analytics endpoints) | 30 requests  | 1 minute    | Per user (by JWT) |
| All other `/api` endpoints                   | 100 requests | 15 minutes  | Per IP            |
| `/sms/receive`                               | 3 votes      | 24 hours    | Per phone number  |
