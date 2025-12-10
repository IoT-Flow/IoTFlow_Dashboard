import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import * as AuthContext from '../contexts/AuthContext';

// Mock axios before importing anything else
jest.mock('axios');

// Mock the API service
jest.mock('../services/apiService', () => ({
  getDevices: jest.fn(),
  getGroups: jest.fn(),
  createDevice: jest.fn(),
  updateDevice: jest.fn(),
  deleteDevice: jest.fn(),
}));

// Mock the Auth context
jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: jest.fn(),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

// Mock WebSocket
jest.mock('../contexts/WebSocketContext', () => ({
  WebSocketProvider: ({ children }) => <div>{children}</div>,
  useWebSocket: () => ({
    sendMessage: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  }),
}));

// Mock child components to avoid complex rendering
jest.mock('../pages/Overview', () => {
  return function Overview() {
    return <div data-testid="overview-page">Overview Page</div>;
  };
});

jest.mock('../pages/Devices', () => {
  return function Devices() {
    return <div data-testid="devices-page">Devices Page</div>;
  };
});

jest.mock('../pages/Telemetry', () => {
  return function Telemetry() {
    return <div data-testid="telemetry-page">Telemetry Page</div>;
  };
});

jest.mock('../pages/Admin', () => {
  return function Admin() {
    return <div data-testid="admin-page">Admin Page</div>;
  };
});

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

describe('Dashboard Routing - User vs Admin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Regular User Dashboard', () => {
    const regularUser = {
      id: 1,
      username: 'testuser',
      email: 'user@test.com',
      is_admin: false,
      role: 'user',
    };

    beforeEach(() => {
      AuthContext.useAuth.mockReturnValue({
        isAuthenticated: true,
        user: regularUser,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });
    });

    test('should display overview page by default for regular users', async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('overview-page')).toBeInTheDocument();
      });
    });

    test('should have access to devices page', async () => {
      window.history.pushState({}, 'Devices', '/devices');
      
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('devices-page')).toBeInTheDocument();
      });
    });

    test('should have access to telemetry page', async () => {
      window.history.pushState({}, 'Telemetry', '/telemetry');
      
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('telemetry-page')).toBeInTheDocument();
      });
    });

    test('should NOT have access to admin page', async () => {
      window.history.pushState({}, 'Admin', '/admin');
      
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should redirect to overview instead of showing admin page
        expect(screen.queryByTestId('admin-page')).not.toBeInTheDocument();
        expect(screen.getByTestId('overview-page')).toBeInTheDocument();
      });
    });
  });

  describe('Admin User Dashboard', () => {
    const adminUser = {
      id: 1,
      username: 'admin',
      email: 'admin@test.com',
      is_admin: true,
      role: 'admin',
    };

    beforeEach(() => {
      AuthContext.useAuth.mockReturnValue({
        isAuthenticated: true,
        user: adminUser,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });
    });

    test('should display overview page by default for admin users', async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('overview-page')).toBeInTheDocument();
      });
    });

    test('should have access to devices page', async () => {
      window.history.pushState({}, 'Devices', '/devices');
      
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('devices-page')).toBeInTheDocument();
      });
    });

    test('should have access to admin page', async () => {
      window.history.pushState({}, 'Admin', '/admin');
      
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-page')).toBeInTheDocument();
      });
    });

    test('admin should have access to telemetry page', async () => {
      window.history.pushState({}, 'Telemetry', '/telemetry');
      
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('telemetry-page')).toBeInTheDocument();
      });
    });
  });
});
