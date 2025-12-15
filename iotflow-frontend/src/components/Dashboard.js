import {
  Dashboard as DashboardIcon,
  Devices,
  NetworkCheck,
  NotificationAdd,
  Notifications,
  Person,
  PowerSettingsNew,
  Refresh,
  Security,
  TrendingUp,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import apiService from '../services/apiService';
import TelemetryWidget from './TelemetryWidget';

const Dashboard = () => {
  const { user } = useAuth();
  const { isConnected, deviceNotifications = [] } = useWebSocket();

  const [dashboardData, setDashboardData] = useState(null);
  const [devices, setDevices] = useState([]);
  const [telemetryOverview, setTelemetryOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user-specific devices
      const devicesResult = await apiService.getDevices();
      if (devicesResult.success) {
        // Handle both array and object responses
        const devicesData = devicesResult.data;
        if (Array.isArray(devicesData)) {
          setDevices(devicesData);
        } else if (devicesData && Array.isArray(devicesData.devices)) {
          setDevices(devicesData.devices);
        } else {
          setDevices([]);
        }
      } else {
        setDevices([]);
      }



      // Set dashboard data with device counts
      setDashboardData({
        total_devices: devices.length,
        active_devices: devices.filter(d => d.status === 'active').length,
        total_messages: 0, // Placeholder - can be implemented later if needed
        last_updated: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      const notificationTypes = ['info', 'warning', 'error', 'success'];
      const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const randomDevice =
        devices.length > 0 ? devices[Math.floor(Math.random() * devices.length)].id : 'test_device';

      const messages = {
        info: `Device ${randomDevice} is operating normally`,
        warning: `Device ${randomDevice} requires attention`,
        error: `Device ${randomDevice} has encountered an error`,
        success: `Device ${randomDevice} task completed successfully`,
      };

      const result = await apiService.generateTestNotification(
        randomType,
        messages[randomType],
        randomDevice
      );

      if (result.success) {
        console.log('Test notification sent successfully');
      } else {
        console.error('Failed to send test notification:', result.error);
      }
    } catch (err) {
      console.error('Error sending test notification:', err);
    }
  };

  // Prepare chart data
  const deviceStatusData = [
    { name: 'Active', value: telemetryOverview?.active_devices || 0, color: '#4caf50' },
    { name: 'Inactive', value: telemetryOverview?.inactive_devices || 0, color: '#f44336' },
  ];

  const deviceTypeData = Array.isArray(devices)
    ? devices.reduce((acc, device) => {
        const type = device?.type || 'Unknown';
        const existing = acc.find(item => item.type === type);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ type, count: 1 });
        }
        return acc;
      }, [])
    : [];

  console.log(devices);
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant="h5" align="center">
          Loading Dashboard...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Dashboard Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <DashboardIcon sx={{ mr: 2 }} />
          IoTFlow Dashboard
        </Typography>

        {/* User Context Information */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <Person />
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h6">Welcome, {user.username}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                  icon={<Person />}
                  label={`User ID: ${user.id}`}
                  size="small"
                  color="primary"
                />
                <Chip
                  icon={<Security />}
                  label={user.role ? user.role.toUpperCase() : user.is_admin ? 'ADMIN' : 'USER'}
                  size="small"
                  color="info"
                />
                <Chip
                  icon={<NetworkCheck />}
                  label={isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  size="small"
                  color={isConnected ? 'success' : 'error'}
                />
              </Box>
            </Grid>
            <Grid item>
              <Tooltip title="Send Test Notification">
                <IconButton onClick={handleTestNotification} color="secondary">
                  <NotificationAdd />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh Dashboard">
                <IconButton onClick={loadDashboardData} color="primary">
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Dashboard Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Devices />
                </Avatar>
                <Box>
                  <Typography variant="h4">{devices?.length || 0}</Typography>
                  <Typography color="text.secondary">Total Devices</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <PowerSettingsNew />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {devices?.filter(device => device.status === 'active').length || 0}
                  </Typography>
                  <Typography color="text.secondary">Active Devices</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4">{dashboardData?.total_messages || 0}</Typography>
                  <Typography color="text.secondary">Messages Today (IoTDB)</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Notifications />
                </Avatar>
                <Box>
                  <Typography variant="h4">{deviceNotifications.length}</Typography>
                  <Typography color="text.secondary">Notifications</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Device Status Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Device Status Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {deviceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomDashboardTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Device Types */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Device Types
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deviceTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <RechartsTooltip content={<CustomDashboardTooltip />} />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Recent Notifications</Typography>
                <Badge badgeContent={deviceNotifications.length} color="error">
                  <Notifications />
                </Badge>
              </Box>
              <Box sx={{ maxHeight: 250, overflow: 'auto' }}>
                {(deviceNotifications || []).length > 0 ? (
                  <List dense>
                    {(deviceNotifications || []).slice(0, 5).map(notif => (
                      <ListItem key={notif.id}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor:
                                notif.type === 'error'
                                  ? 'error.main'
                                  : notif.type === 'warning'
                                    ? 'warning.main'
                                    : 'success.main',
                            }}
                          >
                            <Notifications />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={notif.message}
                          secondary={`Device ${notif.device_id} - ${new Date(notif.timestamp).toLocaleString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary" align="center">
                    No recent notifications
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Device List with Compact Telemetry */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Devices - Real-time Status
              </Typography>
              <Grid container spacing={2}>
                {(devices || []).slice(0, 6).map(device => (
                  <Grid item xs={12} sm={6} md={4} key={device.id}>
                    <TelemetryWidget deviceId={device.id} compact={true} />
                  </Grid>
                ))}
              </Grid>
              {devices.length === 0 && (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  No devices found. Register your first device to get started.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

// Custom tooltip component for dashboard charts with full date and time
const CustomDashboardTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // Format label to show full date and time if it's a timestamp
    let formattedLabel = label;
    try {
      // Check if label looks like a timestamp or date with better validation
      if (label != null && label !== '') {
        const parsedDate = new Date(label);
        if (!isNaN(parsedDate.getTime()) && (typeof label === 'number' || /^\d{4}-/.test(label))) {
          formattedLabel = format(parsedDate, 'PPpp'); // e.g., "Dec 31, 2023 at 11:59:00 PM"
        }
      }
    } catch (e) {
      // Keep original label if parsing fails
      console.warn('Dashboard tooltip date formatting failed:', e);
      formattedLabel = label;
    }

    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        <p className="text-sm font-medium text-gray-900 mb-2">{formattedLabel}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toFixed(0) : entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default Dashboard;
