import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Download,
  Refresh,
  Settings,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  Timeline,
  BarChart,
  DeviceHub,
  Thermostat,
  Opacity,
  Speed,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useWebSocket } from '../contexts/WebSocketContext';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
);

const Telemetry = () => {
  const { subscribeToDevice, unsubscribeFromDevice } = useWebSocket();
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [timeRange, setTimeRange] = useState('1h');
  const [chartType, setChartType] = useState('line');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 3600000)); // 1 hour ago
  const [endDate, setEndDate] = useState(new Date());
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock devices for demo
  const [devices] = useState([
    { id: 'TEMP_001', name: 'Temperature Sensor 001', type: 'Temperature', unit: '°C' },
    { id: 'HUMID_002', name: 'Humidity Sensor 002', type: 'Humidity', unit: '%' },
    { id: 'PRESS_003', name: 'Pressure Monitor 003', type: 'Pressure', unit: 'hPa' },
    { id: 'VIBR_004', name: 'Vibration Sensor 004', type: 'Vibration', unit: 'mm/s' },
    { id: 'GPS_005', name: 'GPS Tracker 005', type: 'Location', unit: 'coords' },
  ]);

  // Mock telemetry data
  const [telemetryHistory, setTelemetryHistory] = useState({});

  useEffect(() => {
    // Generate mock historical data
    const generateMockData = () => {
      const now = new Date();
      const data = {};
      
      devices.forEach(device => {
        data[device.id] = [];
        for (let i = 100; i >= 0; i--) {
          const timestamp = new Date(now.getTime() - i * 60000); // Every minute
          let value;
          
          switch (device.type) {
            case 'Temperature':
              value = 20 + Math.sin(i * 0.1) * 5 + Math.random() * 2;
              break;
            case 'Humidity':
              value = 50 + Math.sin(i * 0.05) * 20 + Math.random() * 5;
              break;
            case 'Pressure':
              value = 1013 + Math.sin(i * 0.03) * 10 + Math.random() * 3;
              break;
            case 'Vibration':
              value = Math.random() * 10;
              break;
            default:
              value = Math.random() * 100;
          }
          
          data[device.id].push({
            timestamp,
            value: parseFloat(value.toFixed(2)),
            device_id: device.id,
          });
        }
      });
      
      setTelemetryHistory(data);
    };

    generateMockData();
    
    // Auto-refresh data
    if (autoRefresh) {
      const interval = setInterval(generateMockData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, devices]);

  const handleDeviceChange = (deviceId) => {
    if (selectedDevice !== 'all') {
      unsubscribeFromDevice(selectedDevice);
    }
    
    setSelectedDevice(deviceId);
    
    if (deviceId !== 'all') {
      subscribeToDevice(deviceId);
    }
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    const now = new Date();
    let startTime;
    
    switch (range) {
      case '15m':
        startTime = new Date(now.getTime() - 15 * 60000);
        break;
      case '1h':
        startTime = new Date(now.getTime() - 3600000);
        break;
      case '6h':
        startTime = new Date(now.getTime() - 6 * 3600000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 3600000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 3600000);
        break;
      default:
        startTime = new Date(now.getTime() - 3600000);
    }
    
    setStartDate(startTime);
    setEndDate(now);
  };

  const getChartData = () => {
    const devicesToShow = selectedDevice === 'all' 
      ? devices.slice(0, 3) // Show first 3 devices for overview
      : devices.filter(d => d.id === selectedDevice);

    const datasets = devicesToShow.map((device, index) => {
      const data = telemetryHistory[device.id] || [];
      const filteredData = data.filter(item => 
        item.timestamp >= startDate && item.timestamp <= endDate
      );

      const colors = ['#1976d2', '#dc004e', '#ed6c02', '#2e7d32', '#9c27b0'];
      
      return {
        label: device.name,
        data: filteredData.map(item => ({
          x: item.timestamp,
          y: item.value,
        })),
        borderColor: colors[index % colors.length],
        backgroundColor: `${colors[index % colors.length]}20`,
        tension: 0.4,
        fill: chartType === 'area',
      };
    });

    return { datasets };
  };

  const getRealtimeStats = () => {
    if (selectedDevice === 'all') {
      return devices.map(device => {
        const latestData = telemetryHistory[device.id]?.slice(-1)[0];
        return {
          device,
          value: latestData?.value || 0,
          timestamp: latestData?.timestamp || new Date(),
        };
      });
    } else {
      const device = devices.find(d => d.id === selectedDevice);
      const latestData = telemetryHistory[selectedDevice]?.slice(-1)[0];
      return [{
        device,
        value: latestData?.value || 0,
        timestamp: latestData?.timestamp || new Date(),
      }];
    }
  };

  const handleExport = async (format) => {
    setLoading(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const data = selectedDevice === 'all' 
        ? telemetryHistory 
        : { [selectedDevice]: telemetryHistory[selectedDevice] };
      
      if (format === 'csv') {
        // Generate CSV
        let csv = 'Device ID,Timestamp,Value\n';
        Object.entries(data).forEach(([deviceId, records]) => {
          records.forEach(record => {
            csv += `${deviceId},${record.timestamp.toISOString()},${record.value}\n`;
          });
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `telemetry_${selectedDevice}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      } else if (format === 'json') {
        // Generate JSON
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `telemetry_${selectedDevice}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      }
      
      toast.success(`Data exported as ${format.toUpperCase()}`);
      setExportDialogOpen(false);
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ device, value, timestamp }) => {
    const getDeviceIcon = (type) => {
      switch (type) {
        case 'Temperature': return <Thermostat />;
        case 'Humidity': return <Opacity />;
        case 'Pressure': return <Speed />;
        case 'Vibration': return <Timeline />;
        default: return <DeviceHub />;
      }
    };

    const getValueColor = (type, value) => {
      switch (type) {
        case 'Temperature':
          if (value > 30) return 'error';
          if (value < 15) return 'info';
          return 'success';
        case 'Humidity':
          if (value > 70 || value < 30) return 'warning';
          return 'success';
        default:
          return 'primary';
      }
    };

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: `${getValueColor(device.type, value)}.main`, mr: 2 }}>
              {getDeviceIcon(device.type)}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" component="div" 
                sx={{ fontWeight: 600, color: `${getValueColor(device.type, value)}.main` }}>
                {value}{device.unit}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {device.name}
              </Typography>
            </Box>
            <Chip
              label="LIVE"
              color="success"
              size="small"
              variant="outlined"
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Last updated: {timestamp.toLocaleTimeString()}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    scales: {
      x: {
        type: 'time',
        time: {
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'MMM dd',
          },
        },
        grid: {
          color: 'rgba(0,0,0,0.1)',
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0,0,0,0.1)',
        },
      },
    },
    elements: {
      point: {
        radius: 2,
        hoverRadius: 6,
      },
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box className="fade-in">
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
              Telemetry & Analytics
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Real-time data visualization and historical analysis
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => setExportDialogOpen(true)}
            >
              Export Data
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
                  <InputLabel>Device</InputLabel>
                  <Select
                    value={selectedDevice}
                    label="Device"
                    onChange={(e) => handleDeviceChange(e.target.value)}
                  >
                    <MenuItem value="all">All Devices</MenuItem>
                    {devices.map(device => (
                      <MenuItem key={device.id} value={device.id}>
                        {device.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <ToggleButtonGroup
                  value={timeRange}
                  exclusive
                  onChange={(e, value) => value && handleTimeRangeChange(value)}
                  size="small"
                >
                  <ToggleButton value="15m">15m</ToggleButton>
                  <ToggleButton value="1h">1h</ToggleButton>
                  <ToggleButton value="6h">6h</ToggleButton>
                  <ToggleButton value="24h">24h</ToggleButton>
                  <ToggleButton value="7d">7d</ToggleButton>
                </ToggleButtonGroup>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <ToggleButtonGroup
                  value={chartType}
                  exclusive
                  onChange={(e, value) => value && setChartType(value)}
                  size="small"
                >
                  <ToggleButton value="line">
                    <Timeline />
                  </ToggleButton>
                  <ToggleButton value="area">
                    <BarChart />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Chip
                  label={autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
                  color={autoRefresh ? "success" : "default"}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  clickable
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Real-time Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {getRealtimeStats().map((stat, index) => (
            <Grid item xs={12} sm={6} md={selectedDevice === 'all' ? 4 : 6} key={stat.device.id}>
              <MetricCard {...stat} />
            </Grid>
          ))}
        </Grid>

        {/* Main Chart */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                Telemetry Data Visualization
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton size="small">
                  <ZoomIn />
                </IconButton>
                <IconButton size="small">
                  <ZoomOut />
                </IconButton>
                <IconButton size="small">
                  <Fullscreen />
                </IconButton>
                <IconButton size="small">
                  <Settings />
                </IconButton>
              </Box>
            </Box>
            <Box sx={{ height: 400 }}>
              <Line data={getChartData()} options={chartOptions} />
            </Box>
          </CardContent>
        </Card>

        {/* Additional Analytics */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                  Data Summary
                </Typography>
                {getRealtimeStats().map(stat => (
                  <Box key={stat.device.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{stat.device.name}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {stat.value}{stat.device.unit}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Chip label="Min: 15.2" size="small" variant="outlined" />
                      <Chip label="Max: 28.7" size="small" variant="outlined" />
                      <Chip label="Avg: 22.1" size="small" variant="outlined" />
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                  Data Quality & Alerts
                </Typography>
                <Alert severity="success" sx={{ mb: 2 }}>
                  All devices reporting normally - 99.8% uptime
                </Alert>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Temperature sensor TEMP_001 approaching threshold
                </Alert>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Data Points Collected Today
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    45,620
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Export Dialog */}
        <Dialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Export Telemetry Data</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Export data for device: <strong>{selectedDevice === 'all' ? 'All Devices' : selectedDevice}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Time range: {startDate.toLocaleString()} - {endDate.toLocaleString()}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 3 }}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleExport('csv')}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Export as CSV'}
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleExport('json')}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Export as JSON'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Telemetry;
