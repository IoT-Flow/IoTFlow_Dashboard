import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Switch,
  Slider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  FormControlLabel
} from '@mui/material';
import {
  Close,
  Power,
  PlayArrow,
  Stop,
  Settings,
  Refresh,
  History,
  Warning,
  CheckCircle,
  Error,
  Schedule
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';
import { useWebSocket } from '../contexts/WebSocketContext';

const DeviceControlDialog = ({ open, onClose, device }) => {
  const { sendDeviceCommand, getDeviceState, subscribeToDevice, unsubscribeFromDevice } = useWebSocket();
  const [deviceState, setDeviceState] = useState(null);
  const [availableCommands, setAvailableCommands] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commandLoading, setCommandLoading] = useState({});
  const [controlValues, setControlValues] = useState({});
  const [showHistory, setShowHistory] = useState(false);

  // Load device data when dialog opens
  useEffect(() => {
    if (open && device) {
      loadDeviceData();
      subscribeToDevice(device.id);
    }
    
    return () => {
      if (device) {
        unsubscribeFromDevice(device.id);
      }
    };
  }, [open, device, subscribeToDevice, unsubscribeFromDevice]);

  // Monitor device state changes from WebSocket
  useEffect(() => {
    if (device) {
      const wsState = getDeviceState(device.id);
      if (wsState) {
        setDeviceState(wsState);
      }
    }
  }, [device, getDeviceState]);

  const loadDeviceData = async () => {
    if (!device) return;
    
    setLoading(true);
    try {
      // Load device status, available commands, and command history in parallel
      const [statusResult, commandsResult, historyResult] = await Promise.all([
        apiService.getDeviceStatus(device.id),
        apiService.getDeviceCommands(device.id),
        apiService.getCommandHistory(device.id, { limit: 10 })
      ]);

      if (statusResult.success) {
        setDeviceState(statusResult.data);
        // Initialize control values from current state
        setControlValues(statusResult.data.state || {});
      }

      if (commandsResult.success) {
        setAvailableCommands(commandsResult.data.commands || []);
      }

      if (historyResult.success) {
        setCommandHistory(historyResult.data.commands || []);
      }
    } catch (error) {
      console.error('Failed to load device data:', error);
      toast.error('Failed to load device information');
    } finally {
      setLoading(false);
    }
  };

  const executeCommand = async (command, params = {}) => {
    if (!device) return;

    const commandKey = `${command}_${JSON.stringify(params)}`;
    setCommandLoading(prev => ({ ...prev, [commandKey]: true }));

    try {
      // Send command via WebSocket for real-time response
      sendDeviceCommand(device.id, command, params);
      
      // Also send via API for persistence
      const result = await apiService.sendDeviceCommand(device.id, command, params);
      
      if (result.success) {
        toast.success(`Command '${command}' executed successfully`);
        
        // Update local state optimistically
        if (params.hasOwnProperty('state') || params.hasOwnProperty('power')) {
          setDeviceState(prev => ({
            ...prev,
            state: { ...prev?.state, ...params }
          }));
        }
        
        // Refresh command history
        loadCommandHistory();
      } else {
        toast.error('Command execution failed');
      }
    } catch (error) {
      console.error('Command execution error:', error);
      toast.error('Failed to execute command');
    } finally {
      setCommandLoading(prev => ({ ...prev, [commandKey]: false }));
    }
  };

  const loadCommandHistory = async () => {
    try {
      const result = await apiService.getCommandHistory(device.id, { limit: 10 });
      if (result.success) {
        setCommandHistory(result.data.commands || []);
      }
    } catch (error) {
      console.error('Failed to load command history:', error);
    }
  };

  const getCommandIcon = (command) => {
    const iconMap = {
      'power': <Power />,
      'start': <PlayArrow />,
      'stop': <Stop />,
      'lock': <Settings />,
      'unlock': <Settings />,
      'open': <PlayArrow />,
      'close': <Stop />
    };
    return iconMap[command] || <Settings />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'executed': return <CheckCircle color="success" />;
      case 'failed': return <Error color="error" />;
      case 'pending': return <Schedule color="warning" />;
      default: return <Warning />;
    }
  };

  const isControllableDevice = () => {
    const controllableTypes = ['LED', 'Engine', 'Door Lock', 'Pump', 'Fan', 'Valve', 'Thermostat', 'Switch', 'Dimmer', 'Motor'];
    return controllableTypes.includes(device?.type);
  };

  const renderControlInterface = () => {
    if (!isControllableDevice() || availableCommands.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          This device type doesn't support remote control or no commands are available.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {availableCommands.map((command, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              variant="outlined" 
              sx={{ 
                height: '100%',
                '&:hover': { 
                  boxShadow: 2,
                  borderColor: 'primary.main'
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  {getCommandIcon(command.name)}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {command.label}
                  </Typography>
                </Box>

                {renderCommandControl(command)}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderCommandControl = (command) => {
    const commandKey = `${command.name}_${JSON.stringify(controlValues)}`;
    const isLoading = commandLoading[commandKey];

    switch (command.type) {
      case 'button':
        return (
          <Button
            fullWidth
            variant="contained"
            onClick={() => executeCommand(command.name, {})}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={16} /> : getCommandIcon(command.name)}
          >
            {command.label}
          </Button>
        );

      case 'toggle':
        const paramName = command.params[0];
        const isOn = controlValues[paramName] || false;
        return (
          <FormControlLabel
            control={
              <Switch
                checked={isOn}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setControlValues(prev => ({ ...prev, [paramName]: newValue }));
                  executeCommand(command.name, { [paramName]: newValue });
                }}
                disabled={isLoading}
              />
            }
            label={isOn ? 'ON' : 'OFF'}
          />
        );

      case 'slider':
        const sliderParam = command.params[0];
        const sliderValue = controlValues[sliderParam] || command.min || 0;
        return (
          <Box>
            <Typography variant="body2" gutterBottom>
              {command.label}: {sliderValue}
            </Typography>
            <Slider
              value={sliderValue}
              min={command.min || 0}
              max={command.max || 100}
              onChange={(e, value) => {
                setControlValues(prev => ({ ...prev, [sliderParam]: value }));
              }}
              onChangeCommitted={(e, value) => {
                executeCommand(command.name, { [sliderParam]: value });
              }}
              disabled={isLoading}
              valueLabelDisplay="auto"
            />
          </Box>
        );

      case 'select':
        const selectParam = command.params[0];
        const selectValue = controlValues[selectParam] || command.options[0];
        return (
          <FormControl fullWidth>
            <InputLabel>{command.label}</InputLabel>
            <Select
              value={selectValue}
              label={command.label}
              onChange={(e) => {
                const newValue = e.target.value;
                setControlValues(prev => ({ ...prev, [selectParam]: newValue }));
                executeCommand(command.name, { [selectParam]: newValue });
              }}
              disabled={isLoading}
            >
              {command.options?.map((option, idx) => (
                <MenuItem key={idx} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'color':
        return (
          <Box>
            <Typography variant="body2" gutterBottom>
              Color Control
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                const color = { r: 255, g: 0, b: 0 }; // Default red
                executeCommand(command.name, color);
              }}
              disabled={isLoading}
            >
              Set Color
            </Button>
          </Box>
        );

      case 'password':
        return (
          <TextField
            fullWidth
            type="password"
            label={command.label}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                executeCommand(command.name, { [command.params[0]]: e.target.value });
                e.target.value = '';
              }
            }}
            disabled={isLoading}
            helperText="Press Enter to execute"
          />
        );

      default:
        return (
          <Typography variant="body2" color="text.secondary">
            Unsupported control type: {command.type}
          </Typography>
        );
    }
  };

  const renderDeviceStatus = () => {
    if (!deviceState) return null;

    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Device Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip 
                label={deviceState.status} 
                color={deviceState.status === 'active' ? 'success' : 'default'}
                size="small"
              />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Last Update
              </Typography>
              <Typography variant="body2">
                {deviceState.lastUpdate ? new Date(deviceState.lastUpdate).toLocaleString() : 'Never'}
              </Typography>
            </Grid>
            {deviceState.state && Object.keys(deviceState.state).length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Current State
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {Object.entries(deviceState.state).map(([key, value]) => (
                    <Chip 
                      key={key}
                      label={`${key}: ${typeof value === 'boolean' ? (value ? 'ON' : 'OFF') : value}`}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderCommandHistory = () => {
    if (!showHistory) return null;

    return (
      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Recent Commands
            </Typography>
            <Button size="small" onClick={loadCommandHistory} startIcon={<Refresh />}>
              Refresh
            </Button>
          </Box>
          
          {commandHistory.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No recent commands
            </Typography>
          ) : (
            <Box>
              {commandHistory.map((cmd, index) => (
                <Box key={index} sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  py: 1,
                  borderBottom: index < commandHistory.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider'
                }}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {cmd.command}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(cmd.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getStatusIcon(cmd.status)}
                    <Typography variant="caption">
                      {cmd.executionTime}ms
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!device) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box>
          <Typography variant="h5" component="div">
            Device Control
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {device.name} ({device.type})
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Command History">
            <IconButton 
              onClick={() => setShowHistory(!showHistory)}
              color={showHistory ? 'primary' : 'default'}
            >
              <History />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={loadDeviceData} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading device information...</Typography>
          </Box>
        ) : (
          <Box>
            {renderDeviceStatus()}
            
            <Typography variant="h6" gutterBottom>
              Device Controls
            </Typography>
            
            {renderControlInterface()}
            {renderCommandHistory()}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeviceControlDialog;
