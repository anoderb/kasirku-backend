const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Rute inisialisasi awal (hanya bisa 1x)
router.post('/init', authController.initOwner);

// Rute login
router.post('/login', authController.login);

module.exports = router;
