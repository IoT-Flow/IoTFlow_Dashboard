import {
  Assessment,
  PieChart,
  ShowChart,
  Speed,
  Timeline
} from '@mui/icons-material';
import {
  Box,
  Chip,
  Container,
  Grid,
  Paper,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import CustomChart from '../components/CustomChart';

const ChartsDemo = () => {
  const theme = useTheme();
  const [demoData, setDemoData] = useState({});

  // Generate realistic demo telemetry data
  useEffect(() => {
    const generateTimeSeriesData = (points = 24, baseValue = 50, variance = 20) => {
      const data = [];
      const now = new Date();
      for (let i = points - 1; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000); // Every hour
        const value = baseValue + (Math.random() - 0.5) * variance + Math.sin(i / 5) * 10;
        data.push({
          timestamp: timestamp.getTime(),
          value: Math.round(value * 100) / 100
        });
      }
      return data;
    };

    setDemoData({
      temperature: generateTimeSeriesData(24, 22, 8),
      humidity: generateTimeSeriesData(24, 60, 20),
      pressure: generateTimeSeriesData(24, 1013, 50),
      light: generateTimeSeriesData(24, 400, 200),
      battery: generateTimeSeriesData(24, 85, 15),
      network: generateTimeSeriesData(24, 75, 25)
    });
  }, []);

  const chartConfigs = [
    // Line Charts
    {
      id: 'temp-line',
      name: 'Temperature Trend',
      type: 'line',
      description: 'Smooth line chart showing temperature variations over time',
      measurements: ['Temperature'],
      dataTypes: ['temperature'],
      timeRange: '24h',
      customColors: ['#FF6B6B'],
      showLegend: true,
      showGrid: true,
      yAxisMin: 10,
      yAxisMax: 35,
      refreshInterval: 30
    },
    {
      id: 'humidity-spline',
      name: 'Humidity Levels',
      type: 'spline',
      description: 'Curved spline chart for humidity monitoring',
      measurements: ['Humidity'],
      dataTypes: ['humidity'],
      timeRange: '24h',
      customColors: ['#4ECDC4'],
      showLegend: true,
      yAxisMin: 30,
      yAxisMax: 90
    },
    {
      id: 'multi-area',
      name: 'Environmental Overview',
      type: 'area',
      description: 'Area chart combining temperature and humidity',
      measurements: ['Temperature', 'Humidity'],
      dataTypes: ['temperature', 'humidity'],
      timeRange: '24h',
      customColors: ['#FF6B6B', '#4ECDC4'],
      showLegend: true,
      fillArea: true
    },

    // Bar Charts
    {
      id: 'pressure-bar',
      name: 'Pressure Readings',
      type: 'bar',
      description: 'Bar chart showing atmospheric pressure',
      measurements: ['Pressure'],
      dataTypes: ['pressure'],
      timeRange: '24h',
      customColors: ['#45B7D1'],
      showLegend: true
    },
    {
      id: 'stacked-sensors',
      name: 'Sensor Data Stack',
      type: 'stacked-bar',
      description: 'Stacked bar chart for multiple sensor readings',
      measurements: ['Light', 'Battery'],
      dataTypes: ['light', 'battery'],
      timeRange: '24h',
      customColors: ['#FFA07A', '#98D8C8'],
      showLegend: true
    },

    // Pie Charts
    {
      id: 'sensor-distribution',
      name: 'Sensor Distribution',
      type: 'pie',
      description: 'Pie chart showing current sensor value distribution',
      measurements: ['Values'],
      dataTypes: ['temperature'],
      timeRange: 'current',
      customColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
      showLegend: true
    },
    {
      id: 'status-doughnut',
      name: 'System Status',
      type: 'doughnut',
      description: 'Doughnut chart for system status overview',
      measurements: ['Status'],
      dataTypes: ['battery'],
      timeRange: 'current',
      customColors: ['#91CC75', '#FAC858', '#EE6666'],
      showLegend: true
    },

    // Advanced Charts
    {
      id: 'correlation-scatter',
      name: 'Temperature vs Humidity',
      type: 'scatter',
      description: 'Scatter plot showing temperature-humidity correlation',
      measurements: ['Correlation'],
      dataTypes: ['temperature'],
      timeRange: '24h',
      customColors: ['#9A60B4'],
      showLegend: true
    },
    {
      id: 'performance-gauge',
      name: 'System Performance',
      type: 'gauge',
      description: 'Real-time performance gauge',
      measurements: ['Performance'],
      dataTypes: ['network'],
      timeRange: 'current',
      yAxisMin: 0,
      yAxisMax: 100,
      customColors: ['#58D9F9']
    },
    {
      id: 'activity-heatmap',
      name: 'Activity Heatmap',
      type: 'heatmap',
      description: 'Heatmap showing activity patterns',
      measurements: ['Activity'],
      dataTypes: ['temperature'],
      timeRange: '7d',
      showLegend: true
    }
  ];

  const getDataForChart = (config) => {
    switch (config.type) {
      case 'pie':
      case 'doughnut':
        // Generate pie data from latest values
        return Object.entries(demoData).slice(0, 5).map(([key, data]) => ({
          timestamp: Date.now(),
          value: data[data.length - 1]?.value || 0
        }));

      case 'scatter':
        // Generate scatter data (temperature vs humidity)
        return demoData.temperature?.map((tempPoint, idx) => ({
          timestamp: tempPoint.timestamp,
          value: demoData.humidity?.[idx]?.value || 0
        })) || [];

      case 'gauge':
        // Use network data for gauge
        return demoData.network || [];

      default:
        // Multi-measurement support
        if (config.measurements?.length > 1) {
          return config.measurements.map(measurement => {
            const dataKey = measurement.toLowerCase();
            return demoData[dataKey] || [];
          });
        } else {
          // Single measurement
          const dataKey = config.dataTypes?.[0] || 'temperature';
          return demoData[dataKey] || [];
        }
    }
  };

  const chartTypeCategories = [
    {
      title: 'Time Series Charts',
      description: 'Perfect for tracking sensor data over time',
      charts: chartConfigs.filter(c => ['line', 'spline', 'area', 'bar', 'stacked-bar'].includes(c.type)),
      icon: <Timeline sx={{ fontSize: 40, color: 'primary.main' }} />
    },
    {
      title: 'Distribution Charts',
      description: 'Ideal for showing proportions and distributions',
      charts: chartConfigs.filter(c => ['pie', 'doughnut'].includes(c.type)),
      icon: <PieChart sx={{ fontSize: 40, color: 'primary.main' }} />
    },
    {
      title: 'Advanced Analytics',
      description: 'Specialized charts for deep insights',
      charts: chartConfigs.filter(c => ['scatter', 'gauge', 'heatmap'].includes(c.type)),
      icon: <Assessment sx={{ fontSize: 40, color: 'primary.main' }} />
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Paper
        sx={{
          p: 4,
          mb: 4,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2
        }}
      >
        <Box textAlign="center">
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Professional IoT Dashboard Charts
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            Powered by Apache ECharts - Enterprise-grade data visualization
          </Typography>
          <Box display="flex" justifyContent="center" gap={1} flexWrap="wrap">
            <Chip label="Real-time Updates" color="primary" />
            <Chip label="Interactive" color="secondary" />
            <Chip label="Responsive" color="success" />
            <Chip label="Professional Grade" color="info" />
          </Box>
        </Box>
      </Paper>

      {/* Chart Categories */}
      {chartTypeCategories.map((category, categoryIndex) => (
        <Box key={categoryIndex} sx={{ mb: 6 }}>
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              {category.icon}
              <Box>
                <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
                  {category.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {category.description}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Grid container spacing={3}>
            {category.charts.map((chartConfig) => (
              <Grid item xs={12} md={6} lg={4} key={chartConfig.id}>
                <CustomChart
                  chartConfig={chartConfig}
                  telemetryData={getDataForChart(chartConfig)}
                  onEdit={() => console.log('Edit chart:', chartConfig.name)}
                  onDelete={() => console.log('Delete chart:', chartConfig.name)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      {/* Features Section */}
      <Paper sx={{ p: 4, mt: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
          Key Features
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box textAlign="center" p={2}>
              <ShowChart sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Interactive Charts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Smooth animations, hover effects, and zoom capabilities for enhanced user experience
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box textAlign="center" p={2}>
              <Speed sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                High Performance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Optimized rendering with canvas support for handling large datasets efficiently
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box textAlign="center" p={2}>
              <Assessment sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Advanced Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Professional-grade visualizations including gauges, heatmaps, and correlation charts
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ChartsDemo;
