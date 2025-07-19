# IoTFlow Dashboard - User Manual

## 🚀 Getting Started

### 1. **Accessing the Dashboard**
- Open your web browser
- Navigate to `http://localhost:3001`
- You'll see the login screen

### 2. **Login**
- **For existing users**: Enter your email and password, then click "Sign In"
- **For new users**: Click on "Sign Up" tab to create a new account
- **Demo credentials** (for testing):
  - Email: `admin@iotflow.com`
  - Password: `admin123`

### 3. **Creating a New Account**
1. Click the "Sign Up" tab on the login screen
2. Fill in your information:
   - First Name and Last Name
   - Username (unique identifier)
   - Email address
   - Password (minimum 6 characters)
   - Confirm your password
3. Click "Create Account"
4. You'll be automatically logged in after successful registration

## 👤 **User Management & Authentication**

### **Account Types**
- **Regular Users**: Can manage their own devices and view their telemetry data
- **Admin Users**: Have full system access including administration features

### **User Profile Management**
Access your profile by clicking on your avatar in the top-right corner and selecting "Profile":

#### **Personal Information**
- Update your first name, last name, username, and email
- View account creation date and last login information
- See your current role (User or Administrator)

#### **Security Settings**
- Change your password
- View password change history
- Enable two-factor authentication (coming soon)
- Manage API access keys

#### **Activity Log**
- View recent account activity
- Track login sessions and device management actions
- Monitor data export activities

### **Device Ownership**
- Each user can only see and manage their own devices
- Device data is isolated per user account
- Admin users can see system-wide statistics but cannot access other users' device data without proper permissions

## 📊 Dashboard Navigation

### 🏠 **Overview Page**
Your central command center showing:
- **System Health**: Overall platform status
- **Key Metrics**: Device counts, telemetry messages, connections
- **Real-time Charts**: Message trends and device status
- **Recent Alerts**: Latest system notifications
- **Quick Actions**: Direct links to common tasks

### 🔌 **Device Management**
Comprehensive device lifecycle management:

#### **Adding New Devices**
1. Click "Add Device" button
2. Fill in device information:
   - Device Name (required)
   - Device Type (Temperature, Humidity, etc.)
   - Location (required)
   - Firmware/Hardware versions
   - Description
3. Click "Create" to register the device

#### **Managing Existing Devices**
- **View Details**: Click on any device row
- **Edit**: Use the actions menu (three dots)
- **API Keys**: View and regenerate device API keys
- **Bulk Operations**: Select multiple devices for batch updates
- **Status Management**: Change device status (Active/Inactive/Maintenance/Error)

#### **Search and Filter**
- Use the search bar to find devices by name, location, or type
- Filter by status or device type
- Sort by any column

### 📈 **Telemetry & Analytics**
Real-time data visualization and analysis:

#### **Viewing Real-time Data**
1. Select a device from the dropdown (or "All Devices")
2. Choose time range (15m, 1h, 6h, 24h, 7d)
3. Watch live data updates in real-time widgets
4. Monitor temperature, humidity, pressure, and other metrics

#### **Historical Analysis**
- Use time range selector for historical data
- Toggle between line charts and area charts
- Zoom and pan on charts for detailed analysis
- View statistical summaries (min, max, average)

#### **Data Export**
1. Click "Export Data" button
2. Choose format (CSV or JSON)
3. Select time range and devices
4. Download your data for external analysis

### 📡 **MQTT Monitoring**
Monitor your message broker in real-time:

#### **Broker Status**
- View connection status and uptime
- Monitor message throughput and performance
- Track active connections and topics

#### **Topic Management**
- See all active MQTT topics
- Monitor subscriber counts and message rates
- View Quality of Service (QoS) levels

#### **Message Inspection**
- Browse recent MQTT messages
- Click on messages to view full payload
- Filter messages by topic or content
- Copy message payloads for analysis

#### **Performance Metrics**
- Real-time charts of message throughput
- Connection count over time
- Broker performance statistics

### 📊 **Advanced Analytics**
Deep insights into your IoT data:

