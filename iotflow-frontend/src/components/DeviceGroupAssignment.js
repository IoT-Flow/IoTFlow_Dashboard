import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  LinearProgress,
  Alert,
  IconButton,
} from '@mui/material';
import { Search, Close, Folder } from '@mui/icons-material';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';

/**
 * DeviceGroupAssignment Component
 * 
 * Dialog for assigning devices to groups.
 * Supports single device or bulk device assignment.
 * 
 * @param {boolean} open - Whether the dialog is open
 * @param {Object} device - Single device to assign (optional)
 * @param {Array} devices - Multiple devices to assign (optional)
 * @param {Array} deviceGroups - Groups the device is currently in
 * @param {Function} onClose - Callback when dialog is closed
 * @param {Function} onSave - Callback when assignment is saved
 */
const DeviceGroupAssignment = ({
  open,
  device,
  devices,
  deviceGroups = [],
  onClose,
  onSave,
}) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [initialGroups, setInitialGroups] = useState(new Set());
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  const isBulk = Boolean(devices && devices.length > 0);
  const deviceCount = isBulk ? devices.length : 1;
  const deviceName = device ? device.name : '';

  // Load groups
  useEffect(() => {
    const loadGroups = async () => {
      if (!open) return;

      try {
        setLoading(true);
        const groupsData = await apiService.getGroups();
        setGroups(groupsData);

        // Initialize selected groups with current device groups
        const initial = new Set(deviceGroups);
        setSelectedGroups(initial);
        setInitialGroups(initial);
      } catch (error) {
        console.error('Error loading groups:', error);
        toast.error('Failed to load groups');
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [open, deviceGroups]);

  const hasChanges = () => {
    if (selectedGroups.size !== initialGroups.size) return true;

    for (const groupId of selectedGroups) {
      if (!initialGroups.has(groupId)) return true;
    }

    return false;
  };

  const handleToggleGroup = (groupId) => {
    setSelectedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setProgress(0);
    setResults(null);

    const devicesToAssign = isBulk ? devices : [device];
    const groupsToAdd = Array.from(selectedGroups).filter(gId => !initialGroups.has(gId));
    const groupsToRemove = Array.from(initialGroups).filter(gId => !selectedGroups.has(gId));

    let successCount = 0;
    let failureCount = 0;
    let totalOperations = 0;

    try {
      // Calculate total operations
      if (!isBulk) {
        totalOperations = groupsToAdd.length + groupsToRemove.length;
      } else {
        totalOperations = devicesToAssign.length * groupsToAdd.length;
      }

      let completedOperations = 0;

      // Add devices to groups
      for (const deviceToAssign of devicesToAssign) {
        for (const groupId of groupsToAdd) {
          try {
            await apiService.addDeviceToGroup(groupId, deviceToAssign.id);
            successCount++;
          } catch (error) {
            console.error(`Error adding device ${deviceToAssign.id} to group ${groupId}:`, error);
            failureCount++;
          }
          completedOperations++;
          setProgress((completedOperations / totalOperations) * 100);
        }
      }

      // Remove devices from groups (only for single device)
      if (!isBulk) {
        for (const groupId of groupsToRemove) {
          try {
            await apiService.removeDeviceFromGroup(groupId, device.id);
            successCount++;
          } catch (error) {
            console.error(`Error removing device from group ${groupId}:`, error);
            failureCount++;
          }
          completedOperations++;
          setProgress((completedOperations / totalOperations) * 100);
        }
      }

      // Show results
      if (failureCount === 0) {
        toast.success(
          isBulk
            ? `${devicesToAssign.length} devices assigned successfully`
            : 'Device groups updated successfully'
        );
        onSave();
        onClose();
      } else {
        const totalDevices = isBulk ? devicesToAssign.length : 1;
        const successfulDevices = Math.floor(successCount / groupsToAdd.length);
        setResults({
          success: successfulDevices,
          failed: totalDevices - successfulDevices,
          total: totalDevices,
        });
        toast.error(`${failureCount} operations failed`);
      }
    } catch (error) {
      console.error('Error assigning devices:', error);
      toast.error('Failed to assign devices');
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {isBulk
              ? `Assign ${deviceCount} devices to groups`
              : `Assign ${deviceName} to groups`}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading groups...</Typography>
          </Box>
        ) : (
          <Box>
            {/* Search */}
            <TextField
              fullWidth
              size="small"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {/* Progress Bar */}
            {submitting && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="caption" sx={{ mt: 0.5 }}>
                  Processing... {Math.round(progress)}%
                </Typography>
              </Box>
            )}

            {/* Results Alert */}
            {results && (
              <Alert severity={results.failed > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
                {results.success} of {results.total} devices assigned successfully
                {results.failed > 0 && ` (${results.failed} failed)`}
              </Alert>
            )}

            {/* Groups List */}
            {filteredGroups.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  {searchTerm ? 'No groups found' : 'No groups available'}
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {filteredGroups.map((group) => (
                  <ListItem
                    key={group.id}
                    dense
                    button
                    onClick={() => handleToggleGroup(group.id)}
                    disabled={submitting}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedGroups.has(group.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <Box
                      data-testid="group-color-indicator"
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: group.color || '#3B82F6',
                        mr: 1.5,
                      }}
                    />
                    <ListItemText
                      primary={group.name}
                      secondary={`${group.device_count || 0} devices`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!hasChanges() || submitting || loading}
          startIcon={submitting && <CircularProgress size={16} />}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeviceGroupAssignment;
