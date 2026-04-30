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

Sends a 6‑digit OTP to the user's registered email address.  
**Rate limit:** 3 requests per 5 minutes per email.  
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

## 2.5 Password Reset

### 2.5.1 Request password reset (user self‑service)

**`POST /auth/forgot-password`**

Sends a secure reset token to the user’s registered email address. The token is valid for 1 hour and can be used with `/auth/reset-password`.  
**Rate limit:** 3 requests per email per hour (to prevent abuse).

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

All policy endpoints require authentication. Role permissions:

| Role    | View own draft/published? | View others' draft/published? | View others' active/paused/closed? | Create / Update / Delete (own) | Publish / Unpublish (own) | Activate / Pause / Resume / Close / Extend (own)      |
| ------- | ------------------------- | ----------------------------- | ---------------------------------- | ------------------------------ | ------------------------- | ----------------------------------------------------- |
| Citizen | No                        | No                            | Yes (only `active`, own region)    | No                             | No                        | No                                                    |
| Planner | Yes (all statuses)        | **No (404)**                  | Yes                                | Yes (draft/published only)     | Yes (draft → published)   | Yes (published → active, active/paused → close, etc.) |
| Admin   | Yes (all)                 | Yes (all)                     | Yes                                | Yes (any policy)               | Yes (any policy)          | Yes (any policy)                                      |

**Important visibility rule for planners:**

- A planner can see **their own** policies regardless of status (draft, published, active, paused, closed).
- For **other planners' policies**: only `active`, `paused`, and `closed` are visible.
- **Draft and published** policies belonging to another planner are **completely hidden** – any endpoint (GET, PUT, PATCH, POST, DELETE) that targets such a policy will return **`404 Not Found`**, as if the policy does not exist.
- This applies to **all policy‑specific endpoints**: `GET /policies/:id`, `PUT /policies/:id`, `PATCH /policies/:id/publish`, `PATCH /policies/:id/unpublish`, `PATCH /policies/:id/activate`, `PATCH /policies/:id/pause`, `PATCH /policies/:id/resume`, `PATCH /policies/:id/extend`, `POST /policies/:id/close`, `DELETE /policies/:id`, `POST /policies/:id/clone`, `GET /policies/:id/history`.

**Notes:**

- Citizens cannot see `published` policies; they only become visible when `active`.
- Planners see their own `draft` and `published` policies, plus other planners' `active`, `paused`, and `closed` policies (others' `draft` and `published` are hidden).
- `*` Delete allowed only for `draft` or `published` policies. `Update` only for `draft` policies.
- `**` `Extend` works on `active` or `paused` policies. `Pause` works on `active`, `Resume` on `paused`. `Close` works on `active` or `paused`.
- `Activate` moves a `published` policy to `active` (if within voting window). Auto‑activation also does this on startDate.
- `Publish` moves a `draft` policy to `published` (or directly to `active` if startDate already passed).
- `Unpublish` moves a `published` policy back to `draft`.

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

**Access rules:**

- Citizens can only view `active` policies in their own region.
- Planners can view:
  - Their own policies (any status)
  - Other planners' `active`, `paused`, `closed` policies
- Other planners' `draft` or `published` policies return **`404 Not Found`**.
- Admins can view any policy.

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

