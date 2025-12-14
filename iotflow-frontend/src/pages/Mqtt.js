import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Router as RouterIcon,
} from '@mui/icons-material';
import apiService from '../services/apiService';

export default function Mqtt() {
  const [brokerStatus, setBrokerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to format bytes to human-readable format
  const formatBytes = bytes => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Fetch MQTT metrics from backend
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching MQTT metrics...');
      const data = await apiService.getMqttMetrics();
      console.log('MQTT metrics received:', data);

      if (data && data.metrics) {
        const { metrics } = data;

        // Extract data from the actual API structure
        const brokerConnection = metrics.connection_metrics?.broker_connection || {};
        const overview = metrics.overview || {};
        const handlerStats = metrics.handler_metrics?.handler_statistics || {};
        const topicManagement = metrics.topic_metrics?.topic_management || {};
        const subscriptionMetrics = metrics.subscription_metrics || {};
        const messageMetrics = metrics.message_metrics?.data_transfer || {};
        const prometheusMetrics = metrics.prometheus_metrics || {};

        setBrokerStatus({
          status: brokerConnection.connected ? 'running' : 'stopped',
          uptime: overview.uptime_seconds ? formatUptime(overview.uptime_seconds) : 'N/A',
          version: 'Mosquitto 2.0.15', // Not provided by API
          host: brokerConnection.host || 'localhost',
          port: brokerConnection.port || 1883,
          useTls: brokerConnection.use_tls || false,
          connections: brokerConnection.active_connections || 0,
          messagesReceived: prometheusMetrics.mqtt_messages_received_total || 0,
          messagesSent: prometheusMetrics.mqtt_messages_sent_total || 0,
          bytesReceived: formatBytes(prometheusMetrics.mqtt_bytes_received_total || 0),
          bytesSent: formatBytes(prometheusMetrics.mqtt_bytes_sent_total || 0),
          messageHandlers: handlerStats.total_handlers || 0,
          subscriptionCallbacks: subscriptionMetrics.active_subscriptions || 0,
          totalTopics: topicManagement.total_topic_structures || 0,
        });
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching MQTT metrics:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.message || 'Failed to fetch MQTT metrics');
      setLoading(false);
    }
  };

  // Format uptime from seconds to readable format
  const formatUptime = seconds => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Fetch metrics on mount and set up auto-refresh
  useEffect(() => {
    fetchMetrics();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchMetrics();
    }, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchMetrics();
  };

  // Show loading state
  if (loading && !brokerStatus) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading MQTT metrics...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          MQTT Broker Monitoring
        </Typography>
        <IconButton onClick={handleRefresh} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Broker Status Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <RouterIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Broker Status</Typography>
              </Box>
              <Chip
                icon={brokerStatus?.status === 'running' ? <CheckCircleIcon /> : <ErrorIcon />}
                label={brokerStatus?.status === 'running' ? 'Running' : 'Stopped'}
                color={brokerStatus?.status === 'running' ? 'success' : 'error'}
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Uptime: {brokerStatus?.uptime || 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {brokerStatus?.version || 'N/A'} • Port {brokerStatus?.port || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Connections
              </Typography>
              <Typography variant="h3" color="primary">
                {brokerStatus?.connections || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Connected clients
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Messages
              </Typography>
              <Typography variant="h4" color="success.main">
                ↓ {(brokerStatus?.messagesReceived || 0).toLocaleString()}
              </Typography>
              <Typography variant="h4" color="info.main">
                ↑ {(brokerStatus?.messagesSent || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Received / Sent
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Transfer
              </Typography>
              <Typography variant="body1">↓ {brokerStatus?.bytesReceived || '0 B'}</Typography>
              <Typography variant="body1">↑ {brokerStatus?.bytesSent || '0 B'}</Typography>
              <Typography variant="caption" color="text.secondary">
                Received / Sent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* MQTT Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Topic Structures
              </Typography>
              <Typography variant="h3" color="primary">
                {brokerStatus?.totalTopics || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total topic definitions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Message Handlers
              </Typography>
              <Typography variant="h3" color="success.main">
                {brokerStatus?.messageHandlers || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active message handlers
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Subscriptions
              </Typography>
              <Typography variant="h3" color="info.main">
                {brokerStatus?.subscriptionCallbacks || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active subscription callbacks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Connection Info */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Connection Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Host
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                {brokerStatus?.host || 'localhost'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Port
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                {brokerStatus?.port || 1883}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={brokerStatus?.status === 'running' ? 'Connected' : 'Disconnected'}
                color={brokerStatus?.status === 'running' ? 'success' : 'error'}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                TLS Enabled
              </Typography>
              <Typography variant="body1">{brokerStatus?.useTls ? 'Yes' : 'No'}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
