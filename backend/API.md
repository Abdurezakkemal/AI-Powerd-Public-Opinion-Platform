## API Documentation

### Base URL

http://<your-server-ip>:5000/api (or your domain)

All endpoints return JSON unless otherwise noted.

Protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <token>
```

---

## Authentication

### POST /auth/register

Register a new citizen.

Request Body:

```json
{
  "email": "user@example.com",
  "password": "secret123",
  "phone": "0912345678",
  "region": "Addis Ababa"
}
```

Responses:

201 Created

```json
{ "message": "User created. Please verify phone with OTP." }
```

400 Bad Request – missing fields  
409 Conflict – email or phone already exists

---

### POST /auth/send-otp

Send 6-digit OTP to phone.

Request Body:

```json
{ "phone": "0912345678" }
```

Responses:

200 OK

```json
{ "message": "OTP sent." }
```

400 Bad Request – invalid phone  
429 Too Many Requests – rate limited

---

### POST /auth/verify-otp

Verify OTP and get JWT.

Request Body:

```json
{
  "phone": "0912345678",
  "code": "123456"
}
```

Responses:

200 OK

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "role": "citizen"
}
```

400 Bad Request – invalid or expired code  
410 Gone – code expired

---

### POST /auth/login

Login for any user.

Request Body:

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

Responses:

200 OK

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "role": "citizen|planner|admin"
}
```

401 Unauthorized – invalid credentials

---

## Policies

### GET /policies

List policies. Citizens see only active policies in their region. Planners/admins see all with optional filters.

Query Parameters (optional):

- status – active, closed, draft
- region – city name (planners/admins only)
- page – default 1
- limit – default 20

Responses:

200 OK

```json
{
  "policies": [
    {
      "id": "60d...",
      "title": "New School",
      "description": "...",
      "policyCode": "SCHL123",
      "targetRegions": ["Addis Ababa"],
      "startDate": "2026-03-01T00:00:00.000Z",
      "endDate": "2026-04-01T00:00:00.000Z",
      "status": "active",
      "averageRating": 4.2,
      "totalVotes": 150
    }
  ],
  "total": 10,
  "page": 1
}
```

Access: Citizens, Planners, Admins

---

### GET /policies/:id

Get a single policy.

Path Parameter: id – policy ID

Responses:

200 OK

```json
{
  "id": "60d...",
  "title": "New School",
  "description": "...",
  "policyCode": "SCHL123",
  "targetRegions": ["Addis Ababa"],
  "startDate": "2026-03-01T00:00:00.000Z",
  "endDate": "2026-04-01T00:00:00.000Z",
  "status": "active",
  "createdBy": "planner@example.com",
  "createdAt": "2026-02-01T00:00:00.000Z"
}
```

404 Not Found

403 Forbidden – citizen trying to access outside region or inactive policy

Access: Citizens (only if active and in region), Planners, Admins

---

### POST /policies

Create a new policy. Planners/admins only.

Request Body:

```json
{
  "title": "New School Construction",
  "description": "Proposal to build a new school in ...",
  "targetRegions": ["Addis Ababa", "Oromia"],
  "startDate": "2026-03-01",
  "endDate": "2026-04-01"
}
```

Responses:

201 Created

```json
{
  "id": "60d...",
  "policyCode": "SCHL123",
  "message": "Policy created."
}
```

400 Bad Request – invalid dates or missing fields

403 Forbidden – not authorized

Access: Planner, Admin

---

### PUT /policies/:id

Update a policy. Only allowed if status is draft.

Path Parameter: id – policy ID

Request Body (all fields optional):

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "targetRegions": ["Addis Ababa"],
  "startDate": "2026-03-01",
  "endDate": "2026-04-15"
}
```

Responses:

200 OK – updated policy object

400 Bad Request – invalid data

403 Forbidden – not authorized or not in draft

404 Not Found

Access: Planner, Admin

---

### DELETE /policies/:id

Close or delete a policy.  
If draft, permanently delete; if active, close; if already closed, 404.

Path Parameter: id – policy ID

Responses:

200 OK

```json
{ "message": "Policy closed." }
```

403 Forbidden

404 Not Found

Access: Planner, Admin

---

## Feedback

### POST /feedback

Submit a rating and optional comment (app only).

Request Body:

```json
{
  "policyId": "60d...",
  "rating": 4,
  "comment": "I support this but it's taking too long."
}
```

Responses:

201 Created

```json
{ "message": "Feedback recorded." }
```

400 Bad Request – invalid rating or comment too long

403 Forbidden – user not verified

409 Conflict – already voted

404 Not Found – policy not active

Access: Citizen (authenticated, verified)

---

## Analytics

### GET /analytics/:policyId

Get aggregated analytics for a policy.

Path Parameter: policyId – policy ID

Responses:

200 OK

