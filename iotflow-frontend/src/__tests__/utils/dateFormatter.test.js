import {
  formatDate,
  formatDateTime,
  safeFormatDate,
  safeFormatDateTime,
} from '../../utils/dateFormatter';

describe('dateFormatter', () => {
  describe('formatDate', () => {
    it('should format a valid ISO date string', () => {
      const date = '2024-01-15T10:30:00.000Z';
      const result = formatDate(date);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // MM/DD/YYYY or similar
    });

    it('should format a Date object', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const result = formatDate(date);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should handle timestamp numbers', () => {
      const timestamp = Date.now();
      const result = formatDate(timestamp);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  describe('formatDateTime', () => {
    it('should format a valid ISO date string with time', () => {
      const date = '2024-01-15T10:30:00.000Z';
      const result = formatDateTime(date);
      // Should include time component
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}.*\d{1,2}:\d{2}/);
    });

    it('should format a Date object with time', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const result = formatDateTime(date);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}.*\d{1,2}:\d{2}/);
    });
  });

  describe('safeFormatDate', () => {
    it('should format valid dates', () => {
      const date = '2024-01-15T10:30:00.000Z';
      const result = safeFormatDate(date);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should return fallback for null', () => {
      const result = safeFormatDate(null);
      expect(result).toBe('N/A');
    });

    it('should return fallback for undefined', () => {
      const result = safeFormatDate(undefined);
      expect(result).toBe('N/A');
    });

    it('should return fallback for invalid date string', () => {
      const result = safeFormatDate('invalid-date');
      expect(result).toBe('N/A');
    });

    it('should return fallback for empty string', () => {
      const result = safeFormatDate('');
      expect(result).toBe('N/A');
    });

    it('should accept custom fallback text', () => {
      const result = safeFormatDate(null, 'Not Available');
      expect(result).toBe('Not Available');
    });

    it('should handle snake_case field names from backend', () => {
      const userData = { created_at: '2024-01-15T10:30:00.000Z' };
      const result = safeFormatDate(userData.created_at);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  describe('safeFormatDateTime', () => {
    it('should format valid dates with time', () => {
      const date = '2024-01-15T10:30:00.000Z';
      const result = safeFormatDateTime(date);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}.*\d{1,2}:\d{2}/);
    });

    it('should return fallback for null', () => {
      const result = safeFormatDateTime(null);
      expect(result).toBe('N/A');
    });

    it('should return fallback for undefined', () => {
      const result = safeFormatDateTime(undefined);
      expect(result).toBe('N/A');
    });

    it('should return fallback for invalid date string', () => {
      const result = safeFormatDateTime('invalid-date');
      expect(result).toBe('N/A');
    });

    it('should accept custom fallback text', () => {
      const result = safeFormatDateTime(null, 'Never');
      expect(result).toBe('Never');
    });

    it('should handle snake_case field names from backend', () => {
      const userData = { last_login: '2024-01-15T10:30:00.000Z' };
      const result = safeFormatDateTime(userData.last_login);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}.*\d{1,2}:\d{2}/);
    });
  });
});
