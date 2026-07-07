require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');
const stripeRoutes = require('./routes/stripeRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/stripe', stripeRoutes);

// Error Handling
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});