const express = require('express');
const { Op }  = require('sequelize');
const { body, validationResult } = require('express-validator');
const { Event, Participant, Registration } = require('../models/associations');
const { requireEditor } = require('../middleware/auth');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const eventValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('start_date').notEmpty().withMessage('Valid start_date required'),
  body('end_date').notEmpty().withMessage('Valid end_date required'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'cancelled', 'completed'])
    .withMessage('Invalid status'),
  body('max_participants').optional({ nullable: true }),
];

function pickEventFields(body) {
  const { title, description, location, start_date, end_date, status, max_participants } = body;
  return {
    title,
    description: description || '',
    location: location || '',
    start_date,
    end_date,
    status: status || 'draft',
    max_participants: max_participants ? parseInt(max_participants, 10) : null,
  };
}

function addParticipantCount(event) {
  const json = event.toJSON();
  const regs = json.registrations || [];
  json.participant_count = regs.filter((r) => r.status === 'registered').length;
  json.waitlist_count = regs.filter((r) => r.status === 'waitlisted').length;
  return json;
}

// GET /api/events
router.get('/', async (req, res, next) => {
  try {
    const { status, start_date_after, start_date_before } = req.query;
    const where = {};

    if (status) where.status = status;

    if (start_date_after || start_date_before) {
      where.start_date = {};
      if (start_date_after)  where.start_date[Op.gte] = new Date(start_date_after);
      if (start_date_before) where.start_date[Op.lte] = new Date(start_date_before);
    }

    const events = await Event.findAll({
      where,
      order: [['start_date', 'DESC']],
      include: [
        { model: Registration, as: 'registrations', attributes: ['status'] },
      ],
    });
    res.json(events.map(addParticipantCount));
  } catch (err) { next(err); }
});

// GET /api/events/:id/participants/ — matches Django nested route (non-cancelled only)
async function eventParticipantsHandler(req, res, next) {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    const regs = await Registration.findAll({
      where: {
        event_id: req.params.id,
        status: { [Op.ne]: 'cancelled' },
      },
      include: [{ model: Participant, as: 'participant' }],
    });
    const list = regs
      .map((r) => {
        const p = r.participant?.toJSON();
        if (!p) return null;
        return { ...p, registration_status: r.status };
      })
      .filter(Boolean);
    res.json(list);
  } catch (err) { next(err); }
}
router.get('/:id/participants', eventParticipantsHandler);
router.get('/:id/participants/', eventParticipantsHandler);

// GET /api/events/:id
router.get('/:id', async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: Registration, as: 'registrations', attributes: ['status'] },
        {
          model:      Participant,
          as:         'participants',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
          through: { attributes: ['status', 'registered_at', 'notes'] },
        },
      ],
    });
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    res.json(addParticipantCount(event));
  } catch (err) { next(err); }
});

// POST /api/events
router.post('/', requireEditor, eventValidation, validate, async (req, res, next) => {
  try {
    const event = await Event.create(pickEventFields(req.body));
    const json = event.toJSON();
    json.participant_count = 0;
    res.status(201).json(json);
  } catch (err) { next(err); }
});

// PUT /api/events/:id
router.put('/:id', requireEditor, eventValidation, validate, async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    await event.update(pickEventFields(req.body));
    const full = await Event.findByPk(event.id, {
      include: [{ model: Registration, as: 'registrations', attributes: ['status'] }],
    });
    res.json(addParticipantCount(full));
  } catch (err) { next(err); }
});

// DELETE /api/events/:id
router.delete('/:id', requireEditor, async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    await event.destroy();
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;