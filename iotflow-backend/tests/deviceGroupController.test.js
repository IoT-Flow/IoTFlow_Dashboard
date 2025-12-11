const request = require('supertest');
const express = require('express');
const DeviceGroupController = require('../src/controllers/deviceGroupController');
const { Group, Device } = require('../src/models');
const { verifyToken } = require('../src/middlewares/authMiddleware');

// Mock the models
jest.mock('../src/models');
jest.mock('../src/middlewares/authMiddleware');

describe('DeviceGroupController - addDeviceToGroup', () => {
  let app;
  let mockGroup;
  let mockDevices;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Setup Express app
    app = express();
    app.use(express.json());

    // Mock auth middleware
    verifyToken.mockImplementation((req, res, next) => {
      req.user = { id: 1 };
      next();
    });

    // Mock group
    mockGroup = {
      id: 1,
      name: 'Test Group',
      user_id: 1,
      addDevices: jest.fn().mockResolvedValue(),
    };

    // Mock devices
    mockDevices = [
      { id: 10, name: 'Device 1', user_id: 1 },
      { id: 20, name: 'Device 2', user_id: 1 },
    ];

    // Setup mock request and response
    mockReq = {
      params: { id: 1 },
      body: {},
      user: { id: 1 },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    Group.findOne = jest.fn().mockResolvedValue(mockGroup);
    Device.findAll = jest.fn().mockResolvedValue(mockDevices);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should accept device_id (snake_case) format', async () => {
    mockReq.body = { device_id: 10 };
    Device.findAll = jest.fn().mockResolvedValue([mockDevices[0]]);

    await DeviceGroupController.addDeviceToGroup(mockReq, mockRes);

    expect(Device.findAll).toHaveBeenCalledWith({
      where: { id: [10], user_id: 1 },
    });
    expect(mockGroup.addDevices).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Device(s) added to group successfully' });
  });

  test('should accept deviceId (camelCase) format from frontend', async () => {
    mockReq.body = { deviceId: 10 };
    Device.findAll = jest.fn().mockResolvedValue([mockDevices[0]]);

    await DeviceGroupController.addDeviceToGroup(mockReq, mockRes);

    expect(Device.findAll).toHaveBeenCalledWith({
      where: { id: [10], user_id: 1 },
    });
    expect(mockGroup.addDevices).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Device(s) added to group successfully' });
  });

  test('should accept device_ids (snake_case) array format', async () => {
    mockReq.body = { device_ids: [10, 20] };

    await DeviceGroupController.addDeviceToGroup(mockReq, mockRes);

    expect(Device.findAll).toHaveBeenCalledWith({
      where: { id: [10, 20], user_id: 1 },
    });
    expect(mockGroup.addDevices).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  test('should accept deviceIds (camelCase) array format from frontend', async () => {
    mockReq.body = { deviceIds: [10, 20] };

    await DeviceGroupController.addDeviceToGroup(mockReq, mockRes);

    expect(Device.findAll).toHaveBeenCalledWith({
      where: { id: [10, 20], user_id: 1 },
    });
    expect(mockGroup.addDevices).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  test('should return 404 when group not found', async () => {
    Group.findOne = jest.fn().mockResolvedValue(null);
    mockReq.body = { deviceId: 10 };

    await DeviceGroupController.addDeviceToGroup(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Group not found' });
  });

  test('should return 404 when device not found', async () => {
    mockReq.body = { deviceId: 999 };
    Device.findAll = jest.fn().mockResolvedValue([]);

    await DeviceGroupController.addDeviceToGroup(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'One or more devices not found' });
  });
});
