const Enterprise = require('../models/company');
const scrapeCompanyData = require('../scrap');

const search = async (req, res) => {
  const { page = 1, limit = 10, searchQuery, searchField } = req.query;
  const searchRegex = { $regex: searchQuery, $options: 'i' };
  try {

    const searchFields = {
      "1": { entity_number: searchRegex },
      "2": { "denominations.denomination": searchRegex },
      "3": { $or: [{ "activities.activity_group": searchRegex }, { "activities.nace_description": searchRegex }] },
      "4": { $or: [{ "addresses.zipcode": searchRegex }, { "addresses.municipality": searchRegex }] }
    };

    if (!searchFields[searchField]) {
      return res.status(400).json({ message: 'Champ de recherche invalide.' });
    }
    
    const enterprises = await Enterprise.find(searchFields[searchField])
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const company = await scrapeCompanyData(searchQuery.replaceAll(".",""));

    const additionalData = searchField === "1" ? { scrapping: company }: {};

    res.status(200).json({ data: enterprises, total: enterprises.length, currentPage: page, ...additionalData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { search };