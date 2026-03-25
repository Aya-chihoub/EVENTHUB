require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

require('./models/associations');

const authRoutes         = require('./routes/auth');
const eventRoutes        = require('./routes/events');
const participantRoutes  = require('./routes/participants');
const registrationRoutes = require('./routes/registrations');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/registrations', registrationRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`EventHub Node backend running on http://localhost:${PORT}`);
  });
});
