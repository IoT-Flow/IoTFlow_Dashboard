import {
  Assessment,
  BarChart,
  Delete,
  DeviceHub,
  Download,
  Edit,
  Fullscreen,
  MoreVert,
  Pause,
  PieChart,
  PlayArrow,
  Refresh,
  ScatterPlot,
  ShowChart,
  Speed,
  Thermostat,
  Timeline,
  WaterDrop
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
  Typography,
  useTheme
} from '@mui/material';
import { format } from 'date-fns';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import html2canvas from 'html2canvas';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const CustomChart = ({
  chartConfig,
  onEdit,
  onDelete,
  telemetryData = {},
  isFullscreen = false,
  onToggleFullscreen
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [chartOption, setChartOption] = useState(null);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  // Professional color palette
  const colorPalette = [
    '#5470C6', '#91CC75', '#FAC858', '#EE6666', '#73C0DE',
    '#3BA272', '#FC8452', '#9A60B4', '#EA7CCC', '#FFC64B',
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'
  ];

  const loadChartData = async () => {
    if (!Array.isArray(telemetryData) || telemetryData.length === 0) {
      setError('No telemetry data available for this measurement');
      setChartOption(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const option = await generateEChartsOption();
      setChartOption(option);
      setLastUpdated(new Date());
    } catch (err) {
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

  const generateEChartsOption = async () => {
    const telemetryArrays = Array.isArray(telemetryData[0]) ? telemetryData : [telemetryData];

    // Generate time labels with safe date formatting
    const timeLabels = telemetryArrays[0]?.map(point => {
      try {
        const date = new Date(point.timestamp);
        if (!isNaN(date.getTime())) {
          // Simple, safe date formatting
          return date.toLocaleString();
        }
        return 'Invalid date';
      } catch (error) {
        return 'Invalid date';
      }
    }) || [];

    const isDarkMode = theme.palette.mode === 'dark';

    switch (chartConfig.type) {
      case 'line':
      case 'spline':
      case 'area':
      case 'step-line':
        return generateLineChartOption(telemetryArrays, timeLabels, isDarkMode);

      case 'bar':
      case 'stacked-bar':
      case 'horizontal-bar':
      case 'grouped-bar':
        return generateBarChartOption(telemetryArrays, timeLabels, isDarkMode);

      case 'pie':
      case 'doughnut':
      case 'rose':
        return generatePieChartOption(telemetryArrays, isDarkMode);

      case 'scatter':
      case 'bubble':
        return generateScatterChartOption(telemetryArrays, timeLabels, isDarkMode);

      case 'gauge':
      case 'speedometer':
      case 'progress-gauge':
      case 'multi-gauge':
        return generateGaugeChartOption(telemetryArrays, isDarkMode);

      case 'heatmap':
        return generateHeatmapChartOption(telemetryArrays, timeLabels, isDarkMode);

      // Specialized IoT Gauges
      case 'thermometer':
        return generateThermometerChartOption(telemetryArrays, isDarkMode);

      case 'tank-level':
        return generateTankLevelChartOption(telemetryArrays, isDarkMode);

      case 'battery-level':
        return generateBatteryLevelChartOption(telemetryArrays, isDarkMode);

      case 'signal-strength':
        return generateSignalStrengthChartOption(telemetryArrays, isDarkMode);

      // Advanced Charts
      case 'radar':
        return generateRadarChartOption(telemetryArrays, isDarkMode);

      case 'funnel':
        return generateFunnelChartOption(telemetryArrays, isDarkMode);

      case 'liquid-fill':
        return generateLiquidFillChartOption(telemetryArrays, isDarkMode);

      case 'sunburst':
        return generateSunburstChartOption(telemetryArrays, isDarkMode);

      // Cards
      case 'value-card':
      case 'metric-card':
      case 'status-card':
      case 'comparison-card':
        return generateCardChartOption(telemetryArrays, isDarkMode);

      default:
        return generateLineChartOption(telemetryArrays, timeLabels, isDarkMode);
    }
  };

  const generateLineChartOption = (telemetryArrays, timeLabels, isDarkMode) => {
    const series = telemetryArrays.map((dataArr, idx) => ({
      name: chartConfig.measurements ? chartConfig.measurements[idx] : `Series ${idx + 1}`,
      type: 'line',
      data: dataArr?.map(point => point.value) || [],
      smooth: chartConfig.type === 'spline',
      step: chartConfig.type === 'step-line' ? 'end' : false,
      areaStyle: chartConfig.type === 'area' ? {
        opacity: 0.3,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: chartConfig.customColors?.[idx] || colorPalette[idx % colorPalette.length] },
          { offset: 1, color: 'transparent' }
        ])
      } : null,
      lineStyle: {
        width: chartConfig.lineWidth || 3,
        color: chartConfig.customColors?.[idx] || colorPalette[idx % colorPalette.length]
      },
      itemStyle: {
        color: chartConfig.customColors?.[idx] || colorPalette[idx % colorPalette.length],
        borderWidth: 2,
        borderColor: '#fff'
      },
      emphasis: {
        focus: 'series',
        itemStyle: {
          borderWidth: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)'
        }
      }
    }));

    return {
      backgroundColor: 'transparent',
      title: {
        text: chartConfig.title,
        left: 'center',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: isFullscreen ? 18 : 14,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          animation: true,
          lineStyle: {
            color: isDarkMode ? '#ffffff' : '#333333',
            width: 1,
            opacity: 0.8
          }
        },
        backgroundColor: isDarkMode ? 'rgba(50, 50, 50, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDarkMode ? '#555555' : '#cccccc',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333'
        },
        formatter: function (params) {
          // Simple approach: use the axis label directly without tryi                                                  ng to reformat it
          const axisLabel = params[0]?.axisValueLabel || params[0]?.name || 'No timestamp';

          let result = `<div style="margin-bottom: 5px; font-weight: bold;">${axisLabel}</div>`;
          params.forEach(param => {
            result += `<div style="margin: 2px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 50%; margin-right: 5px;"></span>
              ${param.seriesName}: <strong>${param.value}</strong>
            </div>`;
          });
          return result;
        }
      },
      legend: {
        show: chartConfig.showLegend !== false,
        top: 'bottom',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: chartConfig.showLegend !== false ? '15%' : '3%',
        top: chartConfig.title ? '15%' : '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: timeLabels,
        boundaryGap: false,
        axisLine: {
          show: true,
          lineStyle: {
            color: isDarkMode ? '#555555' : '#cccccc'
          }
        },
        axisTick: {
          show: true,
          lineStyle: {
            color: isDarkMode ? '#555555' : '#cccccc'
          }
        },
        axisLabel: {
          color: isDarkMode ? '#cccccc' : '#666666',
          fontSize: 12
        },
        splitLine: {
          show: chartConfig.showGrid !== false,
          lineStyle: {
            color: isDarkMode ? '#333333' : '#f0f0f0',
            type: 'dashed'
          }
        }
      },
      yAxis: {
        type: 'value',
        min: chartConfig.yAxisMin,
        max: chartConfig.yAxisMax,
        axisLine: {
          show: true,
          lineStyle: {
            color: isDarkMode ? '#555555' : '#cccccc'
          }
        },
        axisTick: {
          show: true,
          lineStyle: {
            color: isDarkMode ? '#555555' : '#cccccc'
          }
        },
        axisLabel: {
          color: isDarkMode ? '#cccccc' : '#666666',
          fontSize: 12
        },
        splitLine: {
          show: chartConfig.showGrid !== false,
          lineStyle: {
            color: isDarkMode ? '#333333' : '#f0f0f0',
            type: 'dashed'
          }
        }
      },
      series: series,
      animation: chartConfig.animations !== false,
      animationDuration: 750,
      animationEasing: 'cubicOut'
    };
  };

  const generateBarChartOption = (telemetryArrays, timeLabels, isDarkMode) => {
    const isHorizontal = chartConfig.type === 'horizontal-bar';
    const series = telemetryArrays.map((dataArr, idx) => ({
      name: chartConfig.measurements ? chartConfig.measurements[idx] : `Series ${idx + 1}`,
      type: 'bar',
      data: dataArr?.map(point => point.value) || [],
      stack: chartConfig.type === 'stacked-bar' ? 'total' : null,
      barGap: chartConfig.type === 'grouped-bar' ? '10%' : null,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(
          isHorizontal ? 1 : 0,
          isHorizontal ? 0 : 0,
          isHorizontal ? 0 : 0,
          isHorizontal ? 0 : 1,
          [
            { offset: 0, color: chartConfig.customColors?.[idx] || colorPalette[idx % colorPalette.length] },
            { offset: 1, color: echarts.color.modifyAlpha(chartConfig.customColors?.[idx] || colorPalette[idx % colorPalette.length], 0.7) }
          ]
        ),
        borderRadius: isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)'
        }
      }
    }));

    return {
      backgroundColor: 'transparent',
      title: {
        text: chartConfig.title,
        left: 'center',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: isFullscreen ? 18 : 14,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDarkMode ? 'rgba(50, 50, 50, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDarkMode ? '#555555' : '#cccccc',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333'
        }
      },
      legend: {
        show: chartConfig.showLegend !== false,
        top: 'bottom',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: chartConfig.showLegend !== false ? '15%' : '3%',
        top: chartConfig.title ? '15%' : '3%',
        containLabel: true
      },
      xAxis: {
        type: isHorizontal ? 'value' : 'category',
        data: isHorizontal ? null : timeLabels,
        min: isHorizontal ? chartConfig.yAxisMin : null,
        max: isHorizontal ? chartConfig.yAxisMax : null,
        axisLine: {
          lineStyle: {
            color: isDarkMode ? '#555555' : '#cccccc'
          }
        },
        axisLabel: {
          color: isDarkMode ? '#cccccc' : '#666666'
        },
        splitLine: isHorizontal ? {
          lineStyle: {
            color: isDarkMode ? '#333333' : '#f0f0f0',
            type: 'dashed'
          }
        } : undefined
      },
      yAxis: {
        type: isHorizontal ? 'category' : 'value',
        data: isHorizontal ? timeLabels : null,
        min: isHorizontal ? null : chartConfig.yAxisMin,
        max: isHorizontal ? null : chartConfig.yAxisMax,
        axisLine: {
          lineStyle: {
            color: isDarkMode ? '#555555' : '#cccccc'
          }
        },
        axisLabel: {
          color: isDarkMode ? '#cccccc' : '#666666'
        },
        splitLine: !isHorizontal ? {
          lineStyle: {
            color: isDarkMode ? '#333333' : '#f0f0f0',
            type: 'dashed'
          }
        } : undefined
      },
      series: series,
      animation: true,
      animationDuration: 750
    };
  };

  const generatePieChartOption = (telemetryArrays, isDarkMode) => {
    const dataArr = telemetryArrays[0] || [];
    const data = dataArr.map((point, idx) => ({
      value: point.value,
      name: `Point ${idx + 1}`,
      itemStyle: {
        color: colorPalette[idx % colorPalette.length]
      }
    }));

    return {
      backgroundColor: 'transparent',
      title: {
        text: chartConfig.title,
        left: 'center',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: isFullscreen ? 18 : 14,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function (param) {
          // For pie charts, we don't have timestamps but we can show the data point info
          return `${param.seriesName}<br/>${param.name}: <strong>${param.value}</strong> (${param.percent}%)`;
        },
        backgroundColor: isDarkMode ? 'rgba(50, 50, 50, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDarkMode ? '#555555' : '#cccccc',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333'
        }
      },
      legend: {
        show: chartConfig.showLegend !== false,
        bottom: '5%',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333'
        }
      },
      series: [{
        name: chartConfig.name,
        type: 'pie',
        radius: chartConfig.type === 'doughnut' ? ['40%', '70%'] : '70%',
        center: ['50%', '50%'],
        roseType: chartConfig.type === 'rose' ? 'area' : null,
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        animationType: 'scale',
        animationEasing: 'elasticOut'
      }],
      animation: true,
      animationDuration: 1000
    };
  };

  const generateScatterChartOption = (telemetryArrays, timeLabels, isDarkMode) => {
    const series = telemetryArrays.map((dataArr, idx) => ({
      name: chartConfig.measurements ? chartConfig.measurements[idx] : `Series ${idx + 1}`,
      type: 'scatter',
      data: dataArr?.map((point, index) => [index, point.value]) || [],
      itemStyle: {
        color: chartConfig.customColors?.[idx] || colorPalette[idx % colorPalette.length]
      },
      symbolSize: 8
    }));

    return {
      backgroundColor: 'transparent',
      title: {
        text: chartConfig.title,
        left: 'center',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: isFullscreen ? 18 : 14,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function (param) {
          // For scatter plots, show the data point value with series name
          const dataIndex = param.dataIndex;
          const originalData = telemetryArrays[param.seriesIndex];
          if (originalData && originalData[dataIndex]) {
            const timestamp = originalData[dataIndex].timestamp;
            let fullDateTime = 'No timestamp';
            try {
              if (timestamp) {
                const dateValue = new Date(timestamp);
                if (!isNaN(dateValue.getTime())) {
                  fullDateTime = format(dateValue, 'PPpp');
                }
              }
            } catch (error) {
              console.warn('Date formatting failed:', error);
              fullDateTime = timestamp ? timestamp.toString() : 'No timestamp';
            }
            return `<div style="font-weight: bold;">${param.seriesName}</div>
                    <div style="margin-top: 5px;">${fullDateTime}</div>
                    <div style="margin-top: 2px;">Value: <strong>${param.value[1]}</strong></div>`;
          }
          return `${param.seriesName}<br/>Value: <strong>${param.value[1]}</strong>`;
        },
        backgroundColor: isDarkMode ? 'rgba(50, 50, 50, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDarkMode ? '#555555' : '#cccccc',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333'
        }
      },
      legend: {
        show: chartConfig.showLegend !== false,
        top: 'bottom',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: isDarkMode ? '#555555' : '#cccccc'
          }
        },
        axisLabel: {
          color: isDarkMode ? '#cccccc' : '#666666'
        },
        splitLine: {
          lineStyle: {
            color: isDarkMode ? '#333333' : '#f0f0f0',
            type: 'dashed'
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: isDarkMode ? '#555555' : '#cccccc'
          }
        },
        axisLabel: {
          color: isDarkMode ? '#cccccc' : '#666666'
        },
        splitLine: {
          lineStyle: {
            color: isDarkMode ? '#333333' : '#f0f0f0',
            type: 'dashed'
          }
        }
      },
      series: series,
      animation: true
    };
  };

  const generateGaugeChartOption = (telemetryArrays, isDarkMode) => {
    const dataArr = telemetryArrays[0] || [];
    const currentValue = dataArr[dataArr.length - 1]?.value || 0;
    const timestamp = dataArr[dataArr.length - 1]?.timestamp;
    const maxValue = chartConfig.yAxisMax || 100;

    return {
      backgroundColor: 'transparent',
      title: {
        text: chartConfig.title,
        left: 'center',
        top: '10%',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: isFullscreen ? 18 : 14,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        formatter: function () {
          let fullDateTime = 'No timestamp';
          try {
            if (timestamp) {
              const dateValue = new Date(timestamp);
              if (!isNaN(dateValue.getTime())) {
                fullDateTime = format(dateValue, 'PPpp');
              }
            }
          } catch (error) {
            console.warn('Date formatting failed:', error);
            fullDateTime = timestamp ? timestamp.toString() : 'No timestamp';
          }
          return `<div style="font-weight: bold;">${chartConfig.name || 'Gauge'}</div>
                  <div style="margin-top: 5px;">${fullDateTime}</div>
                  <div style="margin-top: 2px;">Value: <strong>${currentValue.toFixed(1)}</strong></div>`;
        }
      },
      series: [{
        name: chartConfig.name,
        type: 'gauge',
        center: ['50%', '60%'],
        startAngle: 200,
        endAngle: -40,
        min: chartConfig.yAxisMin || 0,
        max: maxValue,
        splitNumber: 10,
        itemStyle: {
          color: '#58D9F9',
          shadowColor: 'rgba(0,138,255,0.45)',
          shadowBlur: 10,
          shadowOffsetX: 2,
          shadowOffsetY: 2
        },
        progress: {
          show: true,
          roundCap: true,
          width: 18
        },
        pointer: {
          icon: 'path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.81557,732.63423 2083.81557,729.017692 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z',
          length: '75%',
          width: 16,
          offsetCenter: [0, '5%']
        },
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 18,
            color: [[1, isDarkMode ? '#333333' : '#E6EBF8']]
          }
        },
        axisTick: {
          distance: -45,
          splitNumber: 5,
          lineStyle: {
            width: 2,
            color: isDarkMode ? '#666666' : '#999999'
          }
        },
        splitLine: {
          distance: -52,
          length: 14,
          lineStyle: {
            width: 3,
            color: isDarkMode ? '#666666' : '#999999'
          }
        },
        axisLabel: {
          distance: -20,
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: 12
        },
        title: {
          show: false
        },
        detail: {
          backgroundColor: isDarkMode ? '#333333' : '#ffffff',
          borderColor: isDarkMode ? '#555555' : '#999999',
          borderWidth: 2,
          width: '60%',
          lineHeight: 40,
          height: 40,
          borderRadius: 8,
          offsetCenter: [0, '35%'],
          valueAnimation: true,
          formatter: function (value) {
            return '{value|' + value.toFixed(1) + '}{unit|units}';
          },
          rich: {
            value: {
              fontSize: 20,
              fontWeight: 'bolder',
              color: isDarkMode ? '#ffffff' : '#333333'
            },
            unit: {
              fontSize: 12,
              color: isDarkMode ? '#cccccc' : '#999999',
              padding: [0, 0, -20, 10]
            }
          }
        },
        data: [{
          value: currentValue
        }]
      }],
      animation: true,
      animationDuration: 1000
    };
  };

  const generateHeatmapChartOption = (telemetryArrays, timeLabels, isDarkMode) => {
    // Generate heatmap data - this is a simplified version
    const data = [];
    const dataArr = telemetryArrays[0] || [];

    for (let i = 0; i < Math.min(timeLabels.length, 24); i++) {
      for (let j = 0; j < Math.min(7, dataArr.length); j++) {
        data.push([i, j, dataArr[j]?.value || 0]);
      }
    }

    return {
      backgroundColor: 'transparent',
      title: {
        text: chartConfig.title,
        left: 'center',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: isFullscreen ? 18 : 14,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        position: 'top',
        formatter: function (param) {
          const xIndex = param.data[0];
          const yIndex = param.data[1];
          const value = param.data[2];
          const timestamp = timeLabels[xIndex];
          let fullDateTime = 'No timestamp';
          if (timestamp) {
            // Try to parse the timestamp if it's already a time string or convert from timestamp
            try {
              const dateValue = isNaN(timestamp) ? new Date(timestamp) : new Date(timestamp);
              if (!isNaN(dateValue.getTime())) {
                fullDateTime = format(dateValue, 'PPpp');
              } else {
                fullDateTime = timestamp.toString();
              }
            } catch (e) {
              console.warn('Date formatting failed:', e);
              fullDateTime = timestamp.toString();
            }
          }
          return `<div style="font-weight: bold;">Heatmap Data</div>
                  <div style="margin-top: 5px;">${fullDateTime}</div>
                  <div style="margin-top: 2px;">Value: <strong>${value}</strong></div>`;
        },
        backgroundColor: isDarkMode ? 'rgba(50, 50, 50, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDarkMode ? '#555555' : '#cccccc',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333'
        }
      },
      grid: {
        height: '50%',
        top: '20%'
      },
      xAxis: {
        type: 'category',
        data: timeLabels.slice(0, 24),
        splitArea: {
          show: true
        },
        axisLabel: {
          color: isDarkMode ? '#cccccc' : '#666666'
        }
      },
      yAxis: {
        type: 'category',
        data: ['Series 1', 'Series 2', 'Series 3', 'Series 4', 'Series 5', 'Series 6', 'Series 7'],
        splitArea: {
          show: true
        },
        axisLabel: {
          color: isDarkMode ? '#cccccc' : '#666666'
        }
      },
      visualMap: {
        min: 0,
        max: Math.max(...dataArr.map(d => d.value), 100),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '15%',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333'
        }
      },
      series: [{
        name: chartConfig.name,
        type: 'heatmap',
        data: data,
        label: {
          show: true,
          color: isDarkMode ? '#ffffff' : '#333333'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }],
      animation: true
    };
  };

  // ==================== NEW CHART GENERATORS ====================

  const generateThermometerChartOption = (telemetryArrays, isDarkMode) => {
    const dataArr = telemetryArrays[0] || [];
    const currentValue = dataArr.length > 0 ? dataArr[dataArr.length - 1].value : 0;
    const timestamp = dataArr.length > 0 ? dataArr[dataArr.length - 1].timestamp : null;
    const maxValue = chartConfig.yAxisMax || 100;
    const minValue = chartConfig.yAxisMin || 0;

    return {
      backgroundColor: 'transparent',
      title: {
        text: chartConfig.title,
        left: 'center',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: isFullscreen ? 18 : 14,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        formatter: function () {
          let fullDateTime = 'No timestamp';
          try {
            if (timestamp) {
              const dateValue = new Date(timestamp);
              if (!isNaN(dateValue.getTime())) {
                fullDateTime = format(dateValue, 'PPpp');
              }
            }
          } catch (error) {
            console.warn('Date formatting failed:', error);
            fullDateTime = timestamp ? timestamp.toString() : 'No timestamp';
          }
          return `<div style="font-weight: bold;">Temperature</div>
                  <div style="margin-top: 5px;">${fullDateTime}</div>
                  <div style="margin-top: 2px;">Temperature: <strong>${currentValue.toFixed(1)}°C</strong></div>`;
        }
      },
      series: [{
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: minValue,
        max: maxValue,
        splitNumber: 10,
        radius: '80%',
        center: ['50%', '75%'],
        axisLine: {
          lineStyle: {
            width: 20,
            color: [
              [0.2, '#67e0e3'],
              [0.4, '#37a2da'],
              [0.6, '#fd666d'],
              [0.8, '#ffb64d'],
              [1, '#ff4757']
            ]
          }
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '12%',
          width: 20,
          offsetCenter: [0, '-60%'],
          itemStyle: {
            color: 'auto'
          }
        },
        axisTick: {
          length: 12,
          lineStyle: {
            color: 'auto',
            width: 2
          }
        },
        splitLine: {
          length: 20,
          lineStyle: {
            color: 'auto',
            width: 5
          }
        },
        axisLabel: {
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: 12,
          distance: -60,
          formatter: '{value}°C'
        },
        detail: {
          fontSize: 24,
          offsetCenter: [0, '-35%'],
          valueAnimation: true,
          formatter: '{value}°C',
          color: isDarkMode ? '#ffffff' : '#333333'
        },
        data: [{ value: currentValue, name: 'Temperature' }]
      }]
    };
  };

  const generateTankLevelChartOption = (telemetryArrays, isDarkMode) => {
    const dataArr = telemetryArrays[0] || [];
    const currentValue = dataArr.length > 0 ? dataArr[dataArr.length - 1].value : 0;
    const timestamp = dataArr.length > 0 ? dataArr[dataArr.length - 1].timestamp : null;
    const maxValue = chartConfig.yAxisMax || 100;
    const percentage = Math.min(Math.max((currentValue / maxValue) * 100, 0), 100);

    return {
      backgroundColor: 'transparent',
      title: {
        text: chartConfig.title,
        left: 'center',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: isFullscreen ? 18 : 14,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        formatter: function () {
          let fullDateTime = 'No timestamp';
          try {
            if (timestamp) {
              const dateValue = new Date(timestamp);
              if (!isNaN(dateValue.getTime())) {
                fullDateTime = format(dateValue, 'PPpp');
              }
            }
          } catch (error) {
            console.warn('Date formatting failed:', error);
            fullDateTime = timestamp ? timestamp.toString() : 'No timestamp';
          }
          return `<div style="font-weight: bold;">Tank Level</div>
                  <div style="margin-top: 5px;">${fullDateTime}</div>
                  <div style="margin-top: 2px;">Level: <strong>${currentValue.toFixed(1)} (${percentage.toFixed(1)}%)</strong></div>`;
        }
      },
      graphic: [
        {
          type: 'rect',
          left: 'center',
          top: 'middle',
          shape: {
            x: -50,
            y: -100,
            width: 100,
            height: 200
          },
          style: {
            fill: 'transparent',
            stroke: isDarkMode ? '#ffffff' : '#333333',
            lineWidth: 3
          }
        },
        {
          type: 'rect',
          left: 'center',
          top: 'middle',
          shape: {
            x: -47,
            y: -97 + (200 - (percentage * 2)),
            width: 94,
            height: percentage * 2
          },
          style: {
            fill: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
              { offset: 0, color: '#4facfe' },
              { offset: 1, color: '#00f2fe' }
            ])
          }
        },
        {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: `${percentage.toFixed(1)}%`,
            fontSize: 20,
            fontWeight: 'bold',
            fill: isDarkMode ? '#ffffff' : '#333333'
          }
        }
      ]
    };
  };

  const generateBatteryLevelChartOption = (telemetryArrays, isDarkMode) => {
    const dataArr = telemetryArrays[0] || [];
    const currentValue = dataArr.length > 0 ? dataArr[dataArr.length - 1].value : 0;
    const percentage = Math.min(Math.max(currentValue, 0), 100);

    const getBatteryColor = (level) => {
      if (level > 60) return '#52c41a';
      if (level > 30) return '#faad14';
      return '#ff4d4f';
    };

    return {
      backgroundColor: 'transparent',
      title: {
        text: chartConfig.title,
        left: 'center',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: isFullscreen ? 18 : 14,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        formatter: `Battery: ${percentage.toFixed(1)}%`
      },
      graphic: [
        {
          type: 'rect',
          left: 'center',
          top: 'middle',
          shape: { x: -80, y: -30, width: 150, height: 60 },
          style: {
            fill: 'transparent',
            stroke: isDarkMode ? '#ffffff' : '#333333',
            lineWidth: 3
          }
        },
        {
          type: 'rect',
          left: 'center',
          top: 'middle',
          shape: { x: 70, y: -15, width: 10, height: 30 },
          style: {
            fill: isDarkMode ? '#ffffff' : '#333333'
          }
        },
        {
          type: 'rect',
          left: 'center',
          top: 'middle',
          shape: {
            x: -77,
            y: -27,
            width: (percentage / 100) * 144,
            height: 54
          },
          style: {
            fill: getBatteryColor(percentage)
          }
        },
        {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: `${percentage.toFixed(1)}%`,
            fontSize: 16,
            fontWeight: 'bold',
            fill: isDarkMode ? '#ffffff' : '#333333'
          }
        }
      ]
    };
  };

  const generateSignalStrengthChartOption = (telemetryArrays, isDarkMode) => {
    const dataArr = telemetryArrays[0] || [];
    const currentValue = dataArr.length > 0 ? dataArr[dataArr.length - 1].value : 0;
    const bars = 5;
    const percentage = Math.min(Math.max(currentValue / 100, 0), 1);
    const activeBars = Math.ceil(percentage * bars);

    const barGraphics = [];
    for (let i = 0; i < bars; i++) {
      const height = (i + 1) * 15;
      const isActive = i < activeBars;

      barGraphics.push({
        type: 'rect',
        left: 'center',
        top: 'middle',
        shape: {
          x: -50 + (i * 25),
          y: 30 - height,
          width: 20,
          height: height
        },
        style: {
          fill: isActive ? (percentage > 0.6 ? '#52c41a' : percentage > 0.3 ? '#faad14' : '#ff4d4f') :
            (isDarkMode ? '#333333' : '#e8e8e8')
        }
      });
    }

    return {
      backgroundColor: 'transparent',
      title: {
        text: chartConfig.title,
        left: 'center',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: isFullscreen ? 18 : 14,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        formatter: `Signal: ${(percentage * 100).toFixed(1)}%`
      },
      graphic: [
        ...barGraphics,
        {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: `${(percentage * 100).toFixed(1)}%`,
            fontSize: 16,
            fontWeight: 'bold',
            fill: isDarkMode ? '#ffffff' : '#333333',
            y: 50
          }
        }
      ]
    };
  };

  const generateRadarChartOption = (telemetryArrays, isDarkMode) => {
    // Create radar chart with multiple measurements
    const measurements = chartConfig.measurements || ['Value 1', 'Value 2', 'Value 3', 'Value 4', 'Value 5'];
    const indicator = measurements.map(name => ({ name, max: 100 }));

    const series = telemetryArrays.map((dataArr, idx) => {
      const latestValues = measurements.map((_, i) => {
        const data = telemetryArrays[i] || [];
        return data.length > 0 ? data[data.length - 1].value : 0;
      });

      return {
        name: chartConfig.measurements ? chartConfig.measurements[idx] : `Series ${idx + 1}`,
        type: 'radar',
        data: [{
          value: latestValues,
          name: `Dataset ${idx + 1}`,
          itemStyle: {
            color: colorPalette[idx % colorPalette.length]
          }
        }]
      };
    });

    return {
      backgroundColor: 'transparent',
      title: {
        text: chartConfig.title,
        left: 'center',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: isFullscreen ? 18 : 14,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item'
      },
      legend: {
        show: chartConfig.showLegend !== false,
        bottom: '5%',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333'
        }
      },
      radar: {
        indicator: indicator,
        radius: '60%',
        axisName: {
          color: isDarkMode ? '#ffffff' : '#333333'
        },
        splitLine: {
          lineStyle: {
            color: isDarkMode ? '#333333' : '#e8e8e8'
          }
        },
        axisLine: {
          lineStyle: {
            color: isDarkMode ? '#555555' : '#cccccc'
          }
        }
      },
      series: series
    };
  };

  const generateFunnelChartOption = (telemetryArrays, isDarkMode) => {
    const dataArr = telemetryArrays[0] || [];
    const data = dataArr.map((point, idx) => ({
      value: point.value,
      name: `Stage ${idx + 1}`,
      itemStyle: {
        color: colorPalette[idx % colorPalette.length]
      }
    })).sort((a, b) => b.value - a.value);

    return {
      backgroundColor: 'transparent',
      title: {
        text: chartConfig.title,
        left: 'center',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: isFullscreen ? 18 : 14,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      series: [{
        name: chartConfig.name,
        type: 'funnel',
        left: '10%',
        width: '80%',
        maxSize: '80%',
        data: data,
        itemStyle: {
          borderColor: isDarkMode ? '#333333' : '#ffffff',
          borderWidth: 2
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  };

  const generateLiquidFillChartOption = (telemetryArrays, isDarkMode) => {
    const dataArr = telemetryArrays[0] || [];
    const currentValue = dataArr.length > 0 ? dataArr[dataArr.length - 1].value : 0;
    const maxValue = chartConfig.yAxisMax || 100;
    const percentage = Math.min(Math.max((currentValue / maxValue), 0), 1);

    return {
      backgroundColor: 'transparent',
      title: {
        text: chartConfig.title,
        left: 'center',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: isFullscreen ? 18 : 14,
          fontWeight: 'bold'
        }
      },
      series: [{
        type: 'gauge',
        startAngle: 0,
        endAngle: 360,
        radius: '80%',
        min: 0,
        max: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
        pointer: { show: false },
        detail: {
          show: true,
          fontSize: 24,
          fontWeight: 'bold',
          color: isDarkMode ? '#ffffff' : '#333333',
          formatter: `${(percentage * 100).toFixed(1)}%`
        },
        data: [{ value: percentage }],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
            { offset: 0, color: '#4facfe' },
            { offset: 1, color: '#00f2fe' }
          ])
        }
      }]
    };
  };

  const generateSunburstChartOption = (telemetryArrays, isDarkMode) => {
    // Create hierarchical data for sunburst
    const measurements = chartConfig.measurements || ['Category 1', 'Category 2', 'Category 3'];
    const data = measurements.map((measurement, idx) => {
      const dataArr = telemetryArrays[idx] || [];
      const value = dataArr.length > 0 ? dataArr[dataArr.length - 1].value : Math.random() * 100;

      return {
        name: measurement,
        value: value,
        children: [
          { name: `${measurement} A`, value: value * 0.4 },
          { name: `${measurement} B`, value: value * 0.3 },
          { name: `${measurement} C`, value: value * 0.3 }
        ]
      };
    });

    return {
      backgroundColor: 'transparent',
      title: {
        text: chartConfig.title,
        left: 'center',
        textStyle: {
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: isFullscreen ? 18 : 14,
          fontWeight: 'bold'
        }
      },
      series: [{
        type: 'sunburst',
        data: data,
        radius: [0, '80%'],
        itemStyle: {
          borderRadius: 7,
          borderWidth: 2,
          borderColor: isDarkMode ? '#333333' : '#ffffff'
        },
        emphasis: {
          focus: 'ancestor'
        }
      }]
    };
  };

  const generateCardChartOption = (telemetryArrays, isDarkMode) => {
    const dataArr = telemetryArrays[0] || [];
    const currentValue = dataArr.length > 0 ? dataArr[dataArr.length - 1].value : 0;
    const previousValue = dataArr.length > 1 ? dataArr[dataArr.length - 2].value : currentValue;
    const trend = currentValue > previousValue ? '↗' : currentValue < previousValue ? '↘' : '→';
    const trendColor = currentValue > previousValue ? '#52c41a' : currentValue < previousValue ? '#ff4d4f' : '#faad14';

    return {
      backgroundColor: 'transparent',
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '25%',
          style: {
            text: chartConfig.title || 'Value',
            fontSize: 16,
            fill: isDarkMode ? '#cccccc' : '#666666'
          }
        },
        {
          type: 'text',
          left: 'center',
          top: '50%',
          style: {
            text: currentValue.toFixed(1),
            fontSize: 36,
            fontWeight: 'bold',
            fill: isDarkMode ? '#ffffff' : '#333333'
          }
        },
        {
          type: 'text',
          left: 'center',
          top: '75%',
          style: {
            text: `${trend} ${Math.abs(currentValue - previousValue).toFixed(1)}`,
            fontSize: 14,
            fill: trendColor
          }
        }
      ]
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
      toast.error('Failed to export chart');
    }

    handleMenuClose();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    handleMenuClose();
  };

  const getWidgetIcon = (type) => {
    const iconMap = {
      'line': <Timeline sx={{ fontSize: 48, color: 'primary.main' }} />,
      'spline': <ShowChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'bar': <BarChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'area': <Timeline sx={{ fontSize: 48, color: 'primary.main' }} />,
      'stacked-bar': <BarChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'pie': <PieChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'doughnut': <PieChart sx={{ fontSize: 48, color: 'primary.main' }} />,
      'scatter': <ScatterPlot sx={{ fontSize: 48, color: 'primary.main' }} />,
      'gauge': <Speed sx={{ fontSize: 48, color: 'primary.main' }} />,
      'heatmap': <Assessment sx={{ fontSize: 48, color: 'primary.main' }} />,
      'thermometer': <Thermostat sx={{ fontSize: 48, color: 'primary.main' }} />,
      'tank-level': <WaterDrop sx={{ fontSize: 48, color: 'primary.main' }} />
    };

    return iconMap[type] || <DeviceHub sx={{ fontSize: 48, color: 'primary.main' }} />;
  };

  // Special rendering for non-chart widget types
  const renderSpecialWidget = () => {
    const nonChartTypes = [
      'digital-gauge', 'digital-thermometer', 'tank-level', 'battery-level',
      'signal-strength', 'value-card', 'simple-card', 'entities-hierarchy',
      'aggregation-card', 'count-card', 'entities-table', 'timeseries-table',
      'latest-values', 'openstreet-map', 'google-map', 'image-map', 'route-map',
      'knob-control', 'switch-control', 'button-control', 'slider-control',
      'round-switch', 'update-attribute', 'send-rpc', 'date-range-navigator',
      'timespan-selector', 'scheduler-events', 'power-button', 'energy-meter',
      'liquid-level', 'wind-turbine', 'motor-controller'
    ];

    if (nonChartTypes.includes(chartConfig.type)) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="100%"
          textAlign="center"
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.secondary.main}10 100%)`,
            borderRadius: 2,
            p: 3,
            border: `1px dashed ${theme.palette.divider}`
          }}
        >
          {getWidgetIcon(chartConfig.type)}
          <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
            {chartConfig.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Advanced Widget Preview
          </Typography>
          <Alert severity="info" sx={{ maxWidth: 300 }}>
            This represents a preview of advanced IoT dashboard widgets.
            Interactive features and real-time controls coming soon.
          </Alert>
          {chartConfig.devices?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Connected to {chartConfig.devices.length} device(s)
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    return null;
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
    <Card
      sx={{
        height: 'auto',
        minHeight: isFullscreen ? '100vh' : 350,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
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
            color="primary"
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

        <Box
          ref={chartRef}
          sx={{
            flexGrow: 1,
            width: '100%',
            maxWidth: '100%',
            minHeight: 250,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {(() => {
            const specialWidget = renderSpecialWidget();
            if (specialWidget) {
              return specialWidget;
            }

            return chartOption ? (
              <ReactECharts
                option={chartOption}
                style={{
                  height: isFullscreen ? '80vh' : '300px',
                  width: '100%'
                }}
                theme={theme.palette.mode === 'dark' ? 'dark' : 'light'}
                opts={{
                  renderer: 'canvas',
                  devicePixelRatio: window.devicePixelRatio || 1
                }}
                notMerge={true}
                lazyUpdate={true}
              />
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Loading chart data...
                </Typography>
              </Box>
            );
          })()}
        </Box>
      </CardContent>

      {!isFullscreen && (
        <CardActions sx={{ px: 2, py: 1 }}>
          <Button
            size="small"
            onClick={loadChartData}
            startIcon={<Refresh />}
            disabled={loading}
            variant="outlined"
          >
            Refresh
          </Button>
          {onToggleFullscreen && (
            <Button
              size="small"
              onClick={onToggleFullscreen}
              startIcon={<Fullscreen />}
              variant="outlined"
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
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.5)'
              : '0 8px 32px rgba(0, 0, 0, 0.15)'
          }
        }}
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
        <MenuItem onClick={() => { onDelete(chartConfig.id); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} /> Delete Chart
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default CustomChart;
