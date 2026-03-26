const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');
const router = express.Router();

// Simple User model inline (or separate file)
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('editor', 'viewer'), defaultValue: 'viewer' },
}, { tableName: 'users', timestamps: true });

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1h' }
  );

// POST /api/auth/register
router.post('/register',
  [
    body('username').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { username, email, password, role } = req.body;
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ username, email, password: hashed, role: role || 'viewer' });
      res.status(201).json({ token: generateToken(user), user: { id: user.id, username, email, role: user.role } });
    } catch (err) { next(err); }
  }
);

// POST /api/auth/login
router.post('/login',
  [body('username').notEmpty(), body('password').notEmpty()],
  async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ where: { username } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }
      res.json({ token: generateToken(user), user: { id: user.id, username, email: user.email, role: user.role } });
    } catch (err) { next(err); }
  }
);

module.exports = router;
module.exports.User = User;
