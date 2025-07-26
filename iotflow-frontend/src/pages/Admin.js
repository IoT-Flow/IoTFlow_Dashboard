import {
  Build,
  CheckCircle,
  Computer,
  Delete,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
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
  Typography,
} from '@mui/material';
import { useState } from 'react';
import toast from 'react-hot-toast';

const Admin = () => {
  const [activeTab, setActiveTab] = useState(0);
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
    totalTelemetryPoints: 2847361,
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

  const getServiceStatusColor = (status) => {
    switch (status) {
      case 'running': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'stopped': return 'default';
      default: return 'info';
    }
  };

  const getServiceStatusIcon = (status) => {
    switch (status) {
      case 'running': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'error': return <Error />;
      case 'stopped': return <Info />;
      default: return <Info />;
    }
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'ERROR': return 'error';
      case 'WARNING': return 'warning';
      case 'INFO': return 'info';
      case 'DEBUG': return 'default';
      default: return 'default';
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
        }
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
                onChange={(e) => setMaintenanceMode(e.target.checked)}
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
      <Alert
        severity={systemHealth.overall === 'good' ? 'success' : 'warning'}
        sx={{ mb: 3 }}
      >
        System Health: {systemHealth.overall.toUpperCase()} - All critical services are operational
      </Alert>

      {/* System Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <ServiceCard
                name="IoTDB"
                service={systemHealth.services.iotdb}
                icon={<Storage />}
              />
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
                    <Box sx={{ height: 100, position: 'relative', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        CPU Chart Placeholder
                      </Typography>
                      <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                      }}>
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
                    <Box sx={{ height: 100, position: 'relative', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Memory Chart Placeholder
                      </Typography>
                      <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                      }}>
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
                  <Typography variant="body2" color="text.secondary">CPU Usage</Typography>
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
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
          >
            <Tab label="System Logs" />
            <Tab label="Cache Management" />
            <Tab label="Performance" />
            <Tab label="Maintenance" />
          </Tabs>
        </Box>

        {/* System Logs Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
                  {logs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {log.timestamp.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.level}
                          color={getLogLevelColor(log.level)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {log.service}
                      </TableCell>
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
        {activeTab === 1 && (
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
                        <Chip
                          label={cacheStats.redis.status}
                          color="success"
                          size="small"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Memory Usage" secondary={cacheStats.redis.memory} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Total Keys" secondary={cacheStats.redis.keys.toLocaleString()} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Hit Rate" secondary={`${cacheStats.redis.hitRate}%`} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Miss Rate" secondary={`${cacheStats.redis.missRate}%`} />
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
                      <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                      >
                        Refresh Cache Stats
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Settings />}
                      >
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
        {activeTab === 2 && (
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
        {activeTab === 3 && (
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
                      <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                      >
                        Restart Services
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Build />}
                      >
                        System Diagnostics
                      </Button>
                      <Button
                        variant="outlined"
                        color="warning"
                        startIcon={<Settings />}
                      >
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
                      <Button
                        variant="outlined"
                        startIcon={<Storage />}
                      >
                        Optimize IoTDB
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Delete />}
                        color="warning"
                      >
                        Clean Old Data
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Timeline />}
                      >
                        Rebuild Indexes
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Monitor />}
                      >
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
      <Dialog
        open={clearCacheDialogOpen}
        onClose={() => setClearCacheDialogOpen(false)}
      >
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
          <Typography gutterBottom>
            Create a complete system backup including:
          </Typography>
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
    </Box>
  );
};

export default Admin;
