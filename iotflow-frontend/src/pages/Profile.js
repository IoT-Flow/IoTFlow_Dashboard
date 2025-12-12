import { Edit, Save, Security } from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/apiService';
import { safeFormatDate, safeFormatDateTime } from '../utils/dateFormatter';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const [profileData, setProfileData] = useState({
    email: user?.email || '',
    username: user?.username || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [activityLog] = useState([
    {
      id: 1,
      action: 'Login',
      timestamp: new Date(Date.now() - 300000),
      details: 'Successful login from web browser',
    },
    {
      id: 2,
      action: 'Device Added',
      timestamp: new Date(Date.now() - 86400000),
      details: 'Added new temperature sensor "Living Room Temp"',
    },
    {
      id: 3,
      action: 'Profile Updated',
      timestamp: new Date(Date.now() - 86400000 * 2),
      details: 'Updated profile information',
    },
    {
      id: 4,
      action: 'Data Export',
      timestamp: new Date(Date.now() - 86400000 * 3),
      details: 'Exported telemetry data (CSV format)',
    },
    {
      id: 5,
      action: 'Login',
      timestamp: new Date(Date.now() - 86400000 * 5),
      details: 'Successful login from mobile app',
    },
  ]);

  const handleProfileChange = field => e => {
    setProfileData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handlePasswordChange = field => e => {
    setPasswordData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Call the real API
      const response = await api.updateProfile({
        username: profileData.username,
        email: profileData.email,
      });

      const updatedUser = response.user || {
        ...user,
        ...profileData,
      };

      updateUser(updatedUser);
      setIsEditing(false);
      toast.success(response.message || 'Profile updated successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      // Call the real API
      const response = await api.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setChangePasswordOpen(false);
      toast.success(response.message || 'Password changed successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="fade-in">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Profile Settings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your account information and preferences
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Overview Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  margin: '0 auto',
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  mb: 2,
                }}
              >
                {user?.username?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                {user?.username}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                @{user?.username}
              </Typography>
              <Chip
                label={user?.role === 'admin' ? 'Administrator' : 'User'}
                color={user?.role === 'admin' ? 'primary' : 'secondary'}
                size="small"
                sx={{ mt: 1 }}
              />

              <Divider sx={{ my: 3 }} />

              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Account Information
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Member since:</strong>{' '}
                  {safeFormatDate(user?.createdAt || user?.created_at, 'Not available')}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Last login:</strong>{' '}
                  {safeFormatDateTime(user?.lastLogin || user?.last_login, 'Never')}
                </Typography>
                <Typography variant="body2">
                  <strong>Role:</strong> {user?.role || (user?.is_admin ? 'admin' : 'user')}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                <Tab label="Personal Information" />
                <Tab label="Security" />
                <Tab label="Activity Log" />
              </Tabs>
            </Box>

            {/* Personal Information Tab */}
            {activeTab === 0 && (
              <CardContent sx={{ p: 4 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Personal Information
                  </Typography>
                  <Button
                    variant={isEditing ? 'outlined' : 'contained'}
                    startIcon={isEditing ? <Save /> : <Edit />}
                    onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
                    disabled={loading}
                  >
                    {isEditing ? 'Save Changes' : 'Edit Profile'}
                  </Button>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Username"
                      value={profileData.username}
                      onChange={handleProfileChange('username')}
                      disabled={!isEditing}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={profileData.email}
                      onChange={handleProfileChange('email')}
                      disabled={!isEditing}
                      variant="outlined"
                      type="email"
                    />
                  </Grid>
                </Grid>

                {isEditing && (
                  <Alert severity="info" sx={{ mt: 3 }}>
                    Changes will be saved to your profile after clicking "Save Changes"
                  </Alert>
                )}
              </CardContent>
            )}

            {/* Security Tab */}
            {activeTab === 1 && (
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Security Settings
                </Typography>

                <List>
                  <ListItem>
                    <ListItemText primary="Password" secondary="Last changed 30 days ago" />
                    <ListItemSecondaryAction>
                      <Button
                        variant="outlined"
                        startIcon={<Security />}
                        onClick={() => setChangePasswordOpen(true)}
                      >
                        Change Password
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText primary="Two-Factor Authentication" secondary="Not enabled" />
                    <ListItemSecondaryAction>
                      <Button variant="outlined" disabled>
                        Enable 2FA
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="API Access"
                      secondary="Manage API keys for your devices"
                    />
                    <ListItemSecondaryAction>
                      <Button variant="outlined" disabled>
                        Manage Keys
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            )}

            {/* Activity Log Tab */}
            {activeTab === 2 && (
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Recent Activity
                </Typography>

                <List>
                  {activityLog.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={activity.action}
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">
                                {activity.details}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {activity.timestamp.toLocaleString()}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < activityLog.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange('currentPassword')}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange('newPassword')}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange('confirmPassword')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
          <Button onClick={handleChangePassword} variant="contained" disabled={loading}>
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
