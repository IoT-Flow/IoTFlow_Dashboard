import {
  Analytics as AnalyticsIcon,
  Assessment,
  Delete,
  Download,
  Edit,
  PlayArrow,
  Refresh,
  Save,
  ShowChart,
  Timeline,
  TrendingDown,
  TrendingUp,
  Visibility,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useState } from 'react';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [analysisType, setAnalysisType] = useState('trends');
  const [selectedDevices, setSelectedDevices] = useState(['all']);
  const [timeRange, setTimeRange] = useState('7d');
  const [customQueryOpen, setCustomQueryOpen] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [savedQueries, setSavedQueries] = useState([
    {
      id: 1,
      name: 'Daily Temperature Averages',
      query: 'SELECT AVG(temperature) FROM telemetry WHERE device_type="temperature" GROUP BY day',
      created: new Date('2025-01-05'),
    },
    {
      id: 2,
      name: 'Device Activity Analysis',
      query: 'SELECT device_id, COUNT(*) as message_count FROM telemetry GROUP BY device_id',
      created: new Date('2025-01-07'),
    },
  ]);

  // Mock analytics data
  const [analyticsData] = useState({
    trends: {
      temperature: [22.5, 23.1, 22.8, 24.2, 23.5, 22.9, 23.7],
      humidity: [45.2, 47.8, 46.1, 44.5, 48.3, 45.9, 46.7],
      pressure: [1013.2, 1012.8, 1013.5, 1014.1, 1013.7, 1012.9, 1013.4],
      timestamps: ['Jan 3', 'Jan 4', 'Jan 5', 'Jan 6', 'Jan 7', 'Jan 8', 'Jan 9'],
    },
    devicePerformance: [
      { device: 'TEMP_001', uptime: 99.8, messages: 15420, avgResponse: 120 },
      { device: 'HUMID_002', uptime: 98.5, messages: 12850, avgResponse: 95 },
      { device: 'PRESS_003', uptime: 97.2, messages: 8765, avgResponse: 150 },
      { device: 'VIBR_004', uptime: 99.1, messages: 25630, avgResponse: 80 },
      { device: 'GPS_005', uptime: 96.8, messages: 5420, avgResponse: 200 },
    ],
    dataQuality: {
      total: 125678,
      valid: 122543,
      invalid: 2145,
      missing: 990,
    },
    correlations: [
      { x: 22.5, y: 45.2, device: 'TEMP_001' },
      { x: 23.1, y: 47.8, device: 'TEMP_001' },
      { x: 22.8, y: 46.1, device: 'TEMP_001' },
      { x: 24.2, y: 44.5, device: 'TEMP_001' },
      { x: 23.5, y: 48.3, device: 'TEMP_001' },
    ],
  });

  const devices = [
    { id: 'all', name: 'All Devices' },
    { id: 'TEMP_001', name: 'Temperature Sensor 001' },
    { id: 'HUMID_002', name: 'Humidity Sensor 002' },
    { id: 'PRESS_003', name: 'Pressure Monitor 003' },
    { id: 'VIBR_004', name: 'Vibration Sensor 004' },
    { id: 'GPS_005', name: 'GPS Tracker 005' },
  ];

  const trendsChartData = {
    labels: analyticsData.trends.timestamps,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: analyticsData.trends.temperature,
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Humidity (%)',
        data: analyticsData.trends.humidity,
        borderColor: '#dc004e',
        backgroundColor: 'rgba(220, 0, 78, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const performanceChartData = {
    labels: analyticsData.devicePerformance.map(d => d.device),
    datasets: [
      {
        label: 'Uptime (%)',
        data: analyticsData.devicePerformance.map(d => d.uptime),
        backgroundColor: '#4caf50',
      },
      {
        label: 'Avg Response Time (ms)',
        data: analyticsData.devicePerformance.map(d => d.avgResponse),
        backgroundColor: '#ff9800',
      },
    ],
  };

  const dataQualityChartData = {
    labels: ['Valid', 'Invalid', 'Missing'],
    datasets: [
      {
        data: [
          analyticsData.dataQuality.valid,
          analyticsData.dataQuality.invalid,
          analyticsData.dataQuality.missing,
        ],
        backgroundColor: ['#4caf50', '#f44336', '#ff9800'],
        borderWidth: 0,
      },
    ],
  };

  const correlationChartData = {
    datasets: [
      {
        label: 'Temperature vs Humidity',
        data: analyticsData.correlations,
        backgroundColor: '#1976d2',
        borderColor: '#1976d2',
      },
    ],
  };

  const trendsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Telemetry Data Trends',
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Temperature (°C)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Humidity (%)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const performanceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Device Performance Metrics',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const correlationChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Temperature vs Humidity Correlation',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Temperature (°C)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Humidity (%)',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Data Quality Distribution',
      },
    },
  };

  const handleRunCustomQuery = () => {
    // Simulate query execution
    toast.success('Custom query executed successfully');
    setCustomQueryOpen(false);
  };

  const handleSaveQuery = () => {
    const newQuery = {
      id: savedQueries.length + 1,
      name: `Custom Query ${savedQueries.length + 1}`,
      query: customQuery,
      created: new Date(),
    };
    setSavedQueries([...savedQueries, newQuery]);
    toast.success('Query saved successfully');
  };

  const handleDeleteQuery = (queryId) => {
    setSavedQueries(savedQueries.filter(q => q.id !== queryId));
    toast.success('Query deleted successfully');
  };

  const StatCard = ({ title, value, change, icon, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: `${color}.main` }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            {icon}
            {change && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {change > 0 ? (
                  <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />
                )}
                <Typography
                  variant="caption"
                  color={change > 0 ? 'success.main' : 'error.main'}
                  sx={{ fontWeight: 600 }}
                >
                  {Math.abs(change)}%
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box className="fade-in">
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
              Advanced Analytics
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Deep insights and data analysis for your IoT infrastructure
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PlayArrow />}
              onClick={() => setCustomQueryOpen(true)}
            >
              Custom Query
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
            >
              Export Report
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

        {/* Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Analysis Type</InputLabel>
                  <Select
                    value={analysisType}
                    label="Analysis Type"
                    onChange={(e) => setAnalysisType(e.target.value)}
                  >
                    <MenuItem value="trends">Trend Analysis</MenuItem>
                    <MenuItem value="performance">Device Performance</MenuItem>
                    <MenuItem value="correlations">Data Correlations</MenuItem>
                    <MenuItem value="quality">Data Quality</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Devices</InputLabel>
                  <Select
                    value={selectedDevices[0]}
                    label="Devices"
                    onChange={(e) => setSelectedDevices([e.target.value])}
                  >
                    {devices.map(device => (
                      <MenuItem key={device.id} value={device.id}>
                        {device.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Time Range</InputLabel>
                  <Select
                    value={timeRange}
                    label="Time Range"
                    onChange={(e) => setTimeRange(e.target.value)}
                  >
                    <MenuItem value="1d">Last 24 Hours</MenuItem>
                    <MenuItem value="7d">Last 7 Days</MenuItem>
                    <MenuItem value="30d">Last 30 Days</MenuItem>
                    <MenuItem value="90d">Last 90 Days</MenuItem>
                    <MenuItem value="custom">Custom Range</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AnalyticsIcon />}
                >
                  Run Analysis
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Data Points Analyzed"
              value="125,678"
              change={12.5}
              icon={<Assessment sx={{ fontSize: 40, color: 'primary.main' }} />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Data Quality Score"
              value="97.4%"
              change={2.1}
              icon={<Timeline sx={{ fontSize: 40, color: 'success.main' }} />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Anomalies Detected"
              value="12"
              change={-8.3}
              icon={<ShowChart sx={{ fontSize: 40, color: 'warning.main' }} />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Prediction Accuracy"
              value="94.2%"
              change={5.7}
              icon={<TrendingUp sx={{ fontSize: 40, color: 'info.main' }} />}
              color="info"
            />
          </Grid>
        </Grid>

        {/* Analysis Charts */}
        {analysisType === 'trends' && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ height: 400 }}>
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="body1" color="text.secondary">
                        Analytics Chart Placeholder - Upgrade to ECharts Coming Soon
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {analysisType === 'performance' && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box sx={{
                    height: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.paper',
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}>
                    <Typography variant="body1" color="text.secondary">
                      Performance Chart (Bar) - ECharts Integration Coming Soon
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                    Device Performance Summary
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Device</TableCell>
                          <TableCell align="right">Messages</TableCell>
                          <TableCell align="right">Uptime</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analyticsData.devicePerformance.map((device) => (
                          <TableRow key={device.device}>
                            <TableCell>{device.device}</TableCell>
                            <TableCell align="right">{device.messages.toLocaleString()}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${device.uptime}%`}
                                color={device.uptime > 98 ? 'success' : device.uptime > 95 ? 'warning' : 'error'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {analysisType === 'correlations' && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{
                    height: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.paper',
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}>
                    <Typography variant="body1" color="text.secondary">
                      Correlation Chart (Scatter) - ECharts Integration Coming Soon
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {analysisType === 'quality' && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{
                    height: 300,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.paper',
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}>
                    <Typography variant="body1" color="text.secondary">
                      Data Quality Chart (Doughnut) - ECharts Integration Coming Soon
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                    Data Quality Metrics
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Total Records</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {analyticsData.dataQuality.total.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="success.main">Valid Records</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} color="success.main">
                        {analyticsData.dataQuality.valid.toLocaleString()}
                        ({((analyticsData.dataQuality.valid / analyticsData.dataQuality.total) * 100).toFixed(1)}%)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="error.main">Invalid Records</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} color="error.main">
                        {analyticsData.dataQuality.invalid.toLocaleString()}
                        ({((analyticsData.dataQuality.invalid / analyticsData.dataQuality.total) * 100).toFixed(1)}%)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="warning.main">Missing Records</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} color="warning.main">
                        {analyticsData.dataQuality.missing.toLocaleString()}
                        ({((analyticsData.dataQuality.missing / analyticsData.dataQuality.total) * 100).toFixed(1)}%)
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Saved Queries */}
        <Card>
          <CardContent>
            <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              Saved Queries & Reports
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Query Name</TableCell>
                    <TableCell>Query</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {savedQueries.map((query) => (
                    <TableRow key={query.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {query.name}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {query.query.length > 50
                          ? `${query.query.substring(0, 50)}...`
                          : query.query}
                      </TableCell>
                      <TableCell>
                        {query.created.toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Run Query">
                          <IconButton size="small">
                            <PlayArrow />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Query">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Query">
                          <IconButton size="small">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Query">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteQuery(query.id)}
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
          </CardContent>
        </Card>

        {/* Custom Query Dialog */}
        <Dialog
          open={customQueryOpen}
          onClose={() => setCustomQueryOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Custom Query Builder</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              Write custom IoTDB queries to analyze your telemetry data. Use SQL-like syntax.
            </Alert>
            <TextField
              fullWidth
              multiline
              rows={8}
              label="Query"
              placeholder="SELECT device_id, AVG(temperature) as avg_temp FROM telemetry WHERE timestamp > now() - 7d GROUP BY device_id"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              sx={{ fontFamily: 'monospace' }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCustomQueryOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveQuery} startIcon={<Save />}>
              Save Query
            </Button>
            <Button onClick={handleRunCustomQuery} variant="contained" startIcon={<PlayArrow />}>
              Run Query
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Analytics;
