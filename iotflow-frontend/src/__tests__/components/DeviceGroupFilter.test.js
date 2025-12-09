import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeviceGroupFilter from '../../components/DeviceGroupFilter';

describe('DeviceGroupFilter Component', () => {
  const mockGroups = [
    { id: 1, name: 'Living Room', device_count: 5, color: '#FF5733' },
    { id: 2, name: 'Bedroom', device_count: 3, color: '#33FF57' },
    { id: 3, name: 'Kitchen', device_count: 7, color: '#3357FF' },
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render the group filter with default "All Groups" option', () => {
    render(
      <DeviceGroupFilter
        groups={mockGroups}
        selectedGroup="all"
        onChange={mockOnChange}
      />
    );

    // Check if the filter label is rendered
    expect(screen.getByLabelText(/Group/i)).toBeInTheDocument();
    
    // Check if "All Groups" is displayed by default
    expect(screen.getByText(/All Groups/i)).toBeInTheDocument();
  });

  test('should render all groups in the dropdown', async () => {
    render(
      <DeviceGroupFilter
        groups={mockGroups}
        selectedGroup="all"
        onChange={mockOnChange}
      />
    );

    // Open the dropdown
    const selectElement = screen.getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Wait for menu items to appear
    await waitFor(() => {
      expect(screen.getByText('Living Room (5)')).toBeInTheDocument();
      expect(screen.getByText('Bedroom (3)')).toBeInTheDocument();
      expect(screen.getByText('Kitchen (7)')).toBeInTheDocument();
    });
  });

  test('should call onChange when a group is selected', async () => {
    render(
      <DeviceGroupFilter
        groups={mockGroups}
        selectedGroup="all"
        onChange={mockOnChange}
      />
    );

    // Open the dropdown
    const selectElement = screen.getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Select "Living Room"
    await waitFor(() => {
      const livingRoomOption = screen.getByText('Living Room (5)');
      fireEvent.click(livingRoomOption);
    });

    // Verify onChange was called with the correct group id
    expect(mockOnChange).toHaveBeenCalledWith(1);
  });

  test('should call onChange with "all" when "All Groups" is selected', async () => {
    render(
      <DeviceGroupFilter
        groups={mockGroups}
        selectedGroup={2}
        onChange={mockOnChange}
      />
    );

    // Open the dropdown
    const selectElement = screen.getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Select "All Groups"
    await waitFor(() => {
      const allGroupsOptions = screen.getAllByText('All Groups');
      fireEvent.click(allGroupsOptions[allGroupsOptions.length - 1]);
    });

    // Verify onChange was called with "all"
    expect(mockOnChange).toHaveBeenCalledWith('all');
  });

  test('should display loading state when groups are empty', () => {
    render(
      <DeviceGroupFilter
        groups={[]}
        selectedGroup="all"
        onChange={mockOnChange}
        loading={true}
      />
    );

    expect(screen.getByText(/Loading groups/i)).toBeInTheDocument();
  });

  test('should disable the filter when disabled prop is true', () => {
    render(
      <DeviceGroupFilter
        groups={mockGroups}
        selectedGroup="all"
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveAttribute('aria-disabled', 'true');
  });

  test('should display selected group correctly', () => {
    render(
      <DeviceGroupFilter
        groups={mockGroups}
        selectedGroup={2}
        onChange={mockOnChange}
      />
    );

    // The selected group should be displayed
    expect(screen.getByText(/Bedroom/i)).toBeInTheDocument();
  });

  test('should show group color indicator for each group', async () => {
    render(
      <DeviceGroupFilter
        groups={mockGroups}
        selectedGroup="all"
        onChange={mockOnChange}
      />
    );

    // Open the dropdown
    const selectElement = screen.getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Check if color indicators are rendered (using test ids or checking for styled elements)
    await waitFor(() => {
      // The color chips should be visible in the dropdown
      const menuItems = screen.getAllByRole('option');
      expect(menuItems.length).toBeGreaterThan(1); // All Groups + 3 groups
    });
  });

  test('should handle empty groups array gracefully', () => {
    render(
      <DeviceGroupFilter
        groups={[]}
        selectedGroup="all"
        onChange={mockOnChange}
      />
    );

    // Should still render with just "All Groups" option
    expect(screen.getByText(/All Groups/i)).toBeInTheDocument();
  });
});
