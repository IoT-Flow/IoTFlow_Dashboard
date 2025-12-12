import axios from 'axios';

// Node.js backend API (user/device/dashboard management)
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Flask backend API (telemetry/IoTDB operations)
export const flaskApi = axios.create({
  baseURL: process.env.REACT_APP_FLASK_API_URL || 'http://localhost:5000/api/v1',
});

export default api;
