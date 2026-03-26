require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { sequelize } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

require('./models/associations');

const authRoutes         = require('./routes/auth');
const { User }           = require('./routes/auth');
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

async function seedUsers() {
  const users = [
    { username: 'admin', email: 'admin@eventhub.com', password: 'admin1234', role: 'editor' },
    { username: 'viewer', email: 'viewer@eventhub.com', password: 'viewer1234', role: 'viewer' },
  ];
  for (const u of users) {
    const [user, created] = await User.findOrCreate({
      where: { username: u.username },
      defaults: { email: u.email, password: await bcrypt.hash(u.password, 10), role: u.role },
    });
    console.log(`${u.role} user "${u.username}" ${created ? 'created' : 'already exists'}`);
  }
}

sequelize.sync().then(async () => {
  await seedUsers();
  app.listen(PORT, () => {
    console.log(`EventHub Node backend running on http://localhost:${PORT}`);
  });
});
