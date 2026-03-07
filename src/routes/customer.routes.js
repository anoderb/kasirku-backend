const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');

router.get('/', customerController.getAll);
router.post('/', customerController.create);
router.get('/:id', customerController.getById);
router.put('/:id', customerController.update);

module.exports = router;
