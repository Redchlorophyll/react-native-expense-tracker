# Backend Technical Specification Document
**Project:** React Native Expense Tracker  
**Version:** 1.0 — MVP  
**Date:** March 2026  

---

## Table of Contents

1. [Feature Summary](#1-feature-summary)
2. [Data Models](#2-data-models)
3. [API Endpoints](#3-api-endpoints)
4. [Backend Flow](#4-backend-flow)
5. [Security Concerns & Best Practices](#5-security-concerns--best-practices)
6. [Infrastructure Recommendations](#6-infrastructure-recommendations)
7. [Cost Estimation](#7-cost-estimation)

---

## 1. Feature Summary

The mobile app should be scoped into four business domains:

| Domain | Current State | What the BE Must Do |
|---|---|---|
| **`account`** | Demo mode — any credentials accepted, OTP is a no-op | Real user accounts, hashed passwords, actual OTP via email, session token + refresh token |
| **`config`** | Stored locally (banks list, categories, cutoff day) | Persist per-user configuration |
| **`investments`** | Stored locally | Persist per-user fund distributions |
| **`expenses-tracker`** | Transactions/cycles/uploads are local or mock | Persist transactions and cycles; parse uploaded bank statements into transactions |

### Auth Flow (diagram)

```
Register
  App: POST /account/register { username, email, password }
  BE:  validate → hash password → create user (unverified) → send OTP email
  App: POST /account/verify-otp { email, otp, mode: "register" }
  BE:  validate OTP → mark user verified → return { sessionToken, refreshToken, user }

Login
  App: POST /account/login { emailOrUsername, password }
  BE:  validate credentials → send OTP email → return { message: "OTP sent" }
  App: POST /account/verify-otp { email, otp, mode: "login" }
  BE:  validate OTP → return { sessionToken, refreshToken, user }
```

---

## 2. Data Models

Below are the recommended database schemas (PostgreSQL assumed; adapt as needed).

### `users`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
username      VARCHAR(50)  NOT NULL UNIQUE
email         VARCHAR(255) NOT NULL UNIQUE
password_hash VARCHAR(255) NOT NULL
is_verified   BOOLEAN      NOT NULL DEFAULT FALSE
created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
```

### `otp_codes`
```sql
id         UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id    UUID        REFERENCES users(id) ON DELETE CASCADE
email      VARCHAR(255) NOT NULL
code       VARCHAR(6)   NOT NULL          -- hashed in DB
mode       VARCHAR(20)  NOT NULL          -- 'register' | 'login'
expires_at TIMESTAMPTZ  NOT NULL
used       BOOLEAN      NOT NULL DEFAULT FALSE
created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
```
> Index on `(email, mode, used, expires_at)` for fast lookup.

### `refresh_tokens`
```sql
id         UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id    UUID        REFERENCES users(id) ON DELETE CASCADE
token_hash VARCHAR(255) NOT NULL UNIQUE   -- SHA-256 of the raw token
expires_at TIMESTAMPTZ  NOT NULL
revoked    BOOLEAN      NOT NULL DEFAULT FALSE
created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
```

### `banks`
```sql
id             UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id        UUID         REFERENCES users(id) ON DELETE CASCADE
bank_id        VARCHAR(50)  NOT NULL              -- user-defined external key e.g. "BCA-001"
name           VARCHAR(100) NOT NULL
color          VARCHAR(7)   NOT NULL              -- hex color
icon           VARCHAR(20)  NOT NULL              -- 'building-2' | 'landmark'
balance        BIGINT       NOT NULL DEFAULT 0    -- store as integer cents/rupiah
created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
UNIQUE (user_id, bank_id)
```

### `categories`
```sql
id         UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id    UUID         REFERENCES users(id) ON DELETE CASCADE  -- NULL = system default
name       VARCHAR(100) NOT NULL
icon       VARCHAR(50)  NOT NULL
color      VARCHAR(7)   NOT NULL
type       VARCHAR(10)  NOT NULL  -- 'income' | 'expense'
created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
```

### `app_config`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID    REFERENCES users(id) ON DELETE CASCADE UNIQUE
cutoff_day  SMALLINT NOT NULL DEFAULT 25 CHECK (cutoff_day BETWEEN 1 AND 31)
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `cycles`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID        REFERENCES users(id) ON DELETE CASCADE
start_date    DATE        NOT NULL
end_date      DATE        NOT NULL
is_closed     BOOLEAN     NOT NULL DEFAULT FALSE
closed_at     TIMESTAMPTZ
created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
UNIQUE (user_id, start_date)
```

### `transactions`
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id               UUID         REFERENCES users(id) ON DELETE CASCADE
cycle_id              UUID         REFERENCES cycles(id)
from_bank_id          UUID         REFERENCES banks(id)
to_bank_id            UUID         REFERENCES banks(id)          -- nullable
amount                BIGINT       NOT NULL                       -- positive for income, negative for expense
description           VARCHAR(255) NOT NULL
type                  VARCHAR(20)  NOT NULL                       -- 'income'|'expense'|'transfer'|'investment'
category              VARCHAR(100)
date                  DATE         NOT NULL
notes                 TEXT
is_transfer_match     BOOLEAN      NOT NULL DEFAULT FALSE
matched_transaction_id UUID        REFERENCES transactions(id)
from_account_name     VARCHAR(100)
to_account_name       VARCHAR(100)
from_payment_method   VARCHAR(50)
to_payment_method     VARCHAR(50)
created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
```
> Indexes: `(user_id, date DESC)`, `(user_id, cycle_id)`, `(user_id, type)`

### `investment_distributions`
```sql
id         UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id    UUID         REFERENCES users(id) ON DELETE CASCADE
label      VARCHAR(100) NOT NULL
amount     BIGINT       NOT NULL
notes      TEXT
created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
```

---

## 3. API Endpoints

**Base URL:** `https://your-service-domain.com/api/v1`  
**Auth:** Session token (HTTP-only cookie) for protected routes. Keep refresh token in secure storage and rotate on refresh.  
**Response envelope:**
```json
{ "data": { ... }, "error": null }
{ "data": null, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

**Endpoint Naming Convention**
- Domain-first prefix: `/account/*`, `/config/*`, `/investments/*`, `/expenses-tracker/*`
- Use kebab-case for domain and multi-word path segments
- Use plural resources for collections (`/transactions`, `/cycles`, `/distributions`, `/statements`)
- Use `/:id` for single-resource operations

### Endpoint Index

| Domain | Method | Endpoint | Purpose |
|---|---|---|---|
| `account` | POST | `/account/register` | Register account and send OTP |
| `account` | POST | `/account/login` | Validate credentials and send OTP |
| `account` | POST | `/account/verify-otp` | Verify OTP and create session |
| `account` | POST | `/account/otp/resend` | Resend OTP |
| `account` | POST | `/account/token/refresh` | Rotate refresh token and renew session |
| `account` | POST | `/account/logout` | Revoke refresh token |
| `account` | GET | `/account/me` | Get current account profile |
| `account` | PATCH | `/account/password` | Change password |
| `config` | GET | `/config` | Fetch banks, categories, cutoff day |
| `config` | PUT | `/config/banks` | Replace bank list |
| `config` | PATCH | `/config/cutoff-day` | Update cutoff day |
| `investments` | GET | `/investments/distributions` | List investment distributions |
| `investments` | POST | `/investments/distributions` | Create distribution |
| `investments` | DELETE | `/investments/distributions/:id` | Delete distribution |
| `expenses-tracker` | GET | `/expenses-tracker/transactions` | List transactions |
| `expenses-tracker` | PATCH | `/expenses-tracker/transactions/:id` | Update mutable transaction fields |
| `expenses-tracker` | GET | `/expenses-tracker/cycles` | List cycles |
| `expenses-tracker` | GET | `/expenses-tracker/cycles/:id` | Get cycle detail and summary |
| `expenses-tracker` | PATCH | `/expenses-tracker/cycles/:id` | Close cycle |
| `expenses-tracker` | GET | `/expenses-tracker/statements` | List statement upload jobs |
| `expenses-tracker` | POST | `/expenses-tracker/statements` | Upload statement files |
| `expenses-tracker` | GET | `/expenses-tracker/statements/jobs/:jobId` | Poll statement parse job |
| `expenses-tracker` | POST | `/expenses-tracker/admin/adjustments` | Admin-only corrective adjustment for closed cycles |

---

### 3.1 `account`

#### `POST /account/register`
Register a new account. Sends OTP to the given email.

**Request body:**
```json
{
  "username": "dhonni",
  "email": "dhonni@example.com",
  "password": "secret123"
}
```

**Validation:**
- `username`: 3–50 chars, alphanumeric + underscores only, unique
- `email`: valid RFC-5322 format, unique
- `password`: min 8 chars, at least 1 number

**Response `201 Created`:**
```json
{
  "data": {
    "message": "Kode verifikasi telah dikirim ke dhonni@example.com"
  }
}
```

**Error codes:** `VALIDATION_ERROR`, `EMAIL_TAKEN`, `USERNAME_TAKEN`

---

#### `POST /account/login`
Validate credentials then send an OTP. Does **not** return a token yet.

**Request body:**
```json
{
  "emailOrUsername": "dhonni",
  "password": "secret123"
}
```

**Response `200 OK`:**
```json
{
  "data": {
    "email": "dhonni@example.com",
    "message": "Kode verifikasi telah dikirim ke dhonni@example.com"
  }
}
```

**Error codes:** `INVALID_CREDENTIALS`, `USER_NOT_VERIFIED`, `ACCOUNT_NOT_FOUND`

---

#### `POST /account/verify-otp`
Verify the 6-digit OTP for both registration completion and login.

**Request body:**
```json
{
  "email": "dhonni@example.com",
  "otp": "482917",
  "mode": "login"
}
```
`mode` is `"register"` or `"login"`.

**Response `200 OK`:**
```json
{
  "data": {
    "sessionToken": "f06b8eb6-c2d6-4f53-8adb-f85f2d4f3e7c",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g...",
    "user": {
      "id": "uuid",
      "username": "dhonni",
      "email": "dhonni@example.com"
    }
  }
}
```

**Error codes:** `INVALID_OTP`, `EXPIRED_OTP`, `OTP_ALREADY_USED`

---

#### `POST /account/otp/resend`
Resend an OTP (rate-limited).

**Request body:**
```json
{ "email": "dhonni@example.com", "mode": "login" }
```

**Response `200 OK`:**
```json
{ "data": { "message": "OTP resent." } }
```

**Rate limit:** Max 3 sends per email per 10 minutes.

---

#### `POST /account/token/refresh`
Exchange a refresh token for a new session token.

**Request body:**
```json
{ "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g..." }
```

**Response `200 OK`:**
```json
{
  "data": {
    "sessionToken": "a57cf0d9-74c1-4211-a8b1-4b074a50a44a",
    "refreshToken": "newRefreshTokenHere..."
  }
}
```

**Error codes:** `INVALID_REFRESH_TOKEN`, `REFRESH_TOKEN_EXPIRED`

---

#### `POST /account/logout` 🔒
Revoke the current refresh token.

**Request body:**
```json
{ "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g..." }
```

**Response `204 No Content`**

---

#### `GET /account/me` 🔒
Get the current authenticated user.

**Response `200 OK`:**
```json
{
  "data": {
    "id": "uuid",
    "username": "dhonni",
    "email": "dhonni@example.com"
  }
}
```

---

#### `PATCH /account/password` 🔒
Change the user's password.

**Request body:**
```json
{
  "currentPassword": "secret123",
  "newPassword": "newSecret456"
}
```

**Response `200 OK`:**
```json
{ "data": { "message": "Password updated." } }
```

**Error codes:** `INVALID_CURRENT_PASSWORD`, `SAME_PASSWORD`

---

### 3.2 `expenses-tracker` / transactions

#### `GET /expenses-tracker/transactions` 🔒
List all transactions for the authenticated user.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `cycleId` | UUID | Filter by cycle |
| `type` | string | `income` \| `expense` \| `transfer` \| `investment` |
| `bankId` | UUID | Filter by source bank |
| `from` | date | Start date (`YYYY-MM-DD`) |
| `to` | date | End date (`YYYY-MM-DD`) |
| `page` | integer | Page number (default 1) |
| `limit` | integer | Items per page (default 50, max 200) |

**Response `200 OK`:**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "amount": 15000000,
        "description": "Gaji Bulan Januari",
        "fromBankId": "bank-uuid",
        "toBankId": null,
        "type": "income",
        "category": "Gaji",
        "date": "2025-01-25",
        "notes": "Gaji pokok + tunjangan",
        "isTransferMatch": false,
        "matchedTransactionId": null,
        "fromAccountName": "Dhonni AHS",
        "toAccountName": null,
        "fromPaymentMethod": null,
        "toPaymentMethod": null,
        "cycleId": "cycle-uuid"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 50
  }
}
```

---

#### `PATCH /expenses-tracker/transactions/:id` 🔒
Update a transaction's mutable fields (notes, category, payment method labels).

**Request body** (all fields optional):
```json
{
  "notes": "Updated note",
  "category": "Makanan",
  "fromAccountName": "Dhonni AHS",
  "toAccountName": "Warung Pak Budi",
  "fromPaymentMethod": null,
  "toPaymentMethod": "QRIS"
}
```

**Response `200 OK`:**
```json
{ "data": { "id": "uuid", "notes": "Updated note", "...": "..." } }
```

**Note:** `amount`, `type`, `date`, `fromBankId`, `toBankId` are **immutable** after creation. Return `422` if client attempts to change them.

**Business rules:**
- If the transaction's cycle is closed (`cycle.is_closed = true`), reject update with `409 Conflict`.
- If update changes transaction classification into or out of `investment`, adjust investment balance atomically in the same DB transaction.
- Only transactions in the current active (open) cycle are editable by regular users.

---

### 3.3 `expenses-tracker` / cycles

#### `GET /expenses-tracker/cycles` 🔒
List all cycles for the user, newest first.

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "startDate": "2025-02-25",
      "endDate": "2025-03-24",
      "isClosed": false,
      "closedAt": null,
      "transactionCount": 13
    }
  ]
}
```

---

#### `GET /expenses-tracker/cycles/:id` 🔒
Get a single cycle's metadata and pre-computed summary. Does **not** embed transactions — fetch those separately via `GET /expenses-tracker/transactions?cycleId=:id`.

**Response `200 OK`:**
```json
{
  "data": {
    "id": "uuid",
    "startDate": "2025-02-25",
    "endDate": "2025-03-24",
    "isClosed": false,
    "closedAt": null,
    "transactionCount": 13,
    "summary": {
      "totalIncome": 23000000,
      "totalExpense": 9700000,
      "netAmount": 13300000,
      "categoryBreakdown": { "Makanan": 1700000, "Tagihan": 3150000 },
      "topExpenseCategory": "Tagihan"
    }
  }
}
```

> To load the transactions for a cycle, call `GET /expenses-tracker/transactions?cycleId=<id>` (supports pagination).

---

#### `PATCH /expenses-tracker/cycles/:id` 🔒
Update a cycle — primarily used to **close** it.

**Request body:**
```json
{ "isClosed": true }
```

**Response `200 OK`:**
```json
{
  "data": {
    "id": "uuid",
    "isClosed": true,
    "closedAt": "2025-03-25T00:00:00Z"
  }
}
```

**Business rule:** Once `isClosed` is `true`, it cannot be set back to `false`.

**Cycle closing policy (current iteration):**
- Cycle closure is user-driven (manual action via `PATCH /expenses-tracker/cycles/:id`).
- No automatic scheduler-based closing in current iteration.
- Grace-window auto-close can be introduced in next iteration.

---

### 3.4 `config`

#### `GET /config` 🔒
Get the user's full app configuration (banks, categories, cutoff day).

**Response `200 OK`:**
```json
{
  "data": {
    "cutoffDay": 25,
    "banks": [
      {
        "id": "uuid",
        "bankId": "BCA-001",
        "name": "BCA",
        "color": "#0051A1",
        "icon": "building-2",
        "balance": 15000000
      }
    ],
    "categories": [
      {
        "id": "uuid",
        "name": "Gaji",
        "icon": "briefcase",
        "color": "#10b981",
        "type": "income"
      }
    ]
  }
}
```

---

#### `PUT /config/banks` 🔒
Replace the user's full bank list (the app sends the full array on save).

**Request body:**
```json
{
  "banks": [
    {
      "id": "uuid-or-null-for-new",
      "bankId": "BCA-001",
      "name": "BCA",
      "color": "#0051A1",
      "icon": "building-2",
      "balance": 15000000
    }
  ]
}
```

**Response `200 OK`:**
```json
{ "data": { "banks": [ { "...": "..." } ] } }
```

**Business rule:** Banks referenced by existing transactions may not be deleted. Return `409 Conflict` if a delete is attempted on a referenced bank.

---

#### `PATCH /config/cutoff-day` 🔒
Change the cycle cutoff day. Takes effect after the current active cycle ends.

**Request body:**
```json
{ "cutoffDay": 1 }
```

**Validation:** Integer between 1 and 31.

**Response `200 OK`:**
```json
{
  "data": {
    "cutoffDay": 1,
    "effectiveFrom": "2025-04-01",
    "message": "Perubahan berlaku setelah siklus aktif selesai pada 24 Mar 2025"
  }
}
```

---

### 3.5 `investments`

#### `GET /investments/distributions` 🔒
List the user's fund distributions.

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "label": "Reksadana",
      "amount": 5000000,
      "notes": "Produk Bibit",
      "createdAt": "2025-03-10T00:00:00Z"
    }
  ]
}
```

---

#### `POST /investments/distributions` 🔒
Add a new distribution entry.

**Request body:**
```json
{
  "label": "Reksadana",
  "amount": 5000000,
  "notes": "Produk Bibit"
}
```

**Validation:** `label` required, max 100 chars; `amount` positive integer.

**Response `201 Created`:**
```json
{ "data": { "id": "uuid", "label": "Reksadana", "amount": 5000000, "notes": "Produk Bibit", "createdAt": "..." } }
```

---

#### `DELETE /investments/distributions/:id` 🔒
Remove a distribution entry.

**Response `204 No Content`**

---

### 3.6 `expenses-tracker` / statements

Users manually upload PDF bank statements from their bank. The server parses the PDF, extracts transactions, and inserts them into the database. The raw PDF is deleted immediately after parsing (success or failure) — only the extracted transaction rows are persisted.

---

#### `GET /expenses-tracker/statements` 🔒
List the user's past upload jobs (upload history).

**Query params:**

| Param | Type | Description |
|---|---|---|
| `page` | integer | Page number (default 1) |
| `limit` | integer | Items per page (default 20) |

**Response `200 OK`:**
```json
{
  "data": {
    "items": [
      {
        "id": "job-uuid",
        "fileName": "BCA_Jan2025.pdf",
        "bankName": "BCA",
        "status": "completed",
        "transactionsImported": 18,
        "duplicatesSkipped": 2,
        "uploadedAt": "2025-03-10T09:30:00Z",
        "completedAt": "2025-03-10T09:30:45Z"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

`status` values: `pending` → `processing` → `completed` | `failed`

---

#### `POST /expenses-tracker/statements` 🔒
Upload one or more bank statement PDFs for parsing. Accepts a `multipart/form-data` request. Each file may optionally carry a PDF password (common for Indonesian bank statements such as BCA and Mandiri).

**Request** (`multipart/form-data`):

| Field | Type | Required | Description |
|---|---|---|---|
| `files` | File[] | Yes | One or more PDF files (max 10 per request, max 10 MB each) |
| `passwords` | string[] | No | Parallel array of PDF passwords, one per file. Send empty string `""` if a file has no password |
| `bankId` | string | No | UUID of the bank this statement belongs to. If omitted, the parser will attempt auto-detection from the PDF content |

**Example (two files, one password-protected):**
```
Content-Type: multipart/form-data; boundary=----boundary

------boundary
Content-Disposition: form-data; name="files"; filename="BCA_Jan2025.pdf"
Content-Type: application/pdf

<binary>
------boundary
Content-Disposition: form-data; name="files"; filename="Mandiri_Jan2025.pdf"
Content-Type: application/pdf

<binary>
------boundary
Content-Disposition: form-data; name="passwords"

BCA123
------boundary
Content-Disposition: form-data; name="passwords"


------boundary--
```

**Response `202 Accepted`:**
```json
{
  "data": {
    "jobId": "job-uuid",
    "status": "processing",
    "filesReceived": 2,
    "message": "PDFs queued for parsing. Poll GET /expenses-tracker/statements/jobs/:jobId for status."
  }
}
```

Parsing is handled **asynchronously** (background job queue) because PDF extraction can be slow for large statements. The raw PDF is deleted from storage immediately after the parser finishes, regardless of outcome.

**Error codes:** `INVALID_FILE_TYPE`, `FILE_TOO_LARGE`, `TOO_MANY_FILES`

---

#### `GET /expenses-tracker/statements/jobs/:jobId` 🔒
Poll the status of an async PDF parse job.

**Response `200 OK`:**
```json
{
  "data": {
    "jobId": "job-uuid",
    "status": "completed",
    "results": [
      {
        "fileName": "BCA_Jan2025.pdf",
        "status": "success",
        "transactionsImported": 18,
        "duplicatesSkipped": 2,
        "parseErrors": []
      },
      {
        "fileName": "Mandiri_Jan2025.pdf",
        "status": "failed",
        "error": "WRONG_PDF_PASSWORD"
      }
    ],
    "completedAt": "2025-03-19T10:01:30Z"
  }
}
```

`status` values: `pending` → `processing` → `completed` | `failed`

> **Security note:** PDF passwords are used in memory only during parsing and are never stored in the database or written to logs.

---

### 3.7 `expenses-tracker` / admin adjustments

#### `POST /expenses-tracker/admin/adjustments` 🔒
Create an admin-only corrective entry for exceptional cases (for example, fixing historical data in closed cycles) without reopening cycles.

**Request body:**
```json
{
  "cycleId": "uuid",
  "adjustmentType": "investment_balance",
  "amountDelta": -250000,
  "reason": "Correct misclassified transaction from prior cycle",
  "referenceTransactionId": "uuid-or-null"
}
```

**Response `201 Created`:**
```json
{
  "data": {
    "id": "adjustment-uuid",
    "cycleId": "uuid",
    "adjustmentType": "investment_balance",
    "amountDelta": -250000,
    "reason": "Correct misclassified transaction from prior cycle",
    "createdBy": "admin-user-id",
    "createdAt": "2026-07-03T10:00:00Z"
  }
}
```

**Authorization:**
- Admin role required.
- Must be auditable (who changed what and why).

---

## 4. Backend Flow

### 4.1 Registration Flow

```
1. Client  → POST /account/register { username, email, password }
2. Server:
   a. Validate fields (format, uniqueness)
   b. Hash password with bcrypt (cost factor ≥ 12)
   c. Insert user record with is_verified = false
   d. Generate cryptographically random 6-digit OTP
   e. Hash OTP with bcrypt and store in otp_codes with expires_at = NOW() + 10 min, mode = 'register'
   f. Send OTP email via transactional email provider (e.g. Resend, SendGrid)
3. Client  → POST /account/verify-otp { email, otp, mode: "register" }
4. Server:
   a. Find latest unused, unexpired OTP with mode = 'register' for that email
   b. Verify OTP against stored hash
   c. Mark OTP as used
   d. Set user.is_verified = true
   e. Create default app_config row (cutoff_day = 25)
   f. Seed default system categories for the user
  g. Issue session token (2 days TTL) + refresh token (5 days TTL)
   h. Store hashed refresh token in refresh_tokens table
  i. Return { sessionToken, refreshToken, user }
```

### 4.2 Login Flow

```
1. Client  → POST /account/login { emailOrUsername, password }
2. Server:
   a. Resolve account by email or username
   b. Verify user exists and is_verified = true
   c. Compare password with bcrypt
   d. On success: generate OTP, hash & store, send email
   e. Return { email, message } — no token yet
3. Client  → POST /account/verify-otp { email, otp, mode: "login" }
4. Server:
   a. Validate OTP (same as step 4 of registration)
  b. Issue session token + refresh token
   c. Return tokens + user profile
```

### 4.3 Token Refresh Flow

```
1. Client detects 401 on any request
2. Client → POST /account/token/refresh { refreshToken }
3. Server:
   a. Hash incoming token and look up in refresh_tokens
   b. Verify not revoked and not expired
  c. Issue new session token + rotate refresh token
   d. Mark old refresh token as revoked
   e. Return new token pair
4. Client retries original request with new session token
```

### 4.4 Cycle Auto-Creation

When a user logs in or triggers a sync, the server checks whether the current date has crossed the cutoff day and no active cycle exists:

```
function ensureActiveCycle(userId):
  config = getConfig(userId)
  activeCycle = findOpenCycle(userId)
  if activeCycle exists → return activeCycle

  // Compute the expected current cycle date range
  today = currentDate()
  if today.day >= config.cutoffDay:
    startDate = (today.year, today.month, config.cutoffDay)
    endDate   = (today.year, today.month + 1, config.cutoffDay - 1)
  else:
    startDate = (today.year, today.month - 1, config.cutoffDay)
    endDate   = (today.year, today.month, config.cutoffDay - 1)

  create cycle { userId, startDate, endDate, isClosed: false }
  return cycle
```

This runs on `GET /expenses-tracker/sync` and `GET /expenses-tracker/cycles`.

Cycle closure itself remains manual in current iteration (no scheduler dependency).

### 4.5 Transfer Detection

The app currently runs transfer detection client-side. On the backend, this should run after any batch import or sync:

```
For each unmatched expense transaction T1 with amount X:
  Look for an income transaction T2 where:
    - T2.amount == X
    - T2.fromBankId != T1.fromBankId
    - |T2.date - T1.date| <= 24 hours
    - T2.isTransferMatch == false
  If found:
    T1.type = 'transfer', T1.isTransferMatch = true, T1.matchedTransactionId = T2.id
    T2.type = 'transfer', T2.isTransferMatch = true, T2.matchedTransactionId = T1.id
```

Run inside a transaction (DB transaction) to ensure atomicity.

### 4.6 Cutoff Day Change

Changing the cutoff day does not immediately affect the active cycle:

```
1. Client → PATCH /config/cutoff-day { cutoffDay: 1 }
2. Server:
   a. Validate 1 ≤ cutoffDay ≤ 31
   b. Update app_config.cutoff_day
   c. Find the currently open cycle → return its endDate as "effectiveFrom"
   d. The next call to ensureActiveCycle (after current cycle closes) will use the new cutoff day
```

### 4.7 Investment Balance Synchronization

When updating a transaction, investment totals must remain consistent with transaction history:

```
On PATCH /expenses-tracker/transactions/:id:
  1. Load existing transaction row (before update)
  2. Reject if parent cycle is closed
  3. Apply allowed field updates
  4. If classification transitions affect investment:
    - non-investment -> investment: add amount to investment balance
    - investment -> non-investment: subtract amount from investment balance
    - investment -> investment and amount changed: apply delta (newAmount - oldAmount)
  5. Commit all changes in one DB transaction
```

This prevents drift between investment balance and underlying transactions.

---

## 5. Security Concerns & Best Practices

### 5.1 Authentication & Session Management

| Risk | Mitigation |
|---|---|
| Brute-force login | Rate limit `/account/login` to 5 attempts per email per 15 min; lock account for 15 min after 10 consecutive failures |
| OTP guessing | Store OTP as **bcrypt hash**, not plaintext; 10-minute expiry; one-time use; rate-limit `/account/otp/resend` to 3 per email per 10 min |
| Session token leakage | Use `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict`) cookies; never expose session tokens to JS |
| Long-lived sessions | Session token TTL = **2 days**; refresh token TTL = **5 days** (aligned with current personal-service behavior) |
| Refresh token theft | Rotate refresh token on every use (issue new, revoke old); detect reuse of a revoked token as a compromise signal → revoke all tokens for that user |
| Concurrent sessions | Store refresh tokens in DB; allows targeted revocation |

### 5.2 Input Validation & Injection

| Risk | Mitigation |
|---|---|
| SQL Injection | Use a parameterized query library (e.g. Prisma, Drizzle, `pg` with `$1` placeholders) — **never** string-interpolate user input into queries |
| XSS (stored) | Sanitize text fields (`description`, `notes`, `label`) — strip HTML tags; enforce max lengths in DB schema |
| Mass-assignment | Define explicit allowed fields in every PATCH handler; never spread `req.body` directly onto a DB record |
| Type coercion | Validate all inputs with a schema library (Zod / Joi) at the controller boundary before any business logic |
| Integer overflow on amounts | Store monetary values as `BIGINT` (rupiah integer, no decimals); validate `amount` is positive integer ≤ 999_999_999_999 |

### 5.3 Authorization

| Risk | Mitigation |
|---|---|
| Broken Object-Level Auth (BOLA) | Every query **must** include `WHERE user_id = :requestingUserId`; never trust a resource ID from the request body/params alone |
| Horizontal privilege escalation | Middleware verifies the session token and resolves authenticated user context; repository functions receive `userId` from trusted auth context, not params |
| Insecure direct object reference | Use opaque UUIDs (v4) as primary keys — never sequential integers |

**Pattern for every protected DB query:**
```go
// Safe — always scope to authenticated user
query := `SELECT id, start_date, end_date FROM cycles WHERE id = $1 AND user_id = $2`
err := db.QueryRowContext(ctx, query, cycleID, authUserID).Scan(&cycle.ID, &cycle.StartDate, &cycle.EndDate)
if err == sql.ErrNoRows {
  return ErrNotFound
}
```

### 5.4 Password Security

- Hash with **bcrypt** at cost factor **12** (or argon2id with `m=65536, t=3, p=4`)
- Never log or return passwords/hashes in responses
- On password change: verify current password first; invalidate **all** existing refresh tokens for that user

### 5.5 OTP Security

- Generate using a **cryptographically secure random** source (`crypto.randomInt` in Node.js, _not_ `Math.random()`)
- Transmit OTP only via **transactional email** (not SMS for MVP — avoids phone number verification complexity)
- Store the OTP as a **bcrypt hash** in the DB
- Mark expired OTPs and clean them up with a scheduled job (or DB TTL)
- Implement **timing-safe comparison** when verifying hashes

### 5.6 Transport Security

- **HTTPS only** — enforce with HSTS (`Strict-Transport-Security: max-age=31536000; includeSubDomains`)
- Reject any HTTP requests at the service edge (hosting or reverse proxy layer)
- Enable **CORS** with a strict allowlist of mobile app origin identifiers

### 5.7 API Rate Limiting

| Endpoint | Limit |
|---|---|
| `POST /account/register` | 5 per IP per hour |
| `POST /account/login` | 5 per email per 15 min |
| `POST /account/verify-otp` | 5 attempts per OTP code |
| `POST /account/otp/resend` | 3 per email per 10 min |
| All other endpoints | 300 requests per user per minute |

Use a sliding window algorithm with a shared store (PostgreSQL table or in-memory store for MVP).

### 5.8 Logging & Monitoring

- **Do not log** session tokens, refresh tokens, OTP codes, or passwords — even in debug mode
- Log all **authentication events** (login attempt, OTP sent, OTP verified, token refresh, logout) with timestamp, userId (if known), IP, user agent
- Log all **authorization failures** (403s) to detect probing
- Set up alerts for: >10 consecutive login failures for a single email, unusual volume of OTP resends from a single IP

### 5.9 Data Integrity

- Wrap transfer-detection updates in a **database transaction** — both transaction records must be updated atomically or neither
- Wrap cycle close + new cycle creation in a **database transaction**
- On transaction update, synchronize investment balance changes in the **same database transaction** as the row update
- Treat closed cycles as immutable for transaction edits (known product rule to avoid retroactive balance drift)
- Use `updated_at` timestamps to enable optimistic concurrency in future

### 5.10 Secrets Management

| Secret | Recommended Storage |
|---|---|
| Database credentials | Environment variable or injected runtime secret |
| Session signing/validation secret | Environment variable or secrets manager; never hardcode in repository |
| Email provider API key | Environment variable / Secrets Manager |
| OTP codes | Bcrypt-hashed in DB — raw value only in memory for the duration of the request |

---

## 6. Infrastructure Recommendations

```
Client (React Native)
  │
  ▼
Backend API Service (Go + Fiber)
  │
  ├── PostgreSQL (Supabase)  ← primary data store
  ├── Email Service (Mailtrap in non-prod, transactional provider in prod)
  ├── Object Storage (for temporary statement files)
  └── Optional async worker for statement parsing
```

The mobile app calls the service directly. No API Gateway layer is required for MVP.

### Recommended Tech Stack for Backend

| Layer | Recommendation |
|---|---|
| Runtime | Go 1.21+ |
| Framework | Fiber v2 |
| Database access | `database/sql` + `lib/pq` (or `pgx`) |
| Validation | Request struct validation at handler boundary |
| Auth helpers | `bcrypt` + UUID-based session and refresh tokens |
| Email | Mailtrap (dev/staging), transactional provider for production |
| Testing | `go test` |
| DB migrations | Supabase migrations (`supabase/migrations`) |

### Environment Variables Required

```env
CONFIG_FILE_PATH=.config.yaml
ENV=production
DATABASE_PERSONAL_SERVICE_MASTER=postgresql://user:pass@host:5432/dbname
APP_PORT=4040
MAIN_APP_URL=https://your-mobile-app-landing-domain.com
SECRET_TOKEN=replace_with_secure_random_value

# Email provider
MAIL_ENABLE_EMAIL=true
MAIL_API_ENDPOINT=https://send.api.mailtrap.io
MAIL_API_TOKEN=replace_me
MAIL_FROM=noreply@your-domain.com
MAIL_FROM_NAME=Expense Tracker Support

# OTP/session settings
OTP_EXPIRES_MINUTES=10
SESSION_TOKEN_TTL_HOURS=48
REFRESH_TOKEN_TTL_HOURS=120
```

---

## 7. Cost Estimation

**Assumed scale:** 1–3 users, 1–3 bank statement uploads per user per month (worst case: 9 PDF jobs/month, ~500 API requests/month).

### Per-Service Breakdown

| Service | Usage at Scale | Free Tier | Estimated Cost |
|---|---|---|---|
| **Supabase** (PostgreSQL) | < 10 MB data, < 500 requests/day | 500 MB DB, 2 projects | **$0/month** |
| **GCP Cloud Run** (Go backend — staging + prod) | ~500 requests/month | 2M requests + 360,000 vCPU-seconds/month | **$0/month** |
| **GCP Pub/Sub** (parse job queue) | ~9 messages/month, kilobytes of data | First 10 GB/month free | **$0/month** |
| **GCP Cloud Storage** (temporary PDF holding) | 9 PDFs × ~1 MB = ~9 MB in-flight; deleted after job completes/fails | First 5 GB/month free | **$0/month** |
| **Gemini Flash** (PDF parsing) | 9 jobs × ~6,000 input tokens = ~54,000 tokens/month | Free quota via Google AI Studio | **~$0.004/month** |
| **GCP Cloud Monitoring** (alerting + logs) | Log volume in kilobytes; 1 alert policy | 50 GB logs/month + unlimited email alerts free | **$0/month** |

### Total

| Scenario | Monthly Cost |
|---|---|
| Normal (1–3 users, ≤ 9 uploads) | **$0 – $0.01** |
| Worst case (all retries hit, 5× Gemini calls per job) | **< $0.25** |

### Cost Control Safeguards

| Risk | Safeguard |
|---|---|
| Runaway Pub/Sub retries → repeated Gemini calls | Pub/Sub subscription: `max_delivery_attempts: 5` + dead-letter topic |
| Duplicate message delivery → double Gemini call | Worker checks DB job status before calling Gemini (idempotency guard) |
| Cloud Run idle costs | `min-instances: 0` on all services (scale to zero) |
| Unnoticed failures accumulating cost silently | GCP Cloud Monitoring alert on dead-letter topic `message_count > 0` → free email notification |
| PDF not deleted if worker crashes mid-job | GCS bucket lifecycle policy: delete all objects older than **1 day** (hard TTL, runs regardless of app code) |
| PDF not deleted after permanent failure (5 attempts) | Worker explicitly deletes GCS object before marking job `permanently_failed` in DB |
| Supabase storage creep | Raw PDFs stored only in GCS temporarily — never written to Supabase |

### PDF Lifecycle & Deletion Guarantee

PDFs are stored temporarily in GCS during the async parse window. Two independent mechanisms ensure they are always deleted:

**1. Application-level deletion (primary path)**

The Go worker explicitly deletes the GCS object at every terminal state:

```go
func (w *Worker) handleJob(ctx context.Context, job *Job) error {
    defer func() {
        // Always attempt GCS cleanup regardless of outcome
        if err := w.gcs.Delete(ctx, job.GCSObjectKey); err != nil {
            log.Warnf("GCS delete failed for %s: %v", job.GCSObjectKey, err)
            // Non-fatal — lifecycle policy is the backstop
        }
    }()

    // Check idempotency
    if job.Status == "completed" || job.Status == "permanently_failed" {
        return nil // already terminal, GCS should already be clean
    }

    // ... parse PDF with Gemini ...
    // On success: mark completed
    // On error after max attempts: mark permanently_failed
}
```

**2. GCS bucket lifecycle policy (backstop)**

Set on the GCS bucket — catches any PDFs orphaned by worker crashes or bugs:

```json
{
  "rule": [{
    "action": { "type": "Delete" },
    "condition": { "age": 1 }
  }]
}
```

This means any object older than **1 day** is automatically deleted by GCS, regardless of application state. A normal parse job completes in seconds to minutes, so legitimate in-flight files are never affected.

**Deletion guarantee matrix:**

| Outcome | Deleted by |
|---|---|
| Parse succeeds | Worker `defer` cleanup |
| Parse fails, retried, eventually succeeds | Worker `defer` cleanup on final attempt |
| Parse permanently failed (5 attempts) | Worker `defer` cleanup when marking `permanently_failed` |
| Worker crashes mid-job (panic, OOM, deploy) | GCS lifecycle policy (within 24h) |
| Pub/Sub message lost before worker starts | GCS lifecycle policy (within 24h) |

### Notes

- Gemini Flash pricing as of early 2026: **$0.075 / 1M input tokens**, **$0.30 / 1M output tokens**. Even at 5× retry worst case per job: 9 jobs × 5 retries × 6,000 tokens = 270,000 tokens ≈ **$0.02**.
- If Google AI Studio free quota is used (1,500 requests/day free), cost is literally $0.
- Supabase free tier covers **2 projects**, so staging and prod both fit without a paid plan.
- GCP always-free Cloud Run tier resets monthly and is per-account, not per-service.

---

*This document should be treated as a living specification — update it as the API evolves.*
