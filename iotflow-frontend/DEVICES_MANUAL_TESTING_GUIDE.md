# Manual Testing Guide - New Devices Page

## Testing Checklist

### Prerequisites
1. Start the backend server (Node.js on port 3001)
2. Start the frontend server: `npm start` (React on port 3000)
3. Have at least 2 user accounts:
   - One admin account
   - One regular user account
4. Have some test devices registered

---

## Test Scenarios

### 1. Admin User Tests

#### 1.1 Login as Admin
- [ ] Navigate to http://localhost:3000
- [ ] Login with admin credentials
- [ ] Verify redirect to `/admin` page

#### 1.2 Navigate to Devices Page
- [ ] Click "Devices" in sidebar
- [ ] URL should be `/devices`
- [ ] Page should load without errors

#### 1.3 Verify Device List (Admin View)
- [ ] All devices from all users should be visible
- [ ] "Owner" column should be present in table
- [ ] Device count should show total devices (e.g., "3 devices")
- [ ] Each device should show:
  - Name
  - Type
  - Status (with colored chip: green=online, grey=offline)
  - Location
  - Owner username/email
  - Action buttons (Edit, Delete)

#### 1.4 Test Search Functionality
- [ ] Type a device name in search box
- [ ] Results should filter immediately
- [ ] Only matching devices should be visible
- [ ] Device count should update

#### 1.5 Test Status Filter
- [ ] Click "Status" dropdown
- [ ] Select "Online"
- [ ] Only online devices should be visible
- [ ] Select "Offline"
- [ ] Only offline devices should be visible
- [ ] Select "All"
- [ ] All devices should be visible again

#### 1.6 Test Type Filter
- [ ] Click "Type" dropdown
- [ ] Available types should be listed (e.g., temperature_sensor, humidity_sensor)
- [ ] Select a type (e.g., "temperature_sensor")
- [ ] Only devices of that type should be visible
- [ ] Select "All"
- [ ] All devices should be visible again

#### 1.7 Test Refresh
- [ ] Click "Refresh" button
- [ ] Loading indicator should briefly appear
- [ ] Device list should reload

#### 1.8 Test Add Device
- [ ] Click "Add Device" button
- [ ] Dialog should open with title "Create Device"
- [ ] Click "Cancel" to close

#### 1.9 Test Delete Device
- [ ] Click delete icon (trash can) on a device
- [ ] Confirmation dialog should appear
- [ ] Dialog should show device name
- [ ] Click "Cancel" - dialog closes, device still exists
- [ ] Click delete icon again
- [ ] Click "Delete" - device should be deleted
- [ ] Success toast should appear: "Device deleted successfully"
- [ ] Device list should refresh

#### 1.10 Test Empty State (if no devices)
- [ ] If you delete all devices:
  - "No devices found" message should appear
  - "Get started by adding your first device" message
  - "Add Device" button should be visible

---

### 2. Regular User Tests

#### 2.1 Login as Regular User
- [ ] Logout from admin account
- [ ] Login with regular user credentials
- [ ] Verify redirect to `/overview` page

#### 2.2 Navigate to Devices Page
- [ ] Click "Devices" in sidebar
- [ ] URL should be `/devices`
- [ ] Page should load without errors

#### 2.3 Verify Device List (User View)
- [ ] Only user's own devices should be visible
- [ ] "Owner" column should NOT be present
- [ ] Device count should show user's device count (e.g., "1 device")
- [ ] Each device should show:
  - Name
  - Type
  - Status (with colored chip)
  - Location
  - Action buttons (Edit, Delete)

#### 2.4 Test Filtering and Search
- [ ] Test search (same as admin)
- [ ] Test status filter (same as admin)
- [ ] Test type filter (same as admin)
- [ ] All should work with user's devices only

#### 2.5 Test Device Operations
- [ ] Test refresh (same as admin)
- [ ] Test add device (same as admin)
- [ ] Test delete device (same as admin)
- [ ] All should work with user's devices only

---

### 3. Responsive Design Tests

#### 3.1 Desktop View (> 600px width)
- [ ] Open in desktop browser
- [ ] Devices should display as a table
- [ ] All columns should be visible
- [ ] Filters should be in a row

#### 3.2 Mobile View (< 600px width)
- [ ] Open in mobile browser OR resize window
- [ ] Devices should display as cards
- [ ] Each card should show:
  - Device name (header)
  - Status chip (top right)
  - Device type
  - Location (with 📍 icon)
  - Description (if available)
  - Owner info (if admin)
  - Action buttons (Edit, Delete)

---

### 4. Error Handling Tests

#### 4.1 Test API Error
- [ ] Stop the backend server
- [ ] Refresh the devices page
- [ ] Error toast should appear: "Failed to load devices"
- [ ] Page should show empty state

#### 4.2 Test Delete Error
- [ ] Start backend server again
- [ ] Try to delete a device that doesn't exist (manually modify ID in DevTools if needed)
- [ ] Error toast should appear
- [ ] Device list should remain unchanged

---

### 5. Loading States

#### 5.1 Initial Load
- [ ] Navigate to devices page
- [ ] Loading spinner (CircularProgress) should appear briefly
- [ ] Then device list should appear

#### 5.2 Refresh Load
- [ ] Click "Refresh" button
- [ ] Loading spinner should appear briefly
- [ ] Device list should update

---

## Expected Console Messages

### Normal Operation
- No errors in console
- Possible warnings about React Router (harmless)

### When Devices Load Successfully
```
IoTFlow Dashboard Configuration: {
  api: 'http://localhost:3001/api',
  ...
}
```

### When API Call Succeeds (in Network tab)
- **Admin**: `GET /api/v1/admin/devices` - Status 200
- **User**: `GET /api/devices` - Status 200

---

## Comparison with Old Devices Page

### Old Behavior (Broken)
- ❌ Failed to load devices
- ❌ Used wrong API endpoint for admins
- ❌ 1,178 lines of complex code
- ❌ No tests
- ❌ Difficult to maintain

### New Behavior (Fixed)
- ✅ Successfully loads devices
- ✅ Uses correct role-based API endpoints
- ✅ 394 lines of simple, clean code
- ✅ 19 comprehensive tests (all passing)
- ✅ Easy to maintain and extend

---

## Troubleshooting

### Devices Not Loading
1. Check browser console for errors
2. Check Network tab for API calls
3. Verify backend is running on port 3001
4. Check if user is authenticated
5. Try refreshing the page

### Filters Not Working
1. Check if devices array has data
2. Verify filter values are being set
3. Check browser console for errors

### Delete Not Working
1. Verify user has permission
2. Check if device ID is valid
3. Check backend logs for errors

---

## Success Criteria

All tests pass if:
- ✅ Admin users see all devices from all users
- ✅ Regular users see only their own devices
- ✅ Search, filters, and operations work correctly
- ✅ Loading and empty states display properly
- ✅ Responsive design works on mobile and desktop
- ✅ Error handling shows appropriate messages
- ✅ No console errors during normal operation

---

## Next Development Steps

After manual testing confirms everything works:
1. Implement device creation form (currently placeholder)
2. Implement device editing functionality
3. Add pagination for large device lists
4. Add sorting capabilities (by name, status, type, etc.)
5. Add bulk operations (delete multiple devices)
6. Add device grouping functionality
7. Remove `Devices.old.js` backup file

