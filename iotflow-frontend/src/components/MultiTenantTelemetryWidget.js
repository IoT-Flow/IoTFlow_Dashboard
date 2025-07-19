import {
  BatteryFull,
  Clear,
  DeviceThermostat,
  Notifications,
  Opacity,
  PowerSettingsNew,
  Refresh,
  Security,
  SignalWifi4Bar,
  Speed,
  TrendingUp
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Tooltip,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import apiService from '../services/apiService';

const MultiTenantTelemetryWidget = ({ deviceId, compact = false }) => {
  const { user } = useAuth();
  const {
    isConnected,
    getDeviceTelemetry,
    getDeviceStatus,
    subscribeToDevice,
    unsubscribeFromDevice,
    realtimeUpdates,
    deviceNotifications,
    clearNotification
  } = useWebSocket();

  const [device, setDevice] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to device updates when component mounts
  useEffect(() => {
    if (deviceId && isConnected) {
      subscribeToDevice(deviceId);
      loadDeviceData();

      return () => {
        unsubscribeFromDevice(deviceId);
      };
    }
  }, [deviceId, isConnected]);

  const loadDeviceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load device information
      const devicesResult = await apiService.getDevices();
      const deviceInfo = devicesResult.data.devices.find(d => d.id === deviceId);
      setDevice(deviceInfo);

      // Load telemetry history
      const telemetryResult = await apiService.getDeviceTelemetryData(deviceId, [], '1h');
      if (telemetryResult.success) {
        setTelemetryHistory(telemetryResult.data.telemetry || []);
      }

    } catch (err) {
      console.error('Failed to load device data:', err);
      setError('Failed to load device data');
    } finally {
      setLoading(false);
    }
  };

  // Get real-time telemetry data
  const latestTelemetry = getDeviceTelemetry(deviceId);
  const deviceStatus = getDeviceStatus(deviceId);

  // Filter notifications for this device
  const deviceNotifs = deviceNotifications.filter(n => n.device_id === deviceId).slice(0, 3);

  // Render telemetry value with appropriate icon
  const renderTelemetryValue = (key, value, unit = '') => {
    const getIcon = (key) => {
      switch (key.toLowerCase()) {
        case 'temperature': return <DeviceThermostat color="error" />;
        case 'humidity': return <Opacity color="primary" />;
        case 'pressure': return <Speed color="info" />;
        case 'battery': case 'battery_level': return <BatteryFull color="success" />;
        case 'signal_strength': return <SignalWifi4Bar color="action" />;
        case 'power': return <PowerSettingsNew color={value ? 'success' : 'disabled'} />;
        default: return <TrendingUp color="action" />;
      }
    };

    const formatValue = (key, value) => {
      if (typeof value === 'boolean') {
        return value ? 'ON' : 'OFF';
      }
      if (typeof value === 'number') {
        return value.toFixed(1);
      }
      return value;
    };

    return (
      <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {getIcon(key)}
        <Typography variant="body2" sx={{ ml: 1, flex: 1 }}>
          {key.replace('_', ' ').toUpperCase()}
        </Typography>
        <Typography variant="h6" color="primary">
          {formatValue(key, value)}{unit}
        </Typography>
      </Box>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Loading device telemetry...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" action={
            <IconButton onClick={loadDeviceData} size="small">
              <Refresh />
            </IconButton>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: device?.status === 'active' ? 'success.main' : 'grey.500' }}>
              <DeviceThermostat />
            </Avatar>
            <Box sx={{ ml: 2, flex: 1 }}>
              <Typography variant="h6">{device?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                User: {user.username} | Tenant: {user.tenant_id}
              </Typography>
            </Box>
            <Chip
              label={isConnected ? 'CONNECTED' : 'DISCONNECTED'}
              color={isConnected ? 'success' : 'error'}
              size="small"
            />
          </Box>

          {latestTelemetry && (
            <Grid container spacing={1}>
              {Object.entries(latestTelemetry)
                .filter(([key]) => !['timestamp', 'device_id', 'user_id', 'tenant_id'].includes(key))
                .slice(0, 4)
                .map(([key, value]) => (
                  <Grid item xs={6} key={key}>
                    {renderTelemetryValue(key, value)}
                  </Grid>
                ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Device Header with Multi-tenant Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ bgcolor: device?.status === 'active' ? 'success.main' : 'grey.500', mr: 2 }}>
            <DeviceThermostat />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5">{device?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {device?.deviceId} | {device?.location}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Chip
                icon={<Security />}
                label={`User: ${user.username}`}
                size="small"
                sx={{ mr: 1 }}
              />
              <Chip
                label={`Tenant: ${user.tenant_id}`}
                size="small"
                sx={{ mr: 1 }}
              />
              <Chip
                label={isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                color={isConnected ? 'success' : 'error'}
                size="small"
              />
            </Box>
          </Box>
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadDeviceData}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={3}>
          {/* Real-time Telemetry Values */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Real-time Telemetry
              </Typography>
              {latestTelemetry ? (
                <Box>
                  {Object.entries(latestTelemetry)
                    .filter(([key]) => !['timestamp', 'device_id', 'user_id', 'tenant_id', 'iotdb_path'].includes(key))
                    .map(([key, value]) => renderTelemetryValue(key, value))}
                  <Typography variant="caption" color="text.secondary">
                    Last updated: {new Date(latestTelemetry.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
              ) : (
                <Typography color="text.secondary">No telemetry data available</Typography>
              )}
            </Paper>

            {/* Device Status */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Device Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PowerSettingsNew color={device?.status === 'active' ? 'success' : 'disabled'} />
                <Typography sx={{ ml: 1 }}>
                  Status: {device?.status?.toUpperCase()}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Last seen: {device?.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Messages today: {device?.message_count_today || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                IoTDB Path: {device?.iotdb_path}
              </Typography>
            </Paper>
          </Grid>

          {/* Telemetry Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 300 }}>
              <Typography variant="h6" gutterBottom>
                Temperature Trend (Last Hour)
              </Typography>
              {telemetryHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={telemetryHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <RechartsTooltip
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '85%' }}>
                  <Typography color="text.secondary">No historical data available</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Recent Notifications */}
          {deviceNotifs.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Notifications sx={{ mr: 1 }} />
                  Recent Notifications
                  <Badge badgeContent={deviceNotifs.length} color="error" sx={{ ml: 2 }} />
                </Typography>
                <List dense>
                  {deviceNotifs.map((notif) => (
                    <ListItem
                      key={notif.id}
                      secondaryAction={
                        <IconButton onClick={() => clearNotification(notif.id)} size="small">
                          <Clear />
                        </IconButton>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{
                          bgcolor: notif.type === 'error' ? 'error.main' :
                            notif.type === 'warning' ? 'warning.main' : 'success.main'
                        }}>
                          <Notifications />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={notif.message}
                        secondary={new Date(notif.timestamp).toLocaleString()}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}

          {/* Real-time Updates Feed */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Real-time Updates Feed
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {realtimeUpdates
                  .filter(update => update.device_id === deviceId)
                  .slice(0, 10)
                  .map((update) => (
                    <Box key={update.id} sx={{
                      p: 1,
                      mb: 1,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.200'
                    }}>
                      <Typography variant="body2">
                        <strong>{update.type.toUpperCase()}:</strong> {JSON.stringify(update.data)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(update.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  ))}
                {realtimeUpdates.filter(update => update.device_id === deviceId).length === 0 && (
                  <Typography color="text.secondary" align="center">
                    No recent updates
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default MultiTenantTelemetryWidget;
