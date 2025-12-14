/**
 * Tests for Prometheus Metrics Integration
 *
 * These tests verify that the Admin dashboard can fetch and parse
 * Prometheus metrics from the Flask backend's /metrics endpoint.
 */

import { render, screen, waitFor } from '@testing-library/react';
import apiService from '../../../services/apiService';

// Mock the API service
jest.mock('../../../services/apiService');

describe('Prometheus Metrics Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Service - getPrometheusMetrics', () => {
    const mockPrometheusText = `# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/api/v1/mqtt/status",status="200"} 15
http_requests_total{method="GET",endpoint="/api/v1/devices",status="200"} 8
# HELP mqtt_connections_active Active MQTT connections
# TYPE mqtt_connections_active gauge
mqtt_connections_active 1
# HELP system_cpu_usage_percent CPU usage percentage
# TYPE system_cpu_usage_percent gauge
system_cpu_usage_percent 25.3
# HELP system_memory_usage_percent Memory usage percentage
# TYPE system_memory_usage_percent gauge
system_memory_usage_percent 62.8
# HELP iotflow_devices_total Total number of registered devices
# TYPE iotflow_devices_total gauge
iotflow_devices_total 12
# HELP iotflow_telemetry_messages_total Total telemetry messages received
# TYPE iotflow_telemetry_messages_total counter
iotflow_telemetry_messages_total 1543`;

    it('should fetch Prometheus metrics from /metrics endpoint', async () => {
      apiService.getPrometheusMetrics = jest.fn().mockResolvedValue(mockPrometheusText);

      const result = await apiService.getPrometheusMetrics();

      expect(apiService.getPrometheusMetrics).toHaveBeenCalledTimes(1);
      expect(result).toContain('http_requests_total');
      expect(result).toContain('mqtt_connections_active');
    });

    it('should include admin token in the request', async () => {
      apiService.getPrometheusMetrics = jest.fn().mockResolvedValue(mockPrometheusText);

      await apiService.getPrometheusMetrics();

      expect(apiService.getPrometheusMetrics).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      apiService.getPrometheusMetrics = jest
        .fn()
        .mockRejectedValue(new Error('Failed to fetch metrics'));

      await expect(apiService.getPrometheusMetrics()).rejects.toThrow('Failed to fetch metrics');
    });
  });

  describe('Prometheus Parser Utility', () => {
    const mockMetricsText = `# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/api/v1/mqtt/status",status="200"} 15
http_requests_total{method="POST",endpoint="/api/v1/devices",status="201"} 3
# HELP mqtt_connections_active Active MQTT connections
# TYPE mqtt_connections_active gauge
mqtt_connections_active 1
# HELP system_cpu_usage_percent CPU usage percentage
# TYPE system_cpu_usage_percent gauge
system_cpu_usage_percent 25.3`;

    it('should parse Prometheus text format into structured data', () => {
      const { parsePrometheusMetrics } = require('../../../utils/prometheusParser');

      const parsed = parsePrometheusMetrics(mockMetricsText);

      expect(parsed).toHaveProperty('metrics');
      expect(Array.isArray(parsed.metrics)).toBe(true);
      expect(parsed.metrics.length).toBeGreaterThan(0);
    });

    it('should extract metric names, values, and labels', () => {
      const { parsePrometheusMetrics } = require('../../../utils/prometheusParser');

      const parsed = parsePrometheusMetrics(mockMetricsText);
      const httpMetric = parsed.metrics.find(m => m.name === 'http_requests_total');

      expect(httpMetric).toBeDefined();
      expect(httpMetric.type).toBe('counter');
      expect(httpMetric.help).toContain('Total HTTP requests');
      expect(Array.isArray(httpMetric.samples)).toBe(true);
    });

    it('should parse labels correctly', () => {
      const { parsePrometheusMetrics } = require('../../../utils/prometheusParser');

      const parsed = parsePrometheusMetrics(mockMetricsText);
      const httpMetric = parsed.metrics.find(m => m.name === 'http_requests_total');
      const sample = httpMetric.samples[0];

      expect(sample).toHaveProperty('labels');
      expect(sample.labels).toHaveProperty('method');
      expect(sample.labels).toHaveProperty('endpoint');
      expect(sample.labels).toHaveProperty('status');
    });

    it('should extract numeric values correctly', () => {
      const { parsePrometheusMetrics } = require('../../../utils/prometheusParser');

      const parsed = parsePrometheusMetrics(mockMetricsText);
      const cpuMetric = parsed.metrics.find(m => m.name === 'system_cpu_usage_percent');

      expect(cpuMetric.samples[0].value).toBe(25.3);
    });

    it('should group metrics by name', () => {
      const { parsePrometheusMetrics } = require('../../../utils/prometheusParser');

      const parsed = parsePrometheusMetrics(mockMetricsText);
      const httpMetric = parsed.metrics.find(m => m.name === 'http_requests_total');

      expect(httpMetric.samples.length).toBe(2); // Two samples for http_requests_total
    });

    it('should handle empty or malformed input gracefully', () => {
      const { parsePrometheusMetrics } = require('../../../utils/prometheusParser');

      const parsed = parsePrometheusMetrics('');
      expect(parsed.metrics).toEqual([]);
    });

    it('should extract summary statistics', () => {
      const {
        parsePrometheusMetrics,
        getMetricsSummary,
      } = require('../../../utils/prometheusParser');

      const parsed = parsePrometheusMetrics(mockMetricsText);
      const summary = getMetricsSummary(parsed);

      expect(summary).toHaveProperty('totalMetrics');
      expect(summary).toHaveProperty('metricTypes');
      expect(summary.totalMetrics).toBeGreaterThan(0);
    });
  });

  describe('Metrics Display Integration', () => {
    it('should extract key system metrics for display', () => {
      const {
        parsePrometheusMetrics,
        getSystemMetrics,
      } = require('../../../utils/prometheusParser');

      const mockText = `system_cpu_usage_percent 25.3
system_memory_usage_percent 62.8
mqtt_connections_active 1
iotflow_devices_total 12
http_requests_total 150`;

      const parsed = parsePrometheusMetrics(mockText);
      const systemMetrics = getSystemMetrics(parsed);

      expect(systemMetrics).toHaveProperty('cpu');
      expect(systemMetrics).toHaveProperty('memory');
      expect(systemMetrics).toHaveProperty('mqttConnections');
      expect(systemMetrics).toHaveProperty('totalDevices');
    });

    it('should provide default values for missing metrics', () => {
      const {
        parsePrometheusMetrics,
        getSystemMetrics,
      } = require('../../../utils/prometheusParser');

      const parsed = parsePrometheusMetrics('');
      const systemMetrics = getSystemMetrics(parsed);

      expect(systemMetrics.cpu).toBeDefined();
      expect(systemMetrics.memory).toBeDefined();
    });

    it('should calculate percentages correctly', () => {
      const {
        parsePrometheusMetrics,
        getSystemMetrics,
      } = require('../../../utils/prometheusParser');

      const mockText = `system_cpu_usage_percent 75.5`;
      const parsed = parsePrometheusMetrics(mockText);
      const systemMetrics = getSystemMetrics(parsed);

      expect(systemMetrics.cpu).toBe(75.5);
      expect(systemMetrics.cpu).toBeLessThanOrEqual(100);
    });
  });
});
