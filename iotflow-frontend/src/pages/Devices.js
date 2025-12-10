/**
 * Devices Page - Rebuilt with TDD
 * 
 * Simplified device management page that:
 * - Shows all devices for admins
 * - Shows only user's devices for regular users
 * - Provides filtering, searching, and CRUD operations
 * - Uses consistent Admin V1 API for admins
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardActions,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import AddDeviceForm from '../components/AddDeviceForm';

const Devices = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State management
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.is_admin;

  // Load devices based on user role
  const loadDevices = async () => {
    setLoading(true);
    try {
      let response;
      
      if (isAdmin) {
        // Admin: Load all devices from all users
        response = await apiService.adminGetAllDevices();
        setDevices(response.devices || []);
      } else {
        // Regular user: Load only their devices
        response = await apiService.getDevices();
        setDevices(response.data || []);
      }
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

  // Filter devices based on search and filters
  const filteredDevices = devices.filter(device => {
    // Search filter
    const matchesSearch = !searchQuery || 
      device.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.location?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;

    // Type filter
    const matchesType = typeFilter === 'all' || device.device_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Get unique device types for filter
  const deviceTypes = [...new Set(devices.map(d => d.device_type).filter(Boolean))];

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

  // Handle successful device creation
  const handleDeviceCreated = (newDevice) => {
    setCreateDialogOpen(false);
    loadDevices();
  };

  // Render status chip with appropriate color
  const renderStatusChip = (status) => {
    const color = status === 'online' ? 'success' : 'default';
    return <Chip label={status} color={color} size="small" />;
  };

  // Render device card for mobile view
  const renderDeviceCard = (device) => (
    <Card key={device.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
          <Typography variant="h6">{device.name}</Typography>
          {renderStatusChip(device.status)}
        </Box>
        <Typography color="text.secondary" gutterBottom>
          {device.device_type}
        </Typography>
        {device.location && (
          <Typography variant="body2">
            📍 {device.location}
          </Typography>
        )}
        {device.description && (
          <Typography variant="body2" color="text.secondary">
            {device.description}
          </Typography>
        )}
        {isAdmin && device.user && (
          <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
            Owner: {device.user.username || device.user.email}
          </Typography>
        )}
      </CardContent>
      <CardActions>
        <IconButton size="small" color="primary">
          <EditIcon />
        </IconButton>
        <IconButton 
          size="small" 
          color="error"
          onClick={() => handleDeleteClick(device)}
          aria-label="delete"
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );

  // Render device table for desktop view
  const renderDeviceTable = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Location</TableCell>
            {isAdmin && <TableCell>Owner</TableCell>}
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredDevices.map((device) => (
            <TableRow key={device.id}>
              <TableCell>{device.name}</TableCell>
              <TableCell>{device.device_type}</TableCell>
              <TableCell>{renderStatusChip(device.status)}</TableCell>
              <TableCell>{device.location || '-'}</TableCell>
              {isAdmin && (
                <TableCell>
                  {device.user ? device.user.username || device.user.email : '-'}
                </TableCell>
              )}
              <TableCell align="right">
                <IconButton size="small" color="primary">
                  <EditIcon />
                </IconButton>
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => handleDeleteClick(device)}
                  aria-label="delete"
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Render empty state
  const renderEmptyState = () => (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        No devices found
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
          ? 'Try adjusting your filters'
          : 'Get started by adding your first device'}
      </Typography>
      {!searchQuery && statusFilter === 'all' && typeFilter === 'all' && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Add Device
        </Button>
      )}
    </Box>
  );

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress role="progressbar" />
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
            {filteredDevices.length} {filteredDevices.length === 1 ? 'device' : 'devices'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDevices}
            aria-label="refresh"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            aria-label="add device"
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="offline">Offline</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Type"
              >
                <MenuItem value="all">All</MenuItem>
                {deviceTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Device List */}
      <Paper>
        {filteredDevices.length === 0 ? (
          renderEmptyState()
        ) : (
          isMobile ? (
            <Box sx={{ p: 2 }}>
              {filteredDevices.map(renderDeviceCard)}
            </Box>
          ) : (
            renderDeviceTable()
          )
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deviceToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" aria-label="confirm">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Device Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Device</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <AddDeviceForm onSuccess={handleDeviceCreated} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Devices;
