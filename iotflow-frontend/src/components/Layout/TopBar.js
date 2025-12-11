import {
  Logout,
  Menu as MenuIcon,
  Notifications,
  Person,
  Settings,
  Wifi,
  WifiOff,
} from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';

const TopBar = ({ onMenuClick, sidebarOpen = true }) => {
  const { user, logout } = useAuth();
  const {
    connected,
    deviceNotifications = [],
    clearNotification,
    clearAllNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useWebSocket();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);

  // Calculate unread count
  const unreadCount = deviceNotifications.filter(n => !n.read).length;

  const handleMenu = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const handleNotificationClick = async () => {
    setNotificationDialogOpen(true);

    // Mark all unread notifications as read when dialog opens
    const unreadNotifications = deviceNotifications.filter(n => !n.read);
    if (unreadNotifications.length > 0) {
      console.log(`📖 Marking ${unreadNotifications.length} notifications as read...`);

      // Mark all unread notifications as read
      for (const notification of unreadNotifications) {
        await markNotificationAsRead(notification.id);
      }
    }
  };

  const getNotificationIcon = type => {
    switch (type) {
      case 'error':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'success':
        return '🟢';
      default:
        return '🔵';
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme => theme.zIndex.drawer + 1,
        backgroundColor: '#fff',
        color: '#333',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginLeft: { xs: 0, md: sidebarOpen ? '240px' : '70px' },
        width: { xs: '100%', md: sidebarOpen ? 'calc(100% - 240px)' : 'calc(100% - 70px)' },
        transition: theme =>
          theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
          IoTFlow Dashboard
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Connection Status */}
          <Chip
            icon={connected ? <Wifi /> : <WifiOff />}
            label={connected ? 'Connected' : 'Disconnected'}
            color={connected ? 'success' : 'error'}
            size="small"
            variant="outlined"
          />

          {/* Notifications */}
          <IconButton color="inherit" onClick={handleNotificationClick}>
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {user?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role}
              </Typography>
            </Box>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user?.username?.charAt(0)?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: { minWidth: 200 },
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleProfile}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* Notifications Dialog */}
      <Dialog
        open={notificationDialogOpen}
        onClose={() => setNotificationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="h6">
            Notifications ({deviceNotifications.length})
            {unreadCount > 0 && (
              <Chip label={`${unreadCount} unread`} color="error" size="small" sx={{ ml: 1 }} />
            )}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {unreadCount > 0 && (
              <IconButton
                onClick={markAllNotificationsAsRead}
                size="small"
                title="Mark All as Read"
                sx={{ fontSize: '0.75rem' }}
              >
                <Typography variant="caption">Mark All Read</Typography>
              </IconButton>
            )}
            {deviceNotifications.length > 0 && (
              <IconButton
                onClick={clearAllNotifications}
                size="small"
                title="Clear All Notifications (Delete All)"
                sx={{
                  color: 'error.main',
                  '&:hover': {
                    backgroundColor: 'error.light',
                    color: 'white',
                  },
                }}
              >
                <Typography variant="caption" sx={{ mr: 1, fontWeight: 600 }}>
                  🗑️ Clear All
                </Typography>
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ minHeight: 300 }}>
          {deviceNotifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">No notifications yet</Typography>
            </Box>
          ) : (
            <List>
              {deviceNotifications
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 10)
                .map(notification => (
                  <ListItem
                    key={notification.id}
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: notification.read ? 'transparent' : 'action.hover',
                      '&:last-child': { borderBottom: 'none' },
                      opacity: notification.read ? 0.7 : 1,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor:
                            notification.type === 'error'
                              ? 'error.main'
                              : notification.type === 'warning'
                                ? 'warning.main'
                                : notification.type === 'success'
                                  ? 'success.main'
                                  : 'info.main',
                          width: 32,
                          height: 32,
                        }}
                      >
                        <Typography variant="caption">
                          {getNotificationIcon(notification.type)}
                        </Typography>
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: notification.read ? 400 : 600,
                              flex: 1,
                            }}
                          >
                            {notification.message}
                          </Typography>
                          {!notification.read && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                bgcolor: 'primary.main',
                                borderRadius: '50%',
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Device {notification.device_id}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(notification.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {!notification.read && (
                        <IconButton
                          onClick={() => markNotificationAsRead(notification.id)}
                          size="small"
                          title="Mark as read"
                          sx={{ fontSize: '0.75rem' }}
                        >
                          ✓
                        </IconButton>
                      )}
                      <IconButton
                        onClick={() => clearNotification(notification.id)}
                        size="small"
                        title="Delete this notification"
                        sx={{
                          fontSize: '0.75rem',
                          color: 'error.main',
                          '&:hover': {
                            backgroundColor: 'error.light',
                            color: 'white',
                          },
                        }}
                      >
                        🗑️
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              {deviceNotifications.length > 10 && (
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography variant="caption" color="text.secondary" align="center">
                        ... and {deviceNotifications.length - 10} more notifications
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </AppBar>
  );
};

export default TopBar;
