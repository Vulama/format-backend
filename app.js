const express = require('express');
const app = express();
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

// Middleware
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
