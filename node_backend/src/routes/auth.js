const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('editor', 'viewer'), defaultValue: 'viewer' },
}, { tableName: 'users', timestamps: true });

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user.id, token_type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

const userPayload = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  is_staff: user.role === 'editor',
});

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
      res.status(201).json({
        access: generateAccessToken(user),
        refresh: generateRefreshToken(user),
        user: userPayload(user),
      });
    } catch (err) { next(err); }
  }
);

// POST /api/auth/login/
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ detail: 'Username and password are required.' });
    }
    const user = await User.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ detail: 'Invalid credentials.' });
    }
    res.json({
      access: generateAccessToken(user),
      refresh: generateRefreshToken(user),
      user: userPayload(user),
    });
  } catch (err) { next(err); }
});

// POST /api/auth/token/refresh/
router.post('/token/refresh', async (req, res, next) => {
  try {
    const { refresh } = req.body;
    if (!refresh) return res.status(400).json({ detail: 'Refresh token required.' });

    const decoded = jwt.verify(refresh, JWT_SECRET);
    if (decoded.token_type !== 'refresh') {
      return res.status(401).json({ detail: 'Invalid token type.' });
    }
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ detail: 'User not found.' });

    res.json({ access: generateAccessToken(user) });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Invalid or expired refresh token.' });
    }
    next(err);
  }
});

// POST /api/auth/logout/
router.post('/logout', (_req, res) => {
  res.json({ detail: 'Logged out.' });
});

module.exports = router;
module.exports.User = User;
