/**
 * Unit Tests: Telemetry Data Parser
 *
 * Tests the data parsing logic separately from the React component
 */

import { parseTelemetryData, getMeasurementMetadata } from '../../utils/telemetryParser';

describe('Telemetry Data Parser - Unit Tests', () => {
  describe('Enhanced Format (measurement_type + unit + value)', () => {
    it('should parse single measurement with type, unit, and value', () => {
      const data = [
        {
          timestamp: '2025-12-12T02:39:18.645000+00:00',
          measurement_type: 'distance',
          unit: 'm',
          value: 45.7,
        },
      ];

      const result = parseTelemetryData(data);

      expect(result).toHaveProperty('distance');
      expect(result.distance.unit).toBe('m');
      expect(result.distance.values).toHaveLength(1);
      expect(result.distance.values[0].value).toBe(45.7);
      expect(result.distance.values[0].timestamp).toBeInstanceOf(Date);
    });

    it('should group multiple measurements by type', () => {
      const data = [
        {
          timestamp: '2025-12-12T02:39:18.645000+00:00',
          measurement_type: 'distance',
          unit: 'm',
          value: 45.7,
        },
        {
          timestamp: '2025-12-12T02:39:19.000000+00:00',
          measurement_type: 'distance',
          unit: 'm',
          value: 46.2,
        },
        {
          timestamp: '2025-12-12T02:39:18.618000+00:00',
          measurement_type: 'speed',
          unit: 'm/s',
          value: 12.3,
        },
      ];

      const result = parseTelemetryData(data);

      expect(result.distance.values).toHaveLength(2);
      expect(result.distance.values[0].value).toBe(45.7);
      expect(result.distance.values[1].value).toBe(46.2);
      expect(result.speed.values).toHaveLength(1);
      expect(result.speed.values[0].value).toBe(12.3);
      expect(result.speed.unit).toBe('m/s');
    });

    it('should filter out null values', () => {
      const data = [
        {
          timestamp: '2025-12-12T02:39:18.645000+00:00',
          measurement_type: 'distance',
          unit: 'm',
          value: 45.7,
        },
        {
          timestamp: '2025-12-12T02:39:18.618000+00:00',
          measurement_type: 'speed',
          unit: 'm/s',
          value: null,
        },
      ];

      const result = parseTelemetryData(data);

      expect(result).toHaveProperty('distance');
      expect(result).not.toHaveProperty('speed');
    });

    it('should NOT treat measurement_type, unit, or value as separate measurements', () => {
      const data = [
        {
          timestamp: '2025-12-12T02:39:18.645000+00:00',
          measurement_type: 'distance',
          unit: 'm',
          value: 45.7,
        },
      ];

      const result = parseTelemetryData(data);

      // Should only have 'distance' key, not 'measurement_type', 'unit', or 'value'
      expect(Object.keys(result)).toEqual(['distance']);
      expect(result).not.toHaveProperty('measurement_type');
      expect(result).not.toHaveProperty('unit');
      expect(result).not.toHaveProperty('value');
    });
  });

  describe('Legacy Format (direct temperature/humidity/pressure fields)', () => {
    it('should parse legacy temperature field', () => {
      const data = [
        {
          timestamp: '2025-12-12T02:11:27.390000+00:00',
          temperature: 25.8,
          humidity: null,
          pressure: null,
          measurement_type: null,
          unit: null,
          value: null,
        },
      ];

      const result = parseTelemetryData(data);

      expect(result).toHaveProperty('temperature');
      expect(result.temperature.unit).toBe('°C');
      expect(result.temperature.values[0].value).toBe(25.8);
    });

    it('should parse multiple legacy fields from same record', () => {
      const data = [
        {
          timestamp: '2025-12-12T02:11:27.390000+00:00',
          temperature: 25.8,
          humidity: 62.1,
          pressure: 1012.5,
          measurement_type: null,
          unit: null,
          value: null,
        },
      ];

      const result = parseTelemetryData(data);

      expect(result).toHaveProperty('temperature');
      expect(result).toHaveProperty('humidity');
      expect(result).toHaveProperty('pressure');
      expect(result.temperature.values[0].value).toBe(25.8);
      expect(result.humidity.values[0].value).toBe(62.1);
      expect(result.humidity.unit).toBe('%');
      expect(result.pressure.values[0].value).toBe(1012.5);
      expect(result.pressure.unit).toBe('hPa');
    });
  });

  describe('Mixed Format', () => {
    it('should handle both enhanced and legacy formats in same dataset', () => {
      const data = [
        // Enhanced format
        {
          timestamp: '2025-12-12T02:39:18.645000+00:00',
          measurement_type: 'distance',
          unit: 'm',
          value: 45.7,
          temperature: null,
          humidity: null,
          pressure: null,
        },
        // Legacy format
        {
          timestamp: '2025-12-12T02:11:27.390000+00:00',
          temperature: 25.8,
          humidity: 62.1,
          pressure: 1012.5,
          measurement_type: null,
          unit: null,
          value: null,
        },
      ];

      const result = parseTelemetryData(data);

      expect(result).toHaveProperty('distance');
      expect(result).toHaveProperty('temperature');
      expect(result).toHaveProperty('humidity');
      expect(result).toHaveProperty('pressure');
      expect(result.distance.unit).toBe('m');
      expect(result.temperature.unit).toBe('°C');
    });
  });
});
