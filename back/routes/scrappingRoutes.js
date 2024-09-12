const express = require('express');
const router = express.Router();
const scrapeCompanyData = require('../controllers/scrappingController');

router.get('/', scrapeCompanyData.scrapeCompanyData);

module.exports = router;