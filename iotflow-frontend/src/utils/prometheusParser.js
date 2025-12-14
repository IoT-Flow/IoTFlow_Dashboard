/**
 * Prometheus Metrics Parser Utility
 *
 * Parses Prometheus text exposition format into structured JavaScript objects.
 * Format specification: https://prometheus.io/docs/instrumenting/exposition_formats/
 */

/**
 * Parse Prometheus metrics text into structured data
 * @param {string} metricsText - Raw Prometheus metrics in text format
 * @returns {object} Parsed metrics with metadata
 */
export function parsePrometheusMetrics(metricsText) {
  if (!metricsText || typeof metricsText !== 'string') {
    return { metrics: [] };
  }

  const lines = metricsText.trim().split('\n');
  const metrics = [];
  let currentMetric = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) continue;

    // Parse HELP comment
    if (trimmedLine.startsWith('# HELP ')) {
      const helpMatch = trimmedLine.match(/^# HELP\s+(\S+)\s+(.+)$/);
      if (helpMatch) {
        const [, name, help] = helpMatch;

        // Find or create metric
        currentMetric = metrics.find(m => m.name === name);
        if (!currentMetric) {
          currentMetric = { name, help: '', type: '', samples: [] };
          metrics.push(currentMetric);
        }
        currentMetric.help = help;
      }
      continue;
    }

    // Parse TYPE comment
    if (trimmedLine.startsWith('# TYPE ')) {
      const typeMatch = trimmedLine.match(/^# TYPE\s+(\S+)\s+(\S+)$/);
      if (typeMatch) {
        const [, name, type] = typeMatch;

        // Find or create metric
        currentMetric = metrics.find(m => m.name === name);
        if (!currentMetric) {
          currentMetric = { name, help: '', type: '', samples: [] };
          metrics.push(currentMetric);
        }
        currentMetric.type = type;
      }
      continue;
    }

    // Skip other comments
    if (trimmedLine.startsWith('#')) continue;

    // Parse metric sample: metric_name{label="value"} number timestamp
    const sampleMatch = trimmedLine.match(/^(\w+)(?:\{([^}]+)\})?\s+([\d.eE+-]+)(?:\s+(\d+))?$/);
    if (sampleMatch) {
      const [, name, labelsStr, valueStr, timestampStr] = sampleMatch;

      // Find or create metric
      let metric = metrics.find(m => m.name === name);
      if (!metric) {
        metric = { name, help: '', type: '', samples: [] };
        metrics.push(metric);
      }

      // Parse labels
      const labels = {};
      if (labelsStr) {
        const labelPairs = labelsStr.match(/(\w+)="([^"]*)"/g);
        if (labelPairs) {
          labelPairs.forEach(pair => {
            const [key, value] = pair.split('=');
            labels[key] = value.replace(/"/g, '');
          });
        }
      }

      // Add sample
      metric.samples.push({
        labels,
        value: parseFloat(valueStr),
        timestamp: timestampStr ? parseInt(timestampStr) : null,
      });
    }
  }

  return { metrics };
}

/**
 * Get summary statistics about parsed metrics
 * @param {object} parsed - Parsed metrics object from parsePrometheusMetrics
 * @returns {object} Summary statistics
 */
export function getMetricsSummary(parsed) {
  const { metrics } = parsed;

  const metricTypes = {};
  let totalSamples = 0;

  metrics.forEach(metric => {
    if (metric.type) {
      metricTypes[metric.type] = (metricTypes[metric.type] || 0) + 1;
    }
    totalSamples += metric.samples.length;
  });

  return {
    totalMetrics: metrics.length,
    totalSamples,
    metricTypes,
  };
}

/**
 * Extract key system metrics for dashboard display
 * @param {object} parsed - Parsed metrics object from parsePrometheusMetrics
 * @returns {object} Key system metrics with default values
 */
export function getSystemMetrics(parsed) {
  const { metrics } = parsed;

  // Helper to find metric value (returns first sample or average of all samples)
  const findMetricValue = name => {
    const metric = metrics.find(m => m.name === name);
    if (metric && metric.samples.length > 0) {
      // If multiple samples (like disk partitions), return the first or average
      if (metric.samples.length === 1) {
        return metric.samples[0].value;
      }
      // For metrics with multiple samples (e.g., disk per partition), average them
      const sum = metric.samples.reduce((acc, sample) => acc + sample.value, 0);
      return sum / metric.samples.length;
    }
    return null;
  };

  // Helper to sum all samples of a metric
  const sumMetricValues = name => {
    const metric = metrics.find(m => m.name === name);
    if (metric && metric.samples.length > 0) {
      return metric.samples.reduce((sum, sample) => sum + sample.value, 0);
    }
    return null;
  };

  // Helper to format bytes to human-readable format
  const formatBytes = bytes => {
    if (bytes === null || bytes === undefined) return null;
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Helper to calculate rate from counters (simple, returns formatted string)
  const getFormattedRate = metricName => {
    const value = sumMetricValues(metricName);
    if (value === null) return null;
    // Convert bytes to MB/s (simplified - actual rate would need time delta)
    return `${(value / 1024 / 1024).toFixed(2)} MB/s`;
  };

  return {
    cpu: findMetricValue('system_cpu_usage_percent'),
    memory: findMetricValue('system_memory_usage_percent'),
    disk: findMetricValue('system_disk_usage_percent'),
    storageUsed: findMetricValue('system_disk_usage_percent'), // Alias for compatibility
    mqttConnections: findMetricValue('mqtt_connections_active'),
    totalDevices: findMetricValue('iotflow_devices_total'),
    httpRequests: sumMetricValues('http_requests_total'),
    telemetryMessages: findMetricValue('iotflow_telemetry_messages_total'),
    databaseConnections: findMetricValue('database_connections_total'),
    networkBytesReceived: sumMetricValues('system_network_bytes_received_total'),
    networkBytesSent: sumMetricValues('system_network_bytes_sent_total'),
    networkIn: formatBytes(sumMetricValues('system_network_bytes_received_total')),
    networkOut: formatBytes(sumMetricValues('system_network_bytes_sent_total')),
    diskIoReadBytes: sumMetricValues('system_disk_io_read_bytes_total'),
    diskIoWriteBytes: sumMetricValues('system_disk_io_write_bytes_total'),
    diskIoRead: getFormattedRate('system_disk_io_read_bytes_total'),
    diskIoWrite: getFormattedRate('system_disk_io_write_bytes_total'),
    // Service status
    redisStatus: findMetricValue('redis_status'), // 1=up, 0=down
    mqttConnectionsActive: findMetricValue('mqtt_connections_active'),
    iotdbStatus: findMetricValue('iotdb_connection_status'), // 1=connected, 0=disconnected
    appUptimeSeconds: findMetricValue('app_uptime_seconds'),
  };
}

/**
 * Format metric value with appropriate unit
 * @param {string} metricName - Name of the metric
 * @param {number} value - Metric value
 * @returns {string} Formatted value with unit
 */
export function formatMetricValue(metricName, value) {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  // Percentage metrics
  if (metricName.includes('percent') || metricName.includes('usage')) {
    return `${value.toFixed(1)}%`;
  }

  // Counter metrics (large numbers)
  if (metricName.includes('total') || metricName.includes('count')) {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(0);
  }

  // Gauge metrics (regular numbers)
  return value.toFixed(2);
}
