import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Router as RouterIcon,
} from '@mui/icons-material';

export default function Mqtt() {
  const [brokerStatus, setBrokerStatus] = useState({
    status: 'running',
    uptime: '2d 15h 32m',
    version: 'Mosquitto 2.0.15',
    port: 1883,
    connections: 24,
    messagesReceived: 15847,
    messagesSent: 15923,
    bytesReceived: '2.4 MB',
    bytesSent: '2.5 MB',
  });

  const [topicStats] = useState([
    {
      topic: 'devices/+/telemetry',
      subscribers: 3,
      publishers: 12,
      messages: 8234,
      lastActivity: '2 seconds ago',
    },
    {
      topic: 'devices/+/status',
      subscribers: 5,
      publishers: 24,
      messages: 1247,
      lastActivity: '5 seconds ago',
    },
    {
      topic: 'devices/+/control',
      subscribers: 12,
      publishers: 2,
      messages: 156,
      lastActivity: '1 minute ago',
    },
    {
      topic: 'system/alerts',
      subscribers: 8,
      publishers: 1,
      messages: 23,
      lastActivity: '5 minutes ago',
    },
  ]);

  const [connectedClients] = useState([
    {
      clientId: 'dashboard_client_1',
      address: '192.168.1.100',
      connected: '2h 15m ago',
      keepalive: 60,
    },
    {
      clientId: 'device_TEMP_001',
      address: '192.168.1.50',
      connected: '1d 3h ago',
      keepalive: 120,
    },
    {
      clientId: 'device_HUM_002',
      address: '192.168.1.51',
      connected: '1d 3h ago',
      keepalive: 120,
    },
    {
      clientId: 'backend_service',
      address: '127.0.0.1',
      connected: '2d 15h ago',
      keepalive: 30,
    },
  ]);

  const handleRefresh = () => {
    // Simulate refresh
    console.log('Refreshing MQTT stats...');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          MQTT Broker Monitoring
        </Typography>
        <IconButton onClick={handleRefresh}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Broker Status Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <RouterIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Broker Status</Typography>
              </Box>
              <Chip
                icon={brokerStatus.status === 'running' ? <CheckCircleIcon /> : <ErrorIcon />}
                label={brokerStatus.status === 'running' ? 'Running' : 'Stopped'}
                color={brokerStatus.status === 'running' ? 'success' : 'error'}
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Uptime: {brokerStatus.uptime}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {brokerStatus.version} • Port {brokerStatus.port}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Connections
              </Typography>
              <Typography variant="h3" color="primary">
                {brokerStatus.connections}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Connected clients
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Messages
              </Typography>
              <Typography variant="h4" color="success.main">
                ↓ {brokerStatus.messagesReceived.toLocaleString()}
              </Typography>
              <Typography variant="h4" color="info.main">
                ↑ {brokerStatus.messagesSent.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Received / Sent
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Transfer
              </Typography>
              <Typography variant="body1">
                ↓ {brokerStatus.bytesReceived}
              </Typography>
              <Typography variant="body1">
                ↑ {brokerStatus.bytesSent}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Received / Sent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Topic Statistics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Topic Statistics
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Topic</TableCell>
                  <TableCell align="center">Subscribers</TableCell>
                  <TableCell align="center">Publishers</TableCell>
                  <TableCell align="right">Messages</TableCell>
                  <TableCell>Last Activity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topicStats.map((topic, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {topic.topic}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={topic.subscribers} size="small" color="primary" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={topic.publishers} size="small" color="secondary" />
                    </TableCell>
                    <TableCell align="right">
                      {topic.messages.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {topic.lastActivity}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Connected Clients */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Connected Clients
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Client ID</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Connected Since</TableCell>
                  <TableCell align="right">Keep Alive (s)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {connectedClients.map((client, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {client.clientId}
                      </Typography>
                    </TableCell>
                    <TableCell>{client.address}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {client.connected}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{client.keepalive}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
