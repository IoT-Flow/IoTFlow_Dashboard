# IoTFlow Backend — API Reference (Express routes)

This document lists the HTTP endpoints implemented by the Node.js backend in `iotflow-backend/src/routes`.
Prefix: `/api` (mounted in `src/app.js`).

Authentication notes

- `verifyToken` — JWT-based user authentication (Authorization: Bearer <token>)
- `verifyApiKey` — API key authentication (used for device telemetry submits)
- `isAdmin` — additional middleware for administrative routes

---

## Health

- GET /health
  - Description: Application health check, returns status and timestamp
  - Auth: Public

## Auth & User (mounted under `/api/auth` and `/api/users`)

- POST /api/auth/register
  - Register a new user
  - Auth: Public

- POST /api/auth/login
  - Login: returns { user, token }
  - Auth: Public

- GET /api/users/profile
  - Get profile for the authenticated user
  - Auth: verifyToken

- PUT /api/users/profile
  - Update username and/or email for current user (password changes are rejected here)
  - Auth: verifyToken

- PUT /api/users/password
  - Change password (requires currentPassword and newPassword)
  - Auth: verifyToken

- POST /api/users/refresh-api-key
  - Rotate / refresh the user's API key
  - Auth: verifyToken

## Devices (mounted under `/api/devices`)

- POST /api/devices/
  - Create/register a device for the authenticated user
  - Auth: verifyToken

- GET /api/devices/
  - List user's devices (supports query params)
  - Auth: verifyToken

- GET /api/devices/:id
  - Get a specific device
  - Auth: verifyToken

- GET /api/devices/:id/groups
  - List groups that include the device
  - Auth: verifyToken

- PUT /api/devices/:id
  - Update device metadata
  - Auth: verifyToken

- DELETE /api/devices/:id
  - Delete device
  - Auth: verifyToken

- GET /api/devices/:id/configuration
  - Get device configuration
  - Auth: verifyToken

- PUT /api/devices/:id/configuration
  - Update device configuration
  - Auth: verifyToken

## Device Groups (mounted under `/api/groups`)

- POST /api/groups/
  - Create a device group
  - Auth: verifyToken

- GET /api/groups/
  - List groups for user
  - Auth: verifyToken

- GET /api/groups/:id
  - Get group details
  - Auth: verifyToken

- PUT /api/groups/:id
  - Update group
  - Auth: verifyToken

- DELETE /api/groups/:id
  - Delete group
  - Auth: verifyToken

- POST /api/groups/:id/devices
  - Add a device to group
  - Auth: verifyToken

- DELETE /api/groups/:id/devices/:deviceId
  - Remove a device from group
  - Auth: verifyToken

## Telemetry (mounted under `/api/telemetry`)

- GET /api/telemetry/health
  - IoTDB/telemetry health check
  - Auth: controller-level (public)

- GET /api/telemetry/device/:device_id/aggregated
  - Aggregated telemetry data for a device
  - Auth: controller-level (may require token or API-key)

- POST /api/telemetry/
  - Submit telemetry from devices (devices must send API key)
  - Auth: verifyApiKey

- GET /api/telemetry/:device_id
  - Retrieve telemetry for a device (user-facing)
  - Auth: controller-level (may be public or token-protected)

## Charts (mounted under `/api/charts`)

- GET /api/charts/
  - List charts for authenticated user
  - Auth: verifyToken

- GET /api/charts/:id
  - Get a chart
  - Auth: verifyToken

- POST /api/charts/
  - Create a chart
  - Auth: verifyToken

- PUT /api/charts/:id
  - Update a chart
  - Auth: verifyToken

- DELETE /api/charts/:id
  - Delete a chart
  - Auth: verifyToken

- POST /api/charts/:id/duplicate
  - Duplicate an existing chart
  - Auth: verifyToken

## Notifications (mounted under `/api/notifications`)

(All notification routes use `verifyToken` middleware)

- GET /api/notifications/
  - Get all notifications for the current user
  - Auth: verifyToken

- GET /api/notifications/unread-count
  - Get count of unread notifications
  - Auth: verifyToken

- GET /api/notifications/stats
  - Notification aggregates/stats
  - Auth: verifyToken

- PUT /api/notifications/:id/read
  - Mark a notification as read
  - Auth: verifyToken

- PUT /api/notifications/mark-all-read
  - Mark all notifications as read
  - Auth: verifyToken

- DELETE /api/notifications/:id
  - Delete a notification
  - Auth: verifyToken

- DELETE /api/notifications/
  - Delete all notifications for the user
  - Auth: verifyToken

## Admin API (`/api/v1/admin`) — Admin-only (verifyToken + isAdmin)

### Users

- GET /api/v1/admin/users
- GET /api/v1/admin/users/:id
- POST /api/v1/admin/users
- PUT /api/v1/admin/users/:id
- DELETE /api/v1/admin/users/:id
- GET /api/v1/admin/users/:id/devices

### Devices

- GET /api/v1/admin/devices
- GET /api/v1/admin/devices/:id
- DELETE /api/v1/admin/devices/:id

### Stats

- GET /api/v1/admin/stats

---

If you want I can:

- Add example cURL snippets for these endpoints.
- Generate an OpenAPI (Swagger) YAML from this list.
- Insert this file into `iotflow-backend/README.md` with a link.

Tell me which of these you'd like next.
