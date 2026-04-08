const express = require('express');
const { body, validationResult } = require('express-validator');
const { Event, Participant, Registration } = require('../models/associations');
const { requireEditor } = require('../middleware/auth');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

/** Map Django-style { event, participant } to { event_id, participant_id } for the React client */
function normalizeRegistrationBody(req, _res, next) {
  const b = req.body;
  if (b.event_id == null && b.event != null) b.event_id = b.event;
  if (b.participant_id == null && b.participant != null) b.participant_id = b.participant;
  if (b.event_id != null && b.event_id !== '') b.event_id = parseInt(b.event_id, 10);
  if (b.participant_id != null && b.participant_id !== '') b.participant_id = parseInt(b.participant_id, 10);
  next();
}

// Shared include config reused across routes
const fullInclude = [
  { model: Event,       as: 'event',       attributes: ['id', 'title', 'start_date', 'end_date', 'status'] },
  { model: Participant, as: 'participant',  attributes: ['id', 'first_name', 'last_name', 'email'] },
];

// ── GET /api/registrations ───────────────────────────────────────────────────
// Query params: ?event_id=1  ?participant_id=2  ?status=registered
router.get('/', async (req, res, next) => {
  try {
    const { event_id, participant_id, status } = req.query;
    const where = {};
    if (event_id)       where.event_id       = event_id;
    if (participant_id) where.participant_id = participant_id;
    if (status)         where.status         = status;

    const registrations = await Registration.findAll({
      where,
      include: fullInclude,
      order: [['registered_at', 'DESC']],
    });
    res.json(registrations);
  } catch (err) { next(err); }
});

// ── GET /api/registrations/:id ───────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const registration = await Registration.findByPk(req.params.id, { include: fullInclude });
    if (!registration) return res.status(404).json({ error: 'Registration not found.' });
    res.json(registration);
  } catch (err) { next(err); }
});

// ── POST /api/registrations ──────────────────────────────────────────────────
// Register a participant to an event
// Body: { event_id, participant_id, notes? }
router.post(
  '/',
  requireEditor,
  normalizeRegistrationBody,
  [
    body('event_id').isInt({ min: 1 }).withMessage('Valid event_id is required'),
    body('participant_id').isInt({ min: 1 }).withMessage('Valid participant_id is required'),
    body('notes').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { event_id, participant_id, notes } = req.body;

      // 1. Verify both entities exist
      const event = await Event.findByPk(event_id);
      if (!event) return res.status(404).json({ error: 'Event not found.' });

      const participant = await Participant.findByPk(participant_id);
      if (!participant) return res.status(404).json({ error: 'Participant not found.' });

      // 2. Block registration on closed events
      if (['cancelled', 'completed'].includes(event.status)) {
        return res.status(409).json({
          error: `Cannot register for an event with status "${event.status}".`,
        });
      }

      // 3. Guard: no duplicate registration (application-level check)
      const existing = await Registration.findOne({ where: { event_id, participant_id } });
      if (existing) {
        return res.status(409).json({
          error: 'Participant is already registered for this event.',
          registration: existing,
        });
      }

      // 4. Confirmed spots full → waitlist (still 201; client shows a message)
      let status = 'registered';
      if (event.max_participants !== null) {
        const confirmed = await Registration.count({
          where: { event_id, status: 'registered' },
        });
        if (confirmed >= event.max_participants) status = 'waitlisted';
      }

      const registration = await Registration.create({
        event_id,
        participant_id,
        notes: notes || '',
        status,
      });

      const full = await Registration.findByPk(registration.id, { include: fullInclude });
      res.status(201).json(full);
    } catch (err) {
      // Race-condition safety net: DB unique constraint fires
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Participant is already registered for this event.' });
      }
      next(err);
    }
  }
);

// ── PATCH /api/registrations/:id ────────────────────────────────────────────
// Update status or notes on an existing registration
router.patch(
  '/:id',
  requireEditor,
  [
    body('status')
      .optional()
      .isIn(['registered', 'waitlisted', 'cancelled'])
      .withMessage('Invalid status'),
    body('notes').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const registration = await Registration.findByPk(req.params.id, { include: fullInclude });
      if (!registration) return res.status(404).json({ error: 'Registration not found.' });

      const { status, notes } = req.body;
      const updates = {};
      if (status !== undefined) updates.status = status;
      if (notes  !== undefined) updates.notes  = notes;

      await registration.update(updates);
      res.json(registration);
    } catch (err) { next(err); }
  }
);

// ── DELETE /api/registrations/:id ────────────────────────────────────────────
router.delete('/:id', requireEditor, async (req, res, next) => {
  try {
    const registration = await Registration.findByPk(req.params.id);
    if (!registration) return res.status(404).json({ error: 'Registration not found.' });
    await registration.destroy();
    res.status(204).send();
  } catch (err) { next(err); }
});

// ── DELETE /api/registrations/event/:eventId/participant/:participantId ───────
// Convenience: unregister without knowing the registration ID
router.delete('/event/:eventId/participant/:participantId', requireEditor, async (req, res, next) => {
  try {
    const registration = await Registration.findOne({
      where: { event_id: req.params.eventId, participant_id: req.params.participantId },
    });
    if (!registration) return res.status(404).json({ error: 'Registration not found.' });
    await registration.destroy();
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;