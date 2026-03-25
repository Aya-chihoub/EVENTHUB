const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Event = sequelize.define('Event', {
  title:            { type: DataTypes.STRING(200), allowNull: false },
  description:      { type: DataTypes.TEXT, defaultValue: '' },
  location:         { type: DataTypes.STRING(300), defaultValue: '' },
  start_date:       { type: DataTypes.DATE, allowNull: false },
  end_date:         { type: DataTypes.DATE, allowNull: false },
  max_participants: { type: DataTypes.INTEGER, allowNull: true },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'cancelled', 'completed'),
    defaultValue: 'draft',
  },
}, {
  tableName: 'events',
  timestamps: true,
  underscored: true,
});

module.exports = Event;
