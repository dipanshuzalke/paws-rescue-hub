# ResQ Paws API Reference

All responses follow a standard envelope:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 }
}
```

## Error Status Codes
- `400`: Bad Request (Validation failed)
- `401`: Unauthorized (Authentication required)
- `403`: Forbidden (Insufficient permissions)
- `404`: Not Found
- `409`: Conflict (Invalid state transition)
- `500`: Internal Server Error

---

## Auth Endpoints
Manage user sessions and profiles.

### `POST /api/auth/register`
- **Role**: Public
- **Body**: `{ name, email, phone, password, role? }` (Role defaults to `CITIZEN`)

### `POST /api/auth/login`
- **Role**: Public
- **Body**: `{ email, password }`

### `POST /api/auth/forgot-password`
- **Role**: Public
- **Body**: `{ email }`
- **Description**: Sends a one-hour, single-use reset link if the account exists.

### `POST /api/auth/reset-password`
- **Role**: Public
- **Body**: `{ token, password }`
- **Description**: Updates the password for a valid reset link.

### `GET /api/auth/me`
- **Role**: Authenticated
- **Response Data**: Current user object.

### `POST /api/auth/logout`
- **Role**: Authenticated
- **Description**: Clears the authentication cookie.

### `PUT /api/auth/me`
- **Role**: Authenticated
- **Body**: `{ name?, phone?, availability? }`

---

## Report Endpoints
Manage rescue reports.

### `GET /api/reports`
- **Role**: NGO, ADMIN, RESCUER
- **Query**: `search, animalType, condition, emergencyLevel, status, city, page, limit`

### `POST /api/reports`
- **Role**: CITIZEN
- **Body (Multipart)**: `animalType, animalCount, condition, emergencyLevel, description, address, area, city, latitude, longitude, title, images[]`

### `GET /api/reports/my-reports`
- **Role**: CITIZEN
- **Description**: List reports created by the current user.

### `GET /api/reports/my-stats`
- **Role**: CITIZEN
- **Description**: Statistics for reports created by the current user.

### `GET /api/reports/status/:status`
- **Role**: NGO, ADMIN, RESCUER
- **Description**: Filter reports by status.

### `GET /api/reports/:id`
- **Role**: Authenticated
- **Description**: Detailed report view. Masked contact info for unassigned rescuers.

### `PUT /api/reports/:id`
- **Role**: CITIZEN (Owner)
- **Status Restriction**: Only while status is `REPORTED`.

### `POST /api/reports/:id/cancel`
- **Role**: Owner or ADMIN
- **Body**: `{ reason? }`
- **Status Restriction**: Cannot cancel if already `IN_PROGRESS`, `RESCUED`, or `CLOSED`.

### `DELETE /api/reports/:id`
- **Role**: ADMIN

---

## Rescue Endpoints
Workflow for rescuers handling cases.

### `GET /api/rescues/available`
- **Role**: RESCUER
- **Description**: Cases with status `REPORTED` or already assigned to the requester.

### `GET /api/rescues/active`
- **Role**: RESCUER
- **Description**: Requester's cases in `ACCEPTED` or `IN_PROGRESS`.

### `GET /api/rescues/history`
- **Role**: RESCUER
- **Description**: Completed or cancelled cases assigned to the requester.

### `GET /api/rescues/rescuer-stats`
- **Role**: RESCUER

### `GET /api/rescues/my-active`
- **Role**: CITIZEN
- **Description**: Requester's reports that are currently being handled.

### `GET /api/rescues/my-history`
- **Role**: CITIZEN
- **Description**: Requester's reports that are completed or cancelled.

### `PATCH /api/rescues/availability`
- **Role**: RESCUER
- **Body**: `{ availability: "AVAILABLE" | "BUSY" | "OFFLINE" }`

### `POST /api/rescues/:reportId/accept`
- **Role**: RESCUER
- **Description**: Self-assign (if unassigned) and move to `ACCEPTED`.

### `PUT /api/rescues/:reportId/status`
- **Role**: RESCUER, ADMIN
- **Body**: `{ status, note? }`
- **Rules**: See [Status Transitions](#status-transition-rules).

### `POST /api/rescues/:reportId/notes`
- **Role**: RESCUER, NGO, ADMIN
- **Body**: `{ text }`

### `POST /api/rescues/:reportId/proof`
- **Role**: RESCUER
- **Body (Multipart)**: `images[]`

### `GET /api/rescues/:id`
- **Role**: RESCUER, NGO, ADMIN
- **Description**: Detailed case view including history and notes.

---

## NGO Endpoints
Management tools for NGO coordinators.

### `GET /api/ngo/stats`
- **Role**: NGO, ADMIN
- **Description**: Scoped to the NGO's reports and rescuers.

### `GET /api/ngo/reports`
- **Role**: NGO, ADMIN

### `GET /api/ngo/active-rescues`
- **Role**: NGO, ADMIN

### `GET /api/ngo/rescuers`
- **Role**: NGO, ADMIN

### `POST /api/ngo/assignments`
- **Role**: NGO, ADMIN
- **Body**: `{ reportId, rescuerId, notes? }`

---

## Admin Endpoints
Full system management.

### `GET /api/admin/stats`
- **Role**: ADMIN

### `GET /api/admin/users`
- **Role**: ADMIN

### `PATCH /api/admin/users/:id/status`
- **Role**: ADMIN
- **Body**: `{ status?, isActive? }`

### `GET /api/admin/ngos`
- **Role**: ADMIN

### `PATCH /api/admin/ngos/:id/verify`
- **Role**: ADMIN

### `GET /api/admin/activity`
- **Role**: ADMIN
- **Description**: Recent system-wide status changes.

---

## Notification Endpoints

### `GET /api/notifications/`
- **Role**: Authenticated

### `PATCH /api/notifications/read-all`
- **Role**: Authenticated

---

## Analytics Endpoints
Data visualization endpoints.

### `GET /api/analytics/overview`
- **Role**: Authenticated (Role-scoped data)

### `GET /api/analytics/performance`
- **Role**: Authenticated

---

## Public Endpoints
No authentication required.

### `GET /api/public/rescue-cases`
- **Description**: Gallery of rescued and active cases. Masked for PII.

### `GET /api/public/stats`
- **Description**: High-level platform impact numbers.

### `GET /api/public/organizations`
- **Description**: List of verified NGOs.

---

## Status Transition Rules
The API strictly enforces the following state transitions for rescue reports:

| From Status | Allowed To Status |
| :--- | :--- |
| `REPORTED` | `ASSIGNED`, `CANCELLED` |
| `ASSIGNED` | `ACCEPTED`, `REPORTED`, `CANCELLED` |
| `ACCEPTED` | `IN_PROGRESS`, `CANCELLED` |
| `IN_PROGRESS` | `RESCUED`, `CANCELLED` |
| `RESCUED` | `CLOSED` |
| `CLOSED` | (None) |
| `CANCELLED` | (None) |

Attempting an invalid transition results in a `409 Conflict` response.
