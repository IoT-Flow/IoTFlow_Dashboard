const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ChartService {
  async getAuthHeaders() {
    const token = localStorage.getItem('iotflow_token'); // FIXED: use the same key as login
    console.log('ChartService: Getting auth headers, token exists:', !!token);
    if (token) {
      console.log('ChartService: Token length:', token.length);
      console.log('ChartService: Token preview:', token.substring(0, 20) + '...');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async handleResponse(response) {
    console.log('Chart API Response Status:', response.status);
    console.log('Chart API Response URL:', response.url);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      console.error('Chart API Error:', error);
      throw new Error(error.error || error.message || 'Request failed');
    }
    return response.json();
  }

  async getCharts() {
    try {
      console.log('Fetching charts from API...');

      const headers = await this.getAuthHeaders();
      console.log('Using headers for getCharts:', headers);

      const response = await fetch(`${API_BASE_URL}/charts`, {
        method: 'GET',
        headers
      });
      const result = await this.handleResponse(response);
      console.log('Charts fetched successfully:', result.data);
      return result.data;
    } catch (error) {
      console.error('Error fetching charts:', error);
      throw error;
    }
  }

  async getChart(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/charts/${id}`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });
      const result = await this.handleResponse(response);
      return result.data;
    } catch (error) {
      console.error('Error fetching chart:', error);
      throw error;
    }
  }

  async createChart(chartConfig) {
    try {
      console.log('Creating chart with config:', chartConfig);

      // Transform frontend config to backend format
      const backendConfig = this.transformToBackendFormat(chartConfig);
      console.log('Transformed backend config:', backendConfig);

      const headers = await this.getAuthHeaders();
      console.log('Using headers:', headers);

      const response = await fetch(`${API_BASE_URL}/charts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(backendConfig)
      });
      const result = await this.handleResponse(response);
      return result.data;
    } catch (error) {
      console.error('Error creating chart:', error);
      throw error;
    }
  }

  async updateChart(id, chartConfig) {
    try {
      // Transform frontend config to backend format
      const backendConfig = this.transformToBackendFormat(chartConfig);

      const response = await fetch(`${API_BASE_URL}/charts/${id}`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(backendConfig)
      });
      const result = await this.handleResponse(response);
      return result.data;
    } catch (error) {
      console.error('Error updating chart:', error);
      throw error;
    }
  }

  async deleteChart(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/charts/${id}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders()
      });
      const result = await this.handleResponse(response);
      return result;
    } catch (error) {
      console.error('Error deleting chart:', error);
      throw error;
    }
  }

  async duplicateChart(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/charts/${id}/duplicate`, {
        method: 'POST',
        headers: await this.getAuthHeaders()
      });
      const result = await this.handleResponse(response);
      return result.data;
    } catch (error) {
      console.error('Error duplicating chart:', error);
      throw error;
    }
  }

  transformToBackendFormat(chartConfig) {
    return {
      name: chartConfig.name,
      title: chartConfig.title,
      description: chartConfig.description,
      type: chartConfig.type,
      devices: chartConfig.devices || [],
      measurements: chartConfig.measurements || [],
      timeRange: chartConfig.timeRange,
      refreshInterval: chartConfig.refreshInterval,
      aggregation: chartConfig.aggregation,
      groupBy: chartConfig.groupBy,

      // Appearance settings (will be stored as JSON in appearance_config)
      showLegend: chartConfig.showLegend,
      showGrid: chartConfig.showGrid,
      animations: chartConfig.animations,
      fillArea: chartConfig.fillArea,
      lineWidth: chartConfig.lineWidth,
      aspectRatio: chartConfig.aspectRatio,
      yAxisMin: chartConfig.yAxisMin,
      yAxisMax: chartConfig.yAxisMax,
      customColors: chartConfig.customColors,
      backgroundColor: chartConfig.backgroundColor,
      borderColor: chartConfig.borderColor,
      pointStyle: chartConfig.pointStyle
    };
  }

  transformFromBackendFormat(backendChart) {
    const appearanceConfig = backendChart.appearance_config || {};

    return {
      id: backendChart.id,
      name: backendChart.name,
      title: backendChart.title,
      description: backendChart.description,
      type: backendChart.type,
      devices: backendChart.devices || [],
      measurements: backendChart.measurements || [],
      timeRange: backendChart.time_range,
      refreshInterval: backendChart.refresh_interval,
      aggregation: backendChart.aggregation,
      groupBy: backendChart.group_by,
      createdAt: backendChart.created_at,
      updatedAt: backendChart.updated_at,

      // Appearance settings from JSON
      showLegend: appearanceConfig.showLegend ?? true,
      showGrid: appearanceConfig.showGrid ?? true,
      animations: appearanceConfig.animations ?? true,
      fillArea: appearanceConfig.fillArea ?? false,
      lineWidth: appearanceConfig.lineWidth ?? 2,
      aspectRatio: appearanceConfig.aspectRatio ?? 2,
      yAxisMin: appearanceConfig.yAxisMin,
      yAxisMax: appearanceConfig.yAxisMax,
      customColors: appearanceConfig.customColors || [],
      backgroundColor: appearanceConfig.backgroundColor || '#ffffff',
      borderColor: appearanceConfig.borderColor || '#1976d2',
      pointStyle: appearanceConfig.pointStyle || 'circle'
    };
  }
}

export const chartService = new ChartService();
export default chartService;
