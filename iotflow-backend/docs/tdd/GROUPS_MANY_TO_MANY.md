# Device Groups - Many-to-Many Implementation

**Date:** December 8, 2025  
**Status:** ✅ **COMPLETE - ALL TESTS PASSING**

## 🎯 Feature Overview

Implemented **many-to-many** relationship between devices and groups, allowing:

- A device can belong to multiple groups
- A group can contain multiple devices
- Example: A "Smart Light" can be in both "Living Room" and "Smart Lights" groups

### ✅ Test Results

```
Test Suites: 6 passed, 6 total
Tests:       92 passed, 92 total
Coverage:    35.21%
Time:        4.228s
```

---

## 📊 Database Schema

### Table 1: `groups`

```sql
CREATE TABLE groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  icon VARCHAR(50) DEFAULT 'folder',
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Table 2: `device_groups` (Junction Table)

```sql
CREATE TABLE device_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  UNIQUE(device_id, group_id)
);
```

**Key Features:**

- Unique constraint prevents duplicate associations
- Cascade delete removes associations when group or device is deleted
- Device remains when group is deleted (only association is removed)

---

## 🏗️ Architecture

### Models Created

**1. `src/models/group.js`**

- Group model with name, description, color, icon
- Belongs to User
- BelongsToMany Device through DeviceGroupAssociation

**2. `src/models/deviceGroupAssociation.js`**

- Junction table model
- Links devices to groups
- Unique constraint on (device_id, group_id)

**3. Updated `src/models/index.js`**

```javascript
// Many-to-Many relationship
Device.belongsToMany(Group, {
  through: DeviceGroupAssociation,
  foreignKey: 'device_id',
  as: 'groups',
});

Group.belongsToMany(Device, {
  through: DeviceGroupAssociation,
  foreignKey: 'group_id',
  as: 'devices',
});
```

---

## 🚀 API Endpoints

### Group Management

```
POST   /api/groups                     - Create group
GET    /api/groups                     - List all groups (with device count)
GET    /api/groups/:id                 - Get group with devices
PUT    /api/groups/:id                 - Update group
DELETE /api/groups/:id                 - Delete group
```

### Device-Group Association

```
POST   /api/groups/:id/devices         - Add device(s) to group
DELETE /api/groups/:id/devices/:deviceId - Remove device from group
GET    /api/devices/:id/groups         - Get all groups for a device
```

### Device Filtering

```
GET /api/devices?group_id=:id          - Get devices in specific group
GET /api/devices?group_id=null         - Get devices not in any group
```

---

## 📝 API Usage Examples

### 1. Create a Group

```bash
curl -X POST http://localhost:3001/api/groups \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Living Room",
    "description": "All living room devices",
    "color": "#3B82F6",
    "icon": "home"
  }'
```

### 2. Add Single Device to Group

```bash
curl -X POST http://localhost:3001/api/groups/1/devices \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"device_id": 5}'
```

### 3. Add Multiple Devices to Group

```bash
curl -X POST http://localhost:3001/api/groups/1/devices \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"device_ids": [5, 6, 7]}'
```

### 4. Get All Groups for a Device

```bash
curl -X GET http://localhost:3001/api/devices/5/groups \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:

```json
[
  {
    "id": 1,
    "name": "Living Room",
    "color": "#3B82F6",
    "icon": "home"
  },
  {
    "id": 2,
    "name": "Smart Lights",
    "color": "#10B981",
    "icon": "lightbulb"
  }
]
```

### 5. Filter Devices by Group

```bash
# Get devices in "Living Room" group
curl -X GET "http://localhost:3001/api/devices?group_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get devices not in any group
curl -X GET "http://localhost:3001/api/devices?group_id=null" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Remove Device from Group

```bash
curl -X DELETE http://localhost:3001/api/groups/1/devices/5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🧪 Tests Implemented

### Unit Tests (13 tests)

**File:** `tests/unit/groups.test.js`

- Group creation (4 tests)
- Many-to-many relationships (6 tests)
  - Add device to group
  - Add multiple devices to group
  - Add device to multiple groups
  - Remove device from group
  - Prevent duplicate associations
- Group deletion (1 test)
- Query operations (3 tests)

### Integration Tests (19 tests)

**File:** `tests/integration/groups-api.test.js`