#### **Trend Analysis**
1. Select "Trend Analysis" from the dropdown
2. Choose devices and time range
3. View multi-metric trend charts
4. Analyze correlations between different sensors

#### **Device Performance**
- Monitor device uptime and reliability
- Track message rates and response times
- Identify poorly performing devices
- Generate performance reports

#### **Data Correlations**
- Visualize relationships between different metrics
- Scatter plots for correlation analysis
- Statistical correlation calculations

#### **Custom Queries**
1. Click "Custom Query" button
2. Write IoTDB SQL queries
3. Execute queries and view results
4. Save frequently used queries

### ⚙️ **System Administration**
Manage your IoT platform:

#### **System Health**
- Monitor all service statuses (IoTDB, Redis, MQTT, API)
- View CPU, memory, and storage usage
- Track system performance metrics
- Receive health alerts and warnings

#### **Cache Management**
- Monitor Redis cache status and performance
- View cache hit/miss rates
- Clear cache when needed
- Manage cache configurations

#### **System Logs**
- Browse real-time system logs
- Filter by service or log level
- Export logs for analysis
- Monitor system events and errors

#### **Maintenance Operations**
- Create system backups
- Restart services
- Run system diagnostics
- Perform database maintenance

## 🎨 **Interface Features**

### 📱 **Responsive Design**
- Fully optimized for mobile devices
- Touch-friendly controls
- Adaptive layouts for all screen sizes
- Sidebar collapses on mobile

### 🔄 **Real-time Updates**
- Live data streaming via WebSocket
- Auto-refresh toggles for different components
- Real-time notifications and alerts
- Live connection status indicators

### 🎯 **User Experience**
- Intuitive navigation with breadcrumbs
- Contextual help and tooltips
- Keyboard shortcuts for power users
- Drag-and-drop interactions where applicable

## 🔧 **Customization Options**

### **Dashboard Widgets**
- Customize which metrics are displayed
- Rearrange widget layouts
- Set refresh intervals
- Configure alert thresholds

### **Charts and Visualizations**
- Switch between chart types (line, bar, area)
- Customize time ranges
- Set up custom color schemes
- Configure axis ranges and scales

### **Notifications and Alerts**
- Set up threshold-based alerts
- Configure notification preferences
- Create custom alert rules
- Manage alert recipients

## 📊 **Data Management**

### **Data Export Options**
- **CSV Format**: Spreadsheet-compatible data
- **JSON Format**: Structured data for APIs
- **Time Range Selection**: Custom date/time ranges
- **Device Filtering**: Export specific device data

### **Data Quality**
- Monitor data completeness and accuracy
- View data quality metrics
- Identify and handle missing data
- Track data validation results

## 🔒 **Security Features**

### **Authentication**
- Secure token-based authentication
- Session management
- Automatic logout on inactivity
- Role-based access control

### **API Security**
- Device-specific API keys
- Key rotation capabilities
- Rate limiting monitoring
- Secure HTTPS connections (in production)

## 🆘 **Troubleshooting**

### **Common Issues**
1. **Login Problems**: Verify token format and validity
2. **No Data Displayed**: Check device connections and backend status
3. **Chart Not Loading**: Verify time range and device selection
4. **Connection Issues**: Check WebSocket connection status

### **Performance Tips**
- Use specific device filters for better performance
- Limit time ranges for large datasets
- Enable data pagination for device lists
- Use auto-refresh wisely to avoid overloading

### **Getting Help**
- Check system status on the Overview page
- Review system logs in the Admin section
- Monitor connection status indicators
- Contact support for backend-related issues

## 🎯 **Best Practices**

### **Device Management**
- Use descriptive device names and locations
- Regularly update firmware versions
- Monitor device health and connectivity
- Rotate API keys periodically

### **Data Analysis**
- Start with overview metrics before diving deep
- Use appropriate time ranges for analysis
- Export data for complex analysis
- Set up alerts for critical metrics

### **System Monitoring**
- Regularly check system health
- Monitor resource usage trends
- Review logs for early problem detection
- Perform regular maintenance tasks

---

**💡 Pro Tip**: Use the keyboard shortcut `Ctrl+/` to see available shortcuts and quick actions throughout the dashboard.
