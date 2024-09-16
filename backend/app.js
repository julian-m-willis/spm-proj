const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const arrangementRoutes = require('./routes/arrangementRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
require('dotenv').config();

// Middleware
app.use(express.json());

// Route Definitions
app.use('/auth', authRoutes);
app.use('/arrangements', arrangementRoutes);
app.use('/schedules', scheduleRoutes);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