| Status | Code           | Message                                                                                                 |
| ------ | -------------- | ------------------------------------------------------------------------------------------------------- |
| 401    | `UNAUTHORIZED` | `"Access denied. No token provided."`                                                                   |
| 403    | `FORBIDDEN`    | `"You do not have access to this policy" (citizen only)`                                                |
| 404    | `NOT_FOUND`    | `"Policy not found"` (policy ID invalid, or planner trying to access another planner's draft/published) |

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

| Status | Code               | Message                                                                                                  |
| ------ | ------------------ | -------------------------------------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | `"Start date cannot be in the past."`                                                                    |
| 400    | `VALIDATION_ERROR` | `"Start date must be before end date."`                                                                  |
| 400    | `VALIDATION_ERROR` | `"End date must be after start date."`                                                                   |
| 403    | `FORBIDDEN`        | `"Only draft policies can be edited. Published, active, paused, or closed policies cannot be modified."` |
| 403    | `FORBIDDEN`        | `"You do not have permission to edit this policy"` (not creator)                                         |
| 404    | `NOT_FOUND`        | `"Policy not found"` (policy ID invalid, or the policy is draft/published and you are not the owner)     |

### 3.5 Publish policy (draft → published/active)

**`PATCH /policies/:id/publish`**

**Roles:** planner, admin  
**Condition:** Policy status must be `draft`.  
**Behaviour:**

- If the current date is within the policy's `startDate` and `endDate`, the policy becomes **active** immediately.
- If the current date is before `startDate`, the policy becomes **published** (will be auto-activated by the worker when `startDate` is reached).
- If the current date is after `endDate`, an error is returned.

**Request body:** none

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "id": "...",
    "status": "active" // or "published"
  },
  "message": "Policy activated immediately because its start date has already passed." // or "Policy published. It will be automatically activated on its start date."
}
```

**Error responses:**

| Status | Code               | Message                                                                                              |
| ------ | ------------------ | ---------------------------------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | `"Only draft policies can be published. Current status: ..."`                                        |
| 400    | `VALIDATION_ERROR` | `"Cannot publish a policy that has already ended."`                                                  |
| 403    | `FORBIDDEN`        | `"You do not have permission to publish this policy"`                                                |
| 404    | `NOT_FOUND`        | `"Policy not found"` (policy ID invalid, or the policy is draft/published and you are not the owner) |

### 3.6 Unpublish policy (published → draft)

**`PATCH /policies/:id/unpublish`**

**Roles:** planner, admin  
**Condition:** Policy status must be `published`.  
**Behaviour:** Moves the policy back to `draft` status. This allows the planner to edit or delete the policy.

**Request body:** none

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "id": "...",
    "status": "draft"
  },
  "message": "Policy unpublished and moved back to draft.",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code               | Message                                                                                              |
| ------ | ------------------ | ---------------------------------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | `"Only published policies can be unpublished. Current status: ..."`                                  |
| 403    | `FORBIDDEN`        | `"You do not have permission to unpublish this policy"`                                              |
| 404    | `NOT_FOUND`        | `"Policy not found"` (policy ID invalid, or the policy is draft/published and you are not the owner) |

### 3.7 Close policy

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

| Status | Code               | Message                                                                    |
| ------ | ------------------ | -------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | `"Only active or paused policies can be closed. Current status: draft"`    |
| 403    | `FORBIDDEN`        | `"You do not have permission to close this policy"` (not creator)          |
| 404    | `NOT_FOUND`        | `"Policy not found"` (policy ID invalid, or hidden draft/published policy) |

### 3.8 Activate policy (draft → active)

**`PATCH /policies/:id/activate`**

**Roles:** creator planner or admin  
**Condition:** Policy status must be `published`.  
**Behaviour:** Manually activates a published policy before its start date (if needed). Voting will be allowed only if the current date is within `startDate` and `endDate`. Auto‑activation also turns `published` → `active` on the start date.

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "id": "...",
    "status": "active"
  },
  "message": "Policy activated successfully. Citizens can now vote.",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code               | Message                                                                    |
| ------ | ------------------ | -------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | `"Only draft policies can be activated. Current status: ..."`              |
| 400    | `VALIDATION_ERROR` | `"Cannot activate a policy whose end date has already passed"`             |
| 403    | `FORBIDDEN`        | `"You do not have permission to activate this policy"`                     |
| 404    | `NOT_FOUND`        | `"Policy not found"` (policy ID invalid, or hidden draft/published policy) |

### 3.9 Pause policy (active → paused)

**`PATCH /policies/:id/pause`**

**Roles:** creator planner or admin  
**Condition:** Policy status must be `active`.  
**Behaviour:** Temporarily suspends voting (status becomes `paused`). Citizens will see the policy but cannot vote until it is resumed.

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "id": "...",
    "status": "paused"
  },
  "message": "Policy paused. Voting is now disabled until resumed.",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code               | Message                                                                    |
| ------ | ------------------ | -------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | `"Only active policies can be paused. Current status: ..."`                |
| 403    | `FORBIDDEN`        | `"You do not have permission to pause this policy"`                        |
| 404    | `NOT_FOUND`        | `"Policy not found"` (policy ID invalid, or hidden draft/published policy) |

### 3.10 Resume policy (paused → active)

**`PATCH /policies/:id/resume`**

**Roles:** creator planner or admin  
**Condition:** Policy status must be `paused`.  
**Behaviour:** Reactivates voting (status becomes `active`). The current date must still be within the policy’s `startDate` and `endDate`; otherwise an error is returned.

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "id": "...",
    "status": "active"
  },
  "message": "Policy resumed. Voting is now active.",
  "timestamp": "..."
}
```

**Error responses:**

| Status | Code               | Message                                                                    |
| ------ | ------------------ | -------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | `"Only paused policies can be resumed. Current status: ..."`               |
| 400    | `VALIDATION_ERROR` | `"Cannot resume policy because the voting period has ended."`              |
| 403    | `FORBIDDEN`        | `"You do not have permission to resume this policy"`                       |
| 404    | `NOT_FOUND`        | `"Policy not found"` (policy ID invalid, or hidden draft/published policy) |

### 3.11 Extend policy end date

**`PATCH /policies/:id/extend`**

**Roles:** creator planner or admin  
**Condition:** Policy status must be `active` or `paused`.  
**Behaviour:** Changes the `endDate` of the policy. You can extend the deadline (make it later) or shorten it (make it earlier), as long as the new date is after the `startDate` and not in the past.

**Request body:**

```json
{
  "newEndDate": "2026-07-31T23:59:59Z"
}
```

**Error responses:**

| Status | Code               | Message                                                                    |
| ------ | ------------------ | -------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | `"Policy must be active or paused to modify end date"`                     |
| 400    | `VALIDATION_ERROR` | `"newEndDate must be a valid ISO date string"`                             |
| 400    | `VALIDATION_ERROR` | `"New end date must be after start date"`                                  |
| 400    | `VALIDATION_ERROR` | `"New end date cannot be in the past"`                                     |
| 403    | `FORBIDDEN`        | `"You do not have permission to modify this policy"`                       |
| 404    | `NOT_FOUND`        | `"Policy not found"` (policy ID invalid, or hidden draft/published policy) |

### 3.12 Delete draft policy (draft or published)

**`DELETE /policies/:id`**

**Roles:** creator planner or admin  
**Condition:** Policy status must be `draft` or `published`.  
**Behaviour:** Permanently removes the policy document. For `active` or `paused` policies, use the close endpoint instead. `Closed` policies cannot be deleted.

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

| Status | Code        | Message                                                                                                     |
| ------ | ----------- | ----------------------------------------------------------------------------------------------------------- |
| 403    | `FORBIDDEN` | `"Only draft or published policies can be deleted. For active or paused policies, use the close endpoint."` |
| 403    | `FORBIDDEN` | `"You do not have permission to delete this policy"` (not creator)                                          |
| 404    | `NOT_FOUND` | `"Policy not found"` (policy ID invalid, or hidden draft/published policy)                                  |

### 3.13 Clone policy

**`POST /policies/:id/clone`**

**Roles:** planner or admin (any policy they can view)

**Behaviour:**  
Creates a new draft policy as a copy of an existing one.

- Title becomes `original.title + " (Copy)"` (truncated to 200 chars if needed).
- A fresh, unique policy code is generated.
- The logged‑in user becomes the `createdBy` owner.
- Status is set to `draft`.
- An audit log entry with action `CLONE_POLICY` is recorded.

**Path parameter:**

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| `id`      | string | ID of the original policy |

**Visibility note:** A planner can only clone policies they are allowed to see. Attempting to clone another planner's draft/published policy returns **`404 Not Found`**.

**Response (201 Created):**

```json
{
  "status": "success",
  "data": {
    "id": "67f1a2b3c4d5e6f7a8b9c0d1",
    "policyCode": "NEWCODE"
  },
  "message": "Policy cloned successfully. Edit the copy before activating.",
  "timestamp": "2026-04-29T12:00:00Z"
}
```

