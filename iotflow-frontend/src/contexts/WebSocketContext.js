import { createContext, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [telemetryData, setTelemetryData] = useState({});
  const [deviceStatuses, setDeviceStatuses] = useState({});
  const [commandResults, setCommandResults] = useState({});
  const [deviceNotifications, setDeviceNotifications] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);

  // Load notifications from backend when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
    }
  }, [isAuthenticated, user]);

  // Load notifications from backend API
  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('iotflow_token');
      if (!token) {
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const notifications = result.data?.notifications || result.notifications || [];

        // Convert backend notifications to match frontend format
        const formattedNotifications = notifications.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          device_id: n.device_id,
          timestamp: n.created_at,
          user_id: n.user_id,
          read: n.is_read,
          metadata: n.metadata,
        }));

        setDeviceNotifications(formattedNotifications);
        // console.log(`✅ Loaded ${formattedNotifications.length} notifications from backend`);
      } else {
        const errorText = await response.text();
        console.warn('⚠️ Failed to load notifications from backend:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    }
  };

  // WebSocket connection management
  useEffect(() => {
    if (isAuthenticated && user) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const connectWebSocket = () => {
    if (!user || wsRef.current) return;

    try {
      // Create WebSocket connection to the real backend
      const wsUrl = process.env.REACT_APP_WS_URL;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        // console.log(`WebSocket connected for user ${user.id}`);

        // Send authentication message with JWT token
        const token = localStorage.getItem('iotflow_token');
        wsRef.current.send(
          JSON.stringify({
            type: 'auth',
            token: token,
            user_id: user.id,
            timestamp: new Date().toISOString(),
          })
        );

        // Notifications will be loaded after auth_success message
      };

      wsRef.current.onmessage = event => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        // console.log('WebSocket disconnected');

        // Attempt to reconnect with exponential backoff
        if (isAuthenticated && reconnectAttempts.current < 5) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000;
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connectWebSocket();
          }, delay);
        }
      };

      wsRef.current.onerror = error => {
        console.error('WebSocket error:', error);
        handleWebSocketError(error);
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      handleWebSocketError(error);
    }
  };

  const disconnectWebSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setTelemetryData({});
    setDeviceStatuses({});
    setCommandResults({});
    // DON'T clear notifications on disconnect - they should persist
    // setDeviceNotifications([]);
  };

  const handleWebSocketMessage = message => {
    try {
      // console.log('Received WebSocket message:', message);

      switch (message.type) {
        case 'auth_success':
          // console.log('WebSocket authentication successful');
          // Load existing notifications after successful authentication
          loadNotifications();
          break;
        case 'notification':
          handleNotification(message.data);
          break;
        case 'telemetry':
          handleTelemetryUpdate(message.data);
          break;
        case 'device_status':
          handleDeviceStatusUpdate(message.data);
          break;
        case 'command_result':
          handleCommandResult(message.data);
          break;
        case 'system_alert':
          handleSystemAlert(message.data);
          break;
        case 'connection_info':
          handleConnectionInfo(message.data);
          break;
        case 'error':
          console.error('WebSocket error:', message.message);
          toast.error(message.message || 'WebSocket error');
          break;
        default:
        // console.log('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  };

  const handleNotification = notification => {
    // Ensure notification belongs to current user
    if (notification.user_id !== user.id) {
      console.warn('Received notification for different user - ignoring');
      return;
    }

    // console.log('🔔 Received real-time notification:', notification);

    // Format notification to match frontend format
    const formattedNotification = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      device_id: notification.device_id,
      timestamp: notification.created_at,
      user_id: notification.user_id,
      read: notification.is_read || false,
      metadata: notification.metadata,
    };

    // Add to device notifications
    setDeviceNotifications(prev => {
      const newNotifications = [...prev, formattedNotification];
      // Keep only last 50 notifications
      return newNotifications.slice(-50);
    });

    // Show toast notification
    const toastMessage = `${notification.message}`;
    switch (notification.type) {
      case 'success':
        toast.success(toastMessage);
        break;
      case 'warning':
        toast.error(toastMessage, { icon: '⚠️' });
        break;
      case 'error':
        toast.error(toastMessage);
        break;
      case 'info':
      default:
        toast(toastMessage, { icon: 'ℹ️' });
        break;
    }
  };

  const handleTelemetryUpdate = data => {
    const { device_id, telemetry, timestamp } = data;

    // Update telemetry data for specific device
    setTelemetryData(prev => ({
      ...prev,
      [device_id]: {
        ...telemetry,
        timestamp,
        device_id,
        user_id: data.user_id,
      },
    }));
  };

  const handleDeviceStatusUpdate = data => {
    const { device_id, status, last_seen } = data;

    setDeviceStatuses(prev => ({
      ...prev,
      [device_id]: {
        status,
        last_seen,
        timestamp: new Date().toISOString(),
        user_id: data.user_id,
      },
    }));

    // Show status change notification
    if (status === 'offline') {
      toast.error(`Device ${device_id} went offline`);
    } else if (status === 'active') {
      toast.success(`Device ${device_id} is back online`);
    }
  };

  const handleCommandResult = data => {
    const { command_id, device_id, success, message } = data;

    setCommandResults(prev => ({
      ...prev,
      [command_id]: {
        ...data,
        timestamp: new Date().toISOString(),
      },
    }));

    // Add notification for command result
    setDeviceNotifications(prev => [
      ...prev,
      {
        id: Date.now(),
        type: success ? 'success' : 'error',
        message: message || `Command ${success ? 'executed successfully' : 'failed'}`,
        device_id,
        timestamp: new Date().toISOString(),
        user_id: data.user_id,
      },
    ]);

    // Show toast notification
    if (success) {
      toast.success(`Command executed successfully on device ${device_id}`);
    } else {
      toast.error(`Command failed on device ${device_id}: ${message}`);
    }
  };

  const handleSystemAlert = data => {
    const { alert_type, message, device_id, severity } = data;

    // Add to device notifications
    setDeviceNotifications(prev => [
      ...prev,
      {
        id: Date.now(),
        type: severity || 'info',
        message,
        device_id,
        alert_type,
        timestamp: new Date().toISOString(),
        user_id: data.user_id,
      },
    ]);

    // Show alert notification based on severity
    switch (severity) {
      case 'critical':
        toast.error(`Critical Alert: ${message}`);
        break;
      case 'warning':
        toast.error(`Warning: ${message}`);
        break;
      case 'info':
        toast(`Info: ${message}`);
        break;
      default:
        toast(message);
    }
  };

  const handleConnectionInfo = data => {
    // console.log('WebSocket connection info:', data);
    if (data.message) {
      toast.success(data.message);
    }
  };

  const handleWebSocketError = error => {
    console.error('WebSocket error:', error);
    setIsConnected(false);
    toast.error('Real-time connection lost. Attempting to reconnect...');
  };

  // Public methods for components to use
  const subscribeToDevice = deviceId => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(
        JSON.stringify({
          type: 'subscribe',
          device_id: deviceId,
          user_id: user.id,
          timestamp: new Date().toISOString(),
        })
      );
    }
  };

  const unsubscribeFromDevice = deviceId => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(
        JSON.stringify({
          type: 'unsubscribe',
          device_id: deviceId,
          user_id: user.id,
          timestamp: new Date().toISOString(),
        })
      );
    }
  };

  const sendDeviceCommand = (deviceId, command, params = {}) => {
    if (wsRef.current && isConnected) {
      const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

      wsRef.current.send(
        JSON.stringify({
          type: 'command',
          command_id: commandId,
          device_id: deviceId,
          command,
          params,
          user_id: user.id,
          timestamp: new Date().toISOString(),
        })
      );

      return commandId;
    }
    return null;
  };

  const requestDeviceState = deviceId => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(
        JSON.stringify({
          type: 'request_state',
          device_id: deviceId,
          user_id: user.id,
          timestamp: new Date().toISOString(),
        })
      );
    }
  };

  const getDeviceTelemetry = deviceId => {
    return telemetryData[deviceId] || null;
  };

  const getDeviceStatus = deviceId => {
    return deviceStatuses[deviceId] || null;
  };

  const getCommandResult = commandId => {
    return commandResults[commandId] || null;
  };

  const clearNotification = async notificationId => {
    try {
      // Remove from local state immediately for better UX
      setDeviceNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Delete from backend
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('iotflow_token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to delete notification from backend');
        // Reload notifications to ensure consistency
        loadNotifications();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Reload notifications to ensure consistency
      loadNotifications();
    }
  };

  const markNotificationAsRead = async notificationId => {
    try {
      // Update local state immediately for better UX
      setDeviceNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );

      // Update backend
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('iotflow_token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to mark notification as read in backend');
        // Reload notifications to ensure consistency
        loadNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Reload notifications to ensure consistency
      loadNotifications();
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      // Update local state immediately for better UX
      setDeviceNotifications(prev => prev.map(n => ({ ...n, read: true })));

      // Update backend
      const response = await fetch(`${process.env.REACT_APP_API_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('iotflow_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to mark all notifications as read in backend');
        // Reload notifications to ensure consistency
        loadNotifications();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Reload notifications to ensure consistency
      loadNotifications();
    }
  };

  const clearAllNotifications = async () => {
    try {
      // Clear local state immediately for better UX
      setDeviceNotifications([]);

      // Clear from backend
      const response = await fetch(`${process.env.REACT_APP_API_URL}/notifications`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('iotflow_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to clear all notifications from backend');
        // Reload notifications to ensure consistency
        loadNotifications();
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      // Reload notifications to ensure consistency
      loadNotifications();
    }
  };

  const value = {
    // Connection state
    connected: isConnected, // Maintain compatibility with existing components
    isConnected,

    // Data
    telemetryData,
    deviceStatuses,
    commandResults,
    deviceNotifications,

    // Methods for device management
    subscribeToDevice,
    unsubscribeFromDevice,
    sendDeviceCommand,
    requestDeviceState,

    // Data access methods
    getDeviceTelemetry,
    getDeviceStatus,
    getCommandResult,

    // Notification management
    clearNotification,
    clearAllNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    loadNotifications,

    // Connection management
    reconnect: connectWebSocket,
    disconnect: disconnectWebSocket,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};
