import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Refresh,
  Fullscreen,
  Download,
  Settings,
  PlayArrow,
  Pause,
  ZoomIn,
  ZoomOut,
  Timeline,
  BarChart,
  PieChart,
  ScatterPlot,
  ShowChart,
  DeviceHub,
  TableChart,
  Map,
  ControlPoint,
  Input,
  Event,
  ElectricBolt,
  Factory,
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
  Send,
  Update,
  Timer,
  EventNote,
  PowerSettingsNew,
  Bolt,
  Compress,
  Waves,
  OfflineBolt
} from '@mui/icons-material';
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
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';

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

const CustomChart = ({ 
  chartConfig, 
  onEdit, 
  onDelete, 
  telemetryData = {},
  isFullscreen = false,
  onToggleFullscreen 
}) => {
  const [loading, setLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    loadChartData();
    
    if (autoRefresh && chartConfig.refreshInterval) {
      refreshIntervalRef.current = setInterval(loadChartData, chartConfig.refreshInterval * 1000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [chartConfig, autoRefresh, telemetryData]);

  const loadChartData = async () => {
    if (!chartConfig.devices?.length || !chartConfig.dataTypes?.length) {
      setError('Chart configuration incomplete');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would fetch data from the API
      // For demo purposes, we'll use the telemetryData prop or generate mock data
      const chartData = await generateChartData();
      setChartData(chartData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load chart data:', err);
      setError('Failed to load chart data');
      toast.error('Failed to update chart data');
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = async () => {
    const labels = [];
    const datasets = [];
    const now = new Date();
    
    // Generate time labels based on time range
    const timeRangeMinutes = {
      '15m': 15,
      '1h': 60,
      '6h': 360,
      '24h': 1440,
      '7d': 10080,
      '30d': 43200
    }[chartConfig.timeRange] || 60;

    const dataPoints = Math.min(timeRangeMinutes, 100); // Limit data points for performance
    const intervalMs = (timeRangeMinutes * 60 * 1000) / dataPoints;

    for (let i = dataPoints; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * intervalMs);
      if (timeRangeMinutes <= 1440) { // 24 hours or less
        labels.push(timestamp.toLocaleTimeString());
      } else {
        labels.push(timestamp.toLocaleDateString());
      }
    }

    // Generate datasets for each device-datatype combination
    const colors = [
      '#1976d2', '#dc004e', '#9c27b0', '#673ab7', '#3f51b5',
      '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
      '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
      '#ff5722', '#795548', '#9e9e9e', '#607d8b'
    ];

    let colorIndex = 0;

    for (const deviceId of chartConfig.devices) {
      for (const dataType of chartConfig.dataTypes) {
        try {
          // Try to get real data from telemetryData first
          let data = [];
          
          if (telemetryData[deviceId]) {
            // Use real telemetry data if available
            data = telemetryData[deviceId]
              .filter(point => point.type === dataType)
              .slice(-dataPoints)
              .map(point => point.value);
          }
          
          // If no real data, generate mock data
          if (data.length === 0) {
            data = labels.map((_, index) => {
              return generateMockValue(dataType, index, dataPoints);
            });
          }

          // Apply aggregation if specified
          if (chartConfig.aggregation !== 'none' && data.length > 1) {
            data = applyAggregation(data, chartConfig.aggregation);
          }

          const color = chartConfig.customColors?.[colorIndex] || colors[colorIndex % colors.length];
          const deviceName = chartConfig.devices.length === 1 ? '' : `Device ${deviceId.slice(-3)} - `;
          const dataTypeName = dataType.charAt(0).toUpperCase() + dataType.slice(1);

          datasets.push({
            label: `${deviceName}${dataTypeName}`,
            data: data,
            borderColor: color,
            backgroundColor: chartConfig.fillArea || chartConfig.type === 'pie' || chartConfig.type === 'doughnut' 
              ? color + '20' 
              : color,
            fill: chartConfig.fillArea && (chartConfig.type === 'line' || chartConfig.type === 'area'),
            borderWidth: chartConfig.lineWidth || 2,
            pointStyle: chartConfig.pointStyle || 'circle',
            pointRadius: chartConfig.type === 'scatter' ? 4 : 2,
            tension: chartConfig.type === 'line' ? 0.4 : 0,
          });

          colorIndex++;
        } catch (err) {
          console.error(`Error generating data for ${deviceId}-${dataType}:`, err);
        }
      }
    }

    return { labels, datasets };
  };

  const generateMockValue = (dataType, index, total) => {
    const baseValues = {
      temperature: 22,
      humidity: 50,
      pressure: 1013,
      vibration: 2,
      light: 500,
      voltage: 12,
      current: 2.5,
      power: 30,
      flow_rate: 15,
      rpm: 1500,
      distance: 100,
      ph: 7,
      co2: 400,
      noise: 45
    };

    const base = baseValues[dataType] || 50;
    const variation = base * 0.2; // 20% variation
    const trend = Math.sin((index / total) * Math.PI * 2) * variation * 0.5;
    const noise = (Math.random() - 0.5) * variation;
    
    return Math.max(0, base + trend + noise);
  };

  const applyAggregation = (data, aggregationType) => {
    const chunkSize = Math.max(1, Math.floor(data.length / 20)); // Aggregate into ~20 points
    const aggregated = [];
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      let value;
      
      switch (aggregationType) {
        case 'avg':
          value = chunk.reduce((sum, val) => sum + val, 0) / chunk.length;
          break;
        case 'min':
          value = Math.min(...chunk);
          break;
        case 'max':
          value = Math.max(...chunk);
          break;
        case 'sum':
          value = chunk.reduce((sum, val) => sum + val, 0);
          break;
        case 'count':
          value = chunk.length;
          break;
        default:
          value = chunk[0];
      }
      
      aggregated.push(value);
    }
    
    return aggregated;
  };

  const getChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: !isFullscreen,
      aspectRatio: isFullscreen ? undefined : (chartConfig.aspectRatio || 2),
      plugins: {
        legend: {
          display: chartConfig.showLegend !== false,
          position: 'top',
        },
        title: {
          display: !!chartConfig.title,
          text: chartConfig.title,
          font: {
            size: isFullscreen ? 18 : 14
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: chartConfig.type === 'pie' || chartConfig.type === 'doughnut' ? {} : {
        y: {
          grid: {
            display: chartConfig.showGrid !== false,
          },
          min: chartConfig.yAxisMin,
          max: chartConfig.yAxisMax,
          beginAtZero: chartConfig.yAxisMin === null && chartConfig.yAxisMax === null,
        },
        x: {
          grid: {
            display: chartConfig.showGrid !== false,
          },
        },
      },
      animation: {
        duration: chartConfig.animations !== false ? 750 : 0,
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    };
  };

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleExportChart = async () => {
    if (!chartRef.current) return;

    try {
      const canvas = await html2canvas(chartRef.current);
      const link = document.createElement('a');
      link.download = `${chartConfig.name || 'chart'}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success('Chart exported successfully');
    } catch (err) {
      console.error('Failed to export chart:', err);
      toast.error('Failed to export chart');
    }
    
    handleMenuClose();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    handleMenuClose();
  };

  const ChartComponent = {
    // Timeseries widgets
    line: Line,
    spline: Line,
    bar: Bar,
    area: Line,
    'stacked-bar': Bar,
    state: Line,
    'timeseries-table-new': Line,
    'flot-bar': Bar,
    'flot-line': Line,
    
    // Chart widgets
    scatter: Scatter,
    pie: Pie,
    doughnut: Doughnut,
    'polar-area': Pie,
    radar: Pie,
    bubble: Scatter,
    heatmap: Line, // Will need custom implementation
    'flot-pie': Pie,
    'chartjs-bar': Bar,
    'chartjs-line': Line,
    'chartjs-doughnut': Doughnut,
    
    // For other widget types, we'll render informational cards
    default: Line
  }[chartConfig.type] || Line;

  // Special rendering for non-chart widget types
  const renderSpecialWidget = () => {
    const category = getWidgetCategory(chartConfig.type);
    
    if (['Analog Gauges', 'Digital Gauges', 'Cards', 'Tables', 'Maps', 'Control', 'Input', 'Navigation', 'Scheduling', 'Energy', 'Industrial', 'Gateway', 'Alarm', 'System', 'Sensors'].includes(category)) {
      return (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          height="100%" 
          textAlign="center"
          sx={{ 
            background: 'linear-gradient(45deg, #f5f5f5 25%, transparent 25%)',
            backgroundSize: '20px 20px',
            borderRadius: 1,
            p: 2
          }}
        >
          {getWidgetIcon(chartConfig.type)}
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {getWidgetLabel(chartConfig.type)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {category} Widget
          </Typography>
          <Alert severity="info" sx={{ maxWidth: 300 }}>
            This widget type represents a preview of ThingsBoard's {category.toLowerCase()} widgets. 
            Full implementation with interactive controls and real-time data coming soon.
          </Alert>
          {chartData && chartData.datasets?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Connected to {chartConfig.devices?.length || 0} device(s)
              </Typography>
            </Box>
          )}
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            {chartConfig.dataTypes?.map(dataType => (
              <Chip 
                key={dataType} 
                label={dataType} 
                size="small" 
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      );
    }
    
    return null;
  };

  const getWidgetCategory = (type) => {
    const chartTypes = [
      // Timeseries Widgets
      { value: 'line', category: 'Timeseries' },
      { value: 'spline', category: 'Timeseries' },
      { value: 'bar', category: 'Timeseries' },
      { value: 'area', category: 'Timeseries' },
      { value: 'stacked-bar', category: 'Timeseries' },
      { value: 'state', category: 'Timeseries' },
      
      // Charts Widgets
      { value: 'pie', category: 'Charts' },
      { value: 'doughnut', category: 'Charts' },
      { value: 'polar-area', category: 'Charts' },
      { value: 'radar', category: 'Charts' },
      { value: 'scatter', category: 'Charts' },
      { value: 'bubble', category: 'Charts' },
      { value: 'heatmap', category: 'Charts' },
      
      // Other categories
      { value: 'gauge', category: 'Analog Gauges' },
      { value: 'compass', category: 'Analog Gauges' },
      { value: 'thermometer', category: 'Analog Gauges' },
      { value: 'digital-gauge', category: 'Digital Gauges' },
      { value: 'digital-thermometer', category: 'Digital Gauges' },
      { value: 'tank-level', category: 'Digital Gauges' },
      { value: 'battery-level', category: 'Digital Gauges' },
      { value: 'signal-strength', category: 'Digital Gauges' },
      { value: 'value-card', category: 'Cards' },
      { value: 'simple-card', category: 'Cards' },
      { value: 'entities-hierarchy', category: 'Cards' },
      { value: 'aggregation-card', category: 'Cards' },
      { value: 'count-card', category: 'Cards' },
      { value: 'entities-table', category: 'Tables' },
      { value: 'timeseries-table', category: 'Tables' },
      { value: 'latest-values', category: 'Tables' },
      { value: 'openstreet-map', category: 'Maps' },
      { value: 'google-map', category: 'Maps' },
      { value: 'image-map', category: 'Maps' },
      { value: 'route-map', category: 'Maps' },
      { value: 'knob-control', category: 'Control' },
      { value: 'switch-control', category: 'Control' },
      { value: 'button-control', category: 'Control' },
      { value: 'slider-control', category: 'Control' },
      { value: 'round-switch', category: 'Control' },
      { value: 'update-attribute', category: 'Input' },
      { value: 'send-rpc', category: 'Input' },
      { value: 'date-range-navigator', category: 'Navigation' },
      { value: 'timespan-selector', category: 'Navigation' },
      { value: 'scheduler-events', category: 'Scheduling' },
      { value: 'power-button', category: 'Energy' },
      { value: 'energy-meter', category: 'Energy' },
      { value: 'liquid-level', category: 'Industrial' },
      { value: 'wind-turbine', category: 'Industrial' },
      { value: 'motor-controller', category: 'Industrial' }
    ];
    
    return chartTypes.find(t => t.value === type)?.category || 'Charts';
  };

  const getWidgetLabel = (type) => {
    const labels = {
      'gauge': 'Analog Gauge',
      'compass': 'Compass',
      'thermometer': 'Thermometer Scale',
      'digital-gauge': 'Digital Gauge',
      'digital-thermometer': 'Digital Thermometer',
      'tank-level': 'Tank Level',
      'battery-level': 'Battery Level',
      'signal-strength': 'Signal Strength',
      'value-card': 'Value Card',
      'simple-card': 'Simple Card',
      'entities-hierarchy': 'Entities Hierarchy',
      'aggregation-card': 'Aggregation Card',
      'count-card': 'Count Card',
      'entities-table': 'Entities Table',
      'timeseries-table': 'Timeseries Table',
      'latest-values': 'Latest Values',
      'openstreet-map': 'OpenStreet Map',
      'google-map': 'Google Map',
      'image-map': 'Image Map',
      'route-map': 'Route Map',
      'knob-control': 'Knob Control',
      'switch-control': 'Switch Control',
      'button-control': 'Button Control',
      'slider-control': 'Slider Control',
      'round-switch': 'Round Switch',
      'update-attribute': 'Update Attribute',
      'send-rpc': 'Send RPC',
      'date-range-navigator': 'Date Range Navigator',
      'timespan-selector': 'Timespan Selector',
      'scheduler-events': 'Scheduler Events',
      'power-button': 'Power Button',
      'energy-meter': 'Energy Meter',
      'liquid-level': 'Liquid Level',
      'wind-turbine': 'Wind Turbine',
      'motor-controller': 'Motor Controller'
    };
    
    return labels[type] || type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getWidgetIcon = (type) => {
    const iconMap = {
      // Timeseries
      'line': <Timeline sx={{ fontSize: 48, color: 'primary.main' }} />,
      'spline': <ShowChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'bar': <BarChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'area': <Timeline sx={{ fontSize: 48, color: 'primary.main' }} />,
      'stacked-bar': <BarChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'state': <Timeline sx={{ fontSize: 48, color: 'primary.main' }} />,
      'timeseries-table-new': <TableChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'flot-bar': <BarChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'flot-line': <ShowChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      
      // Charts
      'pie': <PieChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'doughnut': <DonutLarge sx={{ fontSize: 48, color: 'primary.main' }} />,
      'polar-area': <PieChartOutline sx={{ fontSize: 48, color: 'primary.main' }} />,
      'radar': <DeviceHub sx={{ fontSize: 48, color: 'primary.main' }} />,
      'scatter': <ScatterPlot sx={{ fontSize: 48, color: 'primary.main' }} />,
      'bubble': <BubbleChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'heatmap': <GridView sx={{ fontSize: 48, color: 'primary.main' }} />,
      'flot-pie': <PieChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'chartjs-bar': <BarChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'chartjs-line': <ShowChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'chartjs-doughnut': <DonutLarge sx={{ fontSize: 48, color: 'primary.main' }} />,
      
      // Analog Gauges
      'gauge': <Speed sx={{ fontSize: 48, color: 'primary.main' }} />,
      'compass': <Explore sx={{ fontSize: 48, color: 'primary.main' }} />,
      'thermometer': <Thermostat sx={{ fontSize: 48, color: 'primary.main' }} />,
      'linear-gauge': <LinearScaleIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      'radial-gauge': <RadioButtonChecked sx={{ fontSize: 48, color: 'primary.main' }} />,
      
      // Digital Gauges
      'digital-gauge': <Assessment sx={{ fontSize: 48, color: 'primary.main' }} />,
      'digital-thermometer': <Thermostat sx={{ fontSize: 48, color: 'primary.main' }} />,
      'tank-level': <WaterDrop sx={{ fontSize: 48, color: 'primary.main' }} />,
      'battery-level': <BatteryFull sx={{ fontSize: 48, color: 'primary.main' }} />,
      'signal-strength': <SignalWifi4Bar sx={{ fontSize: 48, color: 'primary.main' }} />,
      'speedometer': <Speed sx={{ fontSize: 48, color: 'primary.main' }} />,
      'level': <CompareArrows sx={{ fontSize: 48, color: 'primary.main' }} />,
      'simple-gauge': <Brightness1 sx={{ fontSize: 48, color: 'primary.main' }} />,
      
      // Cards
      'value-card': <ViewModule sx={{ fontSize: 48, color: 'primary.main' }} />,
      'simple-card': <ViewCompact sx={{ fontSize: 48, color: 'primary.main' }} />,
      'entities-hierarchy': <AccountTree sx={{ fontSize: 48, color: 'primary.main' }} />,
      'aggregation-card': <Functions sx={{ fontSize: 48, color: 'primary.main' }} />,
      'count-card': <QueryStats sx={{ fontSize: 48, color: 'primary.main' }} />,
      'label-card': <ViewModule sx={{ fontSize: 48, color: 'primary.main' }} />,
      'multiple-input': <ViewList sx={{ fontSize: 48, color: 'primary.main' }} />,
      'html-card': <ViewModule sx={{ fontSize: 48, color: 'primary.main' }} />,
      
      // Tables
      'entities-table': <TableChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'timeseries-table': <TableRows sx={{ fontSize: 48, color: 'primary.main' }} />,
      'latest-values': <ViewList sx={{ fontSize: 48, color: 'primary.main' }} />,
      'alarms-table': <TableChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'advanced-table': <ViewStream sx={{ fontSize: 48, color: 'primary.main' }} />,
      
      // Maps
      'openstreet-map': <MapOutlined sx={{ fontSize: 48, color: 'primary.main' }} />,
      'google-map': <Public sx={{ fontSize: 48, color: 'primary.main' }} />,
      'image-map': <LocationOn sx={{ fontSize: 48, color: 'primary.main' }} />,
      'route-map': <Navigation sx={{ fontSize: 48, color: 'primary.main' }} />,
      'trip-animation': <Timeline sx={{ fontSize: 48, color: 'primary.main' }} />,
      'here-map': <Map sx={{ fontSize: 48, color: 'primary.main' }} />,
      'tencent-map': <Map sx={{ fontSize: 48, color: 'primary.main' }} />,
      
      // Control
      'knob-control': <RotateRight sx={{ fontSize: 48, color: 'primary.main' }} />,
      'switch-control': <ToggleOn sx={{ fontSize: 48, color: 'primary.main' }} />,
      'button-control': <SmartButton sx={{ fontSize: 48, color: 'primary.main' }} />,
      'slider-control': <Tune sx={{ fontSize: 48, color: 'primary.main' }} />,
      'round-switch': <RadioButtonChecked sx={{ fontSize: 48, color: 'primary.main' }} />,
      'persistent-table': <TableChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'led-indicator': <Brightness1 sx={{ fontSize: 48, color: 'primary.main' }} />,
      'multiple-input-control': <Input sx={{ fontSize: 48, color: 'primary.main' }} />,
      
      // Input
      'update-attribute': <Update sx={{ fontSize: 48, color: 'primary.main' }} />,
      'send-rpc': <Send sx={{ fontSize: 48, color: 'primary.main' }} />,
      'command-button': <TouchApp sx={{ fontSize: 48, color: 'primary.main' }} />,
      'edge-rpc': <Router sx={{ fontSize: 48, color: 'primary.main' }} />,
      
      // Navigation
      'date-range-navigator': <DateRange sx={{ fontSize: 48, color: 'primary.main' }} />,
      'timespan-selector': <Timer sx={{ fontSize: 48, color: 'primary.main' }} />,
      'navigation-card': <Navigation sx={{ fontSize: 48, color: 'primary.main' }} />,
      
      // Scheduling
      'scheduler-events': <EventNote sx={{ fontSize: 48, color: 'primary.main' }} />,
      'calendar-events': <CalendarToday sx={{ fontSize: 48, color: 'primary.main' }} />,
      
      // Energy
      'power-button': <PowerSettingsNew sx={{ fontSize: 48, color: 'primary.main' }} />,
      'energy-meter': <ElectricalServices sx={{ fontSize: 48, color: 'primary.main' }} />,
      'solar-panel': <WbSunny sx={{ fontSize: 48, color: 'primary.main' }} />,
      
      // Industrial
      'liquid-level': <WaterDrop sx={{ fontSize: 48, color: 'primary.main' }} />,
      'wind-turbine': <Air sx={{ fontSize: 48, color: 'primary.main' }} />,
      'motor-controller': <Engineering sx={{ fontSize: 48, color: 'primary.main' }} />,
      'valve-controller': <FilterAlt sx={{ fontSize: 48, color: 'primary.main' }} />,
      'pump-controller': <Compress sx={{ fontSize: 48, color: 'primary.main' }} />,
      'industrial-gauge': <Factory sx={{ fontSize: 48, color: 'primary.main' }} />,
      
      // Gateway
      'gateway-remote-shell': <Router sx={{ fontSize: 48, color: 'primary.main' }} />,
      'gateway-config': <Settings sx={{ fontSize: 48, color: 'primary.main' }} />,
      
      // Alarm
      'alarm-widget': <MonitorHeart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'alarm-table': <TableChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      
      // System
      'device-claiming': <DeviceHub sx={{ fontSize: 48, color: 'primary.main' }} />,
      'entity-admin': <Settings sx={{ fontSize: 48, color: 'primary.main' }} />,
      'json-input': <Memory sx={{ fontSize: 48, color: 'primary.main' }} />,
      
      // Sensors
      'temperature-humidity': <Thermostat sx={{ fontSize: 48, color: 'primary.main' }} />,
      'environmental': <Sensors sx={{ fontSize: 48, color: 'primary.main' }} />,
      'gas-sensor': <LocalGasStation sx={{ fontSize: 48, color: 'primary.main' }} />,
      'vibration-sensor': <Waves sx={{ fontSize: 48, color: 'primary.main' }} />,
      'electrical-meter': <OfflineBolt sx={{ fontSize: 48, color: 'primary.main' }} />
    };
    
    return iconMap[type] || <DeviceHub sx={{ fontSize: 48, color: 'primary.main' }} />;
  };

  if (error) {
    return (
      <Card sx={{ height: isFullscreen ? '100vh' : 400 }}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: isFullscreen ? '100vh' : 400, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" component="h3">
              {chartConfig.name}
            </Typography>
            {chartConfig.description && (
              <Typography variant="body2" color="text.secondary">
                {chartConfig.description}
              </Typography>
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {loading && <CircularProgress size={20} />}
            <Typography variant="caption" color="text.secondary">
              {lastUpdated.toLocaleTimeString()}
            </Typography>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
          <Chip 
            label={chartConfig.type} 
            size="small" 
            variant="outlined" 
          />
          <Chip 
            label={chartConfig.timeRange} 
            size="small" 
            variant="outlined" 
          />
          {chartConfig.devices?.length > 0 && (
            <Chip 
              label={`${chartConfig.devices.length} device(s)`} 
              size="small" 
              variant="outlined" 
            />
          )}
          {chartConfig.dataTypes?.length > 0 && (
            <Chip 
              label={`${chartConfig.dataTypes.length} data type(s)`} 
              size="small" 
              variant="outlined" 
            />
          )}
        </Box>

        <Box ref={chartRef} sx={{ flexGrow: 1, minHeight: isFullscreen ? 'calc(100vh - 200px)' : 300 }}>
          {(() => {
            const specialWidget = renderSpecialWidget();
            if (specialWidget) {
              return specialWidget;
            }
            
            return chartData ? (
              <ChartComponent 
                data={chartConfig.type === 'stacked-bar' ? { ...chartData, datasets: chartData.datasets.map(d => ({ ...d, stack: 'stack1' })) } : chartData} 
                options={{
                  ...getChartOptions(),
                  ...(chartConfig.type === 'stacked-bar' && {
                    scales: {
                      ...getChartOptions().scales,
                      y: {
                        ...getChartOptions().scales?.y,
                        stacked: true
                      },
                      x: {
                        ...getChartOptions().scales?.x,
                        stacked: true
                      }
                    }
                  }),
                  ...(chartConfig.type === 'area' && {
                    elements: {
                      line: {
                        fill: true,
                        tension: 0.4
                      }
                    }
                  }),
                  ...(chartConfig.type === 'spline' && {
                    elements: {
                      line: {
                        tension: 0.5
                      }
                    }
                  })
                }} 
              />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            );
          })()}
        </Box>
      </CardContent>

      {!isFullscreen && (
        <CardActions>
          <Button
            size="small"
            onClick={loadChartData}
            startIcon={<Refresh />}
            disabled={loading}
          >
            Refresh
          </Button>
          {onToggleFullscreen && (
            <Button
              size="small"
              onClick={onToggleFullscreen}
              startIcon={<Fullscreen />}
            >
              Fullscreen
            </Button>
          )}
        </CardActions>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { onEdit(chartConfig); handleMenuClose(); }}>
          <Edit sx={{ mr: 1 }} /> Edit Chart
        </MenuItem>
        <MenuItem onClick={toggleAutoRefresh}>
          {autoRefresh ? <Pause sx={{ mr: 1 }} /> : <PlayArrow sx={{ mr: 1 }} />}
          {autoRefresh ? 'Pause' : 'Resume'} Auto-refresh
        </MenuItem>
        <MenuItem onClick={handleExportChart}>
          <Download sx={{ mr: 1 }} /> Export as PNG
        </MenuItem>
        <MenuItem onClick={() => { onDelete(chartConfig.id); handleMenuClose(); }}>
          <Delete sx={{ mr: 1 }} /> Delete Chart
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default CustomChart;
