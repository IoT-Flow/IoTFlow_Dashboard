import {
  Add,
  CheckCircle,
  ControlPoint,
  Delete,
  DeviceHub,
  Download,
  Edit,
  Error,
  FilterList,
  Key,
  MoreVert,
  Schedule,
  Search,
  Visibility,
  Warning
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import DeviceControlDialog from '../components/DeviceControlDialog';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

const Devices = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Dialog states
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [controlDialogOpen, setControlDialogOpen] = useState(false);
  const [newDeviceConnection, setNewDeviceConnection] = useState(null);
  const [deviceToDelete, setDeviceToDelete] = useState(null);

  // Form state
  const [deviceForm, setDeviceForm] = useState({
    name: '',
    type: 'Temperature',
    location: '',
    description: '',
    firmware_version: '1.0.0',
    hardware_version: '1.0',
  });

  // Load user devices
  useEffect(() => {
    const loadDevices = async () => {
      try {
        setLoading(true);
        const response = await apiService.getDevices();
        console.log('Devices response:', response); // Debug log

        if (response && response.success) {
          // Backend response has devices in response.data (already an array)
          const deviceList = response.data || [];

          // Transform backend data to match component's expected format
          const transformedDevices = deviceList.map(device => {
            return {
              id: device.id,
              deviceId: device.device_id || device.id,
              name: device.name,
              type: device.device_type || device.type,
              location: device.location,
              status: device.status,
              last_seen: new Date(device.last_seen || device.updatedAt || device.createdAt),
              firmware_version: device.firmware_version || '1.0.0',
              hardware_version: device.hardware_version || '1.0',
              api_key: device.apiKey || 'N/A',
              description: device.description || '',
              created_at: new Date(device.createdAt),
              is_online: device.status === 'active',
              user_id: device.user_id
            };
          });
          setDevices(transformedDevices);
          toast.success(`Loaded ${transformedDevices.length} devices`);
        } else {
          // Handle fallback or error case
          console.warn('No devices found or invalid response');
          setDevices([]);
        }
      } catch (error) {
        console.error('Failed to load devices:', error);
        toast.error('Failed to load devices');
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadDevices();
    }
  }, [user]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'error': return 'error';
      case 'maintenance': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'inactive': return <Schedule />;
      case 'error': return <Error />;
      case 'maintenance': return <Warning />;
      default: return <CheckCircle />;
    }
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
    const matchesType = typeFilter === 'all' || device.type.toLowerCase().includes(typeFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredDevices.map((device) => device.id);
      setSelectedDevices(newSelected);
      return;
    }
    setSelectedDevices([]);
  };

  const handleDeviceSelect = (deviceId) => {
    const selectedIndex = selectedDevices.indexOf(deviceId);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedDevices, deviceId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedDevices.slice(1));
    } else if (selectedIndex === selectedDevices.length - 1) {
      newSelected = newSelected.concat(selectedDevices.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedDevices.slice(0, selectedIndex),
        selectedDevices.slice(selectedIndex + 1),
      );
    }

    setSelectedDevices(newSelected);
  };

  const handleCreateDevice = () => {
    setSelectedDevice(null);
    setDeviceForm({
      name: '',
      type: 'Temperature',
      location: '',
      description: '',
      firmware_version: '1.0.0',
      hardware_version: '1.0',
    });
    setDeviceDialogOpen(true);
  };

  const handleEditDevice = (device) => {
    setSelectedDevice(device);
    setDeviceForm({
      name: device.name,
      type: device.type,
      location: device.location,
      description: device.description,
      firmware_version: device.firmware_version,
      hardware_version: device.hardware_version,
    });
    setDeviceDialogOpen(true);
  };

  const handleSaveDevice = async () => {
    try {
      setLoading(true);

      if (selectedDevice) {
        // Update existing device
        const updatedDevice = { ...selectedDevice, ...deviceForm };
        setDevices(devices.map(device =>
          device.id === selectedDevice.id ? updatedDevice : device
        ));
        toast.success('Device updated successfully');
        setDeviceDialogOpen(false);
      } else {
        // Create new device through API
        const result = await apiService.createDevice(deviceForm);
        console.log('Create device result:', result); // Debug log

        if (result && result.success) {
          // Transform backend response to match component format
          const newDevice = {
            id: result.data.id,
            deviceId: result.data.deviceId || result.data.id,
            name: result.data.name,
            type: result.data.type,
            location: result.data.location,
            status: result.data.status,
            last_seen: result.data.lastSeen ? new Date(result.data.lastSeen) : new Date(),
            firmware_version: result.data.firmware_version || deviceForm.firmware_version,
            hardware_version: result.data.hardware_version || deviceForm.hardware_version,
            api_key: result.data.apiKey || 'N/A',
            description: result.data.description,
            created_at: new Date(result.data.createdAt || Date.now()),
            telemetry_count: 0,
            is_online: result.data.status === 'active',
            user_id: result.data.owner
          };

          setDevices([...devices, newDevice]);
          setDeviceDialogOpen(false);
          // Reset form for next use
          setDeviceForm({
            name: '',
            type: 'Temperature',
            location: '',
            description: '',
            firmware_version: '1.0.0',
            hardware_version: '1.0',
          });
          toast.success(`Device "${newDevice.name}" created successfully`);
        } else {
          throw new Error(result?.message || 'Failed to create device');
        }
      }
    } catch (error) {
      console.error('Error saving device:', error);
      toast.error('Failed to save device');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = (device) => {
    setDeviceToDelete(device);
  };

  const confirmDeleteDevice = async () => {
    try {
      setLoading(true);
      const result = await apiService.deleteDevice(deviceToDelete.id);
      if (result && result.success) {
        setDevices(devices.filter(device => device.id !== deviceToDelete.id));
        setDeviceToDelete(null);
        toast.success('Device deleted successfully');
      } else {
        throw new Error(result?.message || 'Failed to delete device');
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error('Failed to delete device');
    } finally {
      setLoading(false);
    }
  };

  const handleShowConnectionDetails = (device) => {
    setSelectedDevice(device);
    setNewDeviceConnection(device.connectionDetails || {
      api_key: device.apiKey || device.api_key || 'N/A',
      gatewayIP: '192.168.1.100',
      mqttEndpoint: 'mqtt://192.168.1.100:1883',
      httpsEndpoint: 'https://192.168.1.100:8443',
      mqttTopic: `devices/${user?.id}/${device.name.toLowerCase().replace(/\s+/g, '_')}`,
      reconnectInterval: 30,
      heartbeatInterval: 60
    });
    setConnectionDialogOpen(true);
  };

  const handleControlDevice = (device) => {
    setSelectedDevice(device);
    setControlDialogOpen(true);
  };

  const isControllableDevice = (device) => {
    const controllableTypes = ['LED', 'Engine', 'Door Lock', 'Pump', 'Fan', 'Valve', 'Thermostat', 'Switch', 'Dimmer', 'Motor', 'Actuator'];
    return controllableTypes.includes(device.type);
  };

  const handleBulkStatusUpdate = (newStatus) => {
    setDevices(devices.map(device =>
      selectedDevices.includes(device.id)
        ? { ...device, status: newStatus }
        : device
    ));
    setSelectedDevices([]);
    toast.success(`Updated ${selectedDevices.length} device(s) to ${newStatus}`);
  };

  const DeviceActionsMenu = ({ device, anchorEl, onClose }) => (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
    >
      {isControllableDevice(device) && (
        <MenuItem onClick={() => { handleControlDevice(device); onClose(); }}>
          <ControlPoint sx={{ mr: 1 }} /> Control Device
        </MenuItem>
      )}
      <MenuItem onClick={() => { handleEditDevice(device); onClose(); }}>
        <Edit sx={{ mr: 1 }} /> Edit Device
      </MenuItem>
      <MenuItem onClick={() => { handleShowConnectionDetails(device); onClose(); }}>
        <Key sx={{ mr: 1 }} /> Connection Details
      </MenuItem>
      <MenuItem onClick={() => { handleDeleteDevice(device); onClose(); }}>
        <Delete sx={{ mr: 1 }} /> Delete Device
      </MenuItem>
    </Menu>
  );

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuDevice, setMenuDevice] = useState(null);

  const openMenu = (event, device) => {
    setMenuAnchor(event.currentTarget);
    setMenuDevice(device);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuDevice(null);
  };

  return (
    <Box className="fade-in">
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Device Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage and monitor your IoT devices with real-time telemetry from IoTDB
            {user && ` • Logged in as ${user.username}`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ControlPoint />}
            onClick={() => navigate('/device-control')}
            size="large"
          >
            Device Control
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateDevice}
            size="large"
          >
            Add Device
          </Button>
        </Box>
      </Box>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="sensor">Sensor</MenuItem>
                  <MenuItem value="tracker">Tracker</MenuItem>
                  <MenuItem value="monitor">Monitor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button variant="outlined" startIcon={<FilterList />}>More Filters</Button>
                <Button variant="outlined" startIcon={<Download />}>Export</Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedDevices.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <Toolbar
            sx={{
              pl: { sm: 2 },
              pr: { xs: 1, sm: 1 },
              bgcolor: alpha('#1976d2', 0.1), // Fixed: use valid color value
            }}
          >
            <Typography
              sx={{ flex: '1 1 100%' }}
              color="inherit"
              variant="subtitle1"
              component="div"
            >
              {selectedDevices.length} device(s) selected
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                onClick={() => handleBulkStatusUpdate('active')}
              >
                Activate
              </Button>
              <Button
                size="small"
                onClick={() => handleBulkStatusUpdate('inactive')}
              >
                Deactivate
              </Button>
              <Button
                size="small"
                onClick={() => handleBulkStatusUpdate('maintenance')}
              >
                Maintenance
              </Button>
            </Box>
          </Toolbar>
        </Card>
      )}

      {/* Device Table */}
      <Card>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography>Loading your devices...</Typography>
          </Box>
        ) : filteredDevices.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <DeviceHub sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {devices.length === 0 ? 'No Devices Yet' : 'No Matching Devices'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {devices.length === 0
                ? 'Get started by adding your first IoT device to the platform.'
                : 'Try adjusting your search or filter criteria.'}
            </Typography>
            {devices.length === 0 && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateDevice}
              >
                Add Your First Device
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedDevices.length > 0 && selectedDevices.length < filteredDevices.length}
                        checked={filteredDevices.length > 0 && selectedDevices.length === filteredDevices.length}
                        onChange={handleSelectAllClick}
                      />
                    </TableCell>
                    <TableCell>Device</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Seen</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDevices
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((device) => {
                      const isSelected = selectedDevices.indexOf(device.id) !== -1;
                      return (
                        <TableRow
                          hover
                          onClick={() => handleDeviceSelect(device.id)}
                          role="checkbox"
                          aria-checked={isSelected}
                          tabIndex={-1}
                          key={device.id}
                          selected={isSelected}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox checked={isSelected} />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                <DeviceHub />
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {device.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  v{device.firmware_version}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{device.type}</TableCell>
                          <TableCell>{device.location}</TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(device.status)}
                              label={device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                              color={getStatusColor(device.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {device.last_seen ? device.last_seen.toLocaleString() : 'Never'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {isControllableDevice(device) && (
                                <Tooltip title="Control Device">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleControlDevice(device);
                                    }}
                                    sx={{ color: 'primary.main' }}
                                  >
                                    <ControlPoint />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="More Actions">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openMenu(e, device);
                                  }}
                                >
                                  <MoreVert />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredDevices.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Card>

      {/* Device Form Dialog */}
      <Dialog
        open={deviceDialogOpen}
        onClose={() => setDeviceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedDevice ? 'Edit Device' : 'Register New Device'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            {selectedDevice
              ? 'Update your device configuration below.'
              : 'After registration, you will receive connection credentials to connect your device to the IoT platform.'
            }
          </Alert>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Device Name"
                value={deviceForm.name}
                onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                placeholder="e.g., Living Room Temperature Sensor"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Device Type</InputLabel>
                <Select
                  value={deviceForm.type}
                  label="Device Type"
                  onChange={(e) => setDeviceForm({ ...deviceForm, type: e.target.value })}
                >
                  {/* Sensor Devices */}
                  <MenuItem value="Temperature">Temperature Sensor</MenuItem>
                  <MenuItem value="Humidity">Humidity Sensor</MenuItem>
                  <MenuItem value="Pressure">Pressure Sensor</MenuItem>
                  <MenuItem value="Motion">Motion Sensor</MenuItem>
                  <MenuItem value="Light">Light Sensor</MenuItem>
                  <MenuItem value="Sound">Sound Sensor</MenuItem>
                  <MenuItem value="GPS">GPS Tracker</MenuItem>
                  <MenuItem value="Camera">Camera</MenuItem>
                  <MenuItem value="Moisture">Soil Moisture Sensor</MenuItem>
                  <MenuItem value="Air Quality">Air Quality Sensor</MenuItem>

                  {/* Controllable Devices */}
                  <MenuItem value="LED">LED Light Controller</MenuItem>
                  <MenuItem value="Engine">Engine Controller</MenuItem>
                  <MenuItem value="Door Lock">Smart Door Lock</MenuItem>
                  <MenuItem value="Pump">Water Pump Controller</MenuItem>
                  <MenuItem value="Fan">Smart Fan Controller</MenuItem>
                  <MenuItem value="Valve">Smart Valve Controller</MenuItem>
                  <MenuItem value="Thermostat">Smart Thermostat</MenuItem>
                  <MenuItem value="Switch">Smart Switch</MenuItem>
                  <MenuItem value="Dimmer">Smart Dimmer</MenuItem>
                  <MenuItem value="Motor">Motor Controller</MenuItem>

                  {/* Other */}
                  <MenuItem value="Actuator">Generic Actuator/Controller</MenuItem>
                  <MenuItem value="Gateway">IoT Gateway</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Device Location"
                value={deviceForm.location}
                onChange={(e) => setDeviceForm({ ...deviceForm, location: e.target.value })}
                placeholder="e.g., Living Room, Office, Warehouse Zone A"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Firmware Version"
                value={deviceForm.firmware_version}
                onChange={(e) => setDeviceForm({ ...deviceForm, firmware_version: e.target.value })}
                placeholder="e.g., 1.0.0"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hardware Version"
                value={deviceForm.hardware_version}
                onChange={(e) => setDeviceForm({ ...deviceForm, hardware_version: e.target.value })}
                placeholder="e.g., 1.0"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={deviceForm.description}
                onChange={(e) => setDeviceForm({ ...deviceForm, description: e.target.value })}
                placeholder="Describe your device's purpose and any special notes..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeviceDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveDevice}
            variant="contained"
            disabled={loading || !deviceForm.name.trim() || !deviceForm.location.trim()}
          >
            {loading ? 'Processing...' : (selectedDevice ? 'Update Device' : 'Register Device')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Connection Details Dialog */}
      <Dialog
        open={connectionDialogOpen}
        onClose={() => setConnectionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Device Connection Details
          {selectedDevice && ` - ${selectedDevice.name}`}
        </DialogTitle>
        <DialogContent>
          {newDeviceConnection && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Device registered successfully!
                </Typography>
                <Typography variant="body2">
                  Use the credentials below to connect your device to the IoT platform.
                </Typography>
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom color="primary">
                    API Key
                  </Typography>
                  <TextField
                    fullWidth
                    label="API Key"
                    value={newDeviceConnection.api_key}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Copy to clipboard">
                            <IconButton
                              onClick={() => {
                                navigator.clipboard.writeText(newDeviceConnection.api_key);
                                toast.success('API key copied to clipboard');
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Connection Endpoints
                  </Typography>
                  <TextField
                    fullWidth
                    label="Gateway IP Address"
                    value={newDeviceConnection.gatewayIP}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="MQTT Endpoint"
                    value={newDeviceConnection.mqttEndpoint}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="HTTPS Endpoint"
                    value={newDeviceConnection.httpsEndpoint}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom color="primary">
                    MQTT Configuration
                  </Typography>
                  <TextField
                    fullWidth
                    label="MQTT Topic"
                    value={newDeviceConnection.mqttTopic}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="Reconnect Interval (seconds)"
                    value={newDeviceConnection.reconnectInterval}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="Heartbeat Interval (seconds)"
                    value={newDeviceConnection.heartbeatInterval}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="subtitle2" gutterBottom>
                      Integration Instructions:
                    </Typography>
                    <Typography variant="body2" component="div">
                      1. Configure your device with the provided token for authentication<br />
                      2. Connect to the gateway using the IP address: <code>{newDeviceConnection.gatewayIP}</code><br />
                      3. Use MQTT protocol for real-time data transmission<br />
                      4. Publish telemetry data to the specified MQTT topic<br />
                      5. Implement heartbeat messages to maintain connection status
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnectionDialogOpen(false)}>Close</Button>
          <Button
            variant="outlined"
            onClick={() => {
              const connectionInfo = `Device: ${selectedDevice?.name || 'New Device'}\nAPI Key: ${newDeviceConnection?.api_key}\nGateway IP: ${newDeviceConnection?.gatewayIP}\nMQTT Endpoint: ${newDeviceConnection?.mqttEndpoint}\nMQTT Topic: ${newDeviceConnection?.mqttTopic}`;
              console.log("test");
              navigator.clipboard.writeText(connectionInfo);
              toast.success('Connection details copied to clipboard');
            }}
          >
            Copy All Details
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deviceToDelete)}
        onClose={() => setDeviceToDelete(null)}
      >
        <DialogTitle>Confirm Device Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete device "{deviceToDelete?.name}"?
            This action cannot be undone and will remove all associated telemetry data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeviceToDelete(null)}>Cancel</Button>
          <Button onClick={confirmDeleteDevice} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      {menuDevice && (
        <DeviceActionsMenu
          device={menuDevice}
          anchorEl={menuAnchor}
          onClose={closeMenu}
        />
      )}

      {/* Device Control Dialog */}
      <DeviceControlDialog
        open={controlDialogOpen}
        onClose={() => {
          setControlDialogOpen(false);
          setSelectedDevice(null);
        }}
        device={selectedDevice}
      />
    </Box>
  );
};

export default Devices;
