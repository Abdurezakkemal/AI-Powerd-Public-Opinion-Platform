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

| Endpoint group                    | Limit        | Time window                 |
| --------------------------------- | ------------ | --------------------------- |
| `/auth/login`, `/auth/verify-otp` | 10 requests  | 15 minutes (per IP)         |
| All other API endpoints (global)  | 100 requests | 15 minutes (per IP)         |
| `/sms/receive`                    | 3 votes      | 24 hours (per phone number) |

When limit is exceeded, the API returns 429 RATE_LIMIT_EXCEEDED.

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
  "region": "Addis Ababa"
}
```

| Field    | Type   | Required | Description                                                         |
| -------- | ------ | -------- | ------------------------------------------------------------------- |
| email    | string | yes      | Valid email address                                                 |
| password | string | yes      | Min 6 characters                                                    |
| phone    | string | yes      | Ethiopian phone number, international format recommended (+2519...) |
| region   | string | yes      | City/region name (e.g., "Addis Ababa", "Oromia")                    |

Response (201 Created):

```json
{
  "status": "success",
  "data": {
    "userId": "67f1a2b3c4d5e6f7a8b9c0d1"
  },
  "message": "User registered successfully. A 6-digit OTP has been sent to your email for verification.",
  "timestamp": "2026-04-09T12:00:00Z"
}
```

Error responses:

| Status | Code                    | Message example                                                              |
| ------ | ----------------------- | ---------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`      | `"Missing required fields: email, password, phone, region are all required"` |
| 409    | `DUPLICATE_ENTRY`       | `"Email already registered. Please use a different email."`                  |
| 500    | `INTERNAL_SERVER_ERROR` | `"Unable to complete registration. Please try again later."`                 |

### 2.2 Send OTP

**`POST /auth/send-otp`**

Sends a new 6‑digit OTP to the user's registered email address.
The email must already exist in the system. Rate‑limited to 3 requests per hour per email.

Request body:

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

Error responses:

| Status | Code                  | Message                                           |
| ------ | --------------------- | ------------------------------------------------- |
| 400    | `VALIDATION_ERROR`    | `"Email is required"`                             |
| 404    | `NOT_FOUND`           | `"No account found with this email address."`     |
| 429    | `RATE_LIMIT_EXCEEDED` | `"Too many OTP requests. Please wait 5 minutes."` |

### 2.3 Verify OTP

**`POST /auth/verify-otp`**

Verifies the OTP and returns a JWT token. After successful verification, the user's verified flag becomes true, allowing login.

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

Response (200 OK):

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

Error responses:

| Status | Code                  | Message                                                                         |
| ------ | --------------------- | ------------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`    | `"Email and password are required"`                                             |
| 401    | `INVALID_CREDENTIALS` | `"Invalid email or password."`                                                  |
| 403    | `ACCOUNT_DISABLED`    | `"Your account has been deactivated. Please contact an administrator."`         |
| 403    | `NOT_VERIFIED`        | `"Your email address is not verified. Please complete OTP verification first."` |

## 3. Policy Endpoints

All policy endpoints require authentication. Role permissions:

| Role    | View draft? | View active?     | View paused?     | View closed? | Create/Update/Delete (draft only) | Activate / Extend / Pause / Resume / Close |
| ------- | ----------- | ---------------- | ---------------- | ------------ | --------------------------------- | ------------------------------------------ |
| Citizen | No          | Yes (own region) | Yes (own region) | No           | No                                | No                                         |
| Planner | Yes (all)   | Yes (all)        | Yes (all)        | Yes (all)    | Yes (own policies only)           | Yes (own policies only)                    |
| Admin   | Yes (all)   | Yes (all)        | Yes (all)        | Yes (all)    | Yes (all policies)                | Yes (all policies)                         |

### 3.1 List policies

**`GET /policies`**

Query parameters (all optional):

| Parameter | Type    | Default | Description                                                                                                                       |
| --------- | ------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `status`  | string  | none    | Filter by `draft`, `active`, `paused`, or `closed`. Citizens cannot see `draft` or `closed`; they see only `active` and `paused`. |
| `region`  | string  | none    | Filter by target region (planners/admins only)                                                                                    |
| `page`    | integer | 1       | Page number (1‑based)                                                                                                             |
| `limit`   | integer | 20      | Items per page (max 100)                                                                                                          |

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
        "averageRating": 0,
        "totalVotes": 0
      },
      {
        "id": "67f1a2b3c4d5e6f7a8b9c0d2",
        "title": "Temporary Pause Test",
        "description": "Policy temporarily suspended",
        "policyCode": "PAUSE123",
        "targetRegions": ["Addis Ababa"],
        "startDate": "2026-05-01T00:00:00Z",
        "endDate": "2026-06-30T23:59:59Z",
        "status": "paused",
        "averageRating": 0,
        "totalVotes": 0
      }
    ],
    "total": 10,
    "page": 1
  },
  "message": "Policies retrieved successfully",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code                    | Message                               |
| ------ | ----------------------- | ------------------------------------- |
| 401    | `UNAUTHORIZED`          | `"Access denied. No token provided."` |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to retrieve policies"`       |

