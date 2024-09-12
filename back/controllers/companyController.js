const Enterprise = require('../models/company');
const scrapeCompanyData = require('../scrap');

const searchByNumber = async (req, res) => {
  const { searchQuery } = req.query;

  if (!searchQuery) {
    return res.status(400).json({ message: 'La recherche est obligatoire' });
  }

  try {
    const enterprises = await Enterprise.findOne({
      entity_number: { $regex: searchQuery, $options: 'i' }
    });
    const company = await scrapeCompanyData(searchQuery.replaceAll(".",""));
    
    res.status(200).json({db:enterprises, scrapping:company});
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

const searchByDenomination = async (req, res) => {
  const { searchQuery } = req.query;

  if (!searchQuery) {
    return res.status(400).json({ message: 'La recherche est obligatoire' });
  }

  try {
    const enterprises = await Enterprise.find({
      "denominations.denomination": { $regex: searchQuery, $options: 'i' }
    });
    res.status(200).json(enterprises);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

const searchByActivity = async (req, res) => {
  const { searchQuery } = req.query;

  if (!searchQuery) {
    return res.status(400).json({ message: 'La recherche est obligatoire' });
  }

  try {
    const enterprises = await Enterprise.find({
      $or: [
        { "activities.activity_group": { $regex: searchQuery, $options: 'i' } },
        { "activities.nace_description": { $regex: searchQuery, $options: 'i' } }
      ]
    });
    res.status(200).json(enterprises);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

const searchByAddress = async (req, res) => {
  const { searchQuery } = req.query;

  if (!searchQuery) {
    return res.status(400).json({ message: 'La recherche est obligatoire' });
  }

  try {
    const enterprises = await Enterprise.find({
      $or: [
        { "addresses.zipcode": { $regex: searchQuery, $options: 'i' } },
        { "addresses.municipality": { $regex: searchQuery, $options: 'i' } }
      ]
    });
    res.status(200).json(enterprises);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

// Récupérer les détails d'une entreprise par ID
const getCompanyById = async (req, res) => {
  try {
    const company = await Enterprise.collection('enterprise').findOne({ _id: req.params.id });
    if (!company) return res.status(404).json({ message: 'Entreprise pas trouvé' });

    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

module.exports = { searchByNumber, searchByDenomination, searchByActivity, searchByAddress, getCompanyById };