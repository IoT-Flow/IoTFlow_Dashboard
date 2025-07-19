# IoTFlow Dashboard - Authentication & User Management Guide

## 🔐 Authentication System

The IoTFlow Dashboard features a comprehensive authentication system that supports both email and username login, with secure password-based authentication and user-specific device management.

### 🚀 Login Options

Users can authenticate using either:
- **Email address** (e.g., `john@iotflow.com`)
- **Username** (e.g., `john`)

Both authentication methods accept the same password for each user account.

### 👥 Demo User Accounts

The dashboard includes several pre-configured demo accounts for testing:

#### Administrator Account
- **Email:** `admin@iotflow.com`
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Administrator
- **Devices:** Server room monitoring, HVAC systems

#### Regular User Accounts

##### User 1 - John Smith
- **Email:** `john@iotflow.com`
- **Username:** `john`
- **Password:** `john123`
- **Role:** User
- **Devices:** Home automation (temperature, humidity, GPS tracker)

##### User 2 - Alice Johnson
- **Email:** `alice@iotflow.com`
- **Username:** `alice`
- **Password:** `alice123`
- **Role:** User
- **Devices:** Garden automation (greenhouse monitoring, soil sensors)

## 🏠 User-Specific Device Management

### Device Isolation
- Each user can only see and manage their own devices
- Device data is completely isolated between users
- No user can access another user's device information or telemetry data

### Device Categories by User

#### Admin Devices
- **Server Room Temperature Sensor**
  - Location: Data Center - Server Room
  - Purpose: Critical infrastructure monitoring
  - API Key: `admin_temp_001_api_key_demo`

- **HVAC Pressure Monitor**
  - Location: Building A - HVAC Room
  - Purpose: System pressure monitoring
  - API Key: `admin_press_002_api_key_demo`

#### John's Home Devices
- **Living Room Temperature Sensor**
  - Location: Home - Living Room
  - Purpose: Climate control
  - API Key: `john_temp_001_api_key_demo`

- **Bedroom Humidity Sensor**
  - Location: Home - Master Bedroom
  - Purpose: Humidity monitoring
  - API Key: `john_hum_002_api_key_demo`

- **Car GPS Tracker**
  - Location: Vehicle - Honda Civic
  - Purpose: Vehicle tracking
  - API Key: `john_gps_003_api_key_demo`

#### Alice's Garden Devices
- **Greenhouse Temperature Sensor**
  - Location: Garden - Greenhouse
  - Purpose: Plant climate control
  - API Key: `alice_temp_001_api_key_demo`

- **Soil Moisture Sensor**
  - Location: Garden - Vegetable Patch
  - Purpose: Irrigation automation
  - API Key: `alice_soil_002_api_key_demo`

## 🔧 Getting Started

### 1. Login to the Dashboard
1. Navigate to the login page
2. Enter either your email or username
3. Enter your password
4. Click "Sign In"

### 2. Explore Your Devices
1. After login, navigate to the "Devices" page
2. View your personal device inventory
3. Each device shows:
   - Current status (Active, Inactive, Maintenance, Error)
   - Last seen timestamp
   - Device type and location
   - Telemetry message count

### 3. Device Management
- **Add New Device:** Click "Add Device" to register new IoT devices
- **Edit Device:** Use the actions menu (three dots) to modify device settings
- **View API Keys:** Access device-specific API keys for authentication
- **Monitor Status:** Track device connectivity and health

### 4. User Profile Management
1. Click on your avatar in the top-right corner
2. Select "Profile" to access:
   - Personal information editing
   - Password change functionality
   - Account activity history
   - Security settings

## 🔒 Security Features

### Authentication Security
- **Token-based Authentication:** Secure JWT tokens for session management
- **Password Protection:** Encrypted password storage and validation
- **Session Management:** Automatic logout on inactivity
- **Cross-user Isolation:** Complete data separation between user accounts

### API Key Management
- **Device-specific Keys:** Each device has a unique API key
- **Key Rotation:** Regenerate API keys for enhanced security
- **Secure Storage:** Keys are securely stored and transmitted
- **Access Control:** Only device owners can access their API keys

## 📊 User Experience Features

### Personalized Dashboard
- Welcome messages with user's name
- User-specific device counts and statistics
- Personalized activity history
- Custom device organization

### Multi-user Testing
Try logging in with different user accounts to experience:
- Different device inventories per user
- Isolated data views
- User-specific customizations
- Role-based access (admin vs. regular users)

## 🚀 Advanced Features

### User Registration
- Create new user accounts via the "Sign Up" tab
- Required fields: First name, last name, username, email, password
- Email validation and password strength requirements
- Automatic account activation for demo environment

### Device Ownership
- Devices are automatically associated with the creating user
- Transfer of device ownership (admin feature)
- Bulk device management for enterprise users
- Device sharing capabilities (future feature)

## 💡 Best Practices

### Account Security
- Use strong, unique passwords
- Regularly update passwords through profile settings
- Monitor account activity in the activity log
- Log out when using shared computers

### Device Management
- Use descriptive device names and locations
- Regularly monitor device status and connectivity
- Update firmware versions when available
- Rotate API keys periodically for enhanced security

### Data Privacy
- Each user's data remains completely private
- No cross-user data access without explicit permissions
- Secure data transmission and storage
- GDPR-compliant data handling practices

---

**🔗 Quick Access:**
- Login Page: Main dashboard entry point
- Device Management: Navigate to "Devices" after login
- User Profile: Click avatar → "Profile"
- System Administration: Available for admin users only

**📞 Support:**
For technical support or questions about the authentication system, please refer to the main USER_MANUAL.md file or contact the system administrator.