**Error responses:**

| Status | Code                    | Message                                                                                          |
| ------ | ----------------------- | ------------------------------------------------------------------------------------------------ |
| 404    | `NOT_FOUND`             | `"Original policy not found"` or `"Invalid policy ID format"` (or hidden draft/published policy) |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to clone policy"`                                                                       |

### 3.14 Policy history

**`GET /policies/:id/history`**

**Roles:** planner (only for policies they own) or admin (any policy)
**Visibility note:** A planner can only view history of policies they own. Attempting to view history of another planner's draft/published policy returns **`404 Not Found`**.
**Behaviour:**  
Returns a chronological list of audit events for the policy (creation, activation, pause, resume, close, clone, deletion, etc.) based on the `auditlogs` collection.

**Path parameter:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Policy ID   |

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
        "timestamp": "2026-04-01T10:00:00Z"
      },
      {
        "action": "ACTIVATE_POLICY",
        "userId": "67f1a2b3...",
        "userRole": "planner",
        "details": {
          "policyCode": "CLEAN123",
          "title": "Clean Water Initiative"
        },
        "timestamp": "2026-04-02T11:00:00Z"
      }
    ]
  },
  "message": "Policy history retrieved successfully",
  "timestamp": "2026-04-29T12:00:00Z"
}
```

**Error responses:**

| Status | Code                    | Message                                                                                 |
| ------ | ----------------------- | --------------------------------------------------------------------------------------- |
| 403    | `FORBIDDEN`             | `"You do not have permission to view history of this policy"`                           |
| 404    | `NOT_FOUND`             | `"Policy not found"` or `"Invalid policy ID format"` (or hidden draft/published policy) |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to retrieve policy history"`                                                   |

## 4. Voting & Comment Endpoints

All endpoints in this section require authentication with a citizen token.

### 4.1 Submit a vote (rating only, with optional immediate comment)

**`POST /votes`**

Records a user’s rating for a policy. If the `comment` field is provided, a `Comment` document is automatically created and linked to this vote (the AI worker will process it asynchronously).

**Request body:**

| Field      | Type    | Required | Description                                           |
| ---------- | ------- | -------- | ----------------------------------------------------- |
| `policyId` | string  | yes      | ID of an active policy                                |
| `rating`   | integer | yes      | 1 to 5 stars                                          |
| `comment`  | string  | no       | Max 500 characters (if present, a Comment is created) |

**Response (201 Created):**

```json
{
  "status": "success",
  "data": {
    "voteId": "67f1a2b3c4d5e6f7a8b9c0d1",
    "commentId": null, // or the comment ID if comment was provided
    "rating": 5
  },
  "message": "Vote recorded successfully" // or "Vote and comment recorded. AI will process comment."
}
```

**Error responses:**

| Status | Code                    | Message                                                                                |
| ------ | ----------------------- | -------------------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`      | `"policyId and rating are required"`                                                   |
| 400    | `VALIDATION_ERROR`      | `"Rating must be between 1 and 5"`                                                     |
| 400    | `VALIDATION_ERROR`      | `"Comment too long (max 500 characters)"`                                              |
| 400    | `VOTING_CLOSED`         | `"Voting is not allowed for this policy at this time. Please check the policy dates."` |
| 403    | `NOT_VERIFIED`          | `"Please verify your phone number before voting"`                                      |
| 403    | `FORBIDDEN`             | `"Voting is temporarily paused for this policy"` (status = `paused`)                   |
| 403    | `FORBIDDEN`             | `"This policy is closed for voting"` (status = `closed`)                               |
| 404    | `NOT_FOUND`             | `"Policy not found"` (also for `draft` or `published` policies)                        |
| 409    | `ALREADY_VOTED`         | `"You have already voted on this policy. Each user can vote only once."`               |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to submit vote"`                                                              |

### 4.2 Add a comment to an existing vote

**`POST /comments/:voteId`**

Adds a detailed comment to a vote that was previously cast without one (or allows a user to amend their comment – only one comment per vote is allowed). The AI worker will process the comment asynchronously.

**Path parameter:**

