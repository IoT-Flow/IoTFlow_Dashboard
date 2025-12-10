/**
 * TDD Test Suite for Removing Device Control from Admin Sidebar
 * 
 * Requirements:
 * - Device Control menu item should NOT appear for admin users
 * - Device Control route should NOT be accessible for admin users
 * - Regular users should still not have access (already admin-only feature)
 */

import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Sidebar from '../../components/Layout/Sidebar';

// Mock the AuthContext
const mockAuthContext = {
  user: {
    id: 1,
    username: 'admin',
    email: 'admin@test.com',
    is_admin: true,
    role: 'admin',
  },
  isAuthenticated: true,
  loading: false,
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock useMediaQuery
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(() => false), // Default to desktop view
}));

const theme = createTheme();

describe('Sidebar - Remove Device Control (TDD)', () => {
  const renderSidebar = (open = true) => {
    return render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Sidebar open={open} onClose={() => {}} />
        </BrowserRouter>
      </ThemeProvider>
    );
  };

  describe('Admin User', () => {
    beforeEach(() => {
      mockAuthContext.user = {
        id: 1,
        username: 'admin',
        email: 'admin@test.com',
        is_admin: true,
        role: 'admin',
      };
    });

    test('should NOT display "Device Control" menu item for admin users', () => {
      renderSidebar();

      // Device Control should not be in the menu
      const deviceControlItem = screen.queryByText('Device Control');
      expect(deviceControlItem).not.toBeInTheDocument();
    });

    test('should NOT display device control description', () => {
      renderSidebar();

      // Check that there's no description for device control
      const deviceControlDescription = screen.queryByText('Send commands to devices');
      expect(deviceControlDescription).not.toBeInTheDocument();
    });

    test('should display other admin menu items (Users, MQTT)', () => {
      renderSidebar();

      // Admin should still see these items (no "Admin" label - admin users see "Dashboard")
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('MQTT')).toBeInTheDocument();
    });

    test('should display common menu items (Dashboard, Devices)', () => {
      renderSidebar();

      // Admin users see "Dashboard" not "Overview"
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Devices')).toBeInTheDocument();
    });
  });

  describe('Regular User', () => {
    beforeEach(() => {
      mockAuthContext.user = {
        id: 2,
        username: 'user1',
        email: 'user1@test.com',
        is_admin: false,
        role: 'user',
      };
    });

    test('should NOT display "Device Control" menu item for regular users', () => {
      renderSidebar();

      // Device Control should not be in the menu
      const deviceControlItem = screen.queryByText('Device Control');
      expect(deviceControlItem).not.toBeInTheDocument();
    });

    test('should display regular user menu items (Overview, Devices, Telemetry, Profile)', () => {
      renderSidebar();

      // Regular user should see these items
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Devices')).toBeInTheDocument();
      expect(screen.getByText('Telemetry')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    test('should NOT display admin-only menu items', () => {
      renderSidebar();

      // Regular user should NOT see admin items
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
      expect(screen.queryByText('Users')).not.toBeInTheDocument();
      expect(screen.queryByText('MQTT')).not.toBeInTheDocument();
    });
  });

  describe('Menu Item Count', () => {
    test('admin should have correct menu items (without Device Control)', () => {
      mockAuthContext.user = {
        id: 1,
        username: 'admin',
        is_admin: true,
        role: 'admin',
      };

      renderSidebar();
      
      // Admin should have: Dashboard (not Overview), Devices, MQTT, Users
      // Should NOT have: Device Control, Telemetry, Profile
      const menuItems = ['Dashboard', 'Devices', 'MQTT', 'Users'];
      
      menuItems.forEach(item => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });

      // Verify Device Control is not present
      expect(screen.queryByText('Device Control')).not.toBeInTheDocument();
      
      // Verify regular user items are not present
      expect(screen.queryByText('Telemetry')).not.toBeInTheDocument();
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });

    test('regular user should have correct menu items (without Device Control)', () => {
      mockAuthContext.user = {
        id: 2,
        username: 'user1',
        is_admin: false,
        role: 'user',
      };

      renderSidebar();

      // Regular user should have: Overview, Devices, Telemetry, Profile
      // Should NOT have: Device Control, MQTT, Admin, Users
      const menuItems = ['Overview', 'Devices', 'Telemetry', 'Profile'];
      
      menuItems.forEach(item => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });

      // Verify Device Control is not present
      expect(screen.queryByText('Device Control')).not.toBeInTheDocument();
      
      // Verify admin items are not present
      expect(screen.queryByText('MQTT')).not.toBeInTheDocument();
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
      expect(screen.queryByText('Users')).not.toBeInTheDocument();
    });
  });
});
