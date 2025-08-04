import { createContext, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';
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
  const [realtimeUpdates, setRealtimeUpdates] = useState([]);
  const [commandResults, setCommandResults] = useState({});
  const [deviceNotifications, setDeviceNotifications] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);

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
  }, [isAuthenticated, user]);

  const connectWebSocket = () => {
    if (!user || wsRef.current) return;

    try {
      // Create WebSocket connection
      wsRef.current = apiService.createTelemetryWebSocket(
        handleWebSocketMessage,
        handleWebSocketError
      );

      if (wsRef.current) {
        wsRef.current.onopen = () => {
          setIsConnected(true);
          reconnectAttempts.current = 0;
          console.log(`WebSocket connected for user ${user.id}`);

          // Send authentication and subscription message
          wsRef.current.send(JSON.stringify({
            type: 'auth',
            user_id: user.id,
            api_key: user.api_key,
            timestamp: new Date().toISOString()
          }));
        };

        wsRef.current.onclose = () => {
          setIsConnected(false);
          console.log('WebSocket disconnected');

          // Attempt to reconnect with exponential backoff
          if (isAuthenticated && reconnectAttempts.current < 5) {
            const delay = Math.pow(2, reconnectAttempts.current) * 1000;
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++;
              connectWebSocket();
            }, delay);
          }
        };
      }
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
    setRealtimeUpdates([]);
    setCommandResults({});
    setDeviceNotifications([]);
  };

  const handleWebSocketMessage = (data) => {
    try {
      // Ensure data belongs to current user
      if (data.user_id !== user.id) {
        console.warn('Received data for different user - ignoring');
        return;
      }

      switch (data.type) {
        case 'telemetry':
          handleTelemetryUpdate(data);
          break;
        case 'device_status':
          handleDeviceStatusUpdate(data);
          break;
        case 'command_result':
          handleCommandResult(data);
          break;
        case 'system_alert':
          handleSystemAlert(data);
          break;
        case 'connection_info':
          handleConnectionInfo(data);
          break;
        default:
          console.log('Unknown WebSocket message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  };

  const handleTelemetryUpdate = (data) => {
    const { device_id, telemetry, timestamp } = data;

    // Update telemetry data for specific device
    setTelemetryData(prev => ({
      ...prev,
      [device_id]: {
        ...telemetry,
        timestamp,
        device_id,
        user_id: data.user_id
      }
    }));

    // Add to realtime updates list (keep last 50)
    setRealtimeUpdates(prev => {
      const newUpdate = {
        id: `${device_id}_${Date.now()}`,
        device_id,
        type: 'telemetry',
        data: telemetry,
        timestamp,
        user_id: data.user_id
      };

      return [newUpdate, ...prev.slice(0, 49)];
    });
  };

  const handleDeviceStatusUpdate = (data) => {
    const { device_id, status, last_seen } = data;

    setDeviceStatuses(prev => ({
      ...prev,
      [device_id]: {
        status,
        last_seen,
        timestamp: new Date().toISOString(),
        user_id: data.user_id
      }
    }));

    // Add to realtime updates
    setRealtimeUpdates(prev => {
      const newUpdate = {
        id: `${device_id}_status_${Date.now()}`,
        device_id,
        type: 'status_change',
        data: { status, last_seen },
        timestamp: new Date().toISOString(),
        user_id: data.user_id
      };

      return [newUpdate, ...prev.slice(0, 49)];
    });

    // Show status change notification
    if (status === 'offline') {
      toast.error(`Device ${device_id} went offline`);
    } else if (status === 'active') {
      toast.success(`Device ${device_id} is back online`);
    }
  };

  const handleCommandResult = (data) => {
    const { command_id, device_id, success, message } = data;

    setCommandResults(prev => ({
      ...prev,
      [command_id]: {
        ...data,
        timestamp: new Date().toISOString()
      }
    }));

    // Add notification for command result
    setDeviceNotifications(prev => [...prev, {
      id: Date.now(),
      type: success ? 'success' : 'error',
      message: message || `Command ${success ? 'executed successfully' : 'failed'}`,
      device_id,
      timestamp: new Date().toISOString(),
      user_id: data.user_id
    }]);

    // Show toast notification
    if (success) {
      toast.success(`Command executed successfully on device ${device_id}`);
    } else {
      toast.error(`Command failed on device ${device_id}: ${message}`);
    }
  };

  const handleSystemAlert = (data) => {
    const { alert_type, message, device_id, severity } = data;

    // Add to device notifications
    setDeviceNotifications(prev => [...prev, {
      id: Date.now(),
      type: severity || 'info',
      message,
      device_id,
      alert_type,
      timestamp: new Date().toISOString(),
      user_id: data.user_id
    }]);

    // Add to realtime updates
    setRealtimeUpdates(prev => {
      const newUpdate = {
        id: `alert_${Date.now()}`,
        device_id,
        type: 'alert',
        data: { alert_type, message, severity },
        timestamp: new Date().toISOString(),
        user_id: data.user_id
      };

      return [newUpdate, ...prev.slice(0, 49)];
    });

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

  const handleConnectionInfo = (data) => {
    console.log('WebSocket connection info:', data);
    if (data.message) {
      toast.success(data.message);
    }
  };

  const handleWebSocketError = (error) => {
    console.error('WebSocket error:', error);
    setIsConnected(false);
    toast.error('Real-time connection lost. Attempting to reconnect...');
  };

  // Public methods for components to use
  const subscribeToDevice = (deviceId) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        device_id: deviceId,
        user_id: user.id,
        timestamp: new Date().toISOString()
      }));
    }
  };

  const unsubscribeFromDevice = (deviceId) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        device_id: deviceId,
        user_id: user.id,
        timestamp: new Date().toISOString()
      }));
    }
  };

  const sendDeviceCommand = (deviceId, command, params = {}) => {
    if (wsRef.current && isConnected) {
      const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

      wsRef.current.send(JSON.stringify({
        type: 'command',
        command_id: commandId,
        device_id: deviceId,
        command,
        params,
        user_id: user.id,
        timestamp: new Date().toISOString()
      }));

      return commandId;
    }
    return null;
  };

  const requestDeviceState = (deviceId) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'request_state',
        device_id: deviceId,
        user_id: user.id,
        timestamp: new Date().toISOString()
      }));
    }
  };

  const getDeviceTelemetry = (deviceId) => {
    return telemetryData[deviceId] || null;
  };

  const getDeviceStatus = (deviceId) => {
    return deviceStatuses[deviceId] || null;
  };

  const getCommandResult = (commandId) => {
    return commandResults[commandId] || null;
  };

  const clearNotification = (notificationId) => {
    setDeviceNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setDeviceNotifications([]);
  };

  const clearRealtimeUpdates = () => {
    setRealtimeUpdates([]);
  };

  const value = {
    // Connection state
    connected: isConnected, // Maintain compatibility with existing components
    isConnected,

    // Data
    telemetryData,
    deviceStatuses,
    realtimeUpdates,
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
    clearRealtimeUpdates,

    // Connection management
    reconnect: connectWebSocket,
    disconnect: disconnectWebSocket
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
