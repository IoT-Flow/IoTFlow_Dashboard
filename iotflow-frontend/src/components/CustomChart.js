import {
  AccountTree,
  Air,
  Assessment,
  BarChart,
  BatteryFull,
  Brightness1,
  BubbleChart,
  CalendarToday,
  CompareArrows,
  Compress,
  DateRange,
  Delete,
  DeviceHub,
  DonutLarge,
  Download,
  Edit,
  ElectricalServices,
  Engineering,
  EventNote,
  Explore,
  Factory,
  FilterAlt,
  Fullscreen,
  Functions,
  GridView,
  Input,
  LinearScale as LinearScaleIcon,
  LocalGasStation,
  LocationOn,
  Map,
  MapOutlined,
  Memory,
  MonitorHeart,
  MoreVert,
  Navigation,
  OfflineBolt,
  Pause,
  PieChart,
  PieChartOutline,
  PlayArrow,
  PowerSettingsNew,
  Public,
  QueryStats,
  RadioButtonChecked,
  Refresh,
  RotateRight,
  Router,
  ScatterPlot,
  Send,
  Sensors,
  Settings,
  ShowChart,
  SignalWifi4Bar,
  SmartButton,
  Speed,
  TableChart,
  TableRows,
  Thermostat,
  Timeline,
  Timer,
  ToggleOn,
  TouchApp,
  Tune,
  Update,
  ViewCompact,
  ViewList,
  ViewModule,
  ViewStream,
  WaterDrop,
  Waves,
  WbSunny
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Typography
} from '@mui/material';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Tooltip as ChartTooltip,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Title,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import html2canvas from 'html2canvas';
import { useEffect, useRef, useState } from 'react';
import { Bar, Doughnut, Line, Pie, Scatter } from 'react-chartjs-2';
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

  const loadChartData = async () => {
    // Accept telemetryData as an array
    if (!Array.isArray(telemetryData) || telemetryData.length === 0) {
      setError('No telemetry data available for this measurement');
      setChartData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
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

  const generateChartData = async () => {
    // Format timestamps for labels
    const labels = telemetryData.map(point => {
      const date = new Date(point.timestamp);
      // If less than 1 day, show time; else show date
      return telemetryData.length > 0 && (telemetryData[telemetryData.length - 1].timestamp - telemetryData[0].timestamp < 24 * 60 * 60 * 1000)
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString();
    });
    const data = telemetryData.map(point => point.value);
    const datasets = [{
      label: chartConfig.name || chartConfig.measurement,
      data,
      borderColor: chartConfig.borderColor || '#1976d2',
      backgroundColor: chartConfig.fillArea ? (chartConfig.borderColor || '#1976d2') + '20' : (chartConfig.borderColor || '#1976d2'),
      fill: chartConfig.fillArea,
      borderWidth: chartConfig.lineWidth || 2,
      pointStyle: chartConfig.pointStyle || 'circle',
      tension: chartConfig.type === 'line' ? 0.4 : 0,
    }];
    return { labels, datasets };
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
