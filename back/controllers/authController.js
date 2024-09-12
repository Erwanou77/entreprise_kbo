const User = require('../models/user');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Enregistrer un nouvel utilisateur
const register = async (req, res) => {
  try {
    console.log(req.body);
    
    const { name, email, password } = req.body;
    const user = new User({ name, email, password });
    await user.save();

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(400).json({ error: 'Failed to register user', details: err });
  }
};

// Connexion d'un utilisateur
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

    const token = generateToken(user);
    res.status(200).json({ user, token });
  } catch (err) {
    res.status(400).json({ error: 'Login failed', details: err });
  }
};

module.exports = { register, login };
