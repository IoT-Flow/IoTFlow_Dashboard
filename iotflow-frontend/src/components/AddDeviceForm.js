/**
 * AddDeviceForm Component
 *
 * A form for creating new IoT devices with validation and error handling.
 *
 * Features:
 * - Form validation for required fields
 * - Device type selection (Sensor, Actuator, Gateway)
 * - Location and description input
 * - Loading state during submission
 * - Success/error toast notifications
 * - Callback on successful creation
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Typography,
  Stack,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import { ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import apiService from '../services/apiService';

const DEVICE_TYPES = [
  { value: 'sensor', label: 'Sensor' },
  { value: 'actuator', label: 'Actuator' },
  { value: 'gateway', label: 'Gateway' },
];

const AddDeviceForm = ({ onSuccess = () => {} }) => {
  const [loading, setLoading] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [createdDevice, setCreatedDevice] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    device_type: '',
    location: '',
    description: '',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Device name is required';
    }

    if (!formData.device_type) {
      newErrors.device_type = 'Device type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.createDevice({
        name: formData.name,
        device_type: formData.device_type,
        location: formData.location || null,
        description: formData.description || null,
      });

      const device = response.success ? response.data : response;

      toast.success(`Device created successfully: ${device.name}`);

      // Store the created device with API key
      setCreatedDevice(device);

      // Clear form
      setFormData({
        name: '',
        device_type: '',
        location: '',
        description: '',
      });

      // Call callback
      onSuccess(device);
    } catch (error) {
      console.error('Error creating device:', error);
      toast.error(`Failed to create device: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyApiKey = async () => {
    if (createdDevice?.apiKey) {
      try {
        await navigator.clipboard.writeText(createdDevice.apiKey);
        setApiKeyCopied(true);
        setTimeout(() => setApiKeyCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy API key:', error);
        toast.error('Failed to copy API key');
      }
    }
  };

  return (
    <Box>
      {/* API Key Display Section */}
      {createdDevice && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setCreatedDevice(null)}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            ✅ Device created successfully!
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Device Name: <strong>{createdDevice.name}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Save your API key somewhere safe. You'll need it to connect your device.
          </Typography>
          <Paper
            sx={{
              p: 2,
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                wordBreak: 'break-all',
                flex: 1,
              }}
            >
              <strong>API Key:</strong> {createdDevice.apiKey}
            </Typography>
            <Tooltip title={apiKeyCopied ? 'Copied!' : 'Copy API Key'}>
              <IconButton
                size="small"
                onClick={handleCopyApiKey}
                sx={{
                  flexShrink: 0,
                  color: apiKeyCopied ? 'success.main' : 'primary.main',
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>
        </Alert>
      )}

      {/* Form Card */}
      <Card sx={{ maxWidth: 500, mx: 'auto', display: createdDevice ? 'none' : 'block' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Add New Device
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {/* Device Name */}
              <TextField
                fullWidth
                label="Device Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={!!errors.name}
                helperText={errors.name}
                placeholder="Enter device name"
                disabled={loading}
                required
              />

              {/* Device Type */}
              <FormControl fullWidth error={!!errors.device_type} disabled={loading} required>
                <InputLabel id="device-type-label">Device Type</InputLabel>
                <Select
                  labelId="device-type-label"
                  name="device_type"
                  value={formData.device_type}
                  onChange={handleInputChange}
                  label="Device Type"
                >
                  <MenuItem value="">
                    <em>Select device type</em>
                  </MenuItem>
                  {DEVICE_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.device_type && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    {errors.device_type}
                  </Typography>
                )}
              </FormControl>

              {/* Location */}
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Living Room, Kitchen"
                disabled={loading}
              />

              {/* Description */}
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter device description"
                multiline
                rows={3}
                disabled={loading}
              />
            </Stack>
          </Box>
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              minWidth: 150,
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Creating...
              </>
            ) : (
              'Create Device'
            )}
          </Button>
        </CardActions>
      </Card>

      {/* Success notification */}
      <Snackbar
        open={apiKeyCopied}
        autoHideDuration={2000}
        onClose={() => setApiKeyCopied(false)}
        message="API Key copied to clipboard"
      />
    </Box>
  );
};

export default AddDeviceForm;
