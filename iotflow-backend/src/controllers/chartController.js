const Chart = require('../models/chart');
const notificationService = require('../services/notificationService');

class ChartController {
  async getCharts(req, res) {
    try {
      console.log('Get charts request received for user:', req.user.id);

      const charts = await Chart.findByUser(req.user.id);
      console.log('Found charts:', charts.length);

      res.json({
        success: true,
        data: charts
      });
    } catch (error) {
      console.error('Error fetching charts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch charts'
      });
    }
  }

  async getChart(req, res) {
    try {
      const chart = await Chart.findByIdAndUser(req.params.id, req.user.id);
      if (!chart) {
        return res.status(404).json({
          success: false,
          error: 'Chart not found'
        });
      }
      res.json({
        success: true,
        data: chart
      });
    } catch (error) {
      console.error('Error fetching chart:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch chart'
      });
    }
  }

  async createChart(req, res) {
    try {
      console.log('Chart creation request received');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User:', req.user.id, req.user.username);

      const chartData = {
        ...req.body,
        userId: req.user.id
      };

      // Validate required fields
      if (!chartData.name || !chartData.type) {
        console.log('Validation failed: missing name or type');
        return res.status(400).json({
          success: false,
          error: 'Name and type are required'
        });
      }

      console.log('Creating chart with data:', JSON.stringify(chartData, null, 2));
      const chart = await Chart.createChart(chartData);
      console.log('Chart created successfully:', chart.id);

      // Send notification for chart creation
      await notificationService.notifyChartCreated(req.user.id, chartData.name);

      res.status(201).json({
        success: true,
        data: chart
      });
    } catch (error) {
      console.error('Error creating chart:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create chart'
      });
    }
  }

  async updateChart(req, res) {
    try {
      const chart = await Chart.updateChart(req.params.id, req.body, req.user.id);
      if (!chart) {
        return res.status(404).json({
          success: false,
          error: 'Chart not found'
        });
      }

      // Send notification for chart update
      await notificationService.notifyChartUpdated(req.user.id, chart.name);

      res.json({
        success: true,
        data: chart
      });
    } catch (error) {
      console.error('Error updating chart:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update chart'
      });
    }
  }

  async deleteChart(req, res) {
    try {
      // First get the chart name for notification
      const chartToDelete = await Chart.findByIdAndUser(req.params.id, req.user.id);
      if (!chartToDelete) {
        return res.status(404).json({
          success: false,
          error: 'Chart not found'
        });
      }

      const success = await Chart.deleteChart(req.params.id, req.user.id);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Chart not found'
        });
      }

      // Send notification for chart deletion
      await notificationService.notifyChartDeleted(req.user.id, chartToDelete.name);

      res.json({
        success: true,
        message: 'Chart deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting chart:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete chart'
      });
    }
  }

  async duplicateChart(req, res) {
    try {
      const originalChart = await Chart.findByIdAndUser(req.params.id, req.user.id);
      if (!originalChart) {
        return res.status(404).json({
          success: false,
          error: 'Chart not found'
        });
      }

      const duplicateData = {
        ...originalChart,
        name: `${originalChart.name} (Copy)`,
        userId: req.user.id,
        // Extract appearance config if it exists
        showLegend: originalChart.appearance_config?.showLegend,
        showGrid: originalChart.appearance_config?.showGrid,
        animations: originalChart.appearance_config?.animations,
        fillArea: originalChart.appearance_config?.fillArea,
        lineWidth: originalChart.appearance_config?.lineWidth,
        aspectRatio: originalChart.appearance_config?.aspectRatio,
        yAxisMin: originalChart.appearance_config?.yAxisMin,
        yAxisMax: originalChart.appearance_config?.yAxisMax,
        customColors: originalChart.appearance_config?.customColors,
        backgroundColor: originalChart.appearance_config?.backgroundColor,
        borderColor: originalChart.appearance_config?.borderColor,
        pointStyle: originalChart.appearance_config?.pointStyle
      };
      delete duplicateData.id;
      delete duplicateData.created_at;
      delete duplicateData.updated_at;
      delete duplicateData.appearance_config;

      const chart = await Chart.createChart(duplicateData);

      // Send notification for chart duplication
      await notificationService.createNotification(req.user.id, {
        type: 'success',
        title: 'Chart Duplicated',
        message: `Chart "${originalChart.name}" has been duplicated as "${duplicateData.name}"`,
        device_id: null,
        source: 'chart_management',
        metadata: { action: 'duplicate', original_chart: originalChart.name, new_chart: duplicateData.name }
      });

      res.status(201).json({
        success: true,
        data: chart
      });
    } catch (error) {
      console.error('Error duplicating chart:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to duplicate chart'
      });
    }
  }
}

module.exports = new ChartController();