| Parameter | Type   | Description                              |
| --------- | ------ | ---------------------------------------- |
| `voteId`  | string | ID of an existing vote owned by the user |

**Request body:**

| Field     | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| `comment` | string | yes      | Max 500 characters |

**Response (201 Created):**

```json
{
  "status": "success",
  "data": {
    "commentId": "67f1a2b3c4d5e6f7a8b9c0d2"
  },
  "message": "Comment added successfully. AI will process it."
}
```

**Error responses:**

| Status | Code                    | Message                                           |
| ------ | ----------------------- | ------------------------------------------------- |
| 400    | `VALIDATION_ERROR`      | `"Comment text is required"`                      |
| 400    | `VALIDATION_ERROR`      | `"Comment too long (max 500 characters)"`         |
| 403    | `FORBIDDEN`             | `"You can only comment on your own votes"`        |
| 403    | `FORBIDDEN`             | `"Cannot comment on a policy that is not active"` |
| 400    | `VOTING_CLOSED`         | `"Voting period is closed, cannot add comment"`   |
| 404    | `NOT_FOUND`             | `"Vote not found"`                                |
| 409    | `ALREADY_VOTED`         | `"You have already commented on this vote"`       |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to add comment"`                         |

## 5. Analytics Endpoints

**Roles required:** planner or admin (all endpoints in this section)

**General access rules:**

- For **draft** or **published** policies:
  - The **creator** (planner) receives `400` with message `"Policy is not active yet (no analytics available)"`.
  - Any **other planner** receives `404` with `"Policy not found"` (policy appears non‑existent).
- For **active**, **paused**, or **closed** policies: any planner or admin can view analytics.
- Citizens never have access to these endpoints.

**All endpoints support optional date range filters** (`startDate`, `endDate`) unless otherwise noted.

### 5.1 Policy analytics (summary)

**`GET /analytics/:policyId`**

Returns a high‑level summary of voting and sentiment for a single policy, optionally restricted to a date range.

**Query parameters (all optional):**

