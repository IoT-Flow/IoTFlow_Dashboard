import {
  Analytics as AnalyticsIcon,
  BarChart as BarChartIcon,
  ControlPoint as ControlPointIcon,
  Dashboard as DashboardIcon,
  DeviceHub as DeviceHubIcon,
  Person as PersonIcon,
  Router as RouterIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ open, onToggle }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  const navigationItems = [
    {
      label: 'Overview',
      path: '/overview',
      icon: <DashboardIcon />,
      description: 'Dashboard & device summary',
      roles: ['user', 'admin']
    },
    {
      label: 'Devices',
      path: '/devices',
      icon: <DeviceHubIcon />,
      description: 'Device management',
      roles: ['user', 'admin']
    },
    {
      label: 'Device Control',
      path: '/device-control',
      icon: <ControlPointIcon />,
      description: 'Send commands to devices',
      roles: ['user', 'admin']
    },
    {
      label: 'Telemetry',
      path: '/telemetry',
      icon: <AnalyticsIcon />,
      description: 'Data visualization',
      roles: ['user', 'admin']
    },
    {
      label: 'Analytics',
      path: '/analytics',
      icon: <BarChartIcon />,
      description: 'Device data analysis',
      roles: ['user', 'admin']
    },
    {
      label: 'Profile',
      path: '/profile',
      icon: <PersonIcon />,
      description: 'User profile & settings',
      roles: ['user', 'admin']
    },
    // Admin-only features
    {
      label: 'MQTT',
      path: '/mqtt',
      icon: <RouterIcon />,
      description: 'Message broker monitoring',
      roles: ['admin']
    },
    {
      label: 'Admin',
      path: '/admin',
      icon: <SettingsIcon />,
      description: 'System administration',
      roles: ['admin']
    },
  ].filter(item => item.roles.includes(user?.role || 'user'));

  const drawerWidth = open ? 240 : 70;

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onToggle();
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          minHeight: 64,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: open ? 2 : 0,
          }}
        >
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            I
          </Typography>
        </Box>
        {open && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1 }}>
              IoTFlow
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Enterprise IoT Platform
            </Typography>
          </Box>
        )}
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flexGrow: 1, py: 1 }}>
        <List sx={{ px: 1 }}>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: '8px',
                    backgroundColor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'white' : 'text.primary',
                    '&:hover': {
                      backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                    },
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                      color: isActive ? 'white' : 'text.secondary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {open && (
                    <Box>
                      <ListItemText
                        primary={item.label}
                        sx={{
                          '& .MuiTypography-root': {
                            fontWeight: isActive ? 600 : 400,
                            fontSize: '0.9rem'
                          }
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: isActive ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                          display: 'block',
                          lineHeight: 1,
                          mt: 0.5
                        }}
                      >
                        {item.description}
                      </Typography>
                    </Box>
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Footer */}
      {open && (
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            v1.0.0 • IoTFlow Dashboard
          </Typography>
        </Box>
      )}
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 240,
            backgroundColor: 'background.paper',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ mt: '64px' }}>
        {drawerContent}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
