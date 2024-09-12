const mongoose = require('mongoose');

const enterpriseSchema = new mongoose.Schema({}, { strict: false });
const Enterprise = mongoose.model('Enterprise', enterpriseSchema);

module.exports = Enterprise;