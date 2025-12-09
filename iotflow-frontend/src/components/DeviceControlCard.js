import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  IconButton,
  Chip,
  Tooltip,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
} from '@mui/material';
import {
  ControlPoint,
  Power,
  PlayArrow,
  Stop,
  Visibility,
  Refresh,
  DeviceHub,
  CheckCircle,
  Error,
  Warning,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';
import { useWebSocket } from '../contexts/WebSocketContext';
import DeviceControlDialog from './DeviceControlDialog';

const DeviceControlCard = ({ userId }) => {
  const { deviceNotifications, clearNotification } = useWebSocket();
  const [controllableDevices, setControllableDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [controlLoading, setControlLoading] = useState({});
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [controlDialogOpen, setControlDialogOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    loadControllableDevices();
  }, [userId]);

  const loadControllableDevices = async () => {
    try {
      setLoading(true);
      const result = await apiService.getDevices();
      if (result.success) {
        const controllableTypes = [
          'LED',
          'Engine',
          'Door Lock',
          'Pump',
          'Fan',
          'Valve',
          'Thermostat',
          'Switch',
          'Dimmer',
          'Motor',
        ];
        const controllable = result.data.devices.filter(device =>
          controllableTypes.includes(device.type)
        );
        setControllableDevices(controllable);
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeQuickCommand = async (device, command) => {
    const commandKey = `${device.id}_${command}`;
    setControlLoading(prev => ({ ...prev, [commandKey]: true }));

    try {
      const result = await apiService.sendDeviceCommand(device.id, command, {});
      if (result.success) {
        toast.success(`${command} executed on ${device.name}`);
      }
    } catch (error) {
      toast.error(`Failed to execute ${command}`);
    } finally {
      setControlLoading(prev => ({ ...prev, [commandKey]: false }));
    }
  };

  const getQuickActions = deviceType => {
    const actionMap = {
      LED: [{ command: 'power', icon: <Power />, label: 'Toggle' }],
      Engine: [
        { command: 'start', icon: <PlayArrow />, label: 'Start' },
        { command: 'stop', icon: <Stop />, label: 'Stop' },
      ],
      'Door Lock': [
        { command: 'lock', icon: <PlayArrow />, label: 'Lock' },
        { command: 'unlock', icon: <Stop />, label: 'Unlock' },
      ],
      Pump: [
        { command: 'start', icon: <PlayArrow />, label: 'Start' },
        { command: 'stop', icon: <Stop />, label: 'Stop' },
      ],
      Fan: [{ command: 'power', icon: <Power />, label: 'Toggle' }],
      Valve: [
        { command: 'open', icon: <PlayArrow />, label: 'Open' },
        { command: 'close', icon: <Stop />, label: 'Close' },
      ],
    };
    return actionMap[deviceType] || [{ command: 'power', icon: <Power />, label: 'Toggle' }];
  };

  const getStatusColor = status => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'error':
        return 'error';
      case 'maintenance':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" py={3}>
            <CircularProgress size={24} />
            <Typography sx={{ ml: 2 }}>Loading controllable devices...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (controllableDevices.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Device Control
          </Typography>
          <Alert severity="info">
            No controllable devices found. Register LED lights, pumps, locks, or other controllable
            devices to see quick controls here.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
            <Typography variant="h6">Device Control</Typography>
            <Box>
              {deviceNotifications.length > 0 && (
                <Tooltip title={`${deviceNotifications.length} notifications`}>
                  <IconButton
                    size="small"
                    onClick={() => setNotificationsOpen(true)}
                    sx={{ mr: 1 }}
                  >
                    <Warning color="warning" />
                  </IconButton>
                </Tooltip>
              )}
              <IconButton size="small" onClick={loadControllableDevices}>
                <Refresh />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {controllableDevices.slice(0, 6).map(device => (
              <Grid item xs={12} sm={6} md={4} key={device.id}>
                <Card
                  variant="outlined"
                  sx={{
                    '&:hover': {
                      boxShadow: 2,
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <DeviceHub sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2" noWrap sx={{ flexGrow: 1 }}>
                        {device.name}
                      </Typography>
                      <Chip
                        label={device.status}
                        size="small"
                        color={getStatusColor(device.status)}
                      />
                    </Box>

                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                      {device.type} • {device.location}
                    </Typography>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        {getQuickActions(device.type)
                          .slice(0, 2)
                          .map((action, index) => (
                            <Tooltip key={index} title={action.label}>
                              <IconButton
                                size="small"
                                onClick={() => executeQuickCommand(device, action.command)}
                                disabled={controlLoading[`${device.id}_${action.command}`]}
                                sx={{ mr: 0.5 }}
                              >
                                {controlLoading[`${device.id}_${action.command}`] ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  action.icon
                                )}
                              </IconButton>
                            </Tooltip>
                          ))}
                      </Box>

                      <Tooltip title="Full Control">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedDevice(device);
                            setControlDialogOpen(true);
                          }}
                        >
                          <ControlPoint />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {controllableDevices.length > 6 && (
            <Box textAlign="center" mt={2}>
              <Button size="small" variant="outlined">
                View All Devices ({controllableDevices.length})
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Notifications Dialog */}
      <Dialog
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Device Notifications</DialogTitle>
        <DialogContent>
          {deviceNotifications.length === 0 ? (
            <Typography color="text.secondary">No recent notifications</Typography>
          ) : (
            <List>
              {deviceNotifications.slice(0, 10).map(notification => (
                <ListItem key={notification.id}>
                  <ListItemIcon>
                    {notification.type === 'success' ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Error color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.message}
                    secondary={notification.timestamp.toLocaleString()}
                  />
                  <ListItemSecondaryAction>
                    <IconButton onClick={() => clearNotification(notification.id)}>
                      <Visibility />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Device Control Dialog */}
      <DeviceControlDialog
        open={controlDialogOpen}
        onClose={() => {
          setControlDialogOpen(false);
          setSelectedDevice(null);
        }}
        device={selectedDevice}
      />
    </>
  );
};

export default DeviceControlCard;
