const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Registration = sequelize.define('Registration', {
  event_id:       { type: DataTypes.INTEGER, allowNull: false },
  participant_id: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('registered', 'waitlisted', 'cancelled'),
    defaultValue: 'registered',
  },
  notes:         { type: DataTypes.TEXT, defaultValue: '' },
  registered_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'registrations',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['event_id', 'participant_id'] },
  ],
});

module.exports = Registration;