### 3.2 Get single policy

**`GET /policies/:id`**

Path parameter:

| Parameter | Type   | Description                  |
| --------- | ------ | ---------------------------- |
| `id`      | string | Policy ID (MongoDB ObjectId) |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "id": "...",
    "title": "...",
    "description": "...",
    "policyCode": "...",
    "targetRegions": ["..."],
    "startDate": "...",
    "endDate": "...",
    "status": "...",
    "createdBy": "planner@example.com",
    "createdAt": "..."
  },
  "message": "Policy retrieved successfully",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code           | Message                                                  |
| ------ | -------------- | -------------------------------------------------------- |
| 401    | `UNAUTHORIZED` | `"Access denied. No token provided."`                    |
| 403    | `FORBIDDEN`    | `"You do not have access to this policy" (citizen only)` |
| 404    | `NOT_FOUND`    | `"Policy not found"`                                     |

### 3.3 Create policy

**`POST /policies`**

Roles: planner, admin

Request body:

| Field           | Type              | Required | Description                                   |
| --------------- | ----------------- | -------- | --------------------------------------------- |
| `title`         | string            | yes      | Max 200 characters                            |
| `description`   | string            | yes      | Max 2000 characters                           |
| `targetRegions` | array of strings  | yes      | At least one region (e.g., `["Addis Ababa"]`) |
| `startDate`     | string (ISO 8601) | yes      | Must be in the future and before `endDate`    |
| `endDate`       | string (ISO 8601) | yes      | Must be after `startDate`                     |

**Response (201 Created):**

```json
{
  "status": "success",
  "data": {
    "id": "...",
    "policyCode": "CLEAN123"
  },
  "message": "Policy created as draft. You can edit it before activating.",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code                    | Message                                                                            |
| ------ | ----------------------- | ---------------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`      | `"All fields are required: title, description, targetRegions, startDate, endDate"` |
| 400    | `VALIDATION_ERROR`      | `"Start date cannot be in the past. Please set a future start date."`              |
| 400    | `VALIDATION_ERROR`      | `"Start date must be before end date"`                                             |
| 403    | `FORBIDDEN`             | `"Access denied. Insufficient permissions."` (if role not planner/admin)           |
| 500    | `INTERNAL_SERVER_ERROR` | `"Unable to generate a unique policy code. Please try again."`                     |

### 3.4 Update policy

**`PUT /policies/:id`**

**Roles:** creator planner or admin  
**Conditions:** Policy must be in `draft` status

**Request body** (all fields optional):

| Field           | Type   | Description                                        |
| --------------- | ------ | -------------------------------------------------- |
| `title`         | string | New title                                          |
| `description`   | string | New description                                    |
| `targetRegions` | array  | New target regions                                 |
| `startDate`     | string | New start date (must be future and before endDate) |
| `endDate`       | string | New end date (must be after startDate)             |

**Response (200 OK):** returns the updated policy object (same shape as `GET /policies/:id`).

**Error responses:**

