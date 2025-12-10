import {
  Build,
  CheckCircle,
  Computer,
  Delete,
  Devices as DevicesIcon,
  Download,
  Error,
  Info,
  Memory,
  Monitor,
  Refresh,
  Router,
  Security,
  Settings,
  Speed,
  Storage,
  Timeline,
  Warning,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
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
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [allDevices, setAllDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Log user info for debugging
  useEffect(() => {
    console.log('👤 Current user:', user);
    console.log('🔑 Is admin (is_admin):', user?.is_admin);
    console.log('🔑 Is admin (role):', user?.role);
    console.log('🔑 Is admin (combined):', user?.is_admin === true || user?.role === 'admin');
    const token = localStorage.getItem('iotflow_token');
    console.log('🎫 Token exists:', !!token);
    if (token) {
      console.log('🎫 Token preview:', token.substring(0, 20) + '...');
    }
  }, [user]);
  
  const [systemHealth] = useState({
    overall: 'good',
    services: {
      iotdb: { status: 'running', uptime: '2d 14h', cpu: 15, memory: 68 },
      redis: { status: 'running', uptime: '2d 14h', cpu: 5, memory: 23 },
      mqtt: { status: 'running', uptime: '2d 14h', cpu: 8, memory: 12 },
      api: { status: 'warning', uptime: '2d 14h', cpu: 45, memory: 78 },
    },
  });

  const [systemStats] = useState({
    totalDevices: 127,
    activeDevices: 98,
    totalUsers: 45,
    activeUsers: 38,
    adminUsers: 3,
    storageUsed: 73,
    memoryUsed: 68,
    cpuUsage: 34,
    networkIn: '245.6 MB',
    networkOut: '189.2 MB',
    diskIoRead: '45.2 MB/s',
    diskIoWrite: '23.8 MB/s',
  });

  const [logs] = useState([
    {
      id: 1,
      timestamp: new Date(Date.now() - 15000),
      level: 'INFO',
      service: 'IoTDB',
      message: 'Successfully processed telemetry batch (256 records)',
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 30000),
      level: 'WARNING',
      service: 'API Gateway',
      message: 'High memory usage detected - 78% of available memory',
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 45000),
      level: 'INFO',
      service: 'MQTT Broker',
      message: 'New device connection: TEMP_SENSOR_045',
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 60000),
      level: 'ERROR',
      service: 'Redis Cache',
      message: 'Cache miss rate exceeded threshold (15%)',
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 75000),
      level: 'INFO',
      service: 'System',
      message: 'Automated backup completed successfully',
    },
  ]);

  const [cacheStats, setCacheStats] = useState({
    redis: {
      status: 'connected',
      memory: '156.7 MB',
      keys: 15420,
      hitRate: 94.2,
      missRate: 5.8,
      evictions: 23,
      connections: 12,
    },
  });

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);

  const getServiceStatusColor = status => {
    switch (status) {
      case 'running':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'stopped':
        return 'default';
      default:
        return 'info';
    }
  };

  const getServiceStatusIcon = status => {
    switch (status) {
      case 'running':
        return <CheckCircle />;
      case 'warning':
        return <Warning />;
      case 'error':
        return <Error />;
      case 'stopped':
        return <Info />;
      default:
        return <Info />;
    }
  };

  const getLogLevelColor = level => {
    switch (level) {
      case 'ERROR':
        return 'error';
      case 'WARNING':
        return 'warning';
      case 'INFO':
        return 'info';
      case 'DEBUG':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleClearCache = async () => {
    try {
      // Simulate cache clearing
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCacheStats(prev => ({
        ...prev,
        redis: {
          ...prev.redis,
          keys: 0,
          memory: '12.4 MB',
          hitRate: 0,
          missRate: 0,
        },
      }));
      toast.success('Cache cleared successfully');
      setClearCacheDialogOpen(false);
    } catch (error) {
      toast.error('Failed to clear cache');
    }
  };

  const handleBackup = async () => {
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success('System backup completed');
      setBackupDialogOpen(false);
    } catch (error) {
      toast.error('Backup failed');
    }
  };

  // Fetch all users (admin only)
  const fetchAllUsers = async () => {
    const isAdmin = user?.is_admin === true || user?.role === 'admin';
    if (!isAdmin) {
      toast.error('Admin privileges required');
      return;
    }
    
    setLoadingUsers(true);
    try {
      const data = await apiService.getAllUsers();
      // Backend returns array directly when no pagination params, or {users: [...]} when paginated
      const userList = Array.isArray(data) ? data : (data.users || []);
      setAllUsers(userList);
      toast.success(`Loaded ${userList.length} user(s)`);
    } catch (error) {
      console.error('Error fetching all users:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied: Admin privileges required');
      } else {
        toast.error('Failed to load users');
      }
      setAllUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch all devices from all users (admin only)
  const fetchAllDevices = async () => {
    console.log('🔄 Fetching all devices...');
    console.log('👤 Current user:', user);
    console.log('🔐 Is admin:', user?.is_admin || user?.role === 'admin');
    
    // Check if user is admin (check both is_admin field and role)
    const isAdmin = user?.is_admin === true || user?.role === 'admin';
    if (!isAdmin) {
      console.warn('⚠️ User is not an admin, cannot fetch all devices');
      toast.error('Admin privileges required');
      return;
    }
    
    setLoadingDevices(true);
    try {
      console.log('📡 Calling apiService.adminGetAllDevices()...');
      const response = await apiService.adminGetAllDevices();
      console.log('✅ Admin devices response:', response);
      console.log('📊 Total devices:', response.total);
      console.log('📱 Devices array length:', response.devices?.length);
      
      if (response && response.devices) {
        console.log('📋 Setting devices:', response.devices);
        setAllDevices(response.devices);
        toast.success(`Loaded ${response.devices.length} device(s)`);
      } else {
        console.warn('⚠️ No devices array in response');
        setAllDevices([]);
      }
      
      if (response.total === 0 || response.devices?.length === 0) {
        console.warn('⚠️ Backend returned 0 devices - check database and permissions');
      }
    } catch (error) {
      console.error('❌ Error fetching all devices:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
      console.error('Full error object:', error);
      
      if (error.response?.status === 403) {
        toast.error('Access denied: Admin privileges required');
      } else {
        toast.error('Failed to load devices: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoadingDevices(false);
    }
  };

  // Delete device (admin)
  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;
    
    try {
      await apiService.adminDeleteDevice(deviceToDelete.id);
      toast.success(`Device "${deviceToDelete.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
      // Refresh the devices list
      fetchAllDevices();
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error('Failed to delete device');
    }
  };

  // Fetch users when Users tab becomes active
  useEffect(() => {
    if (activeTab === 0) { // Users tab
      fetchAllUsers();
    }
  }, [activeTab]);

  // Fetch devices when Devices tab becomes active
  useEffect(() => {
    console.log('📑 Active tab changed to:', activeTab);
    if (activeTab === 1) { // Devices tab
      console.log('🔍 Devices tab active, fetching devices...');
      fetchAllDevices();
    }
  }, [activeTab]);

  const ServiceCard = ({ name, service, icon }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: `${getServiceStatusColor(service.status)}.main`, mr: 2 }}>
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {name}
            </Typography>
            <Chip
              icon={getServiceStatusIcon(service.status)}
              label={service.status.toUpperCase()}
              color={getServiceStatusColor(service.status)}
              size="small"
            />
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            CPU Usage: {service.cpu}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={service.cpu}
            sx={{ mb: 1, height: 6, borderRadius: 3 }}
            color={service.cpu > 80 ? 'error' : service.cpu > 60 ? 'warning' : 'success'}
          />

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Memory: {service.memory}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={service.memory}
            sx={{ mb: 1, height: 6, borderRadius: 3 }}
            color={service.memory > 80 ? 'error' : service.memory > 60 ? 'warning' : 'success'}
          />
        </Box>

        <Typography variant="caption" color="text.secondary">
          Uptime: {service.uptime}
        </Typography>
      </CardContent>
    </Card>
  );

  const systemUsageData = {
    labels: ['Used', 'Available'],
    datasets: [
      {
        data: [systemStats.storageUsed, 100 - systemStats.storageUsed],
        backgroundColor: ['#1976d2', '#e0e0e0'],
        borderWidth: 0,
      },
    ],
  };

  const memoryUsageData = {
    labels: ['Used', 'Available'],
    datasets: [
      {
        data: [systemStats.memoryUsed, 100 - systemStats.memoryUsed],
        backgroundColor: ['#dc004e', '#e0e0e0'],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    cutout: '70%',
  };

  return (
    <Box className="fade-in">
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            System Administration
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitor system health, manage services, and perform maintenance tasks
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={maintenanceMode}
                onChange={e => setMaintenanceMode(e.target.checked)}
              />
            }
            label="Maintenance Mode"
          />
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => setBackupDialogOpen(true)}
          >
            Backup
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* System Health Alert */}
      <Alert severity={systemHealth.overall === 'good' ? 'success' : 'warning'} sx={{ mb: 3 }}>
        System Health: {systemHealth.overall.toUpperCase()} - All critical services are operational
      </Alert>

      {/* Quick Stats - Devices & Users */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="text.secondary">
                Total Devices
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {systemStats.totalDevices}
              </Typography>
              <Typography variant="body2" color="success.main">
                {systemStats.activeDevices} active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="text.secondary">
                Total Users
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {allUsers.length || systemStats.totalUsers}
              </Typography>
              <Typography variant="body2" color="success.main">
                {allUsers.filter(u => u.is_active).length || systemStats.activeUsers} active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="text.secondary">
                Admin Users
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {allUsers.filter(u => u.is_admin).length || systemStats.adminUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Administrators
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="text.secondary">
                Storage Used
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {systemStats.storageUsed}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={systemStats.storageUsed}
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
                color={systemStats.storageUsed > 80 ? 'error' : 'primary'}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <ServiceCard name="IoTDB" service={systemHealth.services.iotdb} icon={<Storage />} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ServiceCard
                name="Redis Cache"
                service={systemHealth.services.redis}
                icon={<Memory />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ServiceCard
                name="MQTT Broker"
                service={systemHealth.services.mqtt}
                icon={<Router />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ServiceCard
                name="API Gateway"
                service={systemHealth.services.api}
                icon={<Security />}
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                Resource Usage
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        height: 100,
                        position: 'relative',
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'grey.100',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        CPU Chart Placeholder
                      </Typography>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {systemStats.storageUsed}%
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Storage
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        height: 100,
                        position: 'relative',
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'grey.100',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Memory Chart Placeholder
                      </Typography>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {systemStats.memoryUsed}%
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Memory
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    CPU Usage
                  </Typography>
                  <Typography variant="body2">{systemStats.cpuUsage}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={systemStats.cpuUsage}
                  sx={{ mb: 2, height: 6, borderRadius: 3 }}
                />

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Network I/O
                </Typography>
                <Typography variant="caption">
                  In: {systemStats.networkIn} • Out: {systemStats.networkOut}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabbed Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Users" />
            <Tab label="All Devices" icon={<DevicesIcon />} iconPosition="start" />
            <Tab label="System Logs" />
            <Tab label="Cache Management" />
            <Tab label="Performance" />
            <Tab label="Maintenance" />
          </Tabs>
        </Box>

        {/* Users Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                All Users ({allUsers.length})
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchAllUsers}
                disabled={loadingUsers}
              >
                Refresh
              </Button>
            </Box>

            {loadingUsers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : allUsers.length === 0 ? (
              <Alert severity="info">
                No users found in the system.
              </Alert>
            ) : (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  For full user management (edit roles, status, view devices), navigate to <strong>Admin → Users</strong> in the sidebar.
                </Alert>
                
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Username</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allUsers.map((usr) => (
                        <TableRow key={usr.id} hover>
                          <TableCell>{usr.id}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: usr.is_admin ? 'primary.main' : 'grey.400' }}>
                                {usr.username.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {usr.username}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{usr.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={usr.is_admin ? 'Admin' : 'User'}
                              color={usr.is_admin ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={usr.is_active ? 'Active' : 'Inactive'}
                              color={usr.is_active ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(usr.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        )}

        {/* All Devices Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            {/* Admin Check Warning */}
            {user && !(user.is_admin === true || user.role === 'admin') && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Access Denied:</strong> You are logged in as <strong>{user.username}</strong>, but this feature requires admin privileges.
                  <br />
                  <br />
                  <strong>Current user details:</strong>
                  <br />
                  • is_admin: {String(user.is_admin)}
                  <br />
                  • role: {user.role || 'not set'}
                  <br />
                  <br />
                  Please log out and log in with admin credentials:
                  <br />
                  <strong>Username:</strong> admin
                  <br />
                  <strong>Password:</strong> admin123
                </Typography>
              </Alert>
            )}
            
            {/* Debug Info */}
            {user && (
              <Alert severity={(user.is_admin === true || user.role === 'admin') ? 'info' : 'warning'} sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Current User:</strong> {user.username} ({user.email})
                  <br />
                  <strong>Admin Status (is_admin):</strong> {user.is_admin === true ? '✅ Yes' : '❌ No'}
                  <br />
                  <strong>Role:</strong> {user.role || 'not set'}
                  <br />
                  <strong>Token:</strong> {localStorage.getItem('iotflow_token') ? '✅ Present' : '❌ Missing'}
                  <br />
                  <strong>Devices loaded:</strong> {allDevices.length}
                </Typography>
              </Alert>
            )}
            
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                All Devices (All Users)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  color="info"
                  onClick={() => {
                    const token = localStorage.getItem('iotflow_token');
                    const userStr = localStorage.getItem('iotflow_user');
                    console.log('=== DIAGNOSTIC INFO ===');
                    console.log('Token:', token ? token.substring(0, 50) + '...' : 'MISSING');
                    console.log('User from localStorage:', userStr);
                    console.log('User from context:', user);
                    console.log('API URL:', process.env.REACT_APP_API_URL);
                    alert(`Token: ${token ? '✅ Present' : '❌ Missing'}\nUser: ${user?.username || 'not logged in'}\nAdmin: ${user?.is_admin === true || user?.role === 'admin' ? 'Yes' : 'No'}\n\nCheck console for details`);
                  }}
                >
                  🔍 Diagnose
                </Button>
                <Button
                  variant="outlined"
                  startIcon={loadingDevices ? <CircularProgress size={16} /> : <Refresh />}
                  onClick={fetchAllDevices}
                  disabled={loadingDevices}
                >
                  Refresh
                </Button>
              </Box>
            </Box>

            {loadingDevices ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Loading devices...
                </Typography>
              </Box>
            ) : !allDevices || allDevices.length === 0 ? (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>No devices found.</strong>
                    <br />
                    <br />
                    • Check the browser console (F12) for errors
                    <br />
                    • Verify you're logged in as admin (see alert above)
                    <br />
                    • Click the Refresh button above to try again
                    <br />
                    <br />
                    <strong>Current state:</strong>
                    <br />
                    • allDevices is: {allDevices ? `array with ${allDevices.length} items` : 'null/undefined'}
                    <br />
                    • loadingDevices: {loadingDevices ? 'true' : 'false'}
                  </Typography>
                </Alert>
              </Box>
            ) : (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>✅ Found {allDevices.length} device(s) in the system</strong>
                  </Typography>
                </Alert>
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600, overflow: 'auto' }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Device Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Owner</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Location</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Last Seen</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allDevices.map(device => (
                      <TableRow key={device.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {device.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {device.id}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={device.device_type || 'Unknown'} size="small" />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {device.user?.username || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {device.user?.email || ''}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={device.status || 'unknown'}
                            size="small"
                            color={
                              device.status === 'online'
                                ? 'success'
                                : device.status === 'offline'
                                ? 'error'
                                : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {device.location || 'Not set'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {device.last_seen
                              ? new Date(device.last_seen).toLocaleString()
                              : 'Never'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Delete Device">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => {
                                setDeviceToDelete(device);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              </Box>
            )}
          </Box>
        )}

        {/* System Logs Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                System Logs
              </Typography>
              <Button variant="outlined" startIcon={<Download />}>
                Export Logs
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {log.timestamp.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip label={log.level} color={getLogLevelColor(log.level)} size="small" />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{log.service}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {log.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Cache Management Tab */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              Cache Management
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Redis Cache Status
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Status" secondary={cacheStats.redis.status} />
                        <Chip label={cacheStats.redis.status} color="success" size="small" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Memory Usage" secondary={cacheStats.redis.memory} />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Total Keys"
                          secondary={cacheStats.redis.keys.toLocaleString()}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Hit Rate"
                          secondary={`${cacheStats.redis.hitRate}%`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Miss Rate"
                          secondary={`${cacheStats.redis.missRate}%`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Cache Operations
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button
                        variant="outlined"
                        color="warning"
                        startIcon={<Delete />}
                        onClick={() => setClearCacheDialogOpen(true)}
                      >
                        Clear All Cache
                      </Button>
                      <Button variant="outlined" startIcon={<Refresh />}>
                        Refresh Cache Stats
                      </Button>
                      <Button variant="outlined" startIcon={<Settings />}>
                        Cache Configuration
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Performance Tab */}
        {activeTab === 4 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              Performance Metrics
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Computer sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {systemStats.cpuUsage}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      CPU Usage
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Memory sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {systemStats.memoryUsed}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Memory Usage
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Storage sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {systemStats.storageUsed}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Storage Usage
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Speed sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {systemStats.diskIoRead}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Disk I/O Read
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Maintenance Tab */}
        {activeTab === 5 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              Maintenance Operations
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      System Maintenance
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => setBackupDialogOpen(true)}
                      >
                        Create System Backup
                      </Button>
                      <Button variant="outlined" startIcon={<Refresh />}>
                        Restart Services
                      </Button>
                      <Button variant="outlined" startIcon={<Build />}>
                        System Diagnostics
                      </Button>
                      <Button variant="outlined" color="warning" startIcon={<Settings />}>
                        Update Configuration
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Database Maintenance
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button variant="outlined" startIcon={<Storage />}>
                        Optimize IoTDB
                      </Button>
                      <Button variant="outlined" startIcon={<Delete />} color="warning">
                        Clean Old Data
                      </Button>
                      <Button variant="outlined" startIcon={<Timeline />}>
                        Rebuild Indexes
                      </Button>
                      <Button variant="outlined" startIcon={<Monitor />}>
                        Database Statistics
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Card>

      {/* Clear Cache Dialog */}
      <Dialog open={clearCacheDialogOpen} onClose={() => setClearCacheDialogOpen(false)}>
        <DialogTitle>Clear Cache</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to clear all cache data? This will temporarily impact performance
            as the cache rebuilds.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearCacheDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleClearCache} color="warning" variant="contained">
            Clear Cache
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backup Dialog */}
      <Dialog
        open={backupDialogOpen}
        onClose={() => setBackupDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>System Backup</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>Create a complete system backup including:</Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• Device configurations and metadata" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Historical telemetry data" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• System settings and user data" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Cache and temporary files" />
            </ListItem>
          </List>
          <Alert severity="info" sx={{ mt: 2 }}>
            Backup process may take several minutes depending on data size.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBackup} variant="contained">
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Device Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
      >
        <DialogTitle>Delete Device</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the device <strong>{deviceToDelete?.name}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. All telemetry data and configurations for this device
            will be permanently deleted.
          </Alert>
          {deviceToDelete?.user && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Device owner: <strong>{deviceToDelete.user.username}</strong> ({deviceToDelete.user.email})
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteDevice} color="error" variant="contained">
            Delete Device
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Admin;
