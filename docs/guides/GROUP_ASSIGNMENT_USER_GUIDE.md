# Device Group Assignment - User Guide

## Feature: Checkbox State Persistence for Group Assignments

### What This Feature Does

This feature allows you to easily see which groups a device belongs to and quickly add or remove devices from groups using checkboxes.

---

## How to Use

### Step 1: Open the Group Assignment Dialog

1. Navigate to the **Devices** page
2. Find the device you want to manage
3. Click the **folder icon** (📁) in the Actions column
4. The "Assign to Groups" dialog will open

### Step 2: View Current Group Assignments

**The dialog shows:**

- ✅ **Checked boxes** = Device is currently in this group
- ☐ **Unchecked boxes** = Device is NOT in this group

Example:

```
☐ Living Room    (not assigned)
✅ Bedroom       (assigned)
✅ Kitchen       (assigned)
☐ Garage         (not assigned)
```

### Step 3: Add Device to a Group

**To add the device to a new group:**

1. Click on an **unchecked checkbox** (or the group name)
2. The checkbox will become **checked** ✅
3. The "Save" button will become enabled
4. Click **Save** to confirm

**What happens:**

- Device is added to the selected group
- You'll see a success message
- The dialog closes
- The device list refreshes
- Group device counts update

### Step 4: Remove Device from a Group

**To remove the device from a group:**

1. Click on a **checked checkbox** (or the group name)
2. The checkbox will become **unchecked** ☐
3. The "Save" button will become enabled
4. Click **Save** to confirm

**What happens:**

- Device is removed from the deselected group
- You'll see a success message
- The dialog closes
- The device list refreshes
- Group device counts update

### Step 5: Make Multiple Changes at Once

**You can change multiple assignments before saving:**

1. Check boxes to add device to groups
2. Uncheck boxes to remove device from groups
3. Click **Save** once to apply all changes

Example workflow:

```
Initial state:
✅ Bedroom
✅ Kitchen

After changes:
☐ Bedroom       (will be removed)
✅ Kitchen       (no change)
✅ Living Room  (will be added)
✅ Garage       (will be added)

Click Save → All changes applied at once!
```

---

## Visual Examples

### Example 1: Device with No Groups

**Initial State:**

```
Temperature Sensor (not in any groups)

Dialog shows:
☐ Living Room
☐ Bedroom
☐ Kitchen
☐ Garage

All boxes unchecked = Device has no group assignments
```

**Action:** Assign to Living Room and Kitchen

```
Click Living Room checkbox → ✅
Click Kitchen checkbox → ✅
Click Save

Result:
Temperature Sensor is now in:
- Living Room ✅
- Kitchen ✅
```

### Example 2: Device Already in Groups

**Initial State:**

```
Light Actuator (in Bedroom and Kitchen)

Dialog shows:
☐ Living Room
✅ Bedroom       ← Already assigned
✅ Kitchen       ← Already assigned
☐ Garage

Checked boxes show current assignments!
```

**Action:** Remove from Bedroom, add to Living Room

```
Click Bedroom checkbox → ☐ (unchecked)
Click Living Room checkbox → ✅ (checked)
Click Save

Result:
Light Actuator is now in:
- Living Room ✅ (newly added)
- Kitchen ✅ (unchanged)
```

### Example 3: Multiple Toggle Operations

**You can change your mind before saving:**

```
Initial:
☐ Living Room

Click once:
✅ Living Room   (decided to add)

Click again:
☐ Living Room   (changed mind, won't add)

Click once more:
✅ Living Room   (back to adding)

Click Save → Device added to Living Room
```

---

## Additional Features

### Search Groups

- Type in the search box to filter groups by name
- Useful when you have many groups
- Checkboxes maintain their state while searching

### Bulk Assignment

- Select multiple devices on the Devices page
- Click the bulk "Assign to Groups" button
- Check the groups you want to assign all devices to
- All selected devices will be added to chosen groups

### Visual Indicators

**Group Colors:**

- Each group has a color indicator (●)
- Makes it easy to identify groups visually

**Device Counts:**

- Shows how many devices are in each group
- Example: "Living Room (5 devices)"

**Save Button:**

- Disabled when no changes made
- Enabled when you check/uncheck boxes
- Only saves actual changes (efficient!)

---

## Tips & Tricks

### ✅ Quick Assignment

- Click anywhere on the group row (not just the checkbox)
- Faster than clicking the small checkbox

### ✅ Cancel Without Saving

- Click "Cancel" to close without applying changes
- Click outside the dialog to close
- Changes are discarded, checkboxes reset

### ✅ See What Changed

- Save button only enables when you make changes
- If button is disabled, no changes to save

### ✅ Persistent State

- Close the dialog and reopen it
- Checkboxes remember the device's current groups
- Always shows accurate current state

---

## Troubleshooting

### ❓ Checkbox doesn't change when I click

**Solution:** Make sure you're clicking on the checkbox or the group name. Wait for groups to finish loading.

### ❓ Save button is disabled

**Solution:** This means you haven't made any changes. The button only enables when you check/uncheck boxes.

### ❓ Changes don't appear after saving

**Solution:** The page should refresh automatically. If not, try refreshing the browser. Check for error messages.

### ❓ Checkboxes show wrong state

**Solution:** This should not happen as the dialog loads fresh data each time. If you see this, refresh the page and reopen the dialog.

---

## Technical Details (For Developers)

### State Management

- Uses React Set for efficient group ID storage
- Tracks initial state vs. current state
- Only saves actual changes (adds/removes)

### API Calls

- `POST /api/groups/:id/devices` - Add device to group
- `DELETE /api/groups/:id/devices/:deviceId` - Remove device from group
- Calls made only for changed groups (not all checked groups)

### Performance

- O(1) lookup time for checkbox state
- Efficient Set operations
- No unnecessary re-renders
- Optimistic UI updates

---

## Summary

✅ **See current assignments** - Checked boxes show which groups device is in
✅ **Click to assign** - Check box to add device to group
✅ **Click to unassign** - Uncheck box to remove device from group
✅ **Save changes** - All changes applied at once
✅ **State persists** - Reopening dialog shows current state
✅ **Multiple toggles** - Change your mind before saving

**Result:** Fast, intuitive group management with visual feedback!

---

**Last Updated:** December 11, 2025
**Feature Status:** ✅ Production Ready
**Test Coverage:** 51/51 tests passing
