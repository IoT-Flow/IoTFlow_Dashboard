import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Button,
} from '@mui/material';
import {
  getSystemStats,
  getTelemetryMetrics,
  getCombinedAdminStats,
} from '../services/flaskMetricsService';

/**
 * FlaskAdminStats Component
 * Displays admin statistics from Flask backend
 */
const FlaskAdminStats = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [telemetryStatus, setTelemetryStatus] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Get admin token from localStorage (assuming it's stored there)
  const getAdminToken = () => {
    // TODO: Replace with your actual auth mechanism
    return localStorage.getItem('adminToken') || process.env.REACT_APP_ADMIN_TOKEN || 'test';
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const adminToken = getAdminToken();
      const combinedStats = await getCombinedAdminStats(adminToken);

      setStats(combinedStats.flask_backend);
      setTelemetryStatus(combinedStats.telemetry);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch stats');
      console.error('Error fetching Flask stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchStats}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Flask Backend Statistics
        </Typography>
        <Box>
          {lastRefresh && (
            <Typography variant="caption" color="textSecondary" mr={2}>
              Last refresh: {lastRefresh}
            </Typography>
          )}
          <Button variant="outlined" size="small" onClick={fetchStats} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* Telemetry Status */}
      {telemetryStatus && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Telemetry Service Status
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    IoTDB Status
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Chip
                      label={telemetryStatus.iotdb_available ? 'Connected' : 'Disconnected'}
                      color={telemetryStatus.iotdb_available ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Service Status
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Chip
                      label={telemetryStatus.status}
                      color={telemetryStatus.status === 'healthy' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    IoTDB Host
                  </Typography>
                  <Typography variant="body2" mt={1}>
                    {telemetryStatus.iotdb_host}:{telemetryStatus.iotdb_port}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Device Statistics */}
      {stats?.device_stats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📱 Device Statistics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Box textAlign="center" p={2} bgcolor="primary.light" borderRadius={2}>
                  <Typography variant="h3" color="primary.contrastText">
                    {stats.device_stats.total}
                  </Typography>
                  <Typography variant="caption" color="primary.contrastText">
                    Total Devices
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box textAlign="center" p={2} bgcolor="success.light" borderRadius={2}>
                  <Typography variant="h3" color="success.contrastText">
                    {stats.device_stats.online}
                  </Typography>
                  <Typography variant="caption" color="success.contrastText">
                    Online
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box textAlign="center" p={2} bgcolor="warning.light" borderRadius={2}>
                  <Typography variant="h3" color="warning.contrastText">
                    {stats.device_stats.offline}
                  </Typography>
                  <Typography variant="caption" color="warning.contrastText">
                    Offline
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box textAlign="center" p={2} bgcolor="info.light" borderRadius={2}>
                  <Typography variant="h3" color="info.contrastText">
                    {stats.device_stats.active}
                  </Typography>
                  <Typography variant="caption" color="info.contrastText">
                    Active
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box textAlign="center" p={2} bgcolor="grey.300" borderRadius={2}>
                  <Typography variant="h3">{stats.device_stats.inactive}</Typography>
                  <Typography variant="caption">Inactive</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box textAlign="center" p={2} bgcolor="secondary.light" borderRadius={2}>
                  <Typography variant="h3" color="secondary.contrastText">
                    {stats.device_stats.maintenance}
                  </Typography>
                  <Typography variant="caption" color="secondary.contrastText">
                    Maintenance
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Auth Statistics */}
      {stats?.auth_stats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔐 Authentication Statistics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box textAlign="center" p={2} bgcolor="primary.light" borderRadius={2}>
                  <Typography variant="h3" color="primary.contrastText">
                    {stats.auth_stats.total_records}
                  </Typography>
                  <Typography variant="caption" color="primary.contrastText">
                    Total Auth Records
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box textAlign="center" p={2} bgcolor="success.light" borderRadius={2}>
                  <Typography variant="h3" color="success.contrastText">
                    {stats.auth_stats.active_records}
                  </Typography>
                  <Typography variant="caption" color="success.contrastText">
                    Active Auth Records
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Configuration Statistics */}
      {stats?.config_stats && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ⚙️ Configuration Statistics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box textAlign="center" p={2} bgcolor="primary.light" borderRadius={2}>
                  <Typography variant="h3" color="primary.contrastText">
                    {stats.config_stats.total_configs}
                  </Typography>
                  <Typography variant="caption" color="primary.contrastText">
                    Total Configurations
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box textAlign="center" p={2} bgcolor="success.light" borderRadius={2}>
                  <Typography variant="h3" color="success.contrastText">
                    {stats.config_stats.active_configs}
                  </Typography>
                  <Typography variant="caption" color="success.contrastText">
                    Active Configurations
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default FlaskAdminStats;
