import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material';
import { FolderSpecial } from '@mui/icons-material';

/**
 * DeviceGroupFilter Component
 * 
 * A reusable filter component for selecting device groups.
 * Displays groups with their names, device counts, and color indicators.
 * 
 * @param {Array} groups - Array of group objects with id, name, device_count, color
 * @param {string|number} selectedGroup - Currently selected group ID or "all"
 * @param {Function} onChange - Callback function when selection changes
 * @param {boolean} loading - Whether groups are being loaded
 * @param {boolean} disabled - Whether the filter should be disabled
 */
const DeviceGroupFilter = ({ 
  groups = [], 
  selectedGroup = 'all', 
  onChange, 
  loading = false,
  disabled = false 
}) => {
  const handleChange = (event) => {
    const value = event.target.value;
    onChange(value === 'all' ? 'all' : parseInt(value, 10));
  };

  if (loading) {
    return (
      <FormControl sx={{ minWidth: 200 }} size="small" disabled>
        <InputLabel>Group</InputLabel>
        <Select
          value="loading"
          label="Group"
          disabled
        >
          <MenuItem value="loading">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <span>Loading groups...</span>
            </Box>
          </MenuItem>
        </Select>
      </FormControl>
    );
  }

  return (
    <FormControl sx={{ minWidth: 200 }} size="small" disabled={disabled}>
      <InputLabel id="group-filter-label">Group</InputLabel>
      <Select
        labelId="group-filter-label"
        id="group-filter"
        value={selectedGroup}
        onChange={handleChange}
        label="Group"
        renderValue={(value) => {
          if (value === 'all') {
            return 'All Groups';
          }
          const selectedGroupObj = groups.find(g => g.id === value);
          return selectedGroupObj ? selectedGroupObj.name : 'Unknown';
        }}
      >
        <MenuItem value="all">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderSpecial sx={{ fontSize: 20, color: 'text.secondary' }} />
            <span>All Groups</span>
          </Box>
        </MenuItem>

        {groups.map((group) => (
          <MenuItem key={group.id} value={group.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: group.color || '#3B82F6',
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1 }}>
                {group.name} ({group.device_count || 0})
              </span>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default DeviceGroupFilter;
