import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [telemetryData, setTelemetryData] = useState({});
  const [mqttStatus, setMqttStatus] = useState({});
  const [deviceStates, setDeviceStates] = useState({});
  const [commandResults, setCommandResults] = useState({});
  const [deviceNotifications, setDeviceNotifications] = useState([]);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io(process.env.REACT_APP_WS_URL || 'ws://localhost:5000', {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('iotflow_token')
      }
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('WebSocket connected');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('WebSocket disconnected');
    });

    // Listen for telemetry data
    newSocket.on('telemetry_data', (data) => {
      setTelemetryData(prev => ({
        ...prev,
        [data.device_id]: {
          ...data,
          timestamp: new Date()
        }
      }));
    });

    // Listen for MQTT status updates
    newSocket.on('mqtt_status', (status) => {
      setMqttStatus(status);
    });

    // Listen for device status updates
    newSocket.on('device_status', (data) => {
      setDeviceStates(prev => ({
        ...prev,
        [data.device_id]: {
          ...prev[data.device_id],
          ...data,
          lastUpdate: new Date()
        }
      }));
    });

    // Listen for device state changes
    newSocket.on('device_state_change', (data) => {
      setDeviceStates(prev => ({
        ...prev,
        [data.device_id]: {
          ...prev[data.device_id],
          state: { ...prev[data.device_id]?.state, ...data.state },
          lastUpdate: new Date()
        }
      }));
    });

    // Listen for command execution results
    newSocket.on('command_result', (data) => {
      setCommandResults(prev => ({
        ...prev,
        [data.commandId]: {
          ...data,
          timestamp: new Date()
        }
      }));

      // Add notification for command result
      setDeviceNotifications(prev => [...prev, {
        id: Date.now(),
        type: data.success ? 'success' : 'error',
        message: data.message || `Command ${data.success ? 'executed successfully' : 'failed'}`,
        deviceId: data.deviceId,
        timestamp: new Date()
      }]);
    });

    // Listen for device alerts/notifications
    newSocket.on('device_alert', (data) => {
      setDeviceNotifications(prev => [...prev, {
        id: Date.now(),
        type: data.severity || 'info',
        message: data.message,
        deviceId: data.device_id,
        timestamp: new Date()
      }]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const subscribeToDevice = (deviceId) => {
    if (socket && connected) {
      socket.emit('subscribe_device', { device_id: deviceId });
    }
  };

  const unsubscribeFromDevice = (deviceId) => {
    if (socket && connected) {
      socket.emit('unsubscribe_device', { device_id: deviceId });
    }
  };

  const sendDeviceCommand = (deviceId, command, params = {}) => {
    if (socket && connected) {
      const commandData = {
        device_id: deviceId,
        command,
        params,
        timestamp: new Date().toISOString(),
        commandId: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
      };
      
      socket.emit('device_command', commandData);
      return commandData.commandId;
    }
    return null;
  };

  const requestDeviceState = (deviceId) => {
    if (socket && connected) {
      socket.emit('request_device_state', { device_id: deviceId });
    }
  };

  const clearNotification = (notificationId) => {
    setDeviceNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setDeviceNotifications([]);
  };

  const getDeviceState = (deviceId) => {
    return deviceStates[deviceId] || null;
  };

  const getCommandResult = (commandId) => {
    return commandResults[commandId] || null;
  };

  const value = {
    socket,
    connected,
    telemetryData,
    mqttStatus,
    deviceStates,
    commandResults,
    deviceNotifications,
    subscribeToDevice,
    unsubscribeFromDevice,
    sendDeviceCommand,
    requestDeviceState,
    clearNotification,
    clearAllNotifications,
    getDeviceState,
    getCommandResult,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
