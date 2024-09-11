const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

require('dotenv').config();
connectDB();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());

app.use(cors());

const routes = require('./routes');
app.use('/api', routes);

const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});