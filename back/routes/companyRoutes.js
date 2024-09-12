const express = require('express');
const { getCompanyById, searchByNumber, searchByDenomination, searchByActivity, searchByAddress } = require('../controllers/companyController');
const router = express.Router();

router.get('/:id', getCompanyById);
router.get('/search/number', searchByNumber);
router.get('/search/denomination', searchByDenomination);
router.get('/search/activity', searchByActivity);
router.get('/search/address', searchByAddress);

module.exports = router;
