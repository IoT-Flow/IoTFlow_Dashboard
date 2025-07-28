const express = require('express');
const ChartController = require('../controllers/chartController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Chart CRUD routes
router.get('/', verifyToken, ChartController.getCharts);
router.get('/:id', verifyToken, ChartController.getChart);
router.post('/', verifyToken, ChartController.createChart);
router.put('/:id', verifyToken, ChartController.updateChart);
router.delete('/:id', verifyToken, ChartController.deleteChart);
router.post('/:id/duplicate', verifyToken, ChartController.duplicateChart);

module.exports = router;
