/**
 * Hybrid Devices Page - Refined functionality with old design aesthetic
 *
 * Features:
 * - Display all user devices with detailed information
 * - Admin can see all devices from all users
 * - Search, filter by status and type
 * - Pagination support
 * - Device CRUD operations
 * - Show API keys
 * - Responsive table/card layout
 * - Old design styling (more compact, rich feature display)
 */

import React, { useState, useEffect } from 'react';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Key as KeyIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  CheckCircle as OnlineIcon,
  Error as OfflineIcon,
  ContentCopy as ContentCopyIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
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
  useTheme,
  Alert,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import AddDeviceForm from '../components/AddDeviceForm';
import DeviceGroupAssignment from '../components/DeviceGroupAssignment';

const Devices = () => {
  const { user } = useAuth();
  const theme = useTheme();

  // State management
  const [devices, setDevices] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [selectedDevices, setSelectedDevices] = useState([]);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [selectedApiKeyDevice, setSelectedApiKeyDevice] = useState(null);
  const [apiKeyCopied, setApiKeyCopied] = useState(null);
  const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#2196F3');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [assignGroupDialogOpen, setAssignGroupDialogOpen] = useState(false);
  const [selectedDeviceForGroups, setSelectedDeviceForGroups] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.is_admin;

  // Load groups
  const loadGroups = async () => {
    try {
      const response = await apiService.getGroups();
      // Handle both { data: [...] } and [...] response formats
      const groupsData = Array.isArray(response) ? response : response.data || [];
      console.log('Loaded groups:', groupsData);
      setGroups(groupsData);
    } catch (error) {
      console.error('Failed to load groups:', error);
      // Don't show error toast for groups - it's not critical
      setGroups([]);
    }
  };

  // Load devices
  const loadDevices = async () => {
    setLoading(true);
    try {
      let response;

      if (isAdmin) {
        response = await apiService.adminGetAllDevices();
        setDevices(response.devices || []);
      } else {
        response = await apiService.getDevices();
        setDevices(response.data || []);
      }

      toast.success(`Loaded ${(response.devices || response.data || []).length} devices`);
    } catch (error) {
      console.error('Failed to load devices:', error);
      toast.error('Failed to load devices');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Filter devices
  const filteredDevices = devices.filter(device => {
    const matchesSearch =
      !searchTerm ||
      device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;

    const matchesType = typeFilter === 'all' || (device.device_type || device.type) === typeFilter;

    const matchesGroup =
      groupFilter === 'all' ||
      device.group?.id === groupFilter ||
      device.group?.name === groupFilter;

    return matchesSearch && matchesStatus && matchesType && matchesGroup;
  });

  const startIndex = page * rowsPerPage;
  const paginatedDevices = filteredDevices.slice(startIndex, startIndex + rowsPerPage);

  // Get unique values for filters
  const deviceTypes = [...new Set(devices.map(d => d.device_type || d.type).filter(Boolean))];
  const statuses = [...new Set(devices.map(d => d.status).filter(Boolean))];

  // Handle device deletion
  const handleDeleteClick = device => {
    setDeviceToDelete(device);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deviceToDelete) return;

    try {
      if (isAdmin) {
        await apiService.adminDeleteDevice(deviceToDelete.id);
      } else {
        await apiService.deleteDevice(deviceToDelete.id);
      }

      toast.success('Device deleted successfully');
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
      loadDevices();
    } catch (error) {
      console.error('Failed to delete device:', error);
      toast.error('Failed to delete device');
    }
  };

  // Handle API key copy
  const handleCopyApiKey = async device => {
    const apiKey = device.api_key || device.apiKey || 'N/A';
    if (apiKey === 'N/A') {
      toast.error('API key not available');
      return;
    }

    try {
      await navigator.clipboard.writeText(apiKey);
      setApiKeyCopied(device.id);
      setTimeout(() => setApiKeyCopied(null), 2000);
      toast.success('API key copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy API key');
    }
  };

  // Handle group creation
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    setCreatingGroup(true);
    try {
      // Call API to create group
      await apiService.createGroup({
        name: newGroupName,
        description: newGroupDescription,
        color: newGroupColor,
      });

      toast.success(`Group "${newGroupName}" created successfully`);
      setCreateGroupDialogOpen(false);
      setNewGroupName('');
      setNewGroupDescription('');
      setNewGroupColor('#2196F3');
      loadGroups(); // Reload groups to include the newly created group
      loadDevices(); // Reload devices
    } catch (error) {
      console.error('Failed to create group:', error);
      toast.error(`Failed to create group: ${error.message}`);
    } finally {
      setCreatingGroup(false);
    }
  };

  // Status color
  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'online':
        return 'success';
      case 'offline':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Status icon
  const getStatusIcon = status => {
    if (status?.toLowerCase() === 'online') {
      return <OnlineIcon sx={{ fontSize: 16 }} />;
    }
    return <OfflineIcon sx={{ fontSize: 16 }} />;
  };

  // Handle select all
  const handleSelectAllClick = event => {
    if (event.target.checked) {
      setSelectedDevices(paginatedDevices.map(d => d.id));
    } else {
      setSelectedDevices([]);
    }
  };

  // Handle individual select
  const handleSelectDevice = (event, deviceId) => {
    event.stopPropagation();
    if (selectedDevices.includes(deviceId)) {
      setSelectedDevices(selectedDevices.filter(id => id !== deviceId));
    } else {
      setSelectedDevices([...selectedDevices, deviceId]);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box data-testid="devices-page">
      {/* Toolbar */}
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          ...(selectedDevices.length > 0 && {
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          }),
        }}
      >
        <Box sx={{ flex: 1 }}>
          {selectedDevices.length > 0 ? (
            <Typography
              sx={{ flex: '1 1 100%' }}
              color="inherit"
              variant="subtitle1"
              component="div"
            >
              {selectedDevices.length} selected
            </Typography>
          ) : (
            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Devices
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredDevices.length} of {devices.length} devices
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {selectedDevices.length === 0 ? (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadDevices}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Add Device
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setCreateGroupDialogOpen(true)}
              >
                Add Group
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={() => {
                setDeviceToDelete(selectedDevices);
                setDeleteDialogOpen(true);
              }}
            >
              Delete ({selectedDevices.length})
            </Button>
          )}
        </Box>
      </Toolbar>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, mx: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Search devices..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              size="small"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                {statuses.map(status => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={e => {
                  setTypeFilter(e.target.value);
                  setPage(0);
                }}
                label="Type"
              >
                <MenuItem value="all">All</MenuItem>
                {deviceTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Group</InputLabel>
              <Select
                value={groupFilter}
                onChange={e => {
                  setGroupFilter(e.target.value);
                  setPage(0);
                }}
                label="Group"
              >
                <MenuItem value="all">All</MenuItem>
                {groups.map(group => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} sx={{ mx: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedDevices.length > 0 && selectedDevices.length < paginatedDevices.length
                  }
                  checked={
                    paginatedDevices.length > 0 &&
                    selectedDevices.length === paginatedDevices.length
                  }
                  onChange={handleSelectAllClick}
                />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Location</TableCell>
              {isAdmin && <TableCell>Owner</TableCell>}
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedDevices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                      ? 'No devices found matching your filters'
                      : 'No devices found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedDevices.map(device => (
                <TableRow
                  key={device.id}
                  hover
                  selected={selectedDevices.includes(device.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedDevices.includes(device.id)}
                      onChange={e => handleSelectDevice(e, device.id)}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{device.name}</TableCell>
                  <TableCell>{device.device_type || device.type}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(device.status)}
                      label={device.status}
                      color={getStatusColor(device.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{device.location || '-'}</TableCell>
                  {isAdmin && (
                    <TableCell>{device.user?.username || device.user?.email || '-'}</TableCell>
                  )}
                  <TableCell>
                    {new Date(device.created_at || device.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View API Key">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedApiKeyDevice(device);
                          setApiKeyDialogOpen(true);
                        }}
                      >
                        <KeyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Assign to Groups">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          setSelectedDeviceForGroups(device);
                          setAssignGroupDialogOpen(true);
                        }}
                      >
                        <FolderIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(device)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredDevices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          {Array.isArray(deviceToDelete) ? (
            <Typography>
              Are you sure you want to delete {deviceToDelete.length} selected devices? This action
              cannot be undone.
            </Typography>
          ) : (
            <Typography>
              Are you sure you want to delete "{deviceToDelete?.name}"? This action cannot be
              undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog
        open={apiKeyDialogOpen}
        onClose={() => setApiKeyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Device API Key</DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          {selectedApiKeyDevice && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                Device: {selectedApiKeyDevice.name}
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Use this API key to authenticate your device with the IoT platform
              </Alert>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    flex: 1,
                  }}
                >
                  {selectedApiKeyDevice.api_key || selectedApiKeyDevice.apiKey || 'N/A'}
                </Typography>
                <Tooltip title={apiKeyCopied === selectedApiKeyDevice.id ? 'Copied!' : 'Copy'}>
                  <IconButton size="small" onClick={() => handleCopyApiKey(selectedApiKeyDevice)}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApiKeyDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Device Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Device</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <AddDeviceForm
            onSuccess={newDevice => {
              setCreateDialogOpen(false);
              loadDevices();

              // Auto-show API key dialog for newly created device
              if (newDevice) {
                setTimeout(() => {
                  setSelectedApiKeyDevice(newDevice);
                  setApiKeyDialogOpen(true);
                }, 500);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog
        open={createGroupDialogOpen}
        onClose={() => {
          setCreateGroupDialogOpen(false);
          setNewGroupName('');
          setNewGroupDescription('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Device Group</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Group Name"
            placeholder="e.g., Living Room, Bedroom Devices"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            margin="normal"
            variant="outlined"
            size="small"
          />
          <TextField
            fullWidth
            label="Description"
            placeholder="Optional description for this group"
            value={newGroupDescription}
            onChange={e => setNewGroupDescription(e.target.value)}
            margin="normal"
            variant="outlined"
            size="small"
            multiline
            rows={3}
          />
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Color
              </Typography>
              <TextField
                type="color"
                value={newGroupColor}
                onChange={e => setNewGroupColor(e.target.value)}
                size="small"
                sx={{ width: '100%' }}
              />
            </Box>
            <Box
              sx={{
                width: 50,
                height: 50,
                backgroundColor: newGroupColor,
                borderRadius: 1,
                border: '1px solid #ccc',
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCreateGroupDialogOpen(false);
              setNewGroupName('');
              setNewGroupDescription('');
              setNewGroupColor('#2196F3');
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            variant="contained"
            disabled={creatingGroup || !newGroupName.trim()}
          >
            {creatingGroup ? 'Creating...' : 'Create Group'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Device Group Assignment Dialog */}
      <DeviceGroupAssignment
        open={assignGroupDialogOpen}
        device={selectedDeviceForGroups}
        deviceGroups={
          selectedDeviceForGroups?.groups ? selectedDeviceForGroups.groups.map(g => g.id) : []
        }
        onClose={() => {
          setAssignGroupDialogOpen(false);
          setSelectedDeviceForGroups(null);
        }}
        onSave={() => {
          setAssignGroupDialogOpen(false);
          setSelectedDeviceForGroups(null);
          loadDevices(); // Reload to update device groups
          loadGroups(); // Reload groups to update device counts
        }}
      />
    </Box>
  );
};

export default Devices;
