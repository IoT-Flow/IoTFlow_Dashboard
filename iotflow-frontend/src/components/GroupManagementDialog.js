import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Popover,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Delete,
  Close,
} from '@mui/icons-material';
import { HexColorPicker } from 'react-colorful';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';

const DEFAULT_COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#F5FF33',
  '#33FFF5', '#F57F33', '#8B33FF', '#FF3333', '#33FF33',
];

/**
 * GroupManagementDialog Component
 * 
 * Dialog for creating, editing, and deleting device groups.
 * 
 * @param {boolean} open - Whether the dialog is open
 * @param {Function} onClose - Callback when dialog is closed
 * @param {Function} onSave - Callback when group is saved/deleted
 * @param {string} mode - 'create' or 'edit'
 * @param {Object} group - Existing group data (for edit mode)
 */
const GroupManagementDialog = ({
  open,
  onClose,
  onSave,
  mode = 'create',
  group = null,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [colorAnchor, setColorAnchor] = useState(null);

  // Initialize form with existing group data in edit mode
  useEffect(() => {
    if (mode === 'edit' && group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        color: group.color || '#3B82F6',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
      });
    }
    setErrors({});
  }, [mode, group, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleColorChange = (color) => {
    setFormData((prev) => ({
      ...prev,
      color,
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      let result;
      if (mode === 'create') {
        result = await apiService.createGroup(formData);
        toast.success('Group created successfully');
      } else {
        result = await apiService.updateGroup(group.id, formData);
        toast.success('Group updated successfully');
      }

      onSave(result);
      onClose();
    } catch (error) {
      console.error(`Error ${mode}ing group:`, error);
      toast.error(`Failed to ${mode} group`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);

    try {
      await apiService.deleteGroup(group.id);
      toast.success('Group deleted successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    } finally {
      setSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {mode === 'create' ? 'Create Group' : 'Edit Group'}
            </Typography>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            {/* Group Name */}
            <TextField
              label="Group Name"
              value={formData.name}
              onChange={handleChange('name')}
              error={Boolean(errors.name)}
              helperText={errors.name}
              fullWidth
              required
              autoFocus
            />

            {/* Description */}
            <TextField
              label="Description"
              value={formData.description}
              onChange={handleChange('description')}
              fullWidth
              multiline
              rows={3}
            />

            {/* Color and Icon */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* Color Picker */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Color
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <IconButton
                    aria-label="Choose color"
                    onClick={(e) => setColorAnchor(e.currentTarget)}
                    sx={{
                      width: 48,
                      height: 48,
                      border: '2px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box
                      data-testid="color-indicator"
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: formData.color,
                      }}
                    />
                  </IconButton>
                  <TextField
                    value={formData.color}
                    onChange={handleChange('color')}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                </Box>

                {/* Predefined colors */}
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                  {DEFAULT_COLORS.map((color) => (
                    <Box
                      key={color}
                      onClick={() => handleColorChange(color)}
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: formData.color === color ? '2px solid #000' : '2px solid transparent',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
          <Box>
            {mode === 'edit' && (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                color="error"
                startIcon={<Delete />}
                disabled={submitting}
              >
                Delete
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={submitting}
              startIcon={submitting && <CircularProgress size={16} />}
            >
              {mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Color Picker Popover */}
      <Popover
        open={Boolean(colorAnchor)}
        anchorEl={colorAnchor}
        onClose={() => setColorAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2 }} data-testid="color-picker">
          <HexColorPicker color={formData.color} onChange={handleColorChange} />
        </Box>
      </Popover>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to delete this group? This action cannot be undone.
          </Alert>
          <Typography>
            Group: <strong>{group?.name}</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={submitting}
            startIcon={submitting && <CircularProgress size={16} />}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GroupManagementDialog;
