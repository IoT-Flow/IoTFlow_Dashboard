# ThingsBoard Widget Types - IoTFlow Dashboard

This document outlines all the ThingsBoard widget types that have been implemented in the IoTFlow Dashboard telemetry system.

## Widget Categories

### 1. Timeseries Widgets
Real-time and historical time-series data visualization widgets.

- **Timeseries Line Chart** - Classic line chart for continuous data
- **Timeseries Spline Chart** - Smooth curved line chart
- **Timeseries Bar Chart** - Bar chart for time-series data
- **Area Chart** - Filled area under the line
- **Stacked Bar Chart** - Multiple data series stacked
- **State Chart** - Display state changes over time
- **Timeseries Table** - Tabular view of time-series data
- **Flot Bar Chart** - Alternative bar chart implementation
- **Flot Line Chart** - Alternative line chart implementation

### 2. Charts Widgets
Statistical and analytical chart types.

- **Pie Chart** - Circular statistical graphic
- **Doughnut Chart** - Pie chart with hollow center
- **Polar Area Chart** - Circular chart with radius-based data
- **Radar Chart** - Multi-axis data visualization
- **Scatter Plot** - X-Y coordinate data points
- **Bubble Chart** - Three-dimensional scatter plot
- **Heat Map** - Color-coded data matrix
- **Flot Pie Chart** - Alternative pie chart implementation
- **Chart.js Bar** - Chart.js bar implementation
- **Chart.js Line** - Chart.js line implementation
- **Chart.js Doughnut** - Chart.js doughnut implementation

### 3. Analog Gauges
Traditional analog-style measurement displays.

- **Analog Gauge** - Traditional circular gauge
- **Compass** - Direction/orientation display
- **Thermometer Scale** - Temperature-style vertical gauge
- **Linear Gauge** - Horizontal/vertical linear meter
- **Radial Gauge** - Circular progress indicator

### 4. Digital Gauges
Modern digital-style measurement displays.

- **Digital Gauge** - Numeric display with progress bar
- **Digital Thermometer** - Digital temperature display
- **Tank Level** - Liquid level indicator
- **Battery Level** - Battery charge indicator
- **Signal Strength** - Network signal display
- **Speedometer** - Speed measurement display
- **Level Indicator** - Generic level measurement
- **Simple Gauge** - Minimalist gauge design

### 5. Cards Widgets
Information display cards and panels.

- **Value Card** - Simple value display card
- **Simple Card** - Basic information card
- **Entities Hierarchy** - Hierarchical entity relationships
- **Aggregation Card** - Aggregated data display
- **Count Card** - Counter/quantity display
- **Label Value Card** - Labeled value pairs
- **Multiple Input Widgets** - Combined input controls
- **HTML Value Card** - Custom HTML content card

### 6. Tables
Data presentation in tabular format.

- **Entities Table** - Entity data in table format
- **Timeseries Table** - Time-series data table
- **Latest Values** - Most recent data values
- **Alarms Table** - System alerts and alarms
- **Advanced Table** - Feature-rich data table

### 7. Maps
Geographical and location-based visualizations.

- **OpenStreet Map** - Open source map integration
- **Google Map** - Google Maps integration
- **Image Map** - Custom image-based maps
- **Route Map** - Path and route visualization
- **Trip Animation** - Animated movement tracking
- **Here Map** - HERE Maps integration
- **Tencent Map** - Tencent Maps integration

### 8. Control Widgets
Interactive control elements for device management.

- **Knob Control** - Rotary control knob
- **Switch Control** - On/off toggle switch
- **Button Control** - Action trigger button
- **Slider Control** - Range selection slider
- **Round Switch** - Circular toggle control
- **Persistent Table** - Add/remove table controls
- **LED Indicator** - Status indicator light
- **Multiple Input Control** - Combined input fields

### 9. Input Widgets
Data input and command interfaces.

- **Update Attribute** - Attribute modification control
- **Send RPC** - Remote procedure call interface
- **Command Button** - Command execution button
- **Edge RPC** - Edge device RPC interface

### 10. Navigation Widgets
Time and date navigation controls.

- **Date Range Navigator** - Date range selection
- **Timespan Selector** - Time period chooser
- **Navigation Card** - Navigation control panel

### 11. Scheduling
Time-based scheduling and calendar widgets.

- **Scheduler Events** - Event scheduling interface
- **Calendar Scheduler** - Calendar-based scheduling

### 12. Energy
Power and energy-related widgets.

- **Power Button** - Power control interface
- **Energy Meter** - Energy consumption display
- **Solar Panel** - Solar energy visualization

### 13. Industrial
Industrial IoT specific widgets.

- **Liquid Level** - Industrial liquid level sensor
- **Wind Turbine** - Wind power visualization
- **Motor Controller** - Industrial motor control
- **Valve Controller** - Valve position control
- **Pump Controller** - Pump operation control
- **Industrial Gauge** - Heavy-duty measurement gauge

### 14. Gateway
Gateway device management widgets.

- **Gateway Remote Shell** - Remote terminal access
- **Gateway Configuration** - Gateway setup interface

### 15. Alarm
Alert and alarm management widgets.

- **Alarm Widget** - Alert display widget
- **Alarm Table** - Alarm management table

### 16. System
System administration widgets.

- **Device Claiming** - Device registration interface
- **Entity Admin** - Entity management controls
- **JSON Input** - JSON data input interface

### 17. Sensors
Sensor-specific measurement widgets.

- **Temperature & Humidity** - Environmental sensors
- **Environmental Sensors** - Multi-sensor display
- **Gas Sensor** - Gas concentration measurement
- **Vibration Sensor** - Vibration analysis
- **Electrical Meter** - Electrical measurement display

## Implementation Status

### ✅ Fully Implemented
- All Timeseries widgets (Line, Bar, Area, Pie, Scatter, etc.)
- Basic Charts widgets
- Widget selection interface with category filtering
- Icon mapping for all widget types
- Preview mode for non-chart widgets

### 🚧 Preview Mode
- Analog Gauges
- Digital Gauges  
- Cards Widgets
- Tables
- Maps
- Control Widgets
- Input Widgets
- Navigation
- Scheduling
- Energy
- Industrial
- Gateway
- Alarm
- System
- Sensors

Preview mode widgets display:
- Appropriate icon for the widget type
- Widget name and category
- Information about connected devices and data types
- "Coming soon" message for full implementation

## Usage

1. **Adding Widgets**: Use the chart customization dialog to select from all available widget types
2. **Category Filtering**: Filter widgets by category (Timeseries, Charts, Gauges, etc.)
3. **Preview**: All widget types are available for selection and preview
4. **Chart Widgets**: Fully functional for data visualization
5. **Special Widgets**: Display preview mode with proper icons and descriptions

## Technical Implementation

### Chart Types Mapping
- Line charts: Chart.js Line component
- Bar charts: Chart.js Bar component  
- Pie/Doughnut: Chart.js Pie/Doughnut components
- Scatter: Chart.js Scatter component
- Special widgets: Custom preview components

### Icon System
- Material-UI icons mapped to each widget type
- Consistent 48px sizing with primary color theme
- Category-appropriate icon selection

### Category System
- 18 distinct widget categories
- Category-based filtering in selection UI
- Hierarchical organization matching ThingsBoard structure

This implementation provides a comprehensive widget library matching ThingsBoard's capabilities while maintaining room for future enhancement with full interactive functionality.
