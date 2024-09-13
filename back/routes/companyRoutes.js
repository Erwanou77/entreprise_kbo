const express = require('express');
const { search, details } = require('../controllers/companyController');
const router = express.Router();

router.get('/search', search);
router.get('/details', details);

module.exports = router;
