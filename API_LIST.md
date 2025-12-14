# IoTFlow Dashboard — API Reference (auto-generated)

This file summarizes the Express API routes implemented in `iotflow-backend/src/routes`.
It was generated from the route definitions and controllers present in the repository.

Notes:

- Prefix `/api` is applied at the application level in `src/app.js` (see mounting lines).
- `verifyToken` indicates authentication with JWT (user must be logged in).
- `verifyApiKey` indicates API-key (device) authentication.
- Admin-only endpoints require `isAdmin` middleware in addition to `verifyToken`.

---

## General / Health

- GET /health
  - Description: Application health check (returns status and timestamp)
  - Auth: Public

## Authentication & User (mounted at `/api/auth` and `/api/users`)

- POST /api/auth/register
  - Description: Register a new user
  - Auth: Public

- POST /api/auth/login
  - Description: Login, returns JWT token and user object
  - Auth: Public

- GET /api/users/profile
  - Description: Get current authenticated user's profile
  - Auth: verifyToken (JWT)

- PUT /api/users/profile
  - Description: Update username and/or email for current user (profile updates). Password changes are not allowed here.
  - Auth: verifyToken (JWT)

- PUT /api/users/password
  - Description: Change password for current user. Requires `currentPassword` and `newPassword` and enforces strength checks.
  - Auth: verifyToken (JWT)

- POST /api/users/refresh-api-key
  - Description: Refresh the user's API key (rotates the key)
  - Auth: verifyToken (JWT)

## Devices (mounted at `/api/devices`)

- POST /api/devices/
  - Description: Create/register a new device for the authenticated user
  - Auth: verifyToken (JWT)

- GET /api/devices/
  - Description: List devices for the authenticated user (supports query params)
  - Auth: verifyToken (JWT)

- GET /api/devices/:id
  - Description: Get details for a specific device
  - Auth: verifyToken (JWT)

- GET /api/devices/:id/groups
  - Description: Get groups for a specific device
  - Auth: verifyToken (JWT)

- PUT /api/devices/:id
  - Description: Update a device's metadata/configuration
  - Auth: verifyToken (JWT)

- DELETE /api/devices/:id
  - Description: Remove a device
  - Auth: verifyToken (JWT)

- GET /api/devices/:id/configuration
  - Description: Retrieve device configuration
  - Auth: verifyToken (JWT)

- PUT /api/devices/:id/configuration
  - Description: Update device configuration
  - Auth: verifyToken (JWT)

## Device Groups (mounted at `/api/groups`)

- POST /api/groups/
  - Description: Create a new device group
  - Auth: verifyToken (JWT)

- GET /api/groups/
  - Description: List all groups for the user
  - Auth: verifyToken (JWT)

- GET /api/groups/:id
  - Description: Get group details
  - Auth: verifyToken (JWT)

- PUT /api/groups/:id
  - Description: Update group metadata
  - Auth: verifyToken (JWT)

- DELETE /api/groups/:id
  - Description: Delete a group
  - Auth: verifyToken (JWT)

- POST /api/groups/:id/devices
  - Description: Add a device to a group
  - Auth: verifyToken (JWT)

- DELETE /api/groups/:id/devices/:deviceId
  - Description: Remove a device from a group
  - Auth: verifyToken (JWT)

## Telemetry (mounted at `/api/telemetry`)

- GET /api/telemetry/health
  - Description: Telemetry / IoTDB health check
  - Auth: Public (controller-level)

- GET /api/telemetry/device/:device_id/aggregated
  - Description: Aggregated telemetry data for a device
  - Auth: (controller-level) may vary — typically requires token or API-key

- POST /api/telemetry/
  - Description: Submit telemetry from devices. Devices must include API key for authentication.
  - Auth: verifyApiKey (API key header expected)

- GET /api/telemetry/:device_id
  - Description: Retrieve telemetry for a device (user-facing)
  - Auth: Controller-level (may be public or token-protected depending on impl)

## Charts (mounted at `/api/charts`)

- GET /api/charts/
  - Description: List charts for the authenticated user
  - Auth: verifyToken (JWT)

- GET /api/charts/:id
  - Description: Get a single chart configuration
  - Auth: verifyToken (JWT)

- POST /api/charts/
  - Description: Create a new chart
  - Auth: verifyToken (JWT)

- PUT /api/charts/:id
  - Description: Update an existing chart
  - Auth: verifyToken (JWT)

- DELETE /api/charts/:id
  - Description: Delete a chart
  - Auth: verifyToken (JWT)

- POST /api/charts/:id/duplicate
  - Description: Duplicate an existing chart configuration
  - Auth: verifyToken (JWT)

## Notifications (mounted at `/api/notifications`)

_All notification routes are protected by `verifyToken` middleware._

- GET /api/notifications/
  - Description: Get all notifications for the current user
  - Auth: verifyToken

- GET /api/notifications/unread-count
  - Description: Get count of unread notifications
  - Auth: verifyToken

- GET /api/notifications/stats
  - Description: Get notification statistics (aggregates)
  - Auth: verifyToken

- PUT /api/notifications/:id/read
  - Description: Mark a notification as read
  - Auth: verifyToken

- PUT /api/notifications/mark-all-read
  - Description: Mark all notifications as read
  - Auth: verifyToken

- DELETE /api/notifications/:id
  - Description: Delete a specific notification
  - Auth: verifyToken

- DELETE /api/notifications/
  - Description: Delete all notifications for the user
  - Auth: verifyToken

## Admin API (mounted at `/api/v1/admin`)

_All Admin V1 endpoints require `verifyToken` + `isAdmin`._

### Users

- GET /api/v1/admin/users
  - Description: List all users (admin)

- GET /api/v1/admin/users/:id
  - Description: Get user details (admin)

- POST /api/v1/admin/users
  - Description: Create a new user (admin)

- PUT /api/v1/admin/users/:id
  - Description: Update user (admin)

- DELETE /api/v1/admin/users/:id
  - Description: Delete user (admin)

- GET /api/v1/admin/users/:id/devices
  - Description: List devices owned by a user (admin)

### Devices

- GET /api/v1/admin/devices
  - Description: List all devices (admin)

- GET /api/v1/admin/devices/:id
  - Description: Get a device (admin)

- DELETE /api/v1/admin/devices/:id
  - Description: Delete a device (admin)

### Stats

- GET /api/v1/admin/stats
  - Description: Administrative statistics and system overview

---

If you'd like, I can:

- Add example cURL commands for each endpoint.
- Generate OpenAPI (Swagger) YAML from these routes.
- Insert this document into the backend `docs/` folder and link it from `iotflow-backend/README.md`.

Tell me which you'd prefer next.
