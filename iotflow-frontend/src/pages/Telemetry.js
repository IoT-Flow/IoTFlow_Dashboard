import {
  Add,
  BarChart,
  Delete,
  DeviceHub,
  Download,
  Edit,
  MoreVert,
  Opacity,
  Refresh,
  Speed,
  Thermostat,
  Timeline
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
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ChartCustomizationDialog from '../components/ChartCustomizationDialog';
import CustomChart from '../components/CustomChart';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import api from '../services/api'; // Import your API service
import apiService from '../services/apiService';

const Telemetry = () => {
  const { subscribeToDevice, unsubscribeFromDevice } = useWebSocket();
  const { user, token } = useAuth(); // Get token from auth context
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [timeRange, setTimeRange] = useState('1h');
  const [chartType, setChartType] = useState('line');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Custom chart management
  const [customCharts, setCustomCharts] = useState([]);
  const [chartCustomizationOpen, setChartCustomizationOpen] = useState(false);
  const [editingChart, setEditingChart] = useState(null);
  const [chartMenuAnchor, setChartMenuAnchor] = useState(null);
  const [selectedChartForMenu, setSelectedChartForMenu] = useState(null);

  // Devices from the backend
  const [devices, setDevices] = useState([]);
  const [telemetryHistory, setTelemetryHistory] = useState({});

  // Telemetry measurement filter
  const [measurementFilter, setMeasurementFilter] = useState('all');

  // Get available measurements for the selected device
  const availableMeasurements = selectedDevice && telemetryHistory[selectedDevice]
    ? Object.keys(telemetryHistory[selectedDevice])
    : [];

  // Fetch devices from the backend
  useEffect(() => {
    const fetchDevices = async () => {
      if (user) {
        try {
          setLoading(true);
          const response = await apiService.getDevices();
          console.log(response);
          setDevices(response.data);
          if (response.data.length > 0) {
            setSelectedDevice(response.data[0].id); // Select the first device by default
          }
        } catch (error) {
          toast.error('Failed to fetch devices.');
          console.error('Error fetching devices:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchDevices();
  }, [user, token]);

  // Load custom charts from localStorage
  useEffect(() => {
    const savedCharts = localStorage.getItem(`telemetry_charts_${user?.email || 'demo'}`);
    if (savedCharts) {
      try {
        setCustomCharts(JSON.parse(savedCharts));
      } catch (error) {
        console.error('Error loading saved charts:', error);
      }
    }
  }, [user]);

  // Save custom charts to localStorage
  const saveChartsToStorage = (charts) => {
    localStorage.setItem(`telemetry_charts_${user?.email || 'demo'}`, JSON.stringify(charts));
  };

  // Custom chart management functions
  const handleAddChart = () => {
    setEditingChart(null);
    setChartCustomizationOpen(true);
  };

  const handleEditChart = (chart) => {
    setEditingChart(chart);
    setChartCustomizationOpen(true);
    setChartMenuAnchor(null);
  };

  const handleDeleteChart = (chartId) => {
    const updatedCharts = customCharts.filter(chart => chart.id !== chartId);
    setCustomCharts(updatedCharts);
    saveChartsToStorage(updatedCharts);
    setChartMenuAnchor(null);
    toast.success('Chart deleted successfully');
  };

  const handleSaveChart = (chartConfig) => {
    let updatedCharts;

    if (editingChart) {
      // Update existing chart
      updatedCharts = customCharts.map(chart =>
        chart.id === editingChart.id ? { ...chartConfig, id: editingChart.id } : chart
      );
      toast.success('Chart updated successfully');
    } else {
      // Add new chart
      const newChart = {
        ...chartConfig,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      updatedCharts = [...customCharts, newChart];
      toast.success('Chart created successfully');
    }

    setCustomCharts(updatedCharts);
    saveChartsToStorage(updatedCharts);
    setChartCustomizationOpen(false);
    setEditingChart(null);
  };

  const handleChartMenuOpen = (event, chart) => {
    event.stopPropagation();
    setChartMenuAnchor(event.currentTarget);
    setSelectedChartForMenu(chart);
  };

  const handleChartMenuClose = () => {
    setChartMenuAnchor(null);
    setSelectedChartForMenu(null);
  };

  // Fetch telemetry data when selected device or time range changes
  useEffect(() => {
    const fetchTelemetry = async () => {
      if (!selectedDevice) return;
      console.log(selectedDevice);
      setLoading(true);
      try {
        const now = new Date();
        const { startTime } = getTimeRangeDates(timeRange);

        // Use the correct API endpoint that matches your backend
        const telemetryResponse = await api.get(`/telemetry/${selectedDevice}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            start_date: startTime.toISOString(),
            end_date: now.toISOString(),
            limit: 1000,
          }
        });

        // Process the telemetry data from IoTDB format
        const telemetryData = telemetryResponse.data.telemetry || [];
        console.log('Raw telemetry data:', telemetryData);

        const newTelemetryHistory = {};
        if (!newTelemetryHistory[selectedDevice]) {
          newTelemetryHistory[selectedDevice] = {};
        }

        // Group data by measurement type
        telemetryData.forEach(record => {
          // Extract measurements from the record (excluding Time and timestamp fields)
          Object.keys(record).forEach(key => {
            if (key !== 'Time' && key !== 'timestamp') {
              const measurement = key;
              const value = record[key];

              if (value !== null && value !== undefined) {
                if (!newTelemetryHistory[selectedDevice][measurement]) {
                  newTelemetryHistory[selectedDevice][measurement] = [];
                }

                newTelemetryHistory[selectedDevice][measurement].push({
                  timestamp: new Date(record.Time),
                  value: parseFloat(value),
                  device_id: selectedDevice,
                  measurement: measurement,
                });
              }
            }
          });
        });

        setTelemetryHistory(prev => ({ ...prev, ...newTelemetryHistory }));

      } catch (error) {
        toast.error(`Failed to fetch telemetry for device ${selectedDevice}`);
        console.error('Error fetching telemetry:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();

    // Auto-refresh logic
    if (autoRefresh) {
      const interval = setInterval(fetchTelemetry, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedDevice, timeRange, autoRefresh, token]);


  const handleDeviceChange = (event) => {
    const deviceId = event.target.value;
    if (selectedDevice) {
      unsubscribeFromDevice(selectedDevice);
    }

    setSelectedDevice(deviceId);

    if (deviceId) {
      subscribeToDevice(deviceId);
    }
  };

  const getTimeRangeDates = (range) => {
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
    return { startTime, endTime: now };
  }

  const handleTimeRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setTimeRange(newRange);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const getFilteredChartData = () => {
    // Legacy function - now handled by CustomChart component
    return { datasets: [] };
  };

  const getRealtimeStats = () => {
    if (!selectedDevice || !telemetryHistory[selectedDevice]) {
      return [];
    }

    const stats = [];
    const deviceMeasurements = telemetryHistory[selectedDevice];

    for (const measurement in deviceMeasurements) {
      if (deviceMeasurements.hasOwnProperty(measurement)) {
        const latestData = deviceMeasurements[measurement]?.slice(-1)[0];
        stats.push({
          device: { ...devices.find(d => d.id === selectedDevice), name: `${devices.find(d => d.id === selectedDevice)?.name} - ${measurement}` },
          value: latestData?.value || 0,
          timestamp: latestData?.timestamp || new Date(),
        });
      }
    }
    return stats;
  };

  const handleExport = async (format) => {
    setLoading(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const dataToExport = telemetryHistory[selectedDevice] || {};

      if (format === 'csv') {
        // Generate CSV
        let csv = 'Device ID,Measurement,Timestamp,Value\n';
        Object.entries(dataToExport).forEach(([measurement, records]) => {
          records.forEach(record => {
            csv += `${selectedDevice},${measurement},${record.timestamp.toISOString()},${record.value}\n`;
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
        const json = JSON.stringify(dataToExport, null, 2);
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

  // eslint-disable-next-line no-unused-vars
  const chartOptions = {
    // Legacy options - now handled by ECharts in CustomChart component
    responsive: true,
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
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="device-select-label">Device</InputLabel>
              <Select
                labelId="device-select-label"
                id="device-select"
                value={selectedDevice || ''}
                label="Device"
                onChange={handleDeviceChange}
              >
                {devices.map((device) => (
                  <MenuItem key={device.id} value={device.id}>
                    {device.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
              onClick={() => {
                // Manually trigger a refresh
                const fetchTelemetry = async () => {
                  if (!selectedDevice) return;

                  setLoading(true);
                  try {
                    const now = new Date();
                    const { startTime } = getTimeRangeDates(timeRange);

                    // Use the correct API endpoint that matches your backend
                    const telemetryResponse = await api.get(`/telemetry/${selectedDevice}`, {
                      headers: { Authorization: `Bearer ${token}` },
                      params: {
                        start_date: startTime.toISOString(),
                        end_date: now.toISOString(),
                        limit: 1000,
                      }
                    });

                    // Process the telemetry data from IoTDB format
                    const telemetryData = telemetryResponse.data.telemetry || [];
                    console.log('Refreshed telemetry data:', telemetryData);

                    const newTelemetryHistory = {};
                    if (!newTelemetryHistory[selectedDevice]) {
                      newTelemetryHistory[selectedDevice] = {};
                    }

                    // Group data by measurement type
                    telemetryData.forEach(record => {
                      // Extract measurements from the record (excluding Time and timestamp fields)
                      Object.keys(record).forEach(key => {
                        if (key !== 'Time' && key !== 'timestamp') {
                          const measurement = key;
                          const value = record[key];

                          if (value !== null && value !== undefined) {
                            if (!newTelemetryHistory[selectedDevice][measurement]) {
                              newTelemetryHistory[selectedDevice][measurement] = [];
                            }

                            newTelemetryHistory[selectedDevice][measurement].push({
                              timestamp: new Date(record.Time),
                              value: parseFloat(value),
                              device_id: selectedDevice,
                              measurement: measurement,
                            });
                          }
                        }
                      });
                    });

                    setTelemetryHistory(prev => ({ ...prev, ...newTelemetryHistory }));

                  } catch (error) {
                    toast.error(`Failed to fetch telemetry for device ${selectedDevice}`);
                    console.error('Error fetching telemetry:', error);
                  } finally {
                    setLoading(false);
                  }
                };
                fetchTelemetry();
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Controls */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel id="measurement-filter-label">Measurement</InputLabel>
                <Select
                  labelId="measurement-filter-label"
                  id="measurement-filter"
                  value={measurementFilter}
                  label="Measurement"
                  onChange={e => setMeasurementFilter(e.target.value)}
                >
                  <MenuItem value="all">All Measurements</MenuItem>
                  {availableMeasurements.map(m => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <ToggleButtonGroup
                value={timeRange}
                exclusive
                onChange={handleTimeRangeChange}
                aria-label="time range"
              >
                <ToggleButton value="15m" aria-label="15 minutes">15m</ToggleButton>
                <ToggleButton value="1h" aria-label="1 hour">1h</ToggleButton>
                <ToggleButton value="6h" aria-label="6 hours">6h</ToggleButton>
                <ToggleButton value="24h" aria-label="24 hours">24h</ToggleButton>
                <ToggleButton value="7d" aria-label="7 days">7d</ToggleButton>
              </ToggleButtonGroup>
              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={(e, newType) => newType && setChartType(newType)}
                aria-label="chart type"
              >
                <ToggleButton value="line" aria-label="line chart">
                  <Timeline />
                </ToggleButton>
                <ToggleButton value="spline" aria-label="spline chart">
                  <Timeline />
                </ToggleButton>
                <ToggleButton value="area" aria-label="area chart">
                  <Timeline />
                </ToggleButton>
                <ToggleButton value="bar" aria-label="bar chart">
                  <BarChart />
                </ToggleButton>
                <ToggleButton value="scatter" aria-label="scatter chart">
                  <i className="fas fa-chart-scatter" style={{ fontSize: '1.25rem' }}></i>
                </ToggleButton>
              </ToggleButtonGroup>
              <ToggleButton
                value="check"
                selected={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)}
              >
                Auto-Refresh
              </ToggleButton>
            </Box>
          </CardContent>
        </Card>

        {loading && <CircularProgress sx={{ display: 'block', margin: 'auto', my: 4 }} />}

        {!loading && selectedDevice && (
          <>
            {/* Real-time Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {getRealtimeStats().map((stat, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <MetricCard {...stat} />
                </Grid>
              ))}
            </Grid>

            {/* Main Chart */}
            <Card>
              <CardContent>
                {telemetryHistory[selectedDevice] && Object.keys(telemetryHistory[selectedDevice]).length > 0 ? (
                  <CustomChart
                    chartConfig={{
                      id: 'main-telemetry-chart',
                      name: `${devices.find(d => d.id === selectedDevice)?.name || 'Device'} - ${measurementFilter === 'all' ? 'All Measurements' : measurementFilter}`,
                      type: chartType,
                      measurements: measurementFilter === 'all' 
                        ? Object.keys(telemetryHistory[selectedDevice]) 
                        : [measurementFilter],
                      timeRange: timeRange,
                      showLegend: true,
                      showGrid: true,
                      animations: true,
                      refreshInterval: autoRefresh ? 30 : null,
                      devices: [selectedDevice],
                      dataTypes: measurementFilter === 'all' 
                        ? Object.keys(telemetryHistory[selectedDevice]) 
                        : [measurementFilter]
                    }}
                    telemetryData={
                      measurementFilter === 'all'
                        ? Object.keys(telemetryHistory[selectedDevice]).map(m => 
                            telemetryHistory[selectedDevice][m] || []
                          )
                        : [telemetryHistory[selectedDevice][measurementFilter] || []]
                    }
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                ) : (
                  <Box sx={{ 
                    height: 400, 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'background.paper',
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                      No Telemetry Data Available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedDevice ? 'No data found for the selected time range' : 'Please select a device'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Custom Charts */}
            <Box sx={{ mt: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h2">
                  Custom Analytics Charts
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddChart}
                >
                  Add Custom Chart
                </Button>
              </Box>

              {customCharts.length > 0 ? (
                <Grid container spacing={3}>
                  {customCharts.map(chart => {
                    const telemetryForMeasurements = chart.measurements?.map(m =>
                      telemetryHistory[selectedDevice]?.[m] || []
                    ) || [];
                    
                    return (
                      <Grid item xs={12} md={6} lg={4} key={chart.id}>
                        {telemetryForMeasurements.length > 0 && telemetryForMeasurements.some(data => data.length > 0) ? (
                          <CustomChart
                            chartConfig={chart}
                            telemetryData={telemetryForMeasurements}
                            onEdit={handleEditChart}
                            onDelete={handleDeleteChart}
                          />
                        ) : (
                          <Card sx={{ position: 'relative', minHeight: 350 }}>
                            <IconButton
                              sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                              onClick={(e) => handleChartMenuOpen(e, chart)}
                            >
                              <MoreVert />
                            </IconButton>
                            <CardContent sx={{ 
                              height: '100%', 
                              display: 'flex', 
                              flexDirection: 'column',
                              alignItems: 'center', 
                              justifyContent: 'center' 
                            }}>
                              <Alert severity="warning" sx={{ mb: 2 }}>
                                No telemetry data available for measurement(s): {chart.measurements?.join(', ') || 'N/A'}
                              </Alert>
                              <Typography variant="h6" sx={{ mb: 1 }}>{chart.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Chart Type: {chart.type} | Time Range: {chart.timeRange}
                              </Typography>
                            </CardContent>
                          </Card>
                        )}
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <Alert severity="info">No custom charts created yet. Click "Add Chart" to get started.</Alert>
              )}
            </Box>
          </>
        )}

        {!loading && !selectedDevice && (
          <Alert severity="info">Please select a device to view telemetry.</Alert>
        )}

        {/* Chart Menu */}
        <Menu
          anchorEl={chartMenuAnchor}
          open={Boolean(chartMenuAnchor)}
          onClose={handleChartMenuClose}
        >
          <MenuItem onClick={() => handleEditChart(selectedChartForMenu)}>
            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleDeleteChart(selectedChartForMenu.id)}>
            <ListItemIcon><Delete fontSize="small" /></ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
          <DialogTitle>Export Telemetry Data</DialogTitle>
          <DialogContent>
            <Typography>Select the format for your data export.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => handleExport('csv')} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Export as CSV'}
            </Button>
            <Button onClick={() => handleExport('json')} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Export as JSON'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Chart Customization Dialog */}
        <ChartCustomizationDialog
          open={chartCustomizationOpen}
          onClose={() => setChartCustomizationOpen(false)}
          onSaveChart={handleSaveChart}
          devices={devices}
          measurements={selectedDevice && telemetryHistory[selectedDevice] ? Object.keys(telemetryHistory[selectedDevice]) : []}
          editingChart={editingChart}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default Telemetry;
