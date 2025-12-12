/**
 * Telemetry Data Parser Utility
 *
 * Handles parsing of telemetry data in both:
 * 1. Enhanced format: measurement_type + unit + value
 * 2. Legacy format: direct temperature/humidity/pressure fields
 */

/**
 * Get default unit for legacy measurements
 * @param {string} measurementType - The measurement type (temperature, humidity, etc.)
 * @returns {string} Default unit for the measurement type
 */
function getDefaultUnit(measurementType) {
  const defaults = {
    temperature: '°C',
    humidity: '%',
    pressure: 'hPa',
    battery_level: '%',
    signal_strength: 'dBm',
    signal_quality: '%',
    air_quality: 'AQI',
    light_level: 'lux',
  };
  return defaults[measurementType] || '';
}

/**
 * Parse telemetry data with enhanced format support
 *
 * Enhanced format: { measurement_type, unit, value, timestamp }
 * Legacy format: { temperature, humidity, pressure, timestamp }
 *
 * @param {Array} telemetryData - Raw telemetry data from Flask API
 * @param {number|string} deviceId - Device ID for context
 * @returns {Object} Parsed telemetry grouped by measurement type with metadata
 *
 * Output structure:
 * {
 *   [measurementType]: {
 *     unit: string,
 *     values: [{ timestamp: Date, value: number, device_id: number|string, measurement: string }]
 *   }
 * }
 */
export function parseTelemetryData(telemetryData, deviceId = null) {
  const parsed = {};

  telemetryData.forEach(record => {
    // Check if this is enhanced format (measurement_type + unit + value)
    if (record.measurement_type && record.value !== null && record.value !== undefined) {
      // Enhanced format
      const measurementType = record.measurement_type;
      const unit = record.unit || '';
      const value = parseFloat(record.value);
      const timestamp = new Date(record.timestamp);

      if (!parsed[measurementType]) {
        parsed[measurementType] = {
          unit: unit,
          values: [],
        };
      }

      parsed[measurementType].values.push({
        timestamp,
        value,
        device_id: deviceId,
        measurement: measurementType,
      });
    } else {
      // Legacy format - check for direct temperature/humidity/pressure fields
      Object.keys(record).forEach(key => {
        if (
          key !== 'timestamp' &&
          !key.startsWith('meta_') &&
          !key.startsWith('device_') &&
          key !== 'measurement_type' &&
          key !== 'unit' &&
          key !== 'value' &&
          key !== 'complete_flow_test' // Exclude test metadata
        ) {
          const value = record[key];

          if (value !== null && value !== undefined) {
            const measurementType = key; // temperature, humidity, pressure
            const timestamp = new Date(record.timestamp);

            if (!parsed[measurementType]) {
              parsed[measurementType] = {
                unit: getDefaultUnit(measurementType),
                values: [],
              };
            }

            parsed[measurementType].values.push({
              timestamp,
              value: parseFloat(value),
              device_id: deviceId,
              measurement: measurementType,
            });
          }
        }
      });
    }
  });

  return parsed;
}

/**
 * Convert parsed telemetry data to the format expected by Telemetry component
 *
 * @param {Object} parsedData - Output from parseTelemetryData
 * @param {number|string} deviceId - Device ID
 * @returns {Object} Telemetry history in component format
 */
export function convertToTelemetryHistory(parsedData, deviceId) {
  const history = {};

  if (!history[deviceId]) {
    history[deviceId] = {};
  }

  Object.keys(parsedData).forEach(measurementType => {
    history[deviceId][measurementType] = parsedData[measurementType].values;
  });

  return history;
}

/**
 * Get measurement metadata (units) from parsed data
 *
 * @param {Object} parsedData - Output from parseTelemetryData
 * @returns {Object} Map of measurement type to unit
 */
export function getMeasurementMetadata(parsedData) {
  const metadata = {};

  Object.keys(parsedData).forEach(measurementType => {
    metadata[measurementType] = {
      unit: parsedData[measurementType].unit,
      displayName: formatMeasurementName(measurementType),
    };
  });

  return metadata;
}

/**
 * Format measurement name for display
 * @param {string} measurementType - Raw measurement type
 * @returns {string} Formatted display name
 */
function formatMeasurementName(measurementType) {
  // Convert snake_case to Title Case
  return measurementType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default {
  parseTelemetryData,
  convertToTelemetryHistory,
  getMeasurementMetadata,
};