| Status | Code               | Message                                                                                         |
| ------ | ------------------ | ----------------------------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | `"Start date cannot be in the past."`                                                           |
| 400    | `VALIDATION_ERROR` | `"Start date must be before end date."`                                                         |
| 400    | `VALIDATION_ERROR` | `"End date must be after start date."`                                                          |
| 403    | `FORBIDDEN`        | `"Only draft policies can be edited. Activate or close the policy to prevent further changes."` |
| 403    | `FORBIDDEN`        | `"You do not have permission to edit this policy"` (not creator)                                |
| 404    | `NOT_FOUND`        | `"Policy not found"`                                                                            |

### 3.5 Close policy

**`POST /policies/:id/close`**

**Roles:** creator planner or admin  
**Conditions:** Policy status must be `active` or `paused`.  
**Behaviour:** Changes status to `closed`. No more votes accepted.

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "id": "...",
    "status": "closed"
  },
  "message": "Policy closed successfully. No more votes will be accepted.",
  "timestamp": "..."
}
```

**Error responses:**
| Status | Code | Message |
| ------ | ---------------- | ----------------------------------------------------------------------- |
| 400 | `VALIDATION_ERROR` | `"Only active or paused policies can be closed. Current status: draft"` |
| 403 | `FORBIDDEN` | `"You do not have permission to close this policy"` (not creator) |
| 404 | `NOT_FOUND` | `"Policy not found"` |

### 3.6 Delete draft policy

**`DELETE /policies/:id`**

**Roles:** creator planner or admin  
**Condition:** Policy must be in `draft` status.  
**Behaviour:** Permanently removes the policy document.

**Response (200 OK):**

```json
{
  "status": "success",
  "data": null,
  "message": "Policy deleted successfully",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code        | Message                                                                                        |
| ------ | ----------- | ---------------------------------------------------------------------------------------------- |
| 403    | `FORBIDDEN` | `"Only draft policies can be deleted. For active or paused policies, use the close endpoint."` |
| 403    | `FORBIDDEN` | `"You do not have permission to delete this policy"` (not creator)                             |
| 404    | `NOT_FOUND` | `"Policy not found"`                                                                           |

## 4. Feedback Endpoints

### 4.1 Submit feedback

**`POST /feedback`**

**Role:** citizen (must be authenticated and verified)

**Request body:**

| Field      | Type    | Required | Description            |
| ---------- | ------- | -------- | ---------------------- |
| `policyId` | string  | yes      | ID of an active policy |
| `rating`   | integer | yes      | 1 to 5 stars           |
| `comment`  | string  | no       | Max 500 characters     |

**Response (201 Created):**

```json
{
  "status": "success",
  "data": {
    "id": "...",
    "policyId": "...",
    "rating": 5
  },
  "message": "Feedback recorded successfully. Thank you for your input.",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code                    | Message                                                                                |
| ------ | ----------------------- | -------------------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`      | `"policyId and rating are required"`                                                   |
| 400    | `VALIDATION_ERROR`      | `"Rating must be between 1 and 5"`                                                     |
| 400    | `VALIDATION_ERROR`      | `"Comment too long (max 500 characters)"`                                              |
| 400    | `VOTING_CLOSED`         | `"Voting is not allowed for this policy at this time. Please check the policy dates."` |
| 403    | `NOT_VERIFIED`          | `"Please verify your phone number before submitting feedback"`                         |
| 403    | `FORBIDDEN`             | `"This policy has not been published yet"` (policy status = draft)                     |
| 403    | `FORBIDDEN`             | `"Voting is temporarily paused for this policy"` (policy status = paused)              |
| 403    | `FORBIDDEN`             | `"This policy is closed for voting"` (policy status = closed)                          |
| 404    | `NOT_FOUND`             | `"Policy not found"` (invalid policy ID)                                               |
| 409    | `ALREADY_VOTED`         | `"You have already voted on this policy. Each user can vote only once."`               |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to submit feedback. Please try again later."`                                 |

## 5. Analytics Endpoints

Roles required: planner or admin (all endpoints in this section)

### 5.1 Get policy analytics

**`GET /analytics/:policyId`**

Path parameter:

| Parameter  | Type   | Description                  |
| ---------- | ------ | ---------------------------- |
| `policyId` | string | Policy ID (MongoDB ObjectId) |

Response (200 OK):

```json
{
  "status": "success",
  "data": {
    "policyId": "...",
    "title": "Clean Water Initiative",
    "averageRating": 3.8,
    "ratingDistribution": {
      "1": 0,
      "2": 1,
      "3": 5,
      "4": 2,
      "5": 4
    },
    "sentimentCounts": {
      "positive": 5,
      "negative": 2,
      "neutral": 3
    },
    "topKeywords": [
      { "keyword": "water", "count": 4 },
      { "keyword": "access", "count": 2 }
    ],
    "totalVotes": 11,
    "appVotes": 6,
    "smsVotes": 5
  },
  "message": "Analytics retrieved successfully",
  "timestamp": "..."
}
```

Error responses:

| Status | Code                    | Message                                                         |
| ------ | ----------------------- | --------------------------------------------------------------- |
| 403    | `FORBIDDEN`             | `"Access denied. Only planners and admins can view analytics."` |
| 404    | `NOT_FOUND`             | `"Policy not found"`                                            |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to retrieve analytics"`                                |

### 5.2 Export analytics as CSV

**`GET /analytics/:policyId/export`**

Path parameter:

| Parameter  | Type   | Description |
| ---------- | ------ | ----------- |
| `policyId` | string | Policy ID   |

Response: CSV file download.

Columns: rating,channel,date,region

Error responses: same as 5.1 (but CSV content is not returned on error – JSON error instead).

### 5.3 Get comments (paginated)

**`GET /analytics/:policyId/comments`**

Query parameters (all optional):

| Parameter   | Type    | Default | Description                                    |
| ----------- | ------- | ------- | ---------------------------------------------- |
| `page`      | integer | 1       | Page number (1‑based)                          |
| `limit`     | integer | 20      | Items per page (max 100)                       |
| `sentiment` | string  | none    | Filter by `positive`, `negative`, or `neutral` |

Response (200 OK):

```json
{
  "status": "success",
  "data": {
    "comments": [
      {
        "id": "...",
        "text": "This policy is great!",
        "sentiment": "positive",
        "confidence": 0.95,
        "keywords": ["great", "policy"],
        "createdAt": "2026-04-01T10:00:00Z"
      }
    ],
    "total": 50,
    "page": 1
  },
  "message": "Comments retrieved successfully",
  "timestamp": "..."
}
```

Error responses: same as 5.1.

### 5.4 Geographic analytics

**`GET /analytics/:policyId/geographic`**

Response (200 OK):

```json
{
  "status": "success",
  "data": {
    "policyId": "...",
    "regions": [
      {
        "region": "Addis Ababa",
        "totalVotes": 4,
        "averageRating": 4.2,
        "sentimentCounts": {
          "positive": 3,
          "negative": 0,
          "neutral": 1
        }
      }
    ]
  },
  "message": "Geographic analytics retrieved successfully",
  "timestamp": "..."
}
```

Notes:

-Only includes votes from the app channel (SMS votes have no region).
-Only includes votes with comments (empty comments are excluded).

Error responses: same as 5.1.

### 5.5 Trends over time

**`GET /analytics/:policyId/trends`**

Query parameters:

| Parameter  | Type   | Default | Description                        |
| ---------- | ------ | ------- | ---------------------------------- |
| `interval` | string | `day`   | Grouping interval: `day` or `week` |

Response (200 OK):

```json
{
  "status": "success",
  "data": {
    "policyId": "...",
    "interval": "day",
    "data": [
      {
        "date": "2026-04-01",
        "averageRating": 4.1,
        "positive": 5,
        "negative": 1,
        "neutral": 2,
        "total": 8
      }
    ]
  },
  "message": "Trends retrieved successfully",
  "timestamp": "..."
}
```

Date format:

interval=day → YYYY-MM-DD
interval=week → YYYY-Www (e.g., 2026-W14)

Error responses: same as 5.1.

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

### 6.1.3 Update planner

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

### 6.3 Feedback Moderation

#### 6.3.1 Get pending feedback

**`GET /admin/feedback/pending`**

Response (200 OK):

```json
{
  "status": "success",
  "data": {
    "feedbacks": [
      {
        "_id": "...",
        "policyId": { "_id": "...", "title": "Policy title" },
        "userId": { "_id": "...", "email": "user@example.com" },
        "comment": "Text that AI could not process",
        "status": "pending review",
        "createdAt": "..."
      }
    ]
  },
  "message": "Pending feedback retrieved successfully",
  "timestamp": "..."
}
```

Error responses:

| Status | Code                  | Message                               |
| ------ | --------------------- | ------------------------------------- |
| 500    | INTERNAL_SERVER_ERROR | "Failed to retrieve pending feedback" |

#### 6.3.2 Update feedback (manual review)

**`PUT /admin/feedback/:id`**

Path parameter:

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| id        | string | Feedback ID |

Request body (fields optional):

| Field     | Type             | Description                                                  |
| --------- | ---------------- | ------------------------------------------------------------ |
| sentiment | object           | { "label": "positive/negative/neutral", "confidence": 0.95 } |
| keywords  | array of strings | e.g., ["water", "access"]                                    |
| processed | boolean          | Set to true after manual review                              |
| status    | string           | processed or pending review                                  |

Response (200 OK): returns the updated feedback object.

Error responses:

| Status | Code                  | Message                     |
| ------ | --------------------- | --------------------------- |
| 404    | NOT_FOUND             | "Feedback not found"        |
| 500    | INTERNAL_SERVER_ERROR | "Failed to update feedback" |

#### 6.3.3 Retry single feedback

**`POST /admin/feedback/:id/retry`**

Path parameter:

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| id        | string | Feedback ID |

Response (200 OK):

```json
{
  "status": "success",
  "data": { "feedbackId": "..." },
  "message": "Feedback queued for retry. The AI worker will process it shortly.",
  "timestamp": "..."
}
```

Error responses:

| Status | Code                  | Message                              |
| ------ | --------------------- | ------------------------------------ |
| 404    | NOT_FOUND             | "Feedback not found"                 |
| 500    | INTERNAL_SERVER_ERROR | "Failed to queue feedback for retry" |

#### 6.3.4 Retry all pending feedback

**`POST /admin/feedback/retry-all`**

Response (200 OK):

```json
{
  "status": "success",
  "data": { "updatedCount": 5 },
  "message": "5 feedback items queued for retry",
  "timestamp": "..."
}
```

Error responses:

| Status | Code                  | Message                              |
| ------ | --------------------- | ------------------------------------ |
| 500    | INTERNAL_SERVER_ERROR | "Failed to queue feedback for retry" |

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

Request body (fields optional):

| Field  | Type   | Description                        |
| ------ | ------ | ---------------------------------- |
| email  | string | New email address (must be unique) |
| region | string | New city/region name               |

Response (200 OK): returns the updated user object (same shape as **`GET /users/me`**).

```json
{
"status": "success",
"data": { ... },
"message": "User profile updated successfully",
"timestamp": "..."
}
```

Error responses:

| Status | Code                  | Message                                   |
| ------ | --------------------- | ----------------------------------------- |
| 400    | VALIDATION_ERROR      | "No valid fields provided for update"     |
| 409    | DUPLICATE_ENTRY       | "Email already in use by another account" |
| 404    | NOT_FOUND             | "User not found"                          |
| 500    | INTERNAL_SERVER_ERROR | "Failed to update user profile"           |

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

### 7.4 Get feedback history

**`GET /users/me/history`**

Returns all feedback submissions by the authenticated user, including policy details and AI analysis results (if available).

Response (200 OK):

```json
{
  "status": "success",
  "data": {
    "history": [
      {
        "id": "...",
        "policy": {
          "id": "...",
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
  "message": "User feedback history retrieved successfully",
  "timestamp": "..."
}
```

Notes:

-sentiment may be null if AI processing hasn't completed or failed.
-policy may be null if the policy was deleted (keeps history intact).

Error responses:

| Status | Code                  | Message                               |
| ------ | --------------------- | ------------------------------------- |
| 500    | INTERNAL_SERVER_ERROR | "Failed to retrieve feedback history" |

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

## 8. SMS Simulation (Public)

These endpoints simulate an SMS gateway. They return plain text, not JSON. They are rate-limited per phone number (3 votes per 24 hours).

### 8.1 Send SMS command

**`POST /sms/receive`**

Request body (JSON or form-encoded):

| Field   | Type   | Required | Description                        |
| ------- | ------ | -------- | ---------------------------------- |
| phone   | string | yes      | Phone number (e.g., +251912345678) |
| message | string | yes      | Command text (case-insensitive)    |

Supported commands:

| Command | Format                  | Description                                  |
| ------- | ----------------------- | -------------------------------------------- |
| RATE    | RATE <policyCode> <1-5> | Vote on an active policy                     |
| STATUS  | STATUS <policyCode>     | Get current average rating for active policy |
| RESULTS | RESULTS <policyCode>    | Get final results after policy is closed     |
| HELP    | HELP                    | Show available commands                      |

Response (plain text) – successful RATE:

```text
You voted 4 stars for "Clean Water Initiative". Current average rating: 3.5 stars (12 votes). Thank you!
```

Response (plain text) – STATUS:

```text
Policy: Clean Water Initiative
Current average rating: 3.5 stars (12 votes)
```

Response (plain text) – RESULTS:

```text
Policy: Clean Water Initiative – Final average rating: 3.8 stars (150 votes)
```

Response (plain text) – HELP:

```text
Commands:
RATE <code> <1-5> - Vote on a policy
STATUS <code> - Get current average rating for active policy
RESULTS <code> - Get final results (only after policy closes)
HELP - Show this message
```

Error responses (plain text):

| Status | Text                                                                  |
| ------ | --------------------------------------------------------------------- |
| 400    | "Phone and message are required"                                      |
| 400    | "Invalid format. Use: RATE code rating (e.g., RATE POL123 4)"         |
| 403    | "This number is registered with the app. Please use the app to vote." |
| 404    | "Policy not found or not active"                                      |
| 409    | "You have already voted on this policy via SMS."                      |
| 429    | "Daily limit of 3 votes reached. Try again in X hour(s)."             |

### 8.2 Get results (alternative)

**`GET /sms/results`**

Query parameters:

| Parameter | Type   | Required | Description                          |
| --------- | ------ | -------- | ------------------------------------ |
| code      | string | yes      | Policy code (e.g., POL123)           |
| phone     | string | no       | Phone number (optional, for logging) |

Response (plain text) – successful:

```text
Policy: Clean Water Initiative – Final average rating: 3.8 stars (150 votes)
```

Error responses (plain text):

| Status | Text                                 |
| ------ | ------------------------------------ |
| 400    | "Policy code is required"            |
| 404    | "Policy not found or not yet closed" |

End of Section 8.

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

## 10. AI Service Endpoints (Internal)

    These endpoints are called by the backend worker and are not exposed to clients. They are documented here for reference.

Base URL for AI service (internal): **`http://ai-service:8000`**

### 10.1 Analyze comment

**`POST /analyze`**

Request body:

| Field    | Type   | Required | Description                                         |
| -------- | ------ | -------- | --------------------------------------------------- |
| text     | string | yes      | Comment text (max 500 chars)                        |
| language | string | no       | ISO code (am, om, ti, en); auto-detected if omitted |

Response (200 OK):

```json
{
  "sentiment": "positive",
  "confidence": 0.95,
  "keywords": ["water", "access", "support"],
  "language": "am",
  "sentiment_model": "rasyosef/bert-medium-amharic-finetuned-sentiment",
  "keyword_model": "keybert"
}
```

Error responses: HTTP 500 with JSON error.

### 10.2 Benchmark models

**`POST /benchmark`**

Runs all sentiment models on the given text and returns comparison.

Request body: same as **`/analyze`**.

Response (200 OK): includes list of results per model.

### 10.3 Health check

**`GET /health`**

Response (200 OK):

```json
{ "status": "ok" }
```

## Appendix: Rate Limiting Summary

| Endpoint group                | Limit | Window   | Scope            |
| ----------------------------- | ----- | -------- | ---------------- |
| /auth/login, /auth/verify-otp | 10    | 15 min   | Per IP           |
| All other JSON endpoints      | 100   | 15 min   | Per IP           |
| /sms/receive                  | 3     | 24 hours | Per phone number |
