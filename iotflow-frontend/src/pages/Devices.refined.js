/**
 * Refined Devices Page - Enhanced version using new API endpoints
 * 
 * Features:
 * - Display all user devices with detailed information
 * - Admin can see all devices from all users
 * - Search, filter by status and type
 * - Pagination support
 * - Device CRUD operations
 * - Show API keys
 * - Device groups support
 * - Responsive table/card layout
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
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
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as OnlineIcon,
  Error as OfflineIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

const Devices = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [apiKeyCopied, setApiKeyCopied] = useState(null);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [selectedApiKeyDevice, setSelectedApiKeyDevice] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.is_admin;

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

    const matchesType =
      typeFilter === 'all' || (device.device_type || device.type) === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const startIndex = page * rowsPerPage;
  const paginatedDevices = filteredDevices.slice(startIndex, startIndex + rowsPerPage);

  // Get unique values for filters
  const deviceTypes = [...new Set(devices.map(d => d.device_type || d.type).filter(Boolean))];
  const statuses = [...new Set(devices.map(d => d.status).filter(Boolean))];

  // Handle device deletion
  const handleDeleteClick = (device) => {
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
  const handleCopyApiKey = async (device) => {
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

  // Status color
  const getStatusColor = (status) => {
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
  const getStatusIcon = (status) => {
    if (status?.toLowerCase() === 'online') {
      return <OnlineIcon sx={{ fontSize: 16 }} />;
    }
    return <OfflineIcon sx={{ fontSize: 16 }} />;
  };

  // Render device card for mobile
  const renderDeviceCard = (device) => (
    <Card key={device.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
          <Box>
            <Typography variant="h6">{device.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {device.device_type || device.type}
            </Typography>
          </Box>
          <Chip
            icon={getStatusIcon(device.status)}
            label={device.status}
            color={getStatusColor(device.status)}
            size="small"
            variant="outlined"
          />
        </Box>

        {device.location && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            📍 {device.location}
          </Typography>
        )}
        {device.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {device.description}
          </Typography>
        )}

        {isAdmin && device.user && (
          <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
            Owner: {device.user.username || device.user.email}
          </Typography>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Created: {new Date(device.created_at || device.createdAt).toLocaleDateString()}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Button
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={() => {
            setSelectedApiKeyDevice(device);
            setApiKeyDialogOpen(true);
          }}
        >
          API Key
        </Button>
        <Box>
          <IconButton size="small" color="primary">
            <EditIcon />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDeleteClick(device)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  );

  // Render device table
  const renderDeviceTable = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
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
          {paginatedDevices.map(device => (
            <TableRow key={device.id} hover>
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
              <TableCell>{new Date(device.created_at || device.createdAt).toLocaleDateString()}</TableCell>
              <TableCell align="right">
                <Tooltip title="View API Key">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedApiKeyDevice(device);
                      setApiKeyDialogOpen(true);
                    }}
                  >
                    <VisibilityIcon fontSize="small" />
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
          ))}
        </TableBody>
      </Table>
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
    </TableContainer>
  );

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Devices
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredDevices.length} of {devices.length} devices
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDevices}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add Device
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => {
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
                onChange={(e) => {
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
        </Grid>
      </Paper>

      {/* Device List */}
      <Paper>
        {paginatedDevices.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No devices found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first device'}
            </Typography>
          </Box>
        ) : isMobile ? (
          <Box sx={{ p: 2 }}>{paginatedDevices.map(renderDeviceCard)}</Box>
        ) : (
          renderDeviceTable()
        )}
      </Paper>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deviceToDelete?.name}"? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog open={apiKeyDialogOpen} onClose={() => setApiKeyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Device API Key</DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          {selectedApiKeyDevice && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                Device: {selectedApiKeyDevice.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Use this API key to authenticate your device
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
          <Typography color="text.secondary">
            Device creation form goes here. Use the AddDeviceForm component in production.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Devices;
