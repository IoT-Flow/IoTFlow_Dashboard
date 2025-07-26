import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Router,
  Refresh,
  PlayArrow,
  Stop,
  Settings,
  Message,
  Topic,
  Speed,
  CheckCircle,
  Warning,
  Error,
  Info,
  ContentCopy,
} from '@mui/icons-material';
import { useWebSocket } from '../contexts/WebSocketContext';
import toast from 'react-hot-toast';

const MQTT = () => {
  const { connected } = useWebSocket();
  const [activeTab, setActiveTab] = useState(0);
  const [mqttBrokerStats, setMqttBrokerStats] = useState({
    status: 'connected',
    uptime: '2d 14h 32m',
    totalConnections: 98,
    activeConnections: 95,
    messagesPerSecond: 342,
    totalMessages: 2847361,
    topicsCount: 67,
    subscriptionsCount: 156,
    retainedMessages: 23,
    bytesReceived: '45.2 MB',
    bytesSent: '38.7 MB',
  });

  const [topics] = useState([
    {
      name: 'iotflow/devices/+/telemetry',
      subscribers: 12,
      messagesPerSecond: 45,
      lastMessage: new Date(Date.now() - 15000),
      retained: false,
      qos: 1,
    },
    {
      name: 'iotflow/devices/+/status',
      subscribers: 8,
      messagesPerSecond: 2,
      lastMessage: new Date(Date.now() - 30000),
      retained: true,
      qos: 0,
    },
    {
      name: 'iotflow/system/alerts',
      subscribers: 5,
      messagesPerSecond: 0.5,
      lastMessage: new Date(Date.now() - 120000),
      retained: false,
      qos: 2,
    },
    {
      name: 'iotflow/devices/TEMP_001/telemetry',
      subscribers: 3,
      messagesPerSecond: 12,
      lastMessage: new Date(Date.now() - 5000),
      retained: false,
      qos: 1,
    },
  ]);

  const [connections] = useState([
    {
      id: 'conn_001',
      clientId: 'TEMP_SENSOR_001',
      username: 'device_temp001',
      ipAddress: '192.168.1.101',
      protocol: 'MQTT 3.1.1',
      connectedAt: new Date(Date.now() - 7200000),
      keepAlive: 60,
      cleanSession: true,
      status: 'connected',
      subscriptions: ['iotflow/devices/TEMP_001/commands'],
      lastActivity: new Date(Date.now() - 15000),
    },
    {
      id: 'conn_002',
      clientId: 'HUMID_SENSOR_002',
      username: 'device_humid002',
      ipAddress: '192.168.1.102',
      protocol: 'MQTT 3.1.1',
      connectedAt: new Date(Date.now() - 3600000),
      keepAlive: 60,
      cleanSession: true,
      status: 'connected',
      subscriptions: ['iotflow/devices/HUMID_002/commands'],
      lastActivity: new Date(Date.now() - 30000),
    },
    {
      id: 'conn_003',
      clientId: 'DASHBOARD_USER_001',
      username: 'admin',
      ipAddress: '192.168.1.200',
      protocol: 'MQTT 3.1.1',
      connectedAt: new Date(Date.now() - 1800000),
      keepAlive: 300,
      cleanSession: false,
      status: 'connected',
      subscriptions: ['iotflow/devices/+/telemetry', 'iotflow/devices/+/status'],
      lastActivity: new Date(Date.now() - 2000),
    },
  ]);

  const [recentMessages] = useState([
    {
      id: 1,
      topic: 'iotflow/devices/TEMP_001/telemetry',
      payload: '{"temperature": 23.5, "humidity": 45.2, "timestamp": "2025-01-09T10:30:00Z"}',
      qos: 1,
      retained: false,
      timestamp: new Date(Date.now() - 15000),
      size: 78,
    },
    {
      id: 2,
      topic: 'iotflow/devices/HUMID_002/status',
      payload: '{"status": "online", "battery": 87}',
      qos: 0,
      retained: true,
      timestamp: new Date(Date.now() - 30000),
      size: 45,
    },
    {
      id: 3,
      topic: 'iotflow/system/alerts',
      payload: '{"level": "warning", "message": "High temperature detected", "device": "TEMP_001"}',
      qos: 2,
      retained: false,
      timestamp: new Date(Date.now() - 45000),
      size: 92,
    },
  ]);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [brokerControlsOpen, setBrokerControlsOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock performance data for charts
  const [performanceData] = useState({
    messagesPerSecond: [45, 52, 38, 67, 45, 58, 42],
    connectionsOverTime: [92, 94, 96, 95, 98, 97, 95],
    timestamps: ['10:25', '10:26', '10:27', '10:28', '10:29', '10:30', '10:31'],
  });

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simulate real-time updates
        setMqttBrokerStats(prev => ({
          ...prev,
          messagesPerSecond: Math.floor(Math.random() * 100) + 300,
          totalMessages: prev.totalMessages + Math.floor(Math.random() * 100),
        }));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'disconnected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <CheckCircle />;
      case 'connecting': return <Warning />;
      case 'disconnected': return <Error />;
      default: return <Info />;
    }
  };

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    setMessageDialogOpen(true);
  };

  const formatPayload = (payload) => {
    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch {
      return payload;
    }
  };

  const MetricCard = ({ title, value, subtitle, icon, color = 'primary', trend }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ bgcolor: `${color}.main`, mr: 2 }}>
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: `${color}.main` }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          {trend && (
            <Chip
              label={trend}
              color={trend.startsWith('+') ? 'success' : 'error'}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const messagesChartData = {
    labels: performanceData.timestamps,
    datasets: [
      {
        label: 'Messages/Second',
        data: performanceData.messagesPerSecond,
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const connectionsChartData = {
    labels: performanceData.timestamps,
    datasets: [
      {
        label: 'Active Connections',
        data: performanceData.connectionsOverTime,
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 6,
      },
    },
  };

  return (
    <Box className="fade-in">
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            MQTT Monitoring
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Real-time MQTT broker monitoring and message inspection
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto Refresh"
          />
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setBrokerControlsOpen(true)}
          >
            Broker Settings
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Broker Status */}
      <Alert 
        severity={mqttBrokerStats.status === 'connected' ? 'success' : 'error'} 
        sx={{ mb: 3 }}
        icon={getStatusIcon(mqttBrokerStats.status)}
      >
        MQTT Broker is {mqttBrokerStats.status} - Uptime: {mqttBrokerStats.uptime}
      </Alert>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Connections"
            value={mqttBrokerStats.activeConnections}
            subtitle={`of ${mqttBrokerStats.totalConnections} total`}
            icon={<Router />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Messages/Second"
            value={mqttBrokerStats.messagesPerSecond}
            subtitle="Current throughput"
            icon={<Speed />}
            color="success"
            trend="+12%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Topics"
            value={mqttBrokerStats.topicsCount}
            subtitle={`${mqttBrokerStats.subscriptionsCount} subscriptions`}
            icon={<Topic />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Messages"
            value={mqttBrokerStats.totalMessages.toLocaleString()}
            subtitle="Since startup"
            icon={<Message />}
            color="secondary"
          />
        </Grid>
      </Grid>

      {/* Performance Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                Message Throughput
              </Typography>
              <Box sx={{ height: 200 }}>
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Messages Chart Placeholder
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                Active Connections
              </Typography>
              <Box sx={{ height: 200 }}>
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Connections Chart Placeholder
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabbed Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
          >
            <Tab label="Topics" />
            <Tab label="Connections" />
            <Tab label="Recent Messages" />
            <Tab label="Broker Info" />
          </Tabs>
        </Box>

        {/* Topics Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              Active Topics
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Topic</TableCell>
                    <TableCell align="center">Subscribers</TableCell>
                    <TableCell align="center">Msg/s</TableCell>
                    <TableCell align="center">QoS</TableCell>
                    <TableCell align="center">Retained</TableCell>
                    <TableCell>Last Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topics.map((topic, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {topic.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={topic.subscribers} size="small" />
                      </TableCell>
                      <TableCell align="center">{topic.messagesPerSecond}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={`QoS ${topic.qos}`} 
                          size="small" 
                          color={topic.qos === 0 ? 'default' : topic.qos === 1 ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {topic.retained ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {topic.lastMessage.toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Connections Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              Client Connections
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Client ID</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Protocol</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Connected</TableCell>
                    <TableCell>Last Activity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {connections.map((conn) => (
                    <TableRow key={conn.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {conn.clientId}
                        </Typography>
                      </TableCell>
                      <TableCell>{conn.username}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{conn.ipAddress}</TableCell>
                      <TableCell>{conn.protocol}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(conn.status)}
                          label={conn.status}
                          color={getStatusColor(conn.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {conn.connectedAt.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {conn.lastActivity.toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Recent Messages Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              Recent Messages
            </Typography>
            <List>
              {recentMessages.map((message, index) => (
                <React.Fragment key={message.id}>
                  <ListItem 
                    button 
                    onClick={() => handleMessageClick(message)}
                    sx={{ borderRadius: 1, mb: 1 }}
                  >
                    <ListItemIcon>
                      <Message color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {message.topic}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip label={`QoS ${message.qos}`} size="small" />
                            {message.retained && <Chip label="Retained" size="small" color="info" />}
                            <Chip label={`${message.size} bytes`} size="small" variant="outlined" />
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {message.payload.length > 50 
                              ? `${message.payload.substring(0, 50)}...` 
                              : message.payload}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {message.timestamp.toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < recentMessages.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        {/* Broker Info Tab */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              Broker Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <List>
                  <ListItem>
                    <ListItemText primary="Broker Status" secondary={mqttBrokerStats.status} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Uptime" secondary={mqttBrokerStats.uptime} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Total Connections" secondary={mqttBrokerStats.totalConnections} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Active Connections" secondary={mqttBrokerStats.activeConnections} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Topics Count" secondary={mqttBrokerStats.topicsCount} />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <List>
                  <ListItem>
                    <ListItemText primary="Total Messages" secondary={mqttBrokerStats.totalMessages.toLocaleString()} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Retained Messages" secondary={mqttBrokerStats.retainedMessages} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Bytes Received" secondary={mqttBrokerStats.bytesReceived} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Bytes Sent" secondary={mqttBrokerStats.bytesSent} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Messages/Second" secondary={mqttBrokerStats.messagesPerSecond} />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </Box>
        )}
      </Card>

      {/* Message Detail Dialog */}
      <Dialog
        open={messageDialogOpen}
        onClose={() => setMessageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Message Details
        </DialogTitle>
        <DialogContent>
          {selectedMessage && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Topic"
                    value={selectedMessage.topic}
                    InputProps={{ readOnly: true }}
                    sx={{ fontFamily: 'monospace' }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="QoS"
                    value={selectedMessage.qos}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Retained"
                    value={selectedMessage.retained ? 'Yes' : 'No'}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Timestamp"
                    value={selectedMessage.timestamp.toLocaleString()}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Size"
                    value={`${selectedMessage.size} bytes`}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Payload"
                    multiline
                    rows={8}
                    value={formatPayload(selectedMessage.payload)}
                    InputProps={{ 
                      readOnly: true,
                      endAdornment: (
                        <IconButton
                          onClick={() => {
                            navigator.clipboard.writeText(selectedMessage.payload);
                            toast.success('Payload copied to clipboard');
                          }}
                        >
                          <ContentCopy />
                        </IconButton>
                      )
                    }}
                    sx={{ fontFamily: 'monospace' }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Broker Controls Dialog */}
      <Dialog
        open={brokerControlsOpen}
        onClose={() => setBrokerControlsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Broker Settings</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 2, mb: 3 }}>
            Changes to broker settings require admin privileges and may affect all connected devices.
          </Alert>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button variant="outlined" startIcon={<PlayArrow />}>
              Start Broker
            </Button>
            <Button variant="outlined" startIcon={<Stop />} color="warning">
              Stop Broker
            </Button>
            <Button variant="outlined" startIcon={<Refresh />}>
              Restart Broker
            </Button>
            <Button variant="outlined" startIcon={<Settings />}>
              Configuration
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBrokerControlsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MQTT;
