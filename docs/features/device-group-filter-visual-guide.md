# Device Group Filter - Visual Guide

## 📍 Location in Dashboard

The group filter is located in the Devices page filter toolbar:

```
┌─────────────────────────────────────────────────────────────────┐
│  Devices Dashboard                                              │
├─────────────────────────────────────────────────────────────────┤
│  [🔍 Search]  [Status ▼]  [Type ▼]  [Group ▼]  [More Filters]  │
└─────────────────────────────────────────────────────────────────┘
                                         ↑
                                    NEW FILTER
```

## 🎨 Component Appearance

### Default State (All Groups Selected)
```
┌────────────────────────┐
│ Group            ▼     │
│ All Groups             │
└────────────────────────┘
```

### Dropdown Open
```
┌────────────────────────┐
│ Group            ▲     │
│ All Groups             │
├────────────────────────┤
│ 📁 All Groups          │  ← Default option
│ ● Living Room (5)      │  ← Color indicator + name + count
│ ● Bedroom (3)          │
│ ● Kitchen (7)          │
│ ● Office (2)           │
└────────────────────────┘
```

### Loading State
```
┌────────────────────────┐
│ Group            ▼     │
│ ⟳ Loading groups...    │
└────────────────────────┘
```

### Disabled State
```
┌────────────────────────┐
│ Group            ▼     │  (grayed out)
│ All Groups             │
└────────────────────────┘
```

## 🔄 User Flow

### Filtering Devices by Group

1. **Initial State**
   - All devices displayed
   - Filter shows "All Groups"

2. **User Opens Filter**
   ```
   User clicks: [Group ▼]
   ```

3. **Dropdown Shows Options**
   ```
   - All Groups
   - Living Room (5 devices)
   - Bedroom (3 devices)
   - Kitchen (7 devices)
   ```

4. **User Selects Group**
   ```
   User clicks: Living Room (5)
   ```

5. **Devices Filtered**
   - Only devices in "Living Room" group are shown
   - Filter displays: "Living Room"
   - Table updates to show 5 devices

6. **Reset Filter**
   ```
   User clicks: [Group ▼] → All Groups
   All devices shown again
   ```

## 📊 Device Table Integration

### Before Filtering
```
┌──────────────────────────────────────────────────────────┐
│ Device Name    │ Type        │ Location      │ Status    │
├──────────────────────────────────────────────────────────┤
│ Temp Sensor 1  │ Temperature │ Living Room   │ Active    │
│ Hum Sensor 1   │ Humidity    │ Bedroom       │ Active    │
│ Temp Sensor 2  │ Temperature │ Kitchen       │ Inactive  │
│ Light Sensor 1 │ Light       │ Living Room   │ Active    │
│ Temp Sensor 3  │ Temperature │ Office        │ Active    │
└──────────────────────────────────────────────────────────┘
Total: 5 devices
```

### After Filtering (Living Room selected)
```
┌──────────────────────────────────────────────────────────┐
│ Device Name    │ Type        │ Location      │ Status    │
├──────────────────────────────────────────────────────────┤
│ Temp Sensor 1  │ Temperature │ Living Room   │ Active    │
│ Light Sensor 1 │ Light       │ Living Room   │ Active    │
└──────────────────────────────────────────────────────────┘
Total: 2 devices (filtered by group: Living Room)
```

## 🎨 Color Coding

Each group has a color indicator:

```
● Red Group      (#FF5733)
● Green Group    (#33FF57)
● Blue Group     (#3357FF)
● Orange Group   (#FFA500)
● Purple Group   (#9C27B0)
```

## 📱 Responsive Design

### Desktop View (md and up)
```
┌──────────────────────────────────────────────────────────────┐
│ [Search........]  [Status ▼]  [Type ▼]  [Group ▼]  [Actions]│
└──────────────────────────────────────────────────────────────┘
     4 columns        2 col        2 col     2 col      2 col
```

### Tablet View
```
┌─────────────────────────────────────┐
│ [Search..............]              │
│ [Status ▼] [Type ▼] [Group ▼]      │
│ [Actions.................]          │
└─────────────────────────────────────┘
```

### Mobile View (xs)
```
┌──────────────────────┐
│ [Search............] │
│ [Status ▼] [Type ▼] │
│ [Group ▼]            │
│ [Actions...........] │
└──────────────────────┘
```

## 🎯 Filter Combinations

Multiple filters work together:

### Example: Status + Type + Group
```
Search: "sensor"
Status: Active
Type: Temperature
Group: Living Room

Result: Active temperature sensors in Living Room only
```

## 🔔 User Feedback

### Success Messages
```
✅ Loaded 3 device groups
✅ Loaded 15 devices
```

### Error Messages
```
❌ Failed to load device groups
❌ No devices found in selected group
```

### Loading States
```
⟳ Loading groups...
⟳ Loading devices...
```

## 🛠️ Developer Notes

### Component Structure
```
DeviceGroupFilter
├── FormControl (MUI)
│   ├── InputLabel ("Group")
│   └── Select
│       ├── MenuItem ("All Groups")
│       └── MenuItem (for each group)
│           ├── Color indicator
│           ├── Group name
│           └── Device count
```

### Props Interface
```typescript
interface DeviceGroupFilterProps {
  groups: Group[];           // Array of group objects
  selectedGroup: string | number;  // "all" or group ID
  onChange: (value: string | number) => void;
  loading?: boolean;         // Optional loading state
  disabled?: boolean;        // Optional disabled state
}
```

### Group Object Structure
```typescript
interface Group {
  id: number;
  name: string;
  device_count: number;
  color: string;           // Hex color code
  icon?: string;           // Optional icon name
  description?: string;    // Optional description
}
```

## ✅ Accessibility Features

- **ARIA Labels**: Proper labels for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Clear focus indicators
- **Role Attributes**: Proper semantic HTML roles

## 🎨 Styling Details

### MUI Theme Integration
- Uses Material-UI's default theme
- Consistent sizing (small variant)
- Matches existing filter components
- Responsive min-width (200px)

### Color Indicators
- 16px diameter circles
- Positioned to the left of group names
- Uses group's custom color
- Flexbox layout for alignment

## 📈 Performance Considerations

- Groups loaded once on mount
- Device-group mapping cached in state
- Efficient filtering with O(1) lookups
- No unnecessary re-renders
- Memoization-ready structure

---

**Note**: This visual guide complements the technical implementation documentation. For code details, see `device-group-filter-implementation.md`.