| Parameter   | Type   | Description                                                                            |
| ----------- | ------ | -------------------------------------------------------------------------------------- |
| `startDate` | string | ISO date (e.g., `2026-04-01`). Filters votes & comments created on or after this date. |
| `endDate`   | string | ISO date. Filters votes & comments created on or before this date.                     |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "policyId": "67f1a2b3c4d5e6f7a8b9c0d1",
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
    "totalVotes": 12,
    "appVotes": 8,
    "smsVotes": 4
  },
  "message": "Analytics retrieved successfully",
  "timestamp": "..."
}
```

**Error responses :**

| Status | Code               | Message                                                                     |
| ------ | ------------------ | --------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | `"Policy is not active yet (no analytics available)"` (own draft/published) |
| 400    | `VALIDATION_ERROR` | `"Invalid startDate: ..."` or `"Invalid endDate: ..."`                      |
| 403    | `FORBIDDEN`        | `"Access denied. Only planners and admins can view analytics."`             |
| 404    | `NOT_FOUND`        | `"Policy not found"` (other planner's draft/published or non‑existent)      |

### 5.2 Export analytics as CSV

**`GET /analytics/:policyId/export`**

Downloads a CSV file containing each individual vote (rating, channel, date, region). Region is only available for app votes.

**Query parameters:** same as 5.1 (`startDate`, `endDate`).

**Response:** `text/csv` file attachment. Example content:

```csv
rating,channel,date,region
5,app,2026-04-01,Addis Ababa
4,app,2026-04-02,Oromia
3,sms,2026-04-03,
```

**Error responses:**

| Status | Code                    | Message                                                                     |
| ------ | ----------------------- | --------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`      | `"Policy is not active yet (no analytics available)"` (own draft/published) |
| 400    | `VALIDATION_ERROR`      | `"Invalid startDate: ..."` or `"Invalid endDate: ..."`                      |
| 403    | `FORBIDDEN`             | `"Access denied. Only planners and admins can view analytics."`             |
| 404    | `NOT_FOUND`             | `"Policy not found"` (other planner's draft/published or non‑existent)      |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to export analytics"`                                              |

## 5.3 Get paginated comments (with filters)

**`GET /analytics/:policyId/comments`**

Returns comments posted for a policy, with optional filtering by sentiment, date range, pagination. **User emails are never included** for privacy.

**Query parameters (all optional):**

| Parameter   | Type    | Default | Description                                    |
| ----------- | ------- | ------- | ---------------------------------------------- |
| `page`      | integer | 1       | Page number (1‑based)                          |
| `limit`     | integer | 20      | Items per page (max 100)                       |
| `sentiment` | string  | none    | Filter by `positive`, `negative`, or `neutral` |
| `startDate` | string  | none    | ISO date (filter comments created after)       |
| `endDate`   | string  | none    | ISO date (filter comments created before)      |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "comments": [
      {
        "id": "67f1a2b3c4d5e6f7a8b9c0d3",
        "text": "This policy is excellent!",
        "sentiment": "positive",
        "confidence": 0.95,
        "keywords": ["excellent"],
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

**Error responses:**

| Status | Code                    | Message                                                                     |
| ------ | ----------------------- | --------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`      | `"Policy is not active yet (no analytics available)"` (own draft/published) |
| 400    | `VALIDATION_ERROR`      | `"Invalid startDate: ..."` or `"Invalid endDate: ..."`                      |
| 403    | `FORBIDDEN`             | `"Access denied. Only planners and admins can view analytics."`             |
| 404    | `NOT_FOUND`             | `"Policy not found"` (other planner's draft/published or non‑existent)      |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to retrieve comments"`                                             |

## 5.4 Heatmap (unified geographic & time‑series)

**`GET /analytics/heatmap`**

This is the **primary analytics endpoint** for visualising voting patterns over time and across Ethiopian regions. It can produce:

- **Global time series** (vote volume + sentiment aggregated per time bucket, no regional breakdown).
- **Geographic heatmap** (vote volume, average rating, and sentiment per region, per time bucket).

**Roles:** planner, admin

### Query parameters (all optional)

| Parameter   | Type    | Default | Description                                                                                                                                                   |
| ----------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `startDate` | string  | none    | ISO date (e.g., `2026-04-01`). Filters votes and comments created on or after this date.                                                                      |
| `endDate`   | string  | none    | ISO date. Filters votes and comments created on or before this date.                                                                                          |
| `interval`  | string  | `week`  | Grouping interval: `day`, `week`, or `month`.                                                                                                                 |
| `policyId`  | string  | none    | If provided, only votes/comments belonging to that policy are included. Otherwise, data for **all policies** (subject to planner's visibility) is aggregated. |
| `byRegion`  | boolean | `false` | If `true`, the response is grouped by region within each time bucket (geographic heatmap). If `false`, the response is a simple time series (global totals).  |
| `regions`   | string  | none    | Comma‑separated list of region names, e.g., `Addis Ababa,Oromia`. Only applicable when `byRegion=true`. Filters both votes and sentiment to those regions.    |

### Important notes about data sources

- Only **app votes** (with a region snapshot) are included in the geographic parts. SMS votes never appear in region breakdowns because they have no region.
- Sentiment counts are derived from **comments** linked to votes. If a vote has no comment, it contributes only to `totalVotes` and `averageRating`, not to sentiment.
- When `byRegion=false`, the global `totalVotes` includes **SMS votes** as well.

---

### 5.4.1 Response when `byRegion=false` (global time series)

```json
{
  "status": "success",
  "data": {
    "interval": "week",
    "data": [
      {
        "period": "2026-14",
        "totalVotes": 8,
        "averageRating": 4.1,
        "positive": 5,
        "negative": 1,
        "neutral": 2
      },
      {
        "period": "2026-15",
        "totalVotes": 12,
        "averageRating": 3.9,
        "positive": 7,
        "negative": 2,
        "neutral": 3
      }
    ]
  },
  "message": "Heatmap data retrieved successfully",
  "timestamp": "..."
}
```

Fields:

- `period`: time bucket label. For `day`: `YYYY-MM-DD`; for `week`: `YYYY-VV` (ISO week number); for `month`: `YYYY-MM`.
- `totalVotes`: total votes (app + SMS) in that period.
- `averageRating`: average rating (all votes).
- `positive`, `negative`, `neutral`: sentiment counts from comments that fell inside that period.

### 5.4.2 Response when `byRegion=true` (geographic heatmap)

```json
{
  "status": "success",
  "data": {
    "interval": "week",
    "data": [
      {
        "period": "2026-14",
        "startDate": "2026-04-01",
        "endDate": "2026-04-07",
        "regions": [
          {
            "region": "Addis Ababa",
            "totalVotes": 3,
            "averageRating": 4.2,
            "sentimentCounts": {
              "positive": 2,
              "negative": 0,
              "neutral": 1
            }
          },
          {
            "region": "Oromia",
            "totalVotes": 5,
            "averageRating": 3.8,
            "sentimentCounts": {
              "positive": 2,
              "negative": 1,
              "neutral": 2
            }
          }
        ]
      },
      {
        "period": "2026-15",
        "startDate": "2026-04-08",
        "endDate": "2026-04-14",
        "regions": [ ... ]
      }
    ]
  },
  "message": "Heatmap data retrieved successfully",
  "timestamp": "..."
}
```

**Additional fields:**

- `startDate` and `endDate` are human‑readable dates for the period (only for `week` and `month` intervals; for `day` they are the same as `period`).
- Each `region` object contains:
  - `totalVotes`: number of app votes from that region.
  - `averageRating`: average rating of those votes.
  - `sentimentCounts`: aggregated sentiment from comments attached to those votes (only votes with comments contribute to sentiment).

**Note:** If a region appears in the response with `totalVotes: 0` but non‑zero sentiment, it is possible (only comments exist, votes outside date range? In practice, the heatmap merges votes and comments, so a region should not appear without votes unless the `regions` filter explicitly includes it and only comments match – that would be rare. The implementation ensures consistency.)

### 5.4.3 Common use cases

| What you want                                                                 | Example request                                                                                      |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Global weekly vote volume and sentiment for the last 30 days                  | `GET /analytics/heatmap?interval=week&startDate=2026-03-01&endDate=2026-03-31`                       |
| Geographic heatmap for a single policy, daily intervals                       | `GET /analytics/heatmap?policyId=...&byRegion=true&interval=day`                                     |
| Geographic heatmap limited to two regions                                     | `GET /analytics/heatmap?byRegion=true&regions=Addis%20Ababa,Oromia&interval=week`                    |
| Monthly global trend for all policies                                         | `GET /analytics/heatmap?interval=month`                                                              |
| Time series for a specific policy without region breakdown (replaces /trends) | `GET /analytics/heatmap?policyId=...&interval=week` (byRegion defaults to false)                     |
| Geographic snapshot of a policy (replaces /geographic)                        | `GET /analytics/heatmap?policyId=...&byRegion=true&startDate=...&endDate=...` (take earliest period) |

### 5.4.4 Error responses

| Status | Code                    | Message                                                                                                       |
| ------ | ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`      | `"Invalid startDate: ..."` or `"Invalid endDate: ..."`                                                        |
| 400    | `VALIDATION_ERROR`      | `"Invalid policyId format"`                                                                                   |
| 400    | `VALIDATION_ERROR`      | `"Policy is not active yet (no analytics available)"` (policyId supplied, user is creator of draft/published) |
| 403    | `FORBIDDEN`             | `"Access denied. Only planners and admins can view heatmap."`                                                 |
| 404    | `NOT_FOUND`             | `"Policy not found"` (policyId supplied and user is not creator or policy does not exist)                     |
| 500    | `INTERNAL_SERVER_ERROR` | `"Failed to retrieve heatmap data"`                                                                           |

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

## Appendix: Rate Limiting Summary

| Endpoint group                | Limit | Window   | Scope            |
| ----------------------------- | ----- | -------- | ---------------- |
| /auth/login, /auth/verify-otp | 10    | 15 min   | Per IP           |
| All other JSON endpoints      | 100   | 15 min   | Per IP           |
| /sms/receive                  | 3     | 24 hours | Per phone number |
