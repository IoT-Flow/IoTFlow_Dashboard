import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  DeviceHub,
  Analytics,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  Add,
  TrendingUp,
  Schedule,
  DataUsage,
} from '@mui/icons-material';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import apiService from '../services/apiService';
import DeviceControlCard from '../components/DeviceControlCard';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Overview = () => {
  const { user } = useAuth();
  const { connected } = useWebSocket();
  const [userDevices, setUserDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deviceStats, setDeviceStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    inactiveDevices: 0,
    errorDevices: 0,
    maintenanceDevices: 0,
    totalMessages: 0,
  });

  const [recentActivity] = useState([
    {
      id: 1,
      type: 'success',
      message: 'Device connected successfully',
      deviceName: 'Living Room Temp',
      timestamp: new Date(Date.now() - 300000),
    },
    {
      id: 2,
      type: 'info',
      message: 'Data collection started',
      deviceName: 'Bedroom Humidity',
      timestamp: new Date(Date.now() - 600000),
    },
    {
      id: 3,
      type: 'warning',
      message: 'Device offline for maintenance',
      deviceName: 'Garden Sensor',
      timestamp: new Date(Date.now() - 900000),
    },
  ]);

  useEffect(() => {
    // Load user's devices and calculate stats
    const loadUserDevices = async () => {
      try {
        setLoading(true);
        const response = await apiService.getDevices();
        
        if (response.success) {
          const devices = response.data.devices;
          setUserDevices(devices);
          
          // Calculate device statistics
          const stats = {
            totalDevices: devices.length,
            activeDevices: devices.filter(d => d.status === 'active').length,
            inactiveDevices: devices.filter(d => d.status === 'inactive').length,
            errorDevices: devices.filter(d => d.status === 'error').length,
            maintenanceDevices: devices.filter(d => d.status === 'maintenance').length,
            totalMessages: devices.reduce((sum, d) => sum + (Math.floor(Math.random() * 1000)), 0), // Mock for demo
          };
          
          setDeviceStats(stats);
        }
      } catch (error) {
        console.error('Failed to load devices:', error);
        toast.error('Failed to load device information');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadUserDevices();
    }
  }, [user]);

  const deviceStatusData = {
    labels: ['Active', 'Inactive', 'Error', 'Maintenance'],
    datasets: [
      {
        data: [
          deviceStats.activeDevices,
          deviceStats.inactiveDevices,
          deviceStats.errorDevices,
          deviceStats.maintenanceDevices,
        ],
        backgroundColor: ['#4caf50', '#9e9e9e', '#f44336', '#ff9800'],
        borderWidth: 0,
      },
    ],
  };

  const telemetryTrendData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'Data Points/Hour',
        data: [120, 190, 300, 500, 420, 380, 210],
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const MetricCard = ({ title, value, icon, color, subtitle, trend }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: `${color}.main`, mr: 2 }}>
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: `${color}.main` }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          {trend && (
            <Chip
              icon={<TrendingUp />}
              label={`+${trend}%`}
              color="success"
              size="small"
              variant="outlined"
            />
          )}
        </Box>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const SystemHealthIndicator = ({ health }) => {
    const getHealthColor = () => {
      switch (health) {
        case 'good': return 'success';
        case 'warning': return 'warning';
        case 'error': return 'error';
        default: return 'info';
      }
    };

    const getHealthIcon = () => {
      switch (health) {
        case 'good': return <CheckCircle />;
        case 'warning': return <Warning />;
        case 'error': return <Error />;
        default: return <CheckCircle />;
      }
    };

    return (
      <Chip
        icon={getHealthIcon()}
        label={`System ${health.toUpperCase()}`}
        color={getHealthColor()}
        variant="filled"
      />
    );
  };

  return (
    <Box className="fade-in">
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            My Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back, {user?.firstName}! Monitor and manage your IoT devices
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            icon={connected ? <CheckCircle /> : <Error />} 
            label={connected ? 'Connected' : 'Disconnected'} 
            color={connected ? 'success' : 'error'} 
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => toast.success('Navigate to device registration')}
          >
            Add Device
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="My Devices"
            value={loading ? '...' : deviceStats.totalDevices}
            icon={<DeviceHub />}
            color="primary"
            subtitle="Registered devices"
            trend={deviceStats.totalDevices > 0 ? '+' + deviceStats.totalDevices : 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Devices"
            value={loading ? '...' : deviceStats.activeDevices}
            icon={<CheckCircle />}
            color="success"
            subtitle="Currently online"
            trend={deviceStats.activeDevices}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Data Points"
            value={loading ? '...' : deviceStats.totalMessages.toLocaleString()}
            icon={<DataUsage />}
            color="info"
            subtitle="Total collected"
            trend={5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Inactive Devices"
            value={loading ? '...' : deviceStats.inactiveDevices + deviceStats.errorDevices + deviceStats.maintenanceDevices}
            icon={<Schedule />}
            color="warning"
            subtitle="Need attention"
            trend={-deviceStats.inactiveDevices}
          />
        </Grid>
      </Grid>

      {/* Charts and Analytics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                  Data Collection Trends
                </Typography>
                <IconButton size="small">
                  <Refresh />
                </IconButton>
              </Box>
              <Box sx={{ height: 300 }}>
                <Line
                  data={telemetryTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0,0,0,0.1)',
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                      },
                    },
                    elements: {
                      point: {
                        radius: 4,
                        hoverRadius: 6,
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                Device Status Distribution
              </Typography>
              <Box sx={{ height: 250, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Doughnut
                  data={deviceStatusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Device Control Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <DeviceControlCard userId={user?.id} />
        </Grid>
      </Grid>

      {/* Recent Activity and Device Status */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                  Recent Device Activity
                </Typography>
                <Button size="small" endIcon={<TrendingUp />}>
                  View Details
                </Button>
              </Box>
              <List>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemIcon>
                        {activity.type === 'error' && <Error color="error" />}
                        {activity.type === 'warning' && <Warning color="warning" />}
                        {activity.type === 'success' && <CheckCircle color="success" />}
                        {activity.type === 'info' && <CheckCircle color="info" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.message}
                        secondary={`${activity.deviceName} • ${activity.timestamp.toLocaleTimeString()}`}
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Add color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Add New Device" secondary="Register IoT device" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Analytics color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="View Analytics" secondary="Analyze data" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <DeviceHub color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Manage Devices" secondary="Configure settings" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TrendingUp color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="View Telemetry" secondary="Monitor data" />
                </ListItem>
              </List>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Device Limit Usage
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min((deviceStats.totalDevices / 10) * 100, 100)} 
                  sx={{ mb: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {deviceStats.totalDevices} of 10 devices registered
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Overview;
