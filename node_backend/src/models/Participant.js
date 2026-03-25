const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Participant = sequelize.define('Participant', {
  first_name: { type: DataTypes.STRING(100), allowNull: false },
  last_name:  { type: DataTypes.STRING(100), allowNull: false },
  email:      { type: DataTypes.STRING, allowNull: false, unique: true },
  phone:      { type: DataTypes.STRING(20), defaultValue: '' },
  bio:        { type: DataTypes.TEXT, defaultValue: '' },
}, {
  tableName: 'participants',
  timestamps: true,
  underscored: true,
});

module.exports = Participant;
