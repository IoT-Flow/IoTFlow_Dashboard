import {
  Add,
  CheckCircle,
  Close,
  Delete,
  Error,
  History,
  PlayArrow,
  Power,
  Refresh,
  Schedule,
  Send,
  Settings,
  Stop,
  Warning
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useWebSocket } from '../contexts/WebSocketContext';
import apiService from '../services/apiService';

const DeviceControlDialog = ({ open, onClose, device }) => {
  // --- Context and State ---
  const { sendDeviceCommand, subscribeToDevice, unsubscribeFromDevice } = useWebSocket();
  const [deviceState, setDeviceState] = useState(null); // Device status and state
  const [availableCommands, setAvailableCommands] = useState([]); // Supported commands
  const [commandHistory, setCommandHistory] = useState([]); // Recent commands
  const [loading, setLoading] = useState(false); // Dialog loading state
  const [commandLoading, setCommandLoading] = useState({}); // Per-command loading
  const [controlValues, setControlValues] = useState({}); // UI control values
  const [showHistory, setShowHistory] = useState(false); // Show/hide history
  const [tabValue, setTabValue] = useState(0); // Tab control (0: Standard, 1: Custom)

  // Custom Command State
  const [customCommand, setCustomCommand] = useState('');
  const [customParameters, setCustomParameters] = useState([{ key: '', value: '' }]);
  const [customCommandLoading, setCustomCommandLoading] = useState(false);
  const [sentCommands, setSentCommands] = useState([]); // Track sent custom commands
  const [pollingIntervals, setPollingIntervals] = useState({}); // Status polling intervals

  // --- Effects ---
  // Load device data and subscribe when dialog opens
  useEffect(() => {
    if (open && device) {
      loadDeviceData();
      subscribeToDevice(device.id);
    }
    return () => {
      if (device) {
        unsubscribeFromDevice(device.id);
        // Clear all polling intervals
        Object.values(pollingIntervals).forEach(clearInterval);
      }
    };
  }, [open, device, subscribeToDevice, unsubscribeFromDevice]);

  // Placeholder for future WebSocket state sync
  useEffect(() => {
    // To sync deviceState from context, use getDeviceStatus or getDeviceTelemetry if needed
  }, [device]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTabValue(0);
      setCustomCommand('');
      setCustomParameters([{ key: '', value: '' }]);
      setSentCommands([]);
      Object.values(pollingIntervals).forEach(clearInterval);
      setPollingIntervals({});
    }
  }, [open]);

  // --- Data Loaders ---
  const loadDeviceData = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const [statusResult, commandsResult, historyResult] = await Promise.all([
        apiService.getDeviceStatus(device.id),
        apiService.getDeviceCommands(device.id),
        apiService.getCommandHistory(device.id, { limit: 10 })
      ]);
      if (statusResult.success) {
        setDeviceState(statusResult.data);
        setControlValues(statusResult.data.state || {});
      }
      if (commandsResult.success) setAvailableCommands(commandsResult.data.commands || []);
      if (historyResult.success) setCommandHistory(historyResult.data.commands || []);

      // Load pending custom commands
      await loadPendingCommands();
    } catch (error) {
      console.error('Failed to load device data:', error);
      toast.error('Failed to load device information');
    } finally {
      setLoading(false);
    }
  };

  const loadCommandHistory = async () => {
    try {
      const result = await apiService.getCommandHistory(device.id, { limit: 10 });
      if (result.success) setCommandHistory(result.data.commands || []);
    } catch (error) {
      console.error('Failed to load command history:', error);
    }
  };

  // --- Command Execution ---
  const executeCommand = async (command, params = {}) => {
    if (!device) return;
    const commandKey = `${command}_${JSON.stringify(params)}`;
    setCommandLoading(prev => ({ ...prev, [commandKey]: true }));
    try {
      sendDeviceCommand(device.id, command, params);
      const result = await apiService.sendDeviceCommand(device.id, command, params);
      if (result.success) {
        toast.success(`Command '${command}' executed successfully`);
        // Optimistically update local state for control feedback
        if (params.hasOwnProperty('state') || params.hasOwnProperty('power')) {
          setDeviceState(prev => ({
            ...prev,
            state: { ...prev?.state, ...params }
          }));
        }
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

  // --- Custom Command Handlers ---
  const addParameter = () => {
    setCustomParameters([...customParameters, { key: '', value: '' }]);
  };

  const removeParameter = (index) => {
    setCustomParameters(customParameters.filter((_, i) => i !== index));
  };

  const updateParameter = (index, field, value) => {
    const updated = [...customParameters];
    updated[index][field] = value;
    setCustomParameters(updated);
  };

  const sendCustomCommand = async () => {
    if (!customCommand.trim()) {
      toast.error('Please enter a command');
      return;
    }

    setCustomCommandLoading(true);

    try {
      // Build parameters object from key-value pairs
      const parameters = {};
      customParameters.forEach(param => {
        if (param.key.trim() && param.value.trim()) {
          // Try to parse value as number if possible
          const numValue = Number(param.value);
          parameters[param.key.trim()] = isNaN(numValue) ? param.value.trim() : numValue;
        }
      });

      const result = await apiService.sendCustomDeviceControl(device.id, customCommand.trim(), parameters);

      if (result.success) {
        const commandData = {
          ...result.data,
          sentAt: new Date().toISOString()
        };
        setSentCommands(prev => [commandData, ...prev]);
        toast.success(`Custom command '${customCommand}' sent successfully`);

        // Start polling for status updates
        startStatusPolling(commandData.control_id);

        // Reset form
        setCustomCommand('');
        setCustomParameters([{ key: '', value: '' }]);
      } else {
        throw new Error(result.message || 'Failed to send command');
      }
    } catch (error) {
      console.error('Custom command error:', error);
      toast.error('Failed to send custom command');
    } finally {
      setCustomCommandLoading(false);
    }
  };

  const startStatusPolling = (controlId) => {
    // Clear existing interval if any
    if (pollingIntervals[controlId]) {
      clearInterval(pollingIntervals[controlId]);
    }

    const interval = setInterval(async () => {
      try {
        const statusResult = await apiService.getControlCommandStatus(device.id, controlId);
        if (statusResult.success) {
          // Update the command status in sentCommands
          setSentCommands(prev => prev.map(cmd =>
            cmd.control_id === controlId
              ? { ...cmd, ...statusResult.data, lastUpdated: new Date().toISOString() }
              : cmd
          ));

          // Stop polling if command is completed or failed
          if (['completed', 'failed'].includes(statusResult.data.status)) {
            clearInterval(interval);
            setPollingIntervals(prev => {
              const updated = { ...prev };
              delete updated[controlId];
              return updated;
            });
          }
        }
      } catch (error) {
        console.error('Status polling error:', error);
      }
    }, 2000); // Poll every 2 seconds

    setPollingIntervals(prev => ({
      ...prev,
      [controlId]: interval
    }));

    // Auto-stop polling after 2 minutes
    setTimeout(() => {
      if (pollingIntervals[controlId]) {
        clearInterval(pollingIntervals[controlId]);
        setPollingIntervals(prev => {
          const updated = { ...prev };
          delete updated[controlId];
          return updated;
        });
      }
    }, 120000);
  };

  const loadPendingCommands = async () => {
    try {
      const result = await apiService.getPendingControlCommands(device.id);
      if (result.success && result.data.pending_commands) {
        // Debug: log backend response structure
        console.log('Pending commands from backend:', result.data.pending_commands);
        // Normalize control_id for deduplication and display
        const pendingCommands = result.data.pending_commands.map(cmd => ({
          ...cmd,
          control_id: cmd.control_id || cmd.id, // support both keys
          sentAt: cmd.created_at,
          lastUpdated: new Date().toISOString()
        }));
        const existingIds = new Set(sentCommands.map(cmd => cmd.control_id));
        const newCommands = pendingCommands.filter(cmd => !existingIds.has(cmd.control_id));
        if (newCommands.length > 0) {
          setSentCommands(prev => [...newCommands, ...prev]);
        }
      }
    } catch (error) {
      console.error('Failed to load pending commands:', error);
    }
  };

  // --- UI Utilities ---
  const getCommandIcon = (command) => {
    const iconMap = {
      'power': <Power />, 'start': <PlayArrow />, 'stop': <Stop />, 'lock': <Settings />, 'unlock': <Settings />, 'open': <PlayArrow />, 'close': <Stop />
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

  // --- Renderers ---
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
            <Card variant="outlined" sx={{ height: '100%', '&:hover': { boxShadow: 2, borderColor: 'primary.main' } }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  {getCommandIcon(command.name)}
                  <Typography variant="h6" sx={{ ml: 1 }}>{command.label}</Typography>
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
          <Button fullWidth variant="contained" onClick={() => executeCommand(command.name, {})} disabled={isLoading} startIcon={isLoading ? <CircularProgress size={16} /> : getCommandIcon(command.name)}>
            {command.label}
          </Button>
        );
      case 'toggle': {
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
      }
      case 'slider': {
        const sliderParam = command.params[0];
        const sliderValue = controlValues[sliderParam] || command.min || 0;
        return (
          <Box>
            <Typography variant="body2" gutterBottom>{command.label}: {sliderValue}</Typography>
            <Slider
              value={sliderValue}
              min={command.min || 0}
              max={command.max || 100}
              onChange={(e, value) => setControlValues(prev => ({ ...prev, [sliderParam]: value }))}
              onChangeCommitted={(e, value) => executeCommand(command.name, { [sliderParam]: value })}
              disabled={isLoading}
              valueLabelDisplay="auto"
            />
          </Box>
        );
      }
      case 'select': {
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
                <MenuItem key={idx} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      }
      case 'color':
        return (
          <Box>
            <Typography variant="body2" gutterBottom>Color Control</Typography>
            <Button fullWidth variant="outlined" onClick={() => executeCommand(command.name, { r: 255, g: 0, b: 0 })} disabled={isLoading}>
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

  // --- Custom Command Form Renderer ---
  const renderCustomCommandForm = () => {
    return (
      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Custom Command
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Send custom commands with parameters to your device
          </Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Command"
                placeholder="e.g., turn_on, set_brightness, lock"
                value={customCommand}
                onChange={(e) => setCustomCommand(e.target.value)}
                helperText="Enter the command you want to send to the device"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Parameters (optional)
              </Typography>
              {customParameters.map((param, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                  <TextField
                    label="Key"
                    size="small"
                    placeholder="e.g., level, duration"
                    value={param.key}
                    onChange={(e) => updateParameter(index, 'key', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Value"
                    size="small"
                    placeholder="e.g., 50, on"
                    value={param.value}
                    onChange={(e) => updateParameter(index, 'value', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeParameter(index)}
                    disabled={customParameters.length === 1}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ))}
              <Button
                size="small"
                startIcon={<Add />}
                onClick={addParameter}
                variant="outlined"
                sx={{ mt: 1 }}
              >
                Add Parameter
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                startIcon={customCommandLoading ? <CircularProgress size={16} /> : <Send />}
                onClick={sendCustomCommand}
                disabled={customCommandLoading || !customCommand.trim()}
                size="large"
              >
                Send Custom Command
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // --- Command Status Renderer ---
  const renderSentCommands = () => {
    if (sentCommands.length === 0) return null;

    return (
      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Sent Commands
            </Typography>
            <Button
              size="small"
              startIcon={<Refresh />}
              onClick={loadPendingCommands}
            >
              Refresh
            </Button>
          </Box>

          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {sentCommands.map((command, index) => {
              const getStatusColor = (status) => {
                switch (status) {
                  case 'pending': return 'warning';
                  case 'acknowledged': return 'info';
                  case 'executing': return 'primary';
                  case 'completed': return 'success';
                  case 'failed': return 'error';
                  default: return 'default';
                }
              };

              const isPolling = pollingIntervals[command.control_id];

              return (
                <Paper
                  key={command.control_id}
                  elevation={1}
                  sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {command.command}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {command.control_id}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      {isPolling && <CircularProgress size={16} />}
                      <Chip
                        label={command.status || 'pending'}
                        color={getStatusColor(command.status)}
                        size="small"
                      />
                    </Box>
                  </Box>

                  {command.parameters && Object.keys(command.parameters).length > 0 && (
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        Parameters:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                        {Object.entries(command.parameters).map(([key, value]) => (
                          <Chip
                            key={key}
                            label={`${key}: ${value}`}
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      Sent: {new Date(command.sentAt).toLocaleString()}
                    </Typography>
                    {command.execution_time && (
                      <Typography variant="caption" color="text.secondary">
                        Execution: {command.execution_time}ms
                      </Typography>
                    )}
                  </Box>

                  {command.error_message && (
                    <Alert severity="error" sx={{ mt: 1, py: 0 }}>
                      <Typography variant="caption">
                        {command.error_message}
                      </Typography>
                    </Alert>
                  )}
                </Paper>
              );
            })}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderDeviceStatus = () => {
    if (!deviceState) return null;
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Device Status</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Chip label={deviceState.status} color={deviceState.status === 'active' ? 'success' : 'default'} size="small" />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Last Update</Typography>
              <Typography variant="body2">{deviceState.lastUpdate ? new Date(deviceState.lastUpdate).toLocaleString() : 'Never'}</Typography>
            </Grid>
            {deviceState.state && Object.keys(deviceState.state).length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Current State</Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {Object.entries(deviceState.state).map(([key, value]) => (
                    <Chip key={key} label={`${key}: ${typeof value === 'boolean' ? (value ? 'ON' : 'OFF') : value}`} variant="outlined" size="small" />
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
            <Typography variant="h6">Recent Commands</Typography>
            <Button size="small" onClick={loadCommandHistory} startIcon={<Refresh />}>Refresh</Button>
          </Box>
          {commandHistory.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No recent commands</Typography>
          ) : (
            <Box>
              {commandHistory.map((cmd, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: index < commandHistory.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">{cmd.command}</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(cmd.timestamp).toLocaleString()}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getStatusIcon(cmd.status)}
                    <Typography variant="caption">{cmd.executionTime}ms</Typography>
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

  // --- Main Dialog UI ---
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { minHeight: '70vh' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          <Typography variant="h5" component="div">Device Control</Typography>
          <Typography variant="subtitle1" color="text.secondary">{device.name} ({device.type})</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Command History">
            <IconButton onClick={() => setShowHistory(!showHistory)} color={showHistory ? 'primary' : 'default'}>
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

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                aria-label="device control tabs"
              >
                <Tab label="Standard Controls" />
                <Tab label="Custom Commands" />
              </Tabs>
            </Box>

            <Box sx={{ mt: 2 }}>
              {tabValue === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Device Controls</Typography>
                  {renderControlInterface()}
                  {renderCommandHistory()}
                </Box>
              )}

              {tabValue === 1 && (
                <Box>
                  {renderCustomCommandForm()}
                  {renderSentCommands()}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeviceControlDialog;
