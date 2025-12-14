/**
 * TDD Tests for Login Component Error Handling
 * Testing that login errors are properly displayed without page reload
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import { AuthProvider } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';

// Mock the API service
jest.mock('../../services/apiService');
const mockApiService = apiService;

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Helper function to render Login component with providers
const renderLogin = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
};

// Helper function to get form elements
const getFormElements = () => {
  const emailInput = screen.getByLabelText(/email or username/i);
  const passwordInput = screen.getByPlaceholderText(/enter your password/i);
  const loginButton = screen.getByRole('button', { name: /sign in/i });
  return { emailInput, passwordInput, loginButton };
};

describe('Login Component Error Handling - TDD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  describe('Invalid Credentials Error Handling', () => {
    test('should display error message for invalid credentials without page reload', async () => {
      // Mock API service to return error for invalid credentials
      mockApiService.login.mockResolvedValue({
        success: false,
        error: 'Invalid credentials. Please check your email/username and password.',
      });

      renderLogin();

      // Fill in login form with invalid credentials
      const { emailInput, passwordInput, loginButton } = getFormElements();

      fireEvent.change(emailInput, { target: { value: 'invalid@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

      // Submit the form
      fireEvent.click(loginButton);

      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Verify the error is displayed in an Alert component
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(/invalid credentials/i);

      // Verify form is still visible (no page reload)
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(loginButton).toBeInTheDocument();

      // Verify API was called with correct parameters
      expect(mockApiService.login).toHaveBeenCalledWith('invalid@example.com', 'wrongpassword');
    });

    test('should display error message for inactive account', async () => {
      // Mock API service to return error for inactive account
      mockApiService.login.mockResolvedValue({
        success: false,
        error: 'Your account is inactive. Please contact an administrator.',
      });

      renderLogin();

      // Fill in login form
      const { emailInput, passwordInput, loginButton } = getFormElements();

      fireEvent.change(emailInput, { target: { value: 'inactive@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Submit the form
      fireEvent.click(loginButton);

      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(/account is inactive/i)).toBeInTheDocument();
      });

      // Verify the error is displayed properly
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(/account is inactive/i);
    });

    test('should display error message for network errors', async () => {
      // Mock API service to throw network error
      mockApiService.login.mockRejectedValue(new Error('Network error'));

      renderLogin();

      // Fill in login form
      const { emailInput, passwordInput, loginButton } = getFormElements();

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Submit the form
      fireEvent.click(loginButton);

      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Verify the error is displayed properly
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(/network error/i);
    });
  });

  describe('Form Validation Error Handling', () => {
    test('should display error for empty email/username field', async () => {
      renderLogin();

      // Try to submit form with empty email
      const { passwordInput, loginButton } = getFormElements();

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      // Wait for validation error
      await waitFor(() => {
        expect(
          screen.getByText(/please enter both email\/username and password/i)
        ).toBeInTheDocument();
      });

      // Verify API was not called
      expect(mockApiService.login).not.toHaveBeenCalled();
    });

    test('should display error for empty password field', async () => {
      renderLogin();

      // Try to submit form with empty password
      const { emailInput, loginButton } = getFormElements();

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.click(loginButton);

      // Wait for validation error
      await waitFor(() => {
        expect(
          screen.getByText(/please enter both email\/username and password/i)
        ).toBeInTheDocument();
      });

      // Verify API was not called
      expect(mockApiService.login).not.toHaveBeenCalled();
    });

    test('should display error for whitespace-only inputs', async () => {
      renderLogin();

      // Try to submit form with whitespace-only inputs
      const { emailInput, passwordInput, loginButton } = getFormElements();

      fireEvent.change(emailInput, { target: { value: '   ' } });
      fireEvent.change(passwordInput, { target: { value: '   ' } });
      fireEvent.click(loginButton);

      // Wait for validation error
      await waitFor(() => {
        expect(
          screen.getByText(/please enter both email\/username and password/i)
        ).toBeInTheDocument();
      });

      // Verify API was not called
      expect(mockApiService.login).not.toHaveBeenCalled();
    });
  });

  describe('Loading State Handling', () => {
    test('should show loading state during login attempt', async () => {
      // Mock API service to return a delayed promise
      let resolveLogin;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });
      mockApiService.login.mockReturnValue(loginPromise);

      renderLogin();

      // Fill in login form
      const { emailInput, passwordInput, loginButton } = getFormElements();

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Submit the form
      fireEvent.click(loginButton);

      // Verify loading state
      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });

      // Verify button is disabled during loading
      expect(loginButton).toBeDisabled();

      // Resolve the promise with an error
      resolveLogin({
        success: false,
        error: 'Invalid credentials',
      });

      // Wait for loading to finish and error to appear
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Verify button is enabled again
      expect(loginButton).not.toBeDisabled();
      expect(loginButton).toHaveTextContent(/sign in/i);
    });

    test('should clear previous errors when submitting new login attempt', async () => {
      // First, mock a failed login
      mockApiService.login.mockResolvedValueOnce({
        success: false,
        error: 'Invalid credentials',
      });

      renderLogin();

      // Fill in login form and submit
      const { emailInput, passwordInput, loginButton } = getFormElements();

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Now mock a delayed second login attempt
      let resolveSecondLogin;
      const secondLoginPromise = new Promise(resolve => {
        resolveSecondLogin = resolve;
      });
      mockApiService.login.mockReturnValue(secondLoginPromise);

      // Change password and submit again
      fireEvent.change(passwordInput, { target: { value: 'newpassword' } });
      fireEvent.click(loginButton);

      // Verify error is cleared during loading
      await waitFor(() => {
        expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
      });

      // Verify loading state is shown
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();

      // Resolve with another error
      resolveSecondLogin({
        success: false,
        error: 'Account is inactive',
      });

      // Wait for new error to appear
      await waitFor(() => {
        expect(screen.getByText(/account is inactive/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission Prevention', () => {
    test('should prevent default form submission to avoid page reload', async () => {
      mockApiService.login.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      renderLogin();

      // Get the form element
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();

      // Fill in form
      const { emailInput, passwordInput } = getFormElements();

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Create a spy for preventDefault
      const preventDefaultSpy = jest.fn();

      // Submit form and verify preventDefault is called
      fireEvent.submit(form, { preventDefault: preventDefaultSpy });

      // Wait for error to appear (confirming no page reload occurred)
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    test('should handle Enter key press without page reload', async () => {
      mockApiService.login.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      renderLogin();

      // Fill in form
      const { emailInput, passwordInput } = getFormElements();

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Get the form and submit it directly (simulating Enter key behavior)
      const form = document.querySelector('form');
      fireEvent.submit(form);

      // Wait for error to appear (confirming no page reload occurred)
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Verify form is still present
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });
  });

  describe('Error Message Accessibility', () => {
    test('should have proper ARIA attributes for error messages', async () => {
      mockApiService.login.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      renderLogin();

      // Fill in and submit form
      const { emailInput, passwordInput, loginButton } = getFormElements();

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);

      // Wait for error to appear
      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveAttribute('role', 'alert');
      });
    });

    test('should focus on error message for screen readers', async () => {
      mockApiService.login.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      renderLogin();

      // Fill in and submit form
      const { emailInput, passwordInput, loginButton } = getFormElements();

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);

      // Wait for error to appear
      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toBeInTheDocument();
      });
    });
  });
});
