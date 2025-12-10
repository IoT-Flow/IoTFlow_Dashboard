/**
 * TDD Test Suite for Admin Dashboard Routing
 * 
 * Tests that admin users see the Admin page instead of Overview page
 * as their default dashboard.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import App from '../App';

// Mock the auth context
const mockAuthContext = {
  isAuthenticated: true,
  loading: false,
  user: null, // Will be set per test
};

jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mockAuthContext,
}));

// Mock WebSocket context
jest.mock('../contexts/WebSocketContext', () => ({
  WebSocketProvider: ({ children }) => children,
  useWebSocket: () => ({
    connected: false,
    messages: [],
  }),
}));

// Mock all page components
jest.mock('../pages/Overview', () => {
  return function Overview() {
    return <div data-testid="overview-page">Overview Page</div>;
  };
});

jest.mock('../pages/Admin', () => {
  return function Admin() {
    return <div data-testid="admin-page">Admin Page</div>;
  };
});

jest.mock('../pages/Devices', () => {
  return function Devices() {
    return <div data-testid="devices-page">Devices Page</div>;
  };
});

jest.mock('../pages/DeviceControl', () => {
  return function DeviceControl() {
    return <div data-testid="device-control-page">Device Control Page</div>;
  };
});

jest.mock('../pages/Telemetry', () => {
  return function Telemetry() {
    return <div data-testid="telemetry-page">Telemetry Page</div>;
  };
});

jest.mock('../pages/Profile', () => {
  return function Profile() {
    return <div data-testid="profile-page">Profile Page</div>;
  };
});

jest.mock('../pages/Mqtt', () => {
  return function Mqtt() {
    return <div data-testid="mqtt-page">MQTT Page</div>;
  };
});

jest.mock('../pages/UsersManagement', () => {
  return function UsersManagement() {
    return <div data-testid="users-page">Users Management Page</div>;
  };
});

jest.mock('../pages/Login', () => {
  return function Login() {
    return <div data-testid="login-page">Login Page</div>;
  };
});

// Mock Sidebar and TopBar
jest.mock('../components/Layout/Sidebar', () => {
  return function Sidebar() {
    return <div data-testid="sidebar">Sidebar</div>;
  };
});

jest.mock('../components/Layout/TopBar', () => {
  return function TopBar() {
    return <div data-testid="topbar">TopBar</div>;
  };
});

describe('Admin Dashboard Routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Admin User Routing', () => {
    beforeEach(() => {
      mockAuthContext.user = {
        id: 1,
        username: 'admin',
        email: 'admin@test.com',
        role: 'admin',
        is_admin: true,
      };
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.loading = false;
    });

    test('should redirect admin user from / to /admin', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-page')).toBeInTheDocument();
      });
    });

    test('should redirect admin user from /overview to /admin', async () => {
      render(
        <MemoryRouter initialEntries={['/overview']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-page')).toBeInTheDocument();
      });
    });

    test('should show admin page when navigating to /admin', async () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-page')).toBeInTheDocument();
      });
    });

    test('should redirect admin user from unknown route to /admin', async () => {
      render(
        <MemoryRouter initialEntries={['/nonexistent']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-page')).toBeInTheDocument();
      });
    });

    test('should allow admin to access other routes', async () => {
      render(
        <MemoryRouter initialEntries={['/devices']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('devices-page')).toBeInTheDocument();
      });
    });

    test('should allow admin to access MQTT page', async () => {
      render(
        <MemoryRouter initialEntries={['/mqtt']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('mqtt-page')).toBeInTheDocument();
      });
    });

    test('should allow admin to access users management', async () => {
      render(
        <MemoryRouter initialEntries={['/users']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('users-page')).toBeInTheDocument();
      });
    });
  });

  describe('Regular User Routing', () => {
    beforeEach(() => {
      mockAuthContext.user = {
        id: 2,
        username: 'user1',
        email: 'user1@test.com',
        role: 'user',
        is_admin: false,
      };
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.loading = false;
    });

    test('should redirect regular user from / to /overview', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('overview-page')).toBeInTheDocument();
      });
    });

    test('should show overview page for regular user at /overview', async () => {
      render(
        <MemoryRouter initialEntries={['/overview']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('overview-page')).toBeInTheDocument();
      });
    });

    test('should redirect regular user from unknown route to /overview', async () => {
      render(
        <MemoryRouter initialEntries={['/nonexistent']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('overview-page')).toBeInTheDocument();
      });
    });

    test('should allow regular user to access devices', async () => {
      render(
        <MemoryRouter initialEntries={['/devices']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('devices-page')).toBeInTheDocument();
      });
    });

    test('should allow regular user to access telemetry', async () => {
      render(
        <MemoryRouter initialEntries={['/telemetry']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('telemetry-page')).toBeInTheDocument();
      });
    });

    test('should allow regular user to access profile', async () => {
      render(
        <MemoryRouter initialEntries={['/profile']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('profile-page')).toBeInTheDocument();
      });
    });

    test('should not allow regular user to access /admin', async () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <App />
        </MemoryRouter>
      );

      // Should redirect to /overview
      await waitFor(() => {
        expect(screen.queryByTestId('admin-page')).not.toBeInTheDocument();
        expect(screen.getByTestId('overview-page')).toBeInTheDocument();
      });
    });

    test('should not allow regular user to access /mqtt', async () => {
      render(
        <MemoryRouter initialEntries={['/mqtt']}>
          <App />
        </MemoryRouter>
      );

      // Should redirect to /overview
      await waitFor(() => {
        expect(screen.queryByTestId('mqtt-page')).not.toBeInTheDocument();
        expect(screen.getByTestId('overview-page')).toBeInTheDocument();
      });
    });

    test('should not allow regular user to access /users', async () => {
      render(
        <MemoryRouter initialEntries={['/users']}>
          <App />
        </MemoryRouter>
      );

      // Should redirect to /overview
      await waitFor(() => {
        expect(screen.queryByTestId('users-page')).not.toBeInTheDocument();
        expect(screen.getByTestId('overview-page')).toBeInTheDocument();
      });
    });
  });

  describe('Unauthenticated User', () => {
    beforeEach(() => {
      mockAuthContext.user = null;
      mockAuthContext.isAuthenticated = false;
      mockAuthContext.loading = false;
    });

    test('should show login page for unauthenticated user', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    test('should show login page when trying to access /admin', async () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    test('should show login page when trying to access /overview', async () => {
      render(
        <MemoryRouter initialEntries={['/overview']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });
  });
});
