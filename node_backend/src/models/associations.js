/**
 * associations.js
 * Declares all Sequelize relationships.
 * Import this ONCE in server.js before sequelize.sync().
 * Every route file imports models from here instead of directly.
 */

const Event        = require('./Event');
const Participant  = require('./Participant');
const Registration = require('./Registration');

// ── Many-to-many ────────────────────────────────────────────────────────────
Event.belongsToMany(Participant, {
  through:    Registration,
  foreignKey: 'event_id',
  otherKey:   'participant_id',
  as:         'participants',
});

Participant.belongsToMany(Event, {
  through:    Registration,
  foreignKey: 'participant_id',
  otherKey:   'event_id',
  as:         'events',
});

// ── Direct access to Registration rows ──────────────────────────────────────
Event.hasMany(Registration,       { foreignKey: 'event_id',       as: 'registrations', onDelete: 'CASCADE' });
Registration.belongsTo(Event,     { foreignKey: 'event_id',       as: 'event' });

Participant.hasMany(Registration,    { foreignKey: 'participant_id', as: 'registrations', onDelete: 'CASCADE' });
Registration.belongsTo(Participant,  { foreignKey: 'participant_id', as: 'participant' });

module.exports = { Event, Participant, Registration };