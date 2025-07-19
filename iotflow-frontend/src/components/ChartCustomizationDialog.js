import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Switch,
  Slider,
  ColorPicker,
  Tab,
  Tabs,
  Autocomplete,
  Alert
} from '@mui/material';
import {
  Add,
  Delete,
  Preview,
  Save,
  Close,
  Palette,
  Timeline,
  BarChart,
  PieChart,
  ScatterPlot,
  ShowChart,
  TrendingUp,
  Settings,
  DeviceHub,
  TableChart,
  Map,
  ControlPoint,
  Input,
  Event,
  ElectricBolt,
  Industry as FactoryIcon,
  Speed,
  Thermostat,
  BatteryFull,
  SignalWifi4Bar,
  RotateRight,
  Power,
  LinearScale as LinearScaleIcon,
  CompareArrows,
  ViewModule,
  AccountTree,
  Functions,
  CalendarToday,
  Schedule,
  WbSunny,
  AcUnit,
  Opacity,
  Air,
  FilterAlt,
  MonitorHeart,
  Memory,
  Router,
  Sensors,
  Engineering,
  ElectricalServices,
  WaterDrop,
  LocalGasStation,
  Brightness1,
  RadioButtonChecked,
  ToggleOn,
  Tune,
  TouchApp,
  SmartButton,
  Navigation,
  DateRange,
  QueryStats,
  Assessment,
  Dashboard,
  ViewList,
  GridView,
  Analytics,
  ShowChartSharp,
  DonutLarge,
  PieChartOutline,
  ScatterPlotSharp,
  BubbleChart,
  ViewCompact,
  TableRows,
  ViewStream,
  MapOutlined,
  LocationOn,
  Public,
  Explore,
  Gamepad,
  Edit,
  Send,
  Update,
  Timer,
  EventNote,
  PowerSettingsNew,
  Bolt,
  Factory,
  Compress,
  Waves,
  OfflineBolt
} from '@mui/icons-material';
import { HexColorPicker } from 'react-colorful';
import { Line, Bar, Pie, Scatter, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import toast from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  TimeScale
);

const ChartCustomizationDialog = ({ 
  open, 
  onClose, 
  devices = [], 
  onSaveChart, 
  editingChart = null 
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [chartConfig, setChartConfig] = useState({
    id: null,
    name: '',
    type: 'line',
    title: '',
    description: '',
    devices: [],
    dataTypes: [],
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
    groupBy: 'device'
  });

  const [availableDataTypes] = useState([
    { value: 'temperature', label: 'Temperature', unit: '°C' },
    { value: 'humidity', label: 'Humidity', unit: '%' },
    { value: 'pressure', label: 'Pressure', unit: 'hPa' },
    { value: 'vibration', label: 'Vibration', unit: 'mm/s' },
    { value: 'light', label: 'Light Level', unit: 'lux' },
    { value: 'voltage', label: 'Voltage', unit: 'V' },
    { value: 'current', label: 'Current', unit: 'A' },
    { value: 'power', label: 'Power', unit: 'W' },
    { value: 'flow_rate', label: 'Flow Rate', unit: 'L/min' },
    { value: 'rpm', label: 'RPM', unit: 'rpm' },
    { value: 'distance', label: 'Distance', unit: 'cm' },
    { value: 'ph', label: 'pH Level', unit: 'pH' },
    { value: 'co2', label: 'CO2 Level', unit: 'ppm' },
    { value: 'noise', label: 'Noise Level', unit: 'dB' }
  ]);

  const chartTypes = [
    // Timeseries Widgets
    { value: 'line', label: 'Timeseries Line Chart', icon: <Timeline />, category: 'Timeseries' },
    { value: 'spline', label: 'Timeseries Spline Chart', icon: <ShowChart />, category: 'Timeseries' },
    { value: 'bar', label: 'Timeseries Bar Chart', icon: <BarChart />, category: 'Timeseries' },
    { value: 'area', label: 'Area Chart', icon: <Timeline />, category: 'Timeseries' },
    { value: 'stacked-bar', label: 'Stacked Bar Chart', icon: <BarChart />, category: 'Timeseries' },
    { value: 'state', label: 'State Chart', icon: <Timeline />, category: 'Timeseries' },
    { value: 'timeseries-table-new', label: 'Timeseries Table', icon: <TableChart />, category: 'Timeseries' },
    { value: 'flot-bar', label: 'Flot Bar Chart', icon: <BarChart />, category: 'Timeseries' },
    { value: 'flot-line', label: 'Flot Line Chart', icon: <ShowChart />, category: 'Timeseries' },
    
    // Charts Widgets
    { value: 'pie', label: 'Pie Chart', icon: <PieChart />, category: 'Charts' },
    { value: 'doughnut', label: 'Doughnut Chart', icon: <DonutLarge />, category: 'Charts' },
    { value: 'polar-area', label: 'Polar Area Chart', icon: <PieChartOutline />, category: 'Charts' },
    { value: 'radar', label: 'Radar Chart', icon: <DeviceHub />, category: 'Charts' },
    { value: 'scatter', label: 'Scatter Plot', icon: <ScatterPlot />, category: 'Charts' },
    { value: 'bubble', label: 'Bubble Chart', icon: <BubbleChart />, category: 'Charts' },
    { value: 'heatmap', label: 'Heat Map', icon: <GridView />, category: 'Charts' },
    { value: 'flot-pie', label: 'Flot Pie Chart', icon: <PieChart />, category: 'Charts' },
    { value: 'chartjs-bar', label: 'Chart.js Bar', icon: <BarChart />, category: 'Charts' },
    { value: 'chartjs-line', label: 'Chart.js Line', icon: <ShowChart />, category: 'Charts' },
    { value: 'chartjs-doughnut', label: 'Chart.js Doughnut', icon: <DonutLarge />, category: 'Charts' },
    
    // Analog Gauges
    { value: 'gauge', label: 'Analog Gauge', icon: <Speed />, category: 'Analog Gauges' },
    { value: 'compass', label: 'Compass', icon: <Explore />, category: 'Analog Gauges' },
    { value: 'thermometer', label: 'Thermometer Scale', icon: <Thermostat />, category: 'Analog Gauges' },
    { value: 'linear-gauge', label: 'Linear Gauge', icon: <LinearScaleIcon />, category: 'Analog Gauges' },
    { value: 'radial-gauge', label: 'Radial Gauge', icon: <RadioButtonChecked />, category: 'Analog Gauges' },
    
    // Digital Gauges  
    { value: 'digital-gauge', label: 'Digital Gauge', icon: <Assessment />, category: 'Digital Gauges' },
    { value: 'digital-thermometer', label: 'Digital Thermometer', icon: <Thermostat />, category: 'Digital Gauges' },
    { value: 'tank-level', label: 'Tank Level', icon: <WaterDrop />, category: 'Digital Gauges' },
    { value: 'battery-level', label: 'Battery Level', icon: <BatteryFull />, category: 'Digital Gauges' },
    { value: 'signal-strength', label: 'Signal Strength', icon: <SignalWifi4Bar />, category: 'Digital Gauges' },
    { value: 'speedometer', label: 'Speedometer', icon: <Speed />, category: 'Digital Gauges' },
    { value: 'level', label: 'Level Indicator', icon: <CompareArrows />, category: 'Digital Gauges' },
    { value: 'simple-gauge', label: 'Simple Gauge', icon: <Brightness1 />, category: 'Digital Gauges' },
    
    // Cards Widgets
    { value: 'value-card', label: 'Value Card', icon: <ViewModule />, category: 'Cards' },
    { value: 'simple-card', label: 'Simple Card', icon: <ViewCompact />, category: 'Cards' },
    { value: 'entities-hierarchy', label: 'Entities Hierarchy', icon: <AccountTree />, category: 'Cards' },
    { value: 'aggregation-card', label: 'Aggregation Card', icon: <Functions />, category: 'Cards' },
    { value: 'count-card', label: 'Count Card', icon: <QueryStats />, category: 'Cards' },
    { value: 'label-card', label: 'Label Value Card', icon: <ViewModule />, category: 'Cards' },
    { value: 'multiple-input', label: 'Multiple Input Widgets', icon: <ViewList />, category: 'Cards' },
    { value: 'html-card', label: 'HTML Value Card', icon: <ViewModule />, category: 'Cards' },
    
    // Tables
    { value: 'entities-table', label: 'Entities Table', icon: <TableChart />, category: 'Tables' },
    { value: 'timeseries-table', label: 'Timeseries Table', icon: <TableRows />, category: 'Tables' },
    { value: 'latest-values', label: 'Latest Values', icon: <ViewList />, category: 'Tables' },
    { value: 'alarms-table', label: 'Alarms Table', icon: <TableChart />, category: 'Tables' },
    { value: 'advanced-table', label: 'Advanced Table', icon: <ViewStream />, category: 'Tables' },
    
    // Maps
    { value: 'openstreet-map', label: 'OpenStreet Map', icon: <MapOutlined />, category: 'Maps' },
    { value: 'google-map', label: 'Google Map', icon: <Public />, category: 'Maps' },
    { value: 'image-map', label: 'Image Map', icon: <LocationOn />, category: 'Maps' },
    { value: 'route-map', label: 'Route Map', icon: <Navigation />, category: 'Maps' },
    { value: 'trip-animation', label: 'Trip Animation', icon: <Timeline />, category: 'Maps' },
    { value: 'here-map', label: 'Here Map', icon: <Map />, category: 'Maps' },
    { value: 'tencent-map', label: 'Tencent Map', icon: <Map />, category: 'Maps' },
    
    // Control Widgets
    { value: 'knob-control', label: 'Knob Control', icon: <RotateRight />, category: 'Control' },
    { value: 'switch-control', label: 'Switch Control', icon: <ToggleOn />, category: 'Control' },
    { value: 'button-control', label: 'Button Control', icon: <SmartButton />, category: 'Control' },
    { value: 'slider-control', label: 'Slider Control', icon: <Tune />, category: 'Control' },
    { value: 'round-switch', label: 'Round Switch', icon: <RadioButtonChecked />, category: 'Control' },
    { value: 'persistent-table', label: 'Persistent Add/Remove Table', icon: <TableChart />, category: 'Control' },
    { value: 'led-indicator', label: 'LED Indicator', icon: <Brightness1 />, category: 'Control' },
    { value: 'multiple-input-control', label: 'Multiple Input', icon: <Input />, category: 'Control' },
    
    // Input Widgets
    { value: 'update-attribute', label: 'Update Attribute', icon: <Update />, category: 'Input' },
    { value: 'send-rpc', label: 'Send RPC', icon: <Send />, category: 'Input' },
    { value: 'command-button', label: 'Command Button', icon: <TouchApp />, category: 'Input' },
    { value: 'edge-rpc', label: 'Edge RPC', icon: <Router />, category: 'Input' },
    
    // Date/Time & Navigation
    { value: 'date-range-navigator', label: 'Date Range Navigator', icon: <DateRange />, category: 'Navigation' },
    { value: 'timespan-selector', label: 'Timespan Selector', icon: <Timer />, category: 'Navigation' },
    { value: 'navigation-card', label: 'Navigation Card', icon: <Navigation />, category: 'Navigation' },
    
    // Scheduling
    { value: 'scheduler-events', label: 'Scheduler Events', icon: <EventNote />, category: 'Scheduling' },
    { value: 'calendar-events', label: 'Calendar Scheduler', icon: <CalendarToday />, category: 'Scheduling' },
    
    // Energy
    { value: 'power-button', label: 'Power Button', icon: <PowerSettingsNew />, category: 'Energy' },
    { value: 'energy-meter', label: 'Energy Meter', icon: <ElectricalServices />, category: 'Energy' },
    { value: 'solar-panel', label: 'Solar Panel', icon: <WbSunny />, category: 'Energy' },
    
    // Industrial
    { value: 'liquid-level', label: 'Liquid Level', icon: <WaterDrop />, category: 'Industrial' },
    { value: 'wind-turbine', label: 'Wind Turbine', icon: <Air />, category: 'Industrial' },
    { value: 'motor-controller', label: 'Motor Controller', icon: <Engineering />, category: 'Industrial' },
    { value: 'valve-controller', label: 'Valve Controller', icon: <FilterAlt />, category: 'Industrial' },
    { value: 'pump-controller', label: 'Pump Controller', icon: <Compress />, category: 'Industrial' },
    { value: 'industrial-gauge', label: 'Industrial Gauge', icon: <Factory />, category: 'Industrial' },
    
    // Gateway
    { value: 'gateway-remote-shell', label: 'Gateway Remote Shell', icon: <Router />, category: 'Gateway' },
    { value: 'gateway-config', label: 'Gateway Configuration', icon: <Settings />, category: 'Gateway' },
    
    // Alarm
    { value: 'alarm-widget', label: 'Alarm Widget', icon: <MonitorHeart />, category: 'Alarm' },
    { value: 'alarm-table', label: 'Alarm Table', icon: <TableChart />, category: 'Alarm' },
    
    // System
    { value: 'device-claiming', label: 'Device Claiming', icon: <DeviceHub />, category: 'System' },
    { value: 'entity-admin', label: 'Entity Admin', icon: <Settings />, category: 'System' },
    { value: 'json-input', label: 'JSON Input', icon: <Memory />, category: 'System' },
    
    // Sensor Data
    { value: 'temperature-humidity', label: 'Temperature & Humidity', icon: <Thermostat />, category: 'Sensors' },
    { value: 'environmental', label: 'Environmental Sensors', icon: <Sensors />, category: 'Sensors' },
    { value: 'gas-sensor', label: 'Gas Sensor', icon: <LocalGasStation />, category: 'Sensors' },
    { value: 'vibration-sensor', label: 'Vibration Sensor', icon: <Waves />, category: 'Sensors' },
    { value: 'electrical-meter', label: 'Electrical Meter', icon: <OfflineBolt />, category: 'Sensors' }
  ];

  // Widget categories
  const categories = [
    'All',
    'Timeseries',
    'Charts', 
    'Analog Gauges',
    'Digital Gauges',
    'Cards',
    'Tables',
    'Maps',
    'Control',
    'Input',
    'Navigation',
    'Scheduling',
    'Energy',
    'Industrial',
    'Gateway',
    'Alarm',
    'System',
    'Sensors'
  ];

  // Filter chart types by category
  const filteredChartTypes = selectedCategory === 'All' 
    ? chartTypes 
    : chartTypes.filter(type => type.category === selectedCategory);

  const timeRanges = [
    { value: '15m', label: 'Last 15 minutes' },
    { value: '1h', label: 'Last 1 hour' },
    { value: '6h', label: 'Last 6 hours' },
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const aggregationTypes = [
    { value: 'none', label: 'No Aggregation' },
    { value: 'avg', label: 'Average' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'sum', label: 'Sum' },
    { value: 'count', label: 'Count' }
  ];

  useEffect(() => {
    if (editingChart) {
      setChartConfig({ ...editingChart });
    } else {
      // Reset to default when creating new chart
      setChartConfig({
        id: null,
        name: '',
        type: 'line',
        title: '',
        description: '',
        devices: [],
        dataTypes: [],
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
        groupBy: 'device'
      });
    }
  }, [editingChart, open]);

  const handleConfigChange = (field, value) => {
    setChartConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeviceToggle = (deviceId) => {
    const currentDevices = chartConfig.devices || [];
    const isSelected = currentDevices.includes(deviceId);
    
    if (isSelected) {
      handleConfigChange('devices', currentDevices.filter(d => d !== deviceId));
    } else {
      handleConfigChange('devices', [...currentDevices, deviceId]);
    }
  };

  const handleDataTypeToggle = (dataType) => {
    const currentTypes = chartConfig.dataTypes || [];
    const isSelected = currentTypes.includes(dataType);
    
    if (isSelected) {
      handleConfigChange('dataTypes', currentTypes.filter(t => t !== dataType));
    } else {
      handleConfigChange('dataTypes', [...currentTypes, dataType]);
    }
  };

  const generatePreviewData = () => {
    if (!chartConfig.devices.length || !chartConfig.dataTypes.length) {
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

      chartConfig.dataTypes.forEach((dataType, typeIndex) => {
        const dataTypeInfo = availableDataTypes.find(dt => dt.value === dataType);
        if (!dataTypeInfo) return;

        const color = chartConfig.customColors[deviceIndex * chartConfig.dataTypes.length + typeIndex] || 
                     `hsl(${(deviceIndex * 360 / chartConfig.devices.length + typeIndex * 60) % 360}, 70%, 50%)`;

        const data = labels.map(() => {
          // Generate realistic sample data based on data type
          switch (dataType) {
            case 'temperature':
              return 20 + Math.random() * 10;
            case 'humidity':
              return 40 + Math.random() * 40;
            case 'pressure':
              return 1000 + Math.random() * 50;
            default:
              return Math.random() * 100;
          }
        });

        datasets.push({
          label: `${device.name} - ${dataTypeInfo.label}`,
          data: data,
          borderColor: color,
          backgroundColor: chartConfig.fillArea ? color + '20' : color,
          fill: chartConfig.fillArea,
          borderWidth: chartConfig.lineWidth,
          pointStyle: chartConfig.pointStyle,
          tension: 0.4
        });
      });
    });

    return { labels, datasets };
  };

  const renderPreviewChart = () => {
    const data = generatePreviewData();
    if (!data) {
      return (
        <Alert severity="info">
          Select devices and data types to see preview
        </Alert>
      );
    }

    const options = {
      responsive: true,
      aspectRatio: chartConfig.aspectRatio,
      plugins: {
        legend: {
          display: chartConfig.showLegend,
        },
        title: {
          display: !!chartConfig.title,
          text: chartConfig.title,
        },
      },
      scales: {
        y: {
          grid: {
            display: chartConfig.showGrid,
          },
          min: chartConfig.yAxisMin,
          max: chartConfig.yAxisMax,
        },
        x: {
          grid: {
            display: chartConfig.showGrid,
          },
        },
      },
      animation: {
        duration: chartConfig.animations ? 750 : 0,
      },
    };

    const ChartComponent = {
      line: Line,
      bar: Bar,
      area: Line,
      scatter: Scatter,
      pie: Pie,
      doughnut: Doughnut
    }[chartConfig.type] || Line;

    return (
      <Box sx={{ height: 300 }}>
        <ChartComponent data={data} options={options} />
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

    if (!chartConfig.dataTypes.length) {
      toast.error('Please select at least one data type');
      return;
    }

    const chartToSave = {
      ...chartConfig,
      id: editingChart?.id || Date.now().toString(),
      createdAt: editingChart?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveChart(chartToSave);
    onClose();
    toast.success(`Chart "${chartConfig.name}" ${editingChart ? 'updated' : 'created'} successfully`);
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
              onChange={(e) => handleConfigChange('name', e.target.value)}
              placeholder="e.g., Temperature Monitoring"
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Chart Title"
              value={chartConfig.title}
              onChange={(e) => handleConfigChange('title', e.target.value)}
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
              onChange={(e) => handleConfigChange('description', e.target.value)}
              placeholder="Brief description of what this chart shows..."
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Widget Type Selection
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose from our comprehensive collection of ThingsBoard-style widgets
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Widget Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Widget Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
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
                onChange={(e) => handleConfigChange('type', e.target.value)}
              >
                {filteredChartTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box display="flex" alignItems="center">
                      {type.icon}
                      <Typography sx={{ ml: 1 }}>{type.label}</Typography>
                      <Chip 
                        label={type.category} 
                        size="small" 
                        sx={{ ml: 'auto', opacity: 0.7 }} 
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={chartConfig.timeRange}
                label="Time Range"
                onChange={(e) => handleConfigChange('timeRange', e.target.value)}
              >
                {timeRanges.map((range) => (
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
                onChange={(e) => handleConfigChange('aggregation', e.target.value)}
              >
                {aggregationTypes.map((agg) => (
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
              onChange={(e) => handleConfigChange('refreshInterval', parseInt(e.target.value))}
              inputProps={{ min: 5, max: 300 }}
            />
          </Grid>
        </Grid>
      )
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
              {devices.map((device) => (
                <Grid item key={device.id}>
                  <Chip
                    label={device.name}
                    onClick={() => handleDeviceToggle(device.id)}
                    color={chartConfig.devices?.includes(device.id) ? 'primary' : 'default'}
                    variant={chartConfig.devices?.includes(device.id) ? 'filled' : 'outlined'}
                    icon={<DeviceHub />}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Select Data Types
            </Typography>
            <Grid container spacing={1}>
              {availableDataTypes.map((dataType) => (
                <Grid item key={dataType.value}>
                  <Chip
                    label={`${dataType.label} (${dataType.unit})`}
                    onClick={() => handleDataTypeToggle(dataType.value)}
                    color={chartConfig.dataTypes?.includes(dataType.value) ? 'secondary' : 'default'}
                    variant={chartConfig.dataTypes?.includes(dataType.value) ? 'filled' : 'outlined'}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>

          {chartConfig.devices?.length > 0 && chartConfig.dataTypes?.length > 0 && (
            <Grid item xs={12}>
              <Alert severity="info">
                This chart will display {chartConfig.devices.length} device(s) × {chartConfig.dataTypes.length} data type(s) = {chartConfig.devices.length * chartConfig.dataTypes.length} data series
              </Alert>
            </Grid>
          )}
        </Grid>
      )
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
                  onChange={(e) => handleConfigChange('showLegend', e.target.checked)}
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
                  onChange={(e) => handleConfigChange('showGrid', e.target.checked)}
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
                  onChange={(e) => handleConfigChange('animations', e.target.checked)}
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
                  onChange={(e) => handleConfigChange('fillArea', e.target.checked)}
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
                { value: 4, label: '4:1' }
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
              onChange={(e) => handleConfigChange('yAxisMin', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="Auto"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Y-Axis Maximum"
              type="number"
              value={chartConfig.yAxisMax || ''}
              onChange={(e) => handleConfigChange('yAxisMax', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="Auto"
            />
          </Grid>
        </Grid>
      )
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
      )
    }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
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
              <Tab
                key={index}
                label={panel.label}
                icon={panel.icon}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ mt: 2 }}>
          {tabPanels[activeTab]?.content}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<Save />}
        >
          {editingChart ? 'Update Chart' : 'Create Chart'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChartCustomizationDialog;