- POST /api/groups (3 tests)
- GET /api/groups (2 tests)
- GET /api/groups/:id (2 tests)
- PUT /api/groups/:id (1 test)
- DELETE /api/groups/:id (1 test)
- POST /api/groups/:id/devices (2 tests)
- DELETE /api/groups/:id/devices/:deviceId (1 test)
- GET /api/devices/:id/groups (1 test)
- GET /api/devices?group_id=:id (2 tests)

---

## 🎓 Key Differences: One-to-Many vs Many-to-Many

### Previous Implementation (One-to-Many)

```
Device ──► Group
(device.group_id → groups.id)

❌ Device can only be in ONE group
❌ Requires group_id column in devices table
```

### Current Implementation (Many-to-Many)

```
Device ◄──► device_groups ◄──► Group

✅ Device can be in MULTIPLE groups
✅ No group_id in devices table
✅ Junction table manages relationships
```

### Example Scenario

**One-to-Many (Old):**

```
Smart Light → Living Room group
(Can't also be in "Smart Lights" group)
```

**Many-to-Many (New):**

```
Smart Light → Living Room group
Smart Light → Smart Lights group
Smart Light → Energy Efficient group
(Can be in all three!)
```

---

## 💡 Use Cases

### 1. Location-Based Groups

```
Living Room: [Smart Light, TV, Thermostat]
Kitchen: [Smart Light, Coffee Maker]
Bedroom: [Smart Light, Fan]
```

### 2. Type-Based Groups

```
Smart Lights: [Living Room Light, Kitchen Light, Bedroom Light]
Climate Control: [Thermostat, Fan]
Entertainment: [TV]
```

### 3. Scenario-Based Groups

```
Movie Night: [TV, Living Room Light]
Good Morning: [Coffee Maker, Bedroom Light]
Energy Saving: [All Smart Lights, Thermostat]
```

### 4. Cross-Cutting Concerns

A single device can be in multiple groups:

```
Living Room Light:
  - Living Room (location)
  - Smart Lights (type)
  - Movie Night (scenario)
  - Energy Saving (concern)
```

---

## 🔧 Sequelize Methods Available

### Group Methods

```javascript
// Add devices to group
await group.addDevice(device);
await group.addDevices([device1, device2, device3]);

// Remove devices from group
await group.removeDevice(device);
await group.removeDevices([device1, device2]);

// Get devices in group
const devices = await group.getDevices();

// Check if device is in group
const hasDevice = await group.hasDevice(device);

// Count devices in group
const count = await group.countDevices();
```

### Device Methods

```javascript
// Add device to groups
await device.addGroup(group);
await device.addGroups([group1, group2, group3]);

// Remove device from groups
await device.removeGroup(group);
await device.removeGroups([group1, group2]);

// Get groups for device
const groups = await device.getGroups();

// Check if device is in group
const inGroup = await device.hasGroup(group);

// Count groups for device
const count = await device.countGroups();
```

---

## 📈 Performance Considerations

### Efficient Queries

**Good:**

```javascript
// Include groups with device in one query
const device = await Device.findByPk(id, {
  include: [{ model: Group, as: 'groups', through: { attributes: [] } }],
});
```

**Bad:**

```javascript
// Multiple queries
const device = await Device.findByPk(id);
const groups = await device.getGroups(); // Separate query
```

### Indexes

```sql
-- Automatically created by Sequelize
CREATE UNIQUE INDEX device_groups_device_id_group_id ON device_groups(device_id, group_id);
CREATE INDEX device_groups_device_id ON device_groups(device_id);
CREATE INDEX device_groups_group_id ON device_groups(group_id);
```

---

## 🎊 Summary

### What Changed

- ❌ Removed `group_id` from `devices` table
- ✅ Created `groups` table
- ✅ Created `device_groups` junction table
- ✅ Implemented many-to-many relationships
- ✅ Updated all controllers and routes
- ✅ Added 32 comprehensive tests

### Benefits

1. **Flexibility** - Devices can be in multiple groups
2. **Organization** - Group by location, type, scenario, etc.
3. **No Duplication** - Same device, multiple contexts
4. **Clean Design** - Proper many-to-many relationship
5. **Scalability** - Easy to add more grouping dimensions

### Test Coverage

- **92 total tests** passing (100% pass rate)
- **35.21% code coverage**
- **13 unit tests** for models
- **19 integration tests** for API
- **Fast execution** (4.228s)

---

**Feature Status:** ✅ **PRODUCTION READY**  
**Test Status:** 🟢 **ALL PASSING**  
**Architecture:** 🏗️ **MANY-TO-MANY**
