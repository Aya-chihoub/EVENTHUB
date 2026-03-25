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
  body('start_date').isISO8601().withMessage('Valid start_date required'),
  body('end_date').isISO8601().withMessage('Valid end_date required'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'cancelled', 'completed'])
    .withMessage('Invalid status'),
  body('max_participants').optional({ nullable: true }).isInt({ min: 1 }),
];

// GET /api/events
// Query params: ?status=published  ?start_date_after=2025-01-01  ?start_date_before=2025-12-31
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
        { model: Registration, as: 'registrations', attributes: ['id', 'status'] },
      ],
    });
    res.json(events);
  } catch (err) { next(err); }
});

// GET /api/events/:id  — includes registered participants
router.get('/:id', async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        {
          model:      Participant,
          as:         'participants',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
          through: { attributes: ['id', 'status', 'registered_at', 'notes'] },
        },
      ],
    });
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    res.json(event);
  } catch (err) { next(err); }
});

// POST /api/events
router.post('/', requireEditor, eventValidation, validate, async (req, res, next) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json(event);
  } catch (err) { next(err); }
});

// PUT /api/events/:id
router.put('/:id', requireEditor, eventValidation, validate, async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    await event.update(req.body);
    res.json(event);
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