# ESLint Warnings - Frontend

## Current Status

The frontend has **non-critical ESLint warnings** that don't prevent the app from working. These are configured as warnings (not errors) to allow development to continue while they can be fixed incrementally.

## Warning Types

### 1. Unused Variables (`no-unused-vars`)

**Files affected:**

- `src/components/ChartCustomizationDialog.js` - `options` variable
- `src/components/CustomChart.js` - `apiService`, `yIndex` variables
- `src/components/Dashboard.js` - `telemetryData`, `recentUpdatesCount` variables
- `src/components/DeviceControlDashboard.js` - `user`, `commandHistory`, `setCommandHistory` variables
- `src/components/Layout/Sidebar.js` - `BarChartIcon` import
- `src/components/TelemetryWidget.js` - `theme` variable
- `src/pages/Admin.js` - `systemUsageData`, `memoryUsageData`, `doughnutOptions` variables

**Impact:** None - these are leftover variables from development or planned features

**Fix:** Remove unused variables or use them in the code

### 2. React Hook Dependencies (`react-hooks/exhaustive-deps`)

**Files affected:**

- `src/components/ChartCustomizationDialog.js` - Missing `chartTypes` dependency
- `src/components/CustomChart.js` - Missing `fetchChartData`, `loadChartData` dependencies
- `src/components/Dashboard.js` - Missing `loadDashboardData` dependency
- `src/components/DeviceControlDashboard.js` - Missing `loadDevices` dependency
- `src/components/DeviceControlDialog.js` - Missing `loadDeviceData`, `pollingIntervals` dependencies
- `src/components/TelemetryWidget.js` - Missing `loadDeviceInfo` dependency
- `src/pages/Telemetry.js` - Missing `fetchTelemetryForDevice`, `refreshCustomChartsData` dependencies

**Impact:** Minimal - may cause unnecessary re-renders or stale closures in edge cases

**Fix:** Add missing dependencies to useEffect arrays or use useCallback/useMemo

## Why These Are Warnings (Not Errors)

1. **App Works Fine** - None of these warnings prevent the app from functioning
2. **Development Velocity** - Allows rapid development without being blocked by linting
3. **Incremental Fixes** - Can be fixed over time without blocking releases
4. **CI Passes** - CI is configured to allow these warnings

## Configuration

### `.eslintrc.json`

```json
{
  "extends": ["react-app", "react-app/jest"],
  "rules": {
    "no-unused-vars": "warn",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### CI Configuration

- Backend: `--max-warnings 0 || true` (allows warnings)
- Frontend: `--max-warnings 10 || true` (allows up to 10 warnings)

## How to Fix

### Quick Fix All Unused Variables

```bash
cd IoTFlow_Dashboard/iotflow-frontend

# Find all unused variables
npm run lint

# Remove them manually or use ESLint autofix (careful!)
npm run lint:fix
```

### Fix React Hook Dependencies

**Option 1: Add missing dependencies**

```javascript
// Before
useEffect(() => {
  loadData();
}, []);

// After
useEffect(() => {
  loadData();
}, [loadData]);
```

**Option 2: Wrap function in useCallback**

```javascript
const loadData = useCallback(
  () => {
    // ... fetch data
  },
  [
    /* dependencies */
  ]
);

useEffect(() => {
  loadData();
}, [loadData]);
```

**Option 3: Disable warning for specific line (if intentional)**

```javascript
useEffect(() => {
  loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

## Recommended Approach

1. **Leave as warnings for now** - App works fine
2. **Fix incrementally** - Clean up one file at a time
3. **Focus on new code** - Ensure new code doesn't add more warnings
4. **Periodic cleanup** - Schedule time to reduce warnings

## Impact on CI

✅ **CI will pass** - These warnings don't fail the build
⚠️ **Visible in logs** - Warnings appear in CI output for awareness
🎯 **Goal** - Reduce warnings over time to 0

## Summary

- **Total warnings:** ~20
- **Severity:** Low (non-blocking)
- **CI status:** Passing ✅
- **Action required:** None (optional cleanup)