```json
{
  "policyId": "60d...",
  "title": "New School",
  "averageRating": 4.2,
  "ratingDistribution": { "1": 5, "2": 10, "3": 20, "4": 50, "5": 65 },
  "sentimentCounts": { "positive": 80, "negative": 15, "neutral": 55 },
  "topKeywords": [
    { "keyword": "roads", "count": 45 },
    { "keyword": "water", "count": 23 }
  ],
  "totalVotes": 150,
  "appVotes": 120,
  "smsVotes": 30
}
```

403 Forbidden

404 Not Found

Access: Planner, Admin

---

### GET /analytics/:policyId/export

Download rating data as CSV.

Path Parameter: policyId – policy ID

Response: CSV file (attachment). Columns: rating, channel, date, region.

Access: Planner, Admin

---

### GET /analytics/:policyId/comments

Get raw comments with AI tags.

Path Parameter: policyId – policy ID

Query Parameters (optional):

- page – default 1
- limit – default 20
- sentiment – filter by positive, negative, neutral

Responses:

200 OK

```json
{
  "comments": [
    {
      "id": "...",
      "text": "Great project!",
      "sentiment": "positive",
      "confidence": 0.98,
      "keywords": ["great", "project"],
      "createdAt": "2026-03-01T10:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1
}
```

403 Forbidden

404 Not Found

Access: Planner, Admin

### GET /analytics/:policyId/geographic

Get sentiment and rating per region (city) for a policy.

Path Parameter:

- policyId – policy ID

Responses:

200 OK

```json
{
  "policyId": "POLICY_ID",
  "regions": [
    {
      "region": "CITY_NAME",
      "totalVotes": NUMBER,
      "averageRating": NUMBER,
      "sentimentCounts": {
        "positive": NUMBER,
        "negative": NUMBER,
        "neutral": NUMBER
      }
    }
  ]
}
```

403 Forbidden – user not authorized
404 Not Found – policy not found

Access: Planner, Admin

### GET /analytics/:policyId/trends

Get trends over time for a policy, including vote counts and sentiment breakdowns.

Path Parameter:

- policyId – policy ID

Query Parameters (optional):

- interval – "day" (default) or "week"; controls how dates are grouped.

Responses:

200 OK

```json
{
  "policyId": "POLICY_ID",
  "interval": "day",
  "data": [
    {
      "date": "2026-03-01",
      "averageRating": 4.12,
      "positive": 8,
      "negative": 2,
      "neutral": 5,
      "total": 15
    },
    {
      "date": "2026-03-02",
      "averageRating": 4.2,
      "positive": 12,
      "negative": 1,
      "neutral": 7,
      "total": 20
    }
  ]
}
```

403 Forbidden – user not authorized
404 Not Found – policy not found

Access: Planner, Admin

---

## SMS Simulation (Public)

### POST /sms/receive

Simulate an incoming SMS vote.

Request Body:

```json
{
  "phone": "0912345678",
  "message": "RATE POL123 4"
}
```

Response: Plain text

```text
Your vote for "New School Construction" has been recorded. Thank you!
```

Error Responses (plain text):

400 – Invalid format, missing fields  
403 – Number registered with app  
404 – Policy not found or not active  
409 – Already voted  
429 – Rate limit exceeded

Access: Public (rate limited)

---

### GET /sms/results

Get results for a closed policy via SMS.

Query Parameters:

- phone – phone number (for rate limiting)
- code – policy code

Response: Plain text

```text
Policy: New School Construction – Final average rating: 4.2 stars (150 votes)
```

Error Responses (plain text):

400 – Missing code  
404 – Policy not found or not yet closed

Access: Public (rate limited)

---

## Admin – Planner Management

### GET /users/planners

List all planner accounts.

Responses:

200 OK

```json
{
  "planners": [
    {
      "id": "...",
      "email": "planner@example.com",
      "createdAt": "..."
    }
  ]
}
```

403 Forbidden – not admin

Access: Admin

---

### POST /users/planners

Create a new planner account.

Request Body:

```json
{
  "email": "newplanner@example.com",
  "password": "temporary123"
}
```

Responses:

201 Created

```json
{
  "id": "...",
  "email": "newplanner@example.com",
  "message": "Planner created"
}
```

400 Bad Request  
409 Conflict – email exists  
403 Forbidden

Access: Admin

---

### PUT /users/planners/:id

Update a planner (reset password, deactivate/reactivate).  
Note: Deactivation requires an active field in User model (not yet implemented).

Path Parameter: id – planner user ID

Request Body (optional fields):

```json
{
  "password": "newpassword",
  "status": "inactive"
}
```

Responses:

200 OK

```json
{ "message": "Planner updated" }
```

404 Not Found  
403 Forbidden

Access: Admin

---

## Health Check

### GET /health

Check if backend is running.

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-03-01T12:00:00.000Z"
}
```

Access: Public

---
