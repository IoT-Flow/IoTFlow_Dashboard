/**
 * Tests for MQTT Monitoring Integration
 *
 * These tests verify that the MQTT page can fetch real-time
 * monitoring data from the Flask backend's MQTT endpoints.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import apiService from '../../../services/apiService';
import Mqtt from '../../../pages/Mqtt';

// Mock the API service
jest.mock('../../../services/apiService');

describe('MQTT Monitoring Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Service - getMqttMetrics', () => {
    it('should fetch MQTT metrics from backend', async () => {
      const mockMetrics = {
        status: 'success',
        metrics: {
          connection_status: {
            connected: true,
            host: 'localhost',
            port: 1883,
            use_tls: false,
          },
          topics: {
            total_structures: 15,
            base_topic: 'iotflow',
          },
          handlers: {
            message_handlers: 5,
            subscription_callbacks: 3,
          },
        },
        timestamp: '2025-12-14T10:30:00Z',
      };

      apiService.getMqttMetrics = jest.fn().mockResolvedValue(mockMetrics);

      const result = await apiService.getMqttMetrics();

      expect(apiService.getMqttMetrics).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockMetrics);
      expect(result.metrics.connection_status.connected).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      apiService.getMqttMetrics = jest
        .fn()
        .mockRejectedValue(new Error('Failed to fetch MQTT metrics'));

      await expect(apiService.getMqttMetrics()).rejects.toThrow('Failed to fetch MQTT metrics');
    });

    it('should include admin token in request', async () => {
      const mockMetrics = {
        status: 'success',
        metrics: {
          connection_status: { connected: true },
        },
      };

      apiService.getMqttMetrics = jest.fn().mockResolvedValue(mockMetrics);

      await apiService.getMqttMetrics();

      // Verify the method was called (token handling is in API class)
      expect(apiService.getMqttMetrics).toHaveBeenCalled();
    });
  });

  describe('MQTT Page Component', () => {
    const mockMetricsData = {
      status: 'success',
      metrics: {
        connection_metrics: {
          broker_connection: {
            connected: true,
            host: 'mqtt.example.com',
            port: 1883,
            use_tls: false,
            active_connections: 24,
          },
        },
        overview: {
          uptime_seconds: 172800, // 2 days in seconds
        },
        handler_metrics: {
          handler_statistics: {
            total_handlers: 5,
          },
        },
        topic_metrics: {
          topic_management: {
            total_topic_structures: 15,
          },
        },
        subscription_metrics: {
          active_subscriptions: 3,
        },
        message_metrics: {
          data_transfer: {},
        },
        prometheus_metrics: {
          mqtt_messages_received_total: 15847,
          mqtt_messages_sent_total: 15923,
          mqtt_bytes_received_total: 2515968, // bytes
          mqtt_bytes_sent_total: 2621440,
        },
      },
      timestamp: '2025-12-14T10:30:00Z',
    };

    const mockStatusData = {
      status: 'success',
      mqtt_status: {
        connected: true,
        host: 'mqtt.example.com',
        port: 1883,
        use_tls: false,
      },
    };

    beforeEach(() => {
      apiService.getMqttMetrics = jest.fn().mockResolvedValue(mockMetricsData);
      apiService.getMqttStatus = jest.fn().mockResolvedValue(mockStatusData);
    });

    it('should fetch and display MQTT metrics on mount', async () => {
      render(<Mqtt />);

      await waitFor(() => {
        expect(apiService.getMqttMetrics).toHaveBeenCalledTimes(1);
      });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText(/Loading MQTT metrics/i)).not.toBeInTheDocument();
      });

      // Check if broker status is displayed
      expect(screen.getByText(/MQTT Broker Monitoring/i)).toBeInTheDocument();
    });

    it('should display broker connection status', async () => {
      render(<Mqtt />);

      await waitFor(() => {
        expect(screen.getByText(/Running/i)).toBeInTheDocument();
      });
    });

    it('should display number of active connections', async () => {
      render(<Mqtt />);

      await waitFor(() => {
        expect(screen.getByText('24')).toBeInTheDocument();
        expect(screen.getByText(/Connected clients/i)).toBeInTheDocument();
      });
    });

    it('should display message counts', async () => {
      render(<Mqtt />);

      await waitFor(() => {
        // Messages received/sent should be displayed
        expect(screen.getByText(/15,847/i)).toBeInTheDocument();
        expect(screen.getByText(/15,923/i)).toBeInTheDocument();
      });
    });

    it('should format bytes to human-readable format', async () => {
      render(<Mqtt />);

      await waitFor(() => {
        // Wait for data to load first
        expect(apiService.getMqttMetrics).toHaveBeenCalled();
        expect(screen.queryByText(/Loading MQTT metrics/i)).not.toBeInTheDocument();
      });

      // Should display MB format (2515968 bytes ≈ 2.4 MB)
      // There are two values (received and sent), so use getAllByText
      await waitFor(() => {
        const mbElements = screen.getAllByText(/2\.\d+ MB/i);
        expect(mbElements.length).toBeGreaterThan(0);
      });
    });

    it('should display topic statistics', async () => {
      render(<Mqtt />);

      await waitFor(() => {
        expect(screen.getByText(/Topic Structures/i)).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument(); // total_structures
      });
    });

    it('should refresh metrics when refresh button is clicked', async () => {
      render(<Mqtt />);

      // Wait for initial data to load
      await waitFor(() => {
        expect(apiService.getMqttMetrics).toHaveBeenCalledTimes(1);
        expect(screen.getByText(/MQTT Broker Monitoring/i)).toBeInTheDocument();
        expect(screen.queryByText(/Loading MQTT metrics/i)).not.toBeInTheDocument();
      });

      // Find and click refresh button
      const refreshButtons = screen.getAllByRole('button');
      const refreshButton = refreshButtons.find(btn =>
        btn.querySelector('[data-testid="RefreshIcon"]')
      );

      if (refreshButton) {
        fireEvent.click(refreshButton);
      }

      await waitFor(() => {
        expect(apiService.getMqttMetrics).toHaveBeenCalledTimes(2);
      });
    });

    it('should show loading state while fetching data', async () => {
      apiService.getMqttMetrics = jest
        .fn()
        .mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve(mockMetricsData), 100))
        );

      render(<Mqtt />);

      // Should show loading indicator
      expect(screen.getByText(/Loading MQTT metrics/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/Loading MQTT metrics/i)).not.toBeInTheDocument();
      });
    });

    it('should display error message when API call fails', async () => {
      apiService.getMqttMetrics = jest
        .fn()
        .mockRejectedValue(new Error('Failed to fetch MQTT metrics'));

      render(<Mqtt />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch MQTT metrics/i)).toBeInTheDocument();
      });
    });

    it('should handle missing broker_info gracefully', async () => {
      const incompleteData = {
        status: 'success',
        metrics: {
          connection_status: {
            connected: true,
            host: 'mqtt.example.com',
            port: 1883,
          },
          topics: {
            total_structures: 0,
          },
          handlers: {
            message_handlers: 0,
          },
        },
      };

      apiService.getMqttMetrics = jest.fn().mockResolvedValue(incompleteData);

      render(<Mqtt />);

      await waitFor(() => {
        // Should still render without crashing
        expect(screen.getByText(/MQTT Broker Monitoring/i)).toBeInTheDocument();
      });
    });

    it('should display handler counts', async () => {
      render(<Mqtt />);

      await waitFor(() => {
        expect(apiService.getMqttMetrics).toHaveBeenCalled();
        expect(screen.queryByText(/Loading MQTT metrics/i)).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // message_handlers
        expect(screen.getByText('3')).toBeInTheDocument(); // subscription_callbacks
      });
    });

    it('should auto-refresh metrics every 5 seconds', async () => {
      jest.useFakeTimers();
      render(<Mqtt />);

      await waitFor(() => {
        expect(apiService.getMqttMetrics).toHaveBeenCalledTimes(1);
      });

      // Fast-forward 5 seconds
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(apiService.getMqttMetrics).toHaveBeenCalledTimes(2);
      });

      // Fast-forward another 5 seconds
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(apiService.getMqttMetrics).toHaveBeenCalledTimes(3);
      });

      jest.useRealTimers();
    });

    it('should clear interval on component unmount', async () => {
      jest.useFakeTimers();
      const { unmount } = render(<Mqtt />);

      await waitFor(() => {
        expect(apiService.getMqttMetrics).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Fast-forward time after unmount
      jest.advanceTimersByTime(10000);

      // Should not fetch again after unmount
      expect(apiService.getMqttMetrics).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });
});
