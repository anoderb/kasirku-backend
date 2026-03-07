const express = require('express');
const router = express.Router();
const syncController = require('../controllers/sync.controller');
// We use verifyToken to ensure only authenticated cashiers can sync data
// For now, auth middleware isn't fully implemented across all routes, so we just use a public route
router.post('/push', syncController.pushSync);

module.exports = router;
