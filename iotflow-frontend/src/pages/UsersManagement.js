/**
 * UsersManagement Page - Rebuilt with Admin V1 API
 * 
 * User management page that uses Admin V1 API endpoints:
 * - GET /api/v1/admin/users - List all users
 * - GET /api/v1/admin/users/:id/devices - Get user's devices
 * - PUT /api/v1/admin/users/:id - Update user role/status
 * 
 * Preserves the same design and functionality as the original page.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import apiService from '../services/apiService';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDevices, setUserDevices] = useState([]);
  const [devicesDialogOpen, setDevicesDialogOpen] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, searchQuery, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllUsers();
      // Backend returns array directly when no pagination params, or {users: [...]} when paginated
      const userList = Array.isArray(data) ? data : (data.users || []);
      setUsers(userList);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(user => user.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(user => !user.is_active);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        user =>
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleViewDevices = async (user) => {
    try {
      setSelectedUser(user);
      setDevicesDialogOpen(true);
      setLoadingDevices(true);
      
      const data = await apiService.getUserDevices(user.id);
      setUserDevices(data.devices || []);
    } catch (error) {
      console.error('Failed to load user devices:', error);
      toast.error('Failed to load devices');
      setUserDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleToggleRole = async (user) => {
    const newAdminStatus = !user.is_admin;
    const actionText = newAdminStatus ? 'promote to admin' : 'demote to user';
    
    try {
      await toast.promise(
        apiService.updateUserRole(user.id, newAdminStatus),
        {
          loading: `Updating user role...`,
          success: `User ${actionText} successfully`,
          error: 'Failed to update user role',
        }
      );
      
      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === user.id ? { ...u, is_admin: newAdminStatus } : u
        )
      );
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const handleToggleStatus = async (user) => {
    const newActiveStatus = !user.is_active;
    const actionText = newActiveStatus ? 'activate' : 'deactivate';
    
    try {
      await toast.promise(
        apiService.updateUserStatus(user.id, newActiveStatus),
        {
          loading: `Updating user status...`,
          success: `User ${actionText}d successfully`,
          error: 'Failed to update user status',
        }
      );
      
      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === user.id ? { ...u, is_active: newActiveStatus } : u
        )
      );
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const handleCloseDevicesDialog = () => {
    setDevicesDialogOpen(false);
    setSelectedUser(null);
    setUserDevices([]);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={loadUsers} disabled={loading} aria-label="refresh">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 300 }}
          />
          
          <ButtonGroup variant="outlined" size="small">
            <Button
              variant={statusFilter === 'all' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('active')}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('inactive')}
            >
              Inactive
            </Button>
          </ButtonGroup>
        </Box>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No users found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_admin ? 'Admin' : 'User'}
                      color={user.is_admin ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? 'Active' : 'Inactive'}
                      color={user.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Devices">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDevices(user)}
                        aria-label="view devices"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={user.is_admin ? 'Demote to User' : 'Promote to Admin'}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleRole(user)}
                        color={user.is_admin ? 'primary' : 'default'}
                        aria-label={user.is_admin ? 'demote to user' : 'promote to admin'}
                      >
                        {user.is_admin ? (
                          <PersonRemoveIcon fontSize="small" />
                        ) : (
                          <PersonAddIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={user.is_active ? 'Deactivate' : 'Activate'}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleStatus(user)}
                        color={user.is_active ? 'success' : 'default'}
                        aria-label={user.is_active ? 'deactivate' : 'activate'}
                      >
                        {user.is_active ? (
                          <ToggleOnIcon fontSize="small" />
                        ) : (
                          <ToggleOffIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Devices Dialog */}
      <Dialog
        open={devicesDialogOpen}
        onClose={handleCloseDevicesDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedUser?.username}'s Devices
        </DialogTitle>
        <DialogContent>
          {loadingDevices ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : userDevices.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No devices registered
            </Typography>
          ) : (
            <List>
              {userDevices.map((device) => (
                <ListItem key={device.id} divider>
                  <ListItemText
                    primary={device.name}
                    secondary={`Device ID: ${device.device_id}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDevicesDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
