const router = require('express').Router();

router.get('/scrapping/:companyNumber', async (req, res) => {
    try {
      const company = await scrapeCompanyData(req.params.companyNumber);
      if (!company) {
        return res.status(404).json({ msg: 'Company not found' });
      }
      res.json(company);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

module.exports = router;