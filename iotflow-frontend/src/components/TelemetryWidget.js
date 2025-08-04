import {
  DeviceHub,
  SignalWifi4Bar,
  Speed,
  Thermostat,
  TrendingUp
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Typography,
  useTheme
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import apiService from '../services/apiService';

const TelemetryWidget = ({ deviceId, compact = false }) => {
  const theme = useTheme();
  const { telemetryData, isConnected } = useWebSocket();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDeviceInfo();
  }, [deviceId]);

  const loadDeviceInfo = async () => {
    try {
      setLoading(true);
      const result = await apiService.getDevices();
      if (result.success) {
        const devices = Array.isArray(result.data) ? result.data : result.data.devices || [];
        const foundDevice = devices.find(d => d.id === deviceId || d.deviceId === deviceId);
        setDevice(foundDevice);
      }
    } catch (err) {
      console.error('Failed to load device info:', err);
      setError('Failed to load device');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTelemetry = () => {
    return telemetryData[deviceId] || null;
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'temperature':
      case 'temperature_sensor':
        return <Thermostat />;
      case 'speed':
      case 'speed_sensor':
        return <Speed />;
      case 'led':
      case 'smart_lighting':
        return <SignalWifi4Bar />;
      default:
        return <DeviceHub />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'maintenance':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatTelemetryValue = (key, value) => {
    if (typeof value === 'number') {
      if (key.toLowerCase().includes('temp')) {
        return `${value.toFixed(1)}°C`;
      }
      if (key.toLowerCase().includes('humidity')) {
        return `${value.toFixed(1)}%`;
      }
      if (key.toLowerCase().includes('pressure')) {
        return `${value.toFixed(0)} hPa`;
      }
      return value.toFixed(2);
    }
    return String(value);
  };

  if (loading) {
    return (
      <Card sx={{ height: compact ? 200 : 300 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error || !device) {
    return (
      <Card sx={{ height: compact ? 200 : 300 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography color="error" variant="body2">
            {error || 'Device not found'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const currentTelemetry = getCurrentTelemetry();

  return (
    <Card sx={{ height: compact ? 200 : 300 }}>
      <CardContent>
        {/* Device Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
            {getDeviceIcon(device.type)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant={compact ? 'body2' : 'h6'} fontWeight="bold" noWrap>
              {device.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip
                size="small"
                label={device.status || 'Unknown'}
                color={getStatusColor(device.status)}
                variant="outlined"
              />
              <Chip
                size="small"
                label={isConnected ? 'Connected' : 'Disconnected'}
                color={isConnected ? 'success' : 'error'}
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>

        {/* Telemetry Data */}
        {currentTelemetry ? (
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Latest Readings:
            </Typography>
            <Box sx={{ mt: 1 }}>
              {Object.entries(currentTelemetry)
                .filter(([key]) => !['timestamp', 'device_id', 'user_id', 'id'].includes(key))
                .slice(0, compact ? 2 : 4)
                .map(([key, value]) => (
                  <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatTelemetryValue(key, value)}
                    </Typography>
                  </Box>
                ))}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Last updated: {new Date(currentTelemetry.timestamp).toLocaleTimeString()}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
            <Box sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No telemetry data available
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TelemetryWidget;
