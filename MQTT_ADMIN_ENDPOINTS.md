# MQTT Endpoints Used by Admin Front (IoTFlow Dashboard)

This document lists the MQTT-related HTTP endpoints the admin UI uses in the dashboard frontend (`iotflow-frontend`). These endpoints are provided by the Flask backend and are intended for administrative monitoring, testing, and device command operations.

## Admin-facing MQTT endpoints (summary)

- GET /api/v1/mqtt/topics/structure
  - Purpose: Retrieve the complete MQTT topic structure and examples.
  - Auth: Public (UI reads topic structure when building topic helpers).
  - Frontend use: Topic builder, documentation, topic selectors.

- POST /api/v1/mqtt/publish
  - Purpose: Publish an arbitrary message to a topic (used by developer/admin tools).
  - Auth: Service-level checks (used by admin UI to publish test messages).
  - Frontend use: Message inspector / publish test tool.

- POST /api/v1/mqtt/subscribe
  - Purpose: Ask the backend to subscribe to a topic (admin-only helper).
  - Auth: Admin token required.
  - Frontend use: Admin subscription control (subscribe/unsubscribe helper in advanced tools).

- GET /api/v1/mqtt/monitoring/metrics
  - Purpose: Return broker/client monitoring metrics for the UI.
  - Auth: Admin token required.
  - Frontend use: Broker monitoring dashboard (connections, handlers, metrics).

- GET /api/v1/mqtt/topics/device/<device_id>
  - Purpose: Retrieve topics relevant to a specific device.
  - Auth: Public
  - Frontend use: Device detail pages and topic helpers.

- POST /api/v1/mqtt/device/<device_id>/command
  - Purpose: Send a command to a single device via MQTT (admin only).
  - Auth: Admin token required.
  - Frontend use: Admin device control panel (send config/control/firmware commands).

- POST /api/v1/mqtt/fleet/<group_id>/command
  - Purpose: Send a command to a fleet/group of devices (admin only).
  - Auth: Admin token required.
  - Frontend use: Fleet command UI for bulk operations.

- POST /api/v1/mqtt/telemetry/<device_id>
  - Purpose: Accept telemetry submissions proxied via MQTT gateways (HTTP POST).
  - Auth: X-API-Key header required.
  - Frontend use: Used by simulators/gateways and occasionally by admin test tools.

## Frontend usage mapping (where used in UI)

- Broker monitoring page (`/mqtt`) — uses `GET /api/v1/mqtt/monitoring/metrics` and `GET /api/v1/mqtt/status` (status endpoint) to display broker health, connections, and topic stats.
- Topic builder / message inspector — uses `GET /api/v1/mqtt/topics/structure` and `POST /api/v1/mqtt/publish` to validate and publish test messages.
- Admin device panel — uses `POST /api/v1/mqtt/device/<device_id>/command` to send commands and control devices.
- Fleet operations — uses `POST /api/v1/mqtt/fleet/<group_id>/command` for broadcasting commands to groups.

## Quick cURL examples

Publish a message (admin/dev tool):

```bash
curl -X POST "http://localhost:5000/api/v1/mqtt/publish" \
  -H "Content-Type: application/json" \
  -d '{"topic":"iotflow/devices/123/commands","payload":{"command":"reboot"},"qos":1}'
```

Send a device command (admin token required):

```bash
curl -X POST "http://localhost:5000/api/v1/mqtt/device/123/command" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: <ADMIN_TOKEN>" \
  -d '{"command_type":"control","command":{"action":"reboot"}}'
```

## Notes

- Admin endpoints require an admin token (see `require_admin_token` middleware).
- The UI may use demo/static data for some MQTT panels; check `/src/pages/Mqtt.js` for placeholders.

---

Saved by automated scan. If you want, I can add exact frontend source file references (component names and lines) where each endpoint is invoked.
