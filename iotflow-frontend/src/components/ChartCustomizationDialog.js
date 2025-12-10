import {
  AccountTree,
  Assessment,
  BarChart,
  BatteryFull,
  Brightness1,
  BubbleChart,
  CalendarToday,
  Close,
  CompareArrows,
  DateRange,
  DeviceHub,
  DonutLarge,
  GridView,
  LocalGasStation,
  Map,
  MapOutlined,
  Navigation,
  Palette,
  PieChart,
  Preview,
  Save,
  ScatterPlot,
  Settings,
  ShowChart,
  SignalWifi4Bar,
  Speed,
  Thermostat,
  Timeline,
  ViewCompact,
  ViewModule,
  WaterDrop,
  Waves,
  WbSunny,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const ChartCustomizationDialog = ({
  open,
  onClose,
  devices = [],
  measurements = [], // This can now be empty - we'll fetch our own
  onSaveChart,
  editingChart = null,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [availableMeasurements, setAvailableMeasurements] = useState([]);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  const [chartConfig, setChartConfig] = useState({
    id: null,
    name: '',
    type: 'line',
    title: '',
    description: '',
    devices: [],
    measurements: [], // <-- only this, remove dataTypes
    timeRange: '1h',
    refreshInterval: 30,
    showLegend: true,
    showGrid: true,
    animations: true,
    backgroundColor: '#ffffff',
    borderColor: '#1976d2',
    fillArea: false,
    pointStyle: 'circle',
    lineWidth: 2,
    aspectRatio: 2,
    yAxisMin: null,
    yAxisMax: null,
    customColors: [],
    aggregation: 'none',
    groupBy: 'device',
  });

  // Fetch available measurements for selected devices
  const fetchMeasurementsForDevices = async deviceIds => {
    if (!deviceIds || deviceIds.length === 0) {
      setAvailableMeasurements([]);
      return;
    }

    setLoadingMeasurements(true);
    const allMeasurements = new Set();

    try {
      const api = (await import('../services/api')).default;

      // Fetch recent data for each device to determine available measurements
      for (const deviceId of deviceIds) {
        try {
          const response = await api.get(`/telemetry/${deviceId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            params: {
              limit: 10, // Just get recent data to see what measurements are available
            },
          });

          const telemetryRecords = response.data.telemetry || [];

          // Extract measurement names from the records
          telemetryRecords.forEach(record => {
            Object.keys(record).forEach(key => {
              if (key !== 'Time' && key !== 'timestamp') {
                allMeasurements.add(key);
              }
            });
          });
        } catch (deviceError) {
          console.warn(`Failed to fetch measurements for device ${deviceId}:`, deviceError);
        }
      }

      setAvailableMeasurements(Array.from(allMeasurements));
    } catch (error) {
      console.error('Failed to fetch measurements:', error);
      toast.error('Failed to fetch available measurements');
      setAvailableMeasurements([]);
    } finally {
      setLoadingMeasurements(false);
    }
  };

  const chartTypes = [
    // Line & Area Charts - IMPLEMENTED
    {
      value: 'line',
      label: 'Line Chart',
      icon: <Timeline />,
      category: 'Line Charts',
      description: 'Classic line chart for time series data',
      status: 'ready',
    },
    {
      value: 'spline',
      label: 'Smooth Line Chart',
      icon: <ShowChart />,
      category: 'Line Charts',
      description: 'Curved line chart with smooth transitions',
      status: 'ready',
    },
    {
      value: 'area',
      label: 'Area Chart',
      icon: <Timeline />,
      category: 'Line Charts',
      description: 'Filled area chart showing data trends',
      status: 'ready',
    },
    {
      value: 'step-line',
      label: 'Step Line Chart',
      icon: <Timeline />,
      category: 'Line Charts',
      description: 'Step-wise line chart for discrete data',
      status: 'ready',
    },

    // Bar Charts - IMPLEMENTED
    {
      value: 'bar',
      label: 'Bar Chart',
      icon: <BarChart />,
      category: 'Bar Charts',
      description: 'Vertical bar chart for comparing values',
      status: 'ready',
    },
    {
      value: 'horizontal-bar',
      label: 'Horizontal Bar Chart',
      icon: <BarChart />,
      category: 'Bar Charts',
      description: 'Horizontal bar chart for comparing categories',
      status: 'ready',
    },
    {
      value: 'stacked-bar',
      label: 'Stacked Bar Chart',
      icon: <BarChart />,
      category: 'Bar Charts',
      description: 'Stacked bars showing data composition',
      status: 'ready',
    },
    {
      value: 'grouped-bar',
      label: 'Grouped Bar Chart',
      icon: <BarChart />,
      category: 'Bar Charts',
      description: 'Side-by-side bars for multiple series',
      status: 'ready',
    },

    // Circular Charts - IMPLEMENTED
    {
      value: 'pie',
      label: 'Pie Chart',
      icon: <PieChart />,
      category: 'Circular Charts',
      description: 'Traditional pie chart for proportional data',
      status: 'ready',
    },
    {
      value: 'doughnut',
      label: 'Doughnut Chart',
      icon: <DonutLarge />,
      category: 'Circular Charts',
      description: 'Ring-shaped chart with center space',
      status: 'ready',
    },
    {
      value: 'rose',
      label: 'Rose/Nightingale Chart',
      icon: <Brightness1 />,
      category: 'Circular Charts',
      description: 'Polar chart with varying radius',
      status: 'ready',
    },
    {
      value: 'sunburst',
      label: 'Sunburst Chart',
      icon: <WbSunny />,
      category: 'Circular Charts',
      description: 'Multi-level hierarchical chart',
      status: 'ready',
    },

    // Scientific Charts - IMPLEMENTED
    {
      value: 'scatter',
      label: 'Scatter Plot',
      icon: <ScatterPlot />,
      category: 'Scientific Charts',
      description: 'X-Y scatter plot for correlation analysis',
      status: 'ready',
    },
    {
      value: 'bubble',
      label: 'Bubble Chart',
      icon: <BubbleChart />,
      category: 'Scientific Charts',
      description: '3D scatter plot with bubble sizes',
      status: 'ready',
    },
    {
      value: 'heatmap',
      label: 'Heat Map',
      icon: <GridView />,
      category: 'Scientific Charts',
      description: 'Color-coded data matrix visualization',
      status: 'ready',
    },
    {
      value: 'candlestick',
      label: 'Candlestick Chart',
      icon: <Assessment />,
      category: 'Scientific Charts',
      description: 'OHLC financial data visualization',
      status: 'coming-soon',
    },

    // Gauges & Meters - IMPLEMENTED
    {
      value: 'gauge',
      label: 'Analog Gauge',
      icon: <Speed />,
      category: 'Gauges',
      description: 'Classic circular gauge meter',
      status: 'ready',
    },
    {
      value: 'speedometer',
      label: 'Speedometer',
      icon: <Speed />,
      category: 'Gauges',
      description: 'Automotive-style speedometer gauge',
      status: 'ready',
    },
    {
      value: 'progress-gauge',
      label: 'Progress Gauge',
      icon: <Assessment />,
      category: 'Gauges',
      description: 'Progress indicator gauge',
      status: 'ready',
    },
    {
      value: 'multi-gauge',
      label: 'Multi-Needle Gauge',
      icon: <Speed />,
      category: 'Gauges',
      description: 'Multiple values on single gauge',
      status: 'ready',
    },

    // Specialized Gauges - IMPLEMENTED
    {
      value: 'thermometer',
      label: 'Thermometer',
      icon: <Thermostat />,
      category: 'Specialized',
      description: 'Temperature display thermometer',
      status: 'ready',
    },
    {
      value: 'tank-level',
      label: 'Tank Level Indicator',
      icon: <WaterDrop />,
      category: 'Specialized',
      description: 'Liquid level indicator',
      status: 'ready',
    },
    {
      value: 'battery-level',
      label: 'Battery Level',
      icon: <BatteryFull />,
      category: 'Specialized',
      description: 'Battery charge indicator',
      status: 'ready',
    },
    {
      value: 'signal-strength',
      label: 'Signal Strength',
      icon: <SignalWifi4Bar />,
      category: 'Specialized',
      description: 'Wireless signal indicator',
      status: 'ready',
    },

    // Geographic & Network - COMING SOON
    {
      value: 'map-scatter',
      label: 'Map Scatter',
      icon: <Map />,
      category: 'Geographic',
      description: 'Geo-located data points on map',
      status: 'coming-soon',
    },
    {
      value: 'heatmap-geo',
      label: 'Geographic Heatmap',
      icon: <MapOutlined />,
      category: 'Geographic',
      description: 'Heat intensity on geographic map',
      status: 'coming-soon',
    },
    {
      value: 'network-graph',
      label: 'Network Graph',
      icon: <AccountTree />,
      category: 'Network',
      description: 'Node-link network visualization',
      status: 'coming-soon',
    },
    {
      value: 'sankey',
      label: 'Sankey Diagram',
      icon: <Waves />,
      category: 'Network',
      description: 'Flow diagram showing connections',
      status: 'coming-soon',
    },

    // Time Series Specialized - COMING SOON
    {
      value: 'timeline',
      label: 'Timeline Chart',
      icon: <Timeline />,
      category: 'Timeline',
      description: 'Event timeline visualization',
      status: 'coming-soon',
    },
    {
      value: 'gantt',
      label: 'Gantt Chart',
      icon: <DateRange />,
      category: 'Timeline',
      description: 'Project timeline and scheduling',
      status: 'coming-soon',
    },
    {
      value: 'calendar',
      label: 'Calendar Heatmap',
      icon: <CalendarToday />,
      category: 'Timeline',
      description: 'Calendar-based data visualization',
      status: 'coming-soon',
    },

    // Industrial & IoT - IMPLEMENTED
    {
      value: 'funnel',
      label: 'Funnel Chart',
      icon: <CompareArrows />,
      category: 'Industrial',
      description: 'Process funnel visualization',
      status: 'ready',
    },
    {
      value: 'radar',
      label: 'Radar Chart',
      icon: <Navigation />,
      category: 'Industrial',
      description: 'Multi-dimensional data comparison',
      status: 'ready',
    },
    {
      value: 'liquid-fill',
      label: 'Liquid Fill Gauge',
      icon: <LocalGasStation />,
      category: 'Industrial',
      description: 'Animated liquid-filled gauge',
      status: 'ready',
    },
    {
      value: 'tree',
      label: 'Tree Diagram',
      icon: <AccountTree />,
      category: 'Industrial',
      description: 'Hierarchical tree structure',
      status: 'coming-soon',
    },

    // Information Cards - IMPLEMENTED
    {
      value: 'value-card',
      label: 'Value Display Card',
      icon: <ViewModule />,
      category: 'Cards',
      description: 'Simple numeric value display',
      status: 'ready',
    },
    {
      value: 'metric-card',
      label: 'Metric Card',
      icon: <Assessment />,
      category: 'Cards',
      description: 'KPI metric with trend indicator',
      status: 'ready',
    },
    {
      value: 'status-card',
      label: 'Status Card',
      icon: <ViewCompact />,
      category: 'Cards',
      description: 'Device/system status display',
      status: 'ready',
    },
    {
      value: 'comparison-card',
      label: 'Comparison Card',
      icon: <CompareArrows />,
      category: 'Cards',
      description: 'Side-by-side value comparison',
      status: 'ready',
    },
  ];

  // Widget categories
  const categories = [
    'All',
    'Ready Now',
    'Line Charts',
    'Bar Charts',
    'Circular Charts',
    'Scientific Charts',
    'Gauges',
    'Specialized',
    'Geographic',
    'Network',
    'Timeline',
    'Industrial',
    'Cards',
  ];

  // Filter chart types by category
  const filteredChartTypes =
    selectedCategory === 'All'
      ? chartTypes
      : selectedCategory === 'Ready Now'
        ? chartTypes.filter(type => type.status === 'ready')
        : chartTypes.filter(type => type.category === selectedCategory);

  const timeRanges = [
    { value: '15m', label: 'Last 15 minutes' },
    { value: '1h', label: 'Last 1 hour' },
    { value: '6h', label: 'Last 6 hours' },
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const aggregationTypes = [
    { value: 'none', label: 'No Aggregation' },
    { value: 'avg', label: 'Average' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'sum', label: 'Sum' },
    { value: 'count', label: 'Count' },
  ];

  useEffect(() => {
    if (editingChart) {
      const defaultConfig = {
        id: null,
        name: '',
        type: 'line',
        title: '',
        description: '',
        devices: [],
        measurements: [], // <-- only this, remove dataTypes
        timeRange: '1h',
        refreshInterval: 30,
        showLegend: true,
        showGrid: true,
        animations: true,
        backgroundColor: '#ffffff',
        borderColor: '#1976d2',
        fillArea: false,
        pointStyle: 'circle',
        lineWidth: 2,
        aspectRatio: 2,
        yAxisMin: null,
        yAxisMax: null,
        customColors: [],
        aggregation: 'none',
        groupBy: 'device',
      };

      const mergedConfig = { ...defaultConfig, ...editingChart };
      console.debug('[ChartCustomizationDialog] Setting config for editing:', mergedConfig);
      console.debug('[ChartCustomizationDialog] Devices from editingChart:', editingChart.devices);
      console.debug('[ChartCustomizationDialog] Available devices:', devices);

      setChartConfig(mergedConfig);
      const foundType = chartTypes.find(t => t.value === (editingChart.type || 'line'));
      setSelectedCategory(foundType ? foundType.category : 'Ready Now');

      // Fetch measurements for the devices in the chart being edited
      if (editingChart.devices && editingChart.devices.length > 0) {
        console.debug(
          '[ChartCustomizationDialog] Fetching measurements for devices:',
          editingChart.devices
        );
        fetchMeasurementsForDevices(editingChart.devices);
      }
    } else {
      setChartConfig({
        id: null,
        name: '',
        type: 'line',
        title: '',
        description: '',
        devices: [],
        measurements: [], // <-- only this, remove dataTypes
        timeRange: '1h',
        refreshInterval: 30,
        showLegend: true,
        showGrid: true,
        animations: true,
        backgroundColor: '#ffffff',
        borderColor: '#1976d2',
        fillArea: false,
        pointStyle: 'circle',
        lineWidth: 2,
        aspectRatio: 2,
        yAxisMin: null,
        yAxisMax: null,
        customColors: [],
        aggregation: 'none',
        groupBy: 'device',
      });
      setSelectedCategory('Ready Now');
      setAvailableMeasurements([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingChart, open, devices]); // Add devices as dependency

  const handleConfigChange = (field, value) => {
    setChartConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDeviceToggle = deviceId => {
    const currentDevices = chartConfig.devices || [];
    // Ensure consistent data types for comparison
    const deviceIdString = String(deviceId);
    const currentDevicesStrings = currentDevices.map(id => String(id));
    const isSelected = currentDevicesStrings.includes(deviceIdString);

    console.debug('[ChartCustomizationDialog] Device toggle:', {
      deviceId,
      deviceIdString,
      currentDevices,
      currentDevicesStrings,
      isSelected,
      allDevices: devices.map(d => ({ id: d.id, name: d.name })),
    });

    let newDevices;
    if (isSelected) {
      // Remove device (keep original data types)
      newDevices = currentDevices.filter(id => String(id) !== deviceIdString);
    } else {
      // Add device (use original data type from device list)
      newDevices = [...currentDevices, deviceId];
    }

    console.debug('[ChartCustomizationDialog] New devices:', newDevices);
    handleConfigChange('devices', newDevices);

    // Fetch measurements for the selected devices
    fetchMeasurementsForDevices(newDevices);
  };

  // const handleDataTypeToggle = (dataType) => {
  //   const currentTypes = chartConfig.dataTypes || [];
  //   const isSelected = currentTypes.includes(dataType);

  //   if (isSelected) {
  //     handleConfigChange('dataTypes', currentTypes.filter(t => t !== dataType));
  //   } else {
  //     handleConfigChange('dataTypes', [...currentTypes, dataType]);
  //   }
  // };

  const handleMeasurementToggle = measurement => {
    const current = chartConfig.measurements || [];
    const isSelected = current.includes(measurement);
    if (isSelected) {
      setChartConfig(prev => ({
        ...prev,
        measurements: current.filter(m => m !== measurement),
      }));
    } else {
      setChartConfig(prev => ({
        ...prev,
        measurements: [...current, measurement],
      }));
    }
  };

  const generatePreviewData = () => {
    if (!chartConfig.devices.length || !chartConfig.measurements.length) {
      return null;
    }

    const labels = [];
    const datasets = [];
    const now = new Date();

    // Generate time labels
    for (let i = 10; i >= 0; i--) {
      labels.push(new Date(now.getTime() - i * 60000).toLocaleTimeString());
    }

    // Generate datasets for each device-datatype combination
    chartConfig.devices.forEach((deviceId, deviceIndex) => {
      const device = devices.find(d => d.id === deviceId);
      if (!device) return;

      chartConfig.measurements.forEach((dataType, typeIndex) => {
        // Remove reference to availableDataTypes
        // Use the measurement string directly
        const color =
          chartConfig.customColors[deviceIndex * chartConfig.measurements.length + typeIndex] ||
          `hsl(${((deviceIndex * 360) / chartConfig.devices.length + typeIndex * 60) % 360}, 70%, 50%)`;

        const data = labels.map(() => {
          // Generate realistic sample data based on data type
          switch (dataType) {
            case 'Temperature':
            case 'temperature':
              return 20 + Math.random() * 10;
            case 'Humidity':
            case 'humidity':
              return 40 + Math.random() * 40;
            case 'Pressure':
            case 'pressure':
              return 1000 + Math.random() * 50;
            default:
              return Math.random() * 100;
          }
        });

        datasets.push({
          label: `${device.name} - ${dataType}`,
          data: data,
          borderColor: color,
          backgroundColor: chartConfig.fillArea ? color + '20' : color,
          fill: chartConfig.fillArea,
          borderWidth: chartConfig.lineWidth,
          pointStyle: chartConfig.pointStyle,
          tension: 0.4,
        });
      });
    });

    return { labels, datasets };
  };

  const renderPreviewChart = () => {
    const data = generatePreviewData();
    if (!data) {
      return <Alert severity="info">Select devices and data types to see preview</Alert>;
    }

    // Chart preview placeholder - ECharts integration coming soon
    return (
      <Box
        sx={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Chart Preview ({chartConfig.type})
        </Typography>
      </Box>
    );
  };

  const handleSave = () => {
    if (!chartConfig.name.trim()) {
      toast.error('Please enter a chart name');
      return;
    }
    if (!chartConfig.devices.length) {
      toast.error('Please select at least one device');
      return;
    }
    if (!chartConfig.measurements.length) {
      toast.error('Please select at least one measurement');
      return;
    }

    // Save chart with measurement
    const chartToSave = {
      ...chartConfig,
      // measurement: selectedMeasurement,
      id: editingChart?.id || Date.now().toString(),
      createdAt: editingChart?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveChart(chartToSave);
    onClose();
    toast.success(
      `Chart "${chartConfig.name}" ${editingChart ? 'updated' : 'created'} successfully`
    );
  };

  const tabPanels = [
    {
      label: 'Basic Settings',
      icon: <Settings />,
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Chart Name"
              value={chartConfig.name}
              onChange={e => handleConfigChange('name', e.target.value)}
              placeholder="e.g., Temperature Monitoring"
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Chart Title"
              value={chartConfig.title}
              onChange={e => handleConfigChange('title', e.target.value)}
              placeholder="e.g., Device Temperature Over Time"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={chartConfig.description}
              onChange={e => handleConfigChange('description', e.target.value)}
              placeholder="Brief description of what this chart shows..."
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Widget Type Selection
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose from our comprehensive collection of ECharts-based visualization widgets.
              Charts marked with ✓ Ready are fully implemented, while 🔄 Soon indicates features in
              development.
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Widget Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Widget Category"
                onChange={e => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={8}>
            <FormControl fullWidth>
              <InputLabel>Widget Type</InputLabel>
              <Select
                value={chartConfig.type}
                label="Widget Type"
                onChange={e => handleConfigChange('type', e.target.value)}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 400,
                    },
                  },
                }}
              >
                {filteredChartTypes.map(type => (
                  <MenuItem
                    key={type.value}
                    value={type.value}
                    disabled={type.status === 'coming-soon'}
                  >
                    <Box display="flex" flexDirection="column" width="100%" py={0.5}>
                      <Box display="flex" alignItems="center" width="100%">
                        {type.icon}
                        <Typography
                          sx={{
                            ml: 1,
                            flexGrow: 1,
                            opacity: type.status === 'coming-soon' ? 0.6 : 1,
                          }}
                        >
                          {type.label}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Chip
                            label={type.status === 'ready' ? '✓ Ready' : '🔄 Soon'}
                            size="small"
                            variant={type.status === 'ready' ? 'filled' : 'outlined'}
                            color={type.status === 'ready' ? 'success' : 'warning'}
                            sx={{ fontSize: '0.65rem', height: '20px' }}
                          />
                          <Chip
                            label={type.category}
                            size="small"
                            variant="outlined"
                            sx={{ opacity: 0.7, fontSize: '0.65rem', height: '20px' }}
                          />
                        </Box>
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          ml: 3,
                          mt: 0.5,
                          fontStyle: 'italic',
                          opacity: type.status === 'coming-soon' ? 0.6 : 1,
                        }}
                      >
                        {type.description}
                        {type.status === 'coming-soon' && ' (Implementation in progress)'}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              💡 Selected:{' '}
              {(() => {
                const selectedType = filteredChartTypes.find(t => t.value === chartConfig.type);
                if (!selectedType) return 'Select a chart type above';
                return `${selectedType.description} ${selectedType.status === 'ready' ? '(✓ Ready to use)' : '(🔄 Coming soon)'}`;
              })()}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={chartConfig.timeRange}
                label="Time Range"
                onChange={e => handleConfigChange('timeRange', e.target.value)}
              >
                {timeRanges.map(range => (
                  <MenuItem key={range.value} value={range.value}>
                    {range.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Data Aggregation</InputLabel>
              <Select
                value={chartConfig.aggregation}
                label="Data Aggregation"
                onChange={e => handleConfigChange('aggregation', e.target.value)}
              >
                {aggregationTypes.map(agg => (
                  <MenuItem key={agg.value} value={agg.value}>
                    {agg.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Refresh Interval (seconds)"
              type="number"
              value={chartConfig.refreshInterval}
              onChange={e => handleConfigChange('refreshInterval', parseInt(e.target.value))}
              inputProps={{ min: 5, max: 300 }}
            />
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'Data Sources',
      icon: <DeviceHub />,
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Select Devices
            </Typography>
            <Grid container spacing={1}>
              {devices.map(device => {
                // Ensure device ID comparison is consistent (handle both string and number types)
                const deviceId = String(device.id);
                const chartDevices = (chartConfig.devices || []).map(id => String(id));
                const isSelected = chartDevices.includes(deviceId);

                console.debug('[ChartCustomizationDialog] Rendering device chip:', {
                  deviceId: device.id,
                  deviceIdString: deviceId,
                  deviceName: device.name,
                  isSelected,
                  chartConfigDevices: chartConfig.devices,
                  chartDevicesString: chartDevices,
                });

                return (
                  <Grid item key={device.id}>
                    <Chip
                      label={device.name}
                      onClick={() => handleDeviceToggle(device.id)}
                      color={isSelected ? 'primary' : 'default'}
                      variant={isSelected ? 'filled' : 'outlined'}
                      icon={<DeviceHub />}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Select Measurements
              {loadingMeasurements && <CircularProgress size={20} sx={{ ml: 1 }} />}
            </Typography>
            {chartConfig.devices.length === 0 ? (
              <Alert severity="info" sx={{ mt: 1 }}>
                Please select devices first to see available measurements
              </Alert>
            ) : availableMeasurements.length === 0 && !loadingMeasurements ? (
              <Alert severity="warning" sx={{ mt: 1 }}>
                No measurements found for selected devices. Make sure the devices have recent
                telemetry data.
              </Alert>
            ) : (
              <Grid container spacing={1}>
                {availableMeasurements.map(m => (
                  <Grid item key={m}>
                    <Chip
                      label={m}
                      onClick={() => handleMeasurementToggle(m)}
                      color={chartConfig.measurements?.includes(m) ? 'secondary' : 'default'}
                      variant={chartConfig.measurements?.includes(m) ? 'filled' : 'outlined'}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>

          {/* <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Select Data Types
            </Typography>
            <Grid container spacing={1}>
              {measurements.map((dataType) => (
                <Grid item key={dataType}>
                  <Chip
                    label={dataType}
                    onClick={() => handleDataTypeToggle(dataType)}
                    color={chartConfig.dataTypes?.includes(dataType) ? 'secondary' : 'default'}
                    variant={chartConfig.dataTypes?.includes(dataType) ? 'filled' : 'outlined'}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid> */}

          {chartConfig.devices?.length > 0 && chartConfig.dataTypes?.length > 0 && (
            <Grid item xs={12}>
              <Alert severity="info">
                This chart will display {chartConfig.devices.length} device(s) ×{' '}
                {chartConfig.dataTypes.length} data type(s) ={' '}
                {chartConfig.devices.length * chartConfig.dataTypes.length} data series
              </Alert>
            </Grid>
          )}
        </Grid>
      ),
    },
    {
      label: 'Appearance',
      icon: <Palette />,
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={chartConfig.showLegend}
                  onChange={e => handleConfigChange('showLegend', e.target.checked)}
                />
              }
              label="Show Legend"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={chartConfig.showGrid}
                  onChange={e => handleConfigChange('showGrid', e.target.checked)}
                />
              }
              label="Show Grid"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={chartConfig.animations}
                  onChange={e => handleConfigChange('animations', e.target.checked)}
                />
              }
              label="Enable Animations"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={chartConfig.fillArea}
                  onChange={e => handleConfigChange('fillArea', e.target.checked)}
                />
              }
              label="Fill Area (Line Charts)"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Line Width</Typography>
            <Slider
              value={chartConfig.lineWidth}
              onChange={(e, value) => handleConfigChange('lineWidth', value)}
              min={1}
              max={10}
              step={1}
              marks
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Aspect Ratio</Typography>
            <Slider
              value={chartConfig.aspectRatio}
              onChange={(e, value) => handleConfigChange('aspectRatio', value)}
              min={1}
              max={4}
              step={0.1}
              marks={[
                { value: 1, label: '1:1' },
                { value: 2, label: '2:1' },
                { value: 3, label: '3:1' },
                { value: 4, label: '4:1' },
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Y-Axis Minimum"
              type="number"
              value={chartConfig.yAxisMin || ''}
              onChange={e =>
                handleConfigChange('yAxisMin', e.target.value ? parseFloat(e.target.value) : null)
              }
              placeholder="Auto"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Y-Axis Maximum"
              type="number"
              value={chartConfig.yAxisMax || ''}
              onChange={e =>
                handleConfigChange('yAxisMax', e.target.value ? parseFloat(e.target.value) : null)
              }
              placeholder="Auto"
            />
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'Preview',
      icon: <Preview />,
      content: (
        <Box>
          <Typography variant="h6" gutterBottom>
            Chart Preview
          </Typography>
          {renderPreviewChart()}
        </Box>
      ),
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="between" alignItems="center">
          <Typography variant="h5">
            {editingChart ? 'Edit Chart' : 'Create Custom Chart'}
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            {tabPanels.map((panel, index) => (
              <Tab key={index} label={panel.label} icon={panel.icon} iconPosition="start" />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ mt: 2 }}>{tabPanels[activeTab]?.content}</Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<Save />}
          disabled={!chartConfig.measurements.length}
        >
          {editingChart ? 'Update Chart' : 'Create Chart'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChartCustomizationDialog;
