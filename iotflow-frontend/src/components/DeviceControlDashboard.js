import {
  Add,
  CheckCircle,
  Delete,
  DeviceHub,
  Error,
  ExpandMore,
  History,
  PlayArrow,
  Refresh,
  Schedule,
  Send
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

const DeviceControlDashboard = () => {
  const { user } = useAuth();

  // State management
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commandLoading, setCommandLoading] = useState(false);
  const [statusPolling, setStatusPolling] = useState({});

  // Control form state
  const [command, setCommand] = useState('');
  const [parameters, setParameters] = useState([{ key: '', value: '' }]);
  const [pendingCommands, setPendingCommands] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);

  // Dialog states
  const [controlDialogOpen, setControlDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  // Load user devices on component mount
  useEffect(() => {
    loadDevices();
  }, []);

  // Poll for command status updates
  useEffect(() => {
    const intervals = [];
    Object.keys(statusPolling).forEach(controlId => {
      if (statusPolling[controlId]) {
        const interval = setInterval(() => {
          pollCommandStatus(selectedDevice?.id, controlId);
        }, 2000); // Poll every 2 seconds
        intervals.push(interval);
      }
    });

    return () => intervals.forEach(clearInterval);
  }, [statusPolling, selectedDevice]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const result = await apiService.getDevices();
      if (result.success) {
        const deviceList = Array.isArray(result.data) ? result.data : result.data.devices || [];
        setDevices(deviceList);

        // Auto-select first device if available
        if (deviceList.length > 0 && !selectedDevice) {
          setSelectedDevice(deviceList[0]);
          loadDeviceData(deviceList[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceData = async (deviceId) => {
    try {
      const [pendingResult] = await Promise.all([
        apiService.getPendingControlCommands(deviceId)
      ]);
      console.log('API pendingResult:', pendingResult);
      if (pendingResult.success && Array.isArray(pendingResult.data)) {
        // API returns { success: true, data: [ ... ] }
        setPendingCommands(
          pendingResult.data.map(cmd => ({
            ...cmd,
            control_id: cmd.control_id || cmd.id,
            status: cmd.status || "pending" // default to 'pending' if missing
          }))
        );
      } else {
        setPendingCommands([]);
      }
    } catch (error) {
      console.error('Failed to load device data:', error);
    }
  };

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
    setCommand('');
    setParameters([{ key: '', value: '' }]);
    loadDeviceData(device.id);
  };

  const handleParameterChange = (index, field, value) => {
    const newParameters = [...parameters];
    newParameters[index][field] = value;
    setParameters(newParameters);
  };

  const addParameter = () => {
    setParameters([...parameters, { key: '', value: '' }]);
  };

  const removeParameter = (index) => {
    if (parameters.length > 1) {
      const newParameters = parameters.filter((_, i) => i !== index);
      setParameters(newParameters);
    }
  };

  const handleSendCommand = async () => {
    if (!selectedDevice || !command.trim()) {
      toast.error('Please select a device and enter a command');
      return;
    }

    // Build parameters object from key-value pairs
    const paramObj = {};
    parameters.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) {
        // Try to parse numeric values
        const numValue = Number(value);
        paramObj[key.trim()] = isNaN(numValue) ? value.trim() : numValue;
      }
    });

    try {
      setCommandLoading(true);
      const result = await apiService.sendDeviceCommand(
        selectedDevice.id,
        command.trim(),
        paramObj
      );

      if (result.success) {
        toast.success(`Command sent successfully!`);

        // Start polling for status if we got a control_id
        if (result.data.control_id) {
          setStatusPolling(prev => ({
            ...prev,
            [result.data.control_id]: true
          }));

          // Add to pending commands
          setPendingCommands(prev => [result.data, ...prev]);
        }

        // Reset form
        setCommand('');
        setParameters([{ key: '', value: '' }]);
        setControlDialogOpen(false);

        // Refresh device data
        loadDeviceData(selectedDevice.id);
      }
    } catch (error) {
      console.error('Failed to send command:', error);
      toast.error('Failed to send command');
    } finally {
      setCommandLoading(false);
    }
  };

  const pollCommandStatus = async (deviceId, controlId) => {
    try {
      const result = await apiService.getControlCommandStatus(deviceId, controlId);
      if (result.success && result.data) {
        const status = result.data.status;

        // Update pending commands list
        setPendingCommands(prev =>
          prev.map(cmd =>
            cmd.control_id === controlId
              ? { ...cmd, status, updated_at: new Date().toISOString() }
              : cmd
          )
        );

        // Stop polling if command is completed or failed
        if (status === 'completed' || status === 'failed') {
          setStatusPolling(prev => ({
            ...prev,
            [controlId]: false
          }));

          // Show completion notification
          if (status === 'completed') {
            toast.success(`Command completed successfully`);
          } else if (status === 'failed') {
            toast.error(`Command failed: ${result.data.message || 'Unknown error'}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to poll command status:', error);
    }
  };

  const refreshPendingCommands = async () => {
    if (selectedDevice) {
      await loadDeviceData(selectedDevice.id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'acknowledged': return 'info';
      case 'executing': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Schedule />;
      case 'acknowledged': return <CheckCircle />;
      case 'executing': return <PlayArrow />;
      case 'completed': return <CheckCircle />;
      case 'failed': return <Error />;
      default: return <DeviceHub />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Device Control Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Send custom commands to your IoT devices with parameters
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Device Selection */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Devices
              </Typography>
              <List>
                {devices.map((device) => (
                  <ListItem
                    key={device.id}
                    button
                    selected={selectedDevice?.id === device.id}
                    onClick={() => handleDeviceSelect(device)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: selectedDevice?.id === device.id
                        ? alpha('#1976d2', 0.1)
                        : 'transparent'
                    }}
                  >
                    <ListItemIcon>
                      <DeviceHub color={device.status === 'active' ? 'success' : 'error'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={device.name}
                      secondary={`${device.type} • ${device.location}`}
                    />
                    <Chip
                      size="small"
                      label={device.status}
                      color={device.status === 'active' ? 'success' : 'error'}
                    />
                  </ListItem>
                ))}
              </List>

              {devices.length === 0 && (
                <Alert severity="info">
                  No devices found. Register some devices first to control them.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Control Interface */}
        <Grid item xs={12} md={8}>
          {selectedDevice ? (
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Control: {selectedDevice.name}
                  </Typography>
                  <Box>
                    <Button
                      variant="outlined"
                      startIcon={<History />}
                      onClick={() => setHistoryDialogOpen(true)}
                      sx={{ mr: 1 }}
                    >
                      History
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Send />}
                      onClick={() => setControlDialogOpen(true)}
                    >
                      Send Command
                    </Button>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Pending Commands */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">
                      Pending Commands ({pendingCommands.length})
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshPendingCommands();
                      }}
                      sx={{ ml: 1 }}
                    >
                      <Refresh />
                    </IconButton>
                  </AccordionSummary>
                  <AccordionDetails>
                    {pendingCommands.length > 0 ? (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Command</TableCell>
                              <TableCell>Parameters</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Time</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {pendingCommands.map((cmd) => (
                              <TableRow key={cmd.control_id}>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="medium">
                                    {cmd.command}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Box>
                                    {Object.entries(cmd.parameters || {}).map(([key, value]) => (
                                      <Chip
                                        key={key}
                                        size="small"
                                        label={`${key}: ${value}`}
                                        variant="outlined"
                                        sx={{ mr: 0.5, mb: 0.5 }}
                                      />
                                    ))}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    icon={getStatusIcon(cmd.status)}
                                    label={cmd.status}
                                    color={getStatusColor(cmd.status)}
                                    variant={cmd.status === 'executing' ? 'filled' : 'outlined'}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption">
                                    {new Date(cmd.created_at || cmd.timestamp).toLocaleTimeString()}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Alert severity="info">
                        No pending commands for this device
                      </Alert>
                    )}
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Alert severity="info">
                  Select a device from the list to start controlling it
                </Alert>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Send Command Dialog */}
      <Dialog
        open={controlDialogOpen}
        onClose={() => setControlDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Send Command to {selectedDevice?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Command Input */}
            <TextField
              fullWidth
              label="Command"
              placeholder="e.g., turn_on, set_brightness, lock, unlock"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              sx={{ mb: 3 }}
              helperText="Enter the command you want to send to the device"
            />

            {/* Parameters Section */}
            <Typography variant="h6" gutterBottom>
              Parameters
            </Typography>
            {parameters.map((param, index) => (
              <Box key={index} display="flex" gap={2} mb={2} alignItems="center">
                <TextField
                  label="Key"
                  placeholder="e.g., level, duration, mode"
                  value={param.key}
                  onChange={(e) => handleParameterChange(index, 'key', e.target.value)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Value"
                  placeholder="e.g., 50, 10, auto"
                  value={param.value}
                  onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                  sx={{ flex: 1 }}
                />
                <IconButton
                  color="error"
                  onClick={() => removeParameter(index)}
                  disabled={parameters.length === 1}
                >
                  <Delete />
                </IconButton>
              </Box>
            ))}

            <Button
              startIcon={<Add />}
              onClick={addParameter}
              variant="outlined"
              size="small"
            >
              Add Parameter
            </Button>

            {/* Preview */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Command Preview:
              </Typography>
              <Paper sx={{ p: 1, bgcolor: 'background.paper' }}>
                <code>
                  {JSON.stringify({
                    command: command || 'your_command',
                    parameters: parameters.reduce((obj, { key, value }) => {
                      if (key.trim()) {
                        const numValue = Number(value);
                        obj[key.trim()] = isNaN(numValue) ? value : numValue;
                      }
                      return obj;
                    }, {})
                  }, null, 2)}
                </code>
              </Paper>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setControlDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSendCommand}
            disabled={commandLoading || !command.trim()}
            startIcon={commandLoading ? <CircularProgress size={16} /> : <Send />}
          >
            {commandLoading ? 'Sending...' : 'Send Command'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Command History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Command History - {selectedDevice?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Recent commands sent to this device
          </Typography>
          {/* Command history would be loaded here */}
          <Alert severity="info">
            Command history feature will show previous commands and their execution results
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceControlDashboard;
