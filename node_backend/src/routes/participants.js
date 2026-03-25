const express = require('express');
const { body, validationResult } = require('express-validator');
const { Participant, Event, Registration } = require('../models/associations');
const { requireEditor } = require('../middleware/auth');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const participantValidation = [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().isString(),
  body('bio').optional().isString(),
];

// GET /api/participants
router.get('/', async (req, res, next) => {
  try {
    const participants = await Participant.findAll({ order: [['last_name', 'ASC']] });
    res.json(participants);
  } catch (err) { next(err); }
});

// GET /api/participants/:id  — includes events the participant is registered for
router.get('/:id', async (req, res, next) => {
  try {
    const participant = await Participant.findByPk(req.params.id, {
      include: [
        {
          model:      Event,
          as:         'events',
          attributes: ['id', 'title', 'start_date', 'end_date', 'status', 'location'],
          through: { attributes: ['id', 'status', 'registered_at', 'notes'] },
        },
      ],
    });
    if (!participant) return res.status(404).json({ error: 'Participant not found.' });
    res.json(participant);
  } catch (err) { next(err); }
});

// POST /api/participants
router.post('/', requireEditor, participantValidation, validate, async (req, res, next) => {
  try {
    const participant = await Participant.create(req.body);
    res.status(201).json(participant);
  } catch (err) { next(err); }
});

// PUT /api/participants/:id
router.put('/:id', requireEditor, participantValidation, validate, async (req, res, next) => {
  try {
    const participant = await Participant.findByPk(req.params.id);
    if (!participant) return res.status(404).json({ error: 'Participant not found.' });
    await participant.update(req.body);
    res.json(participant);
  } catch (err) { next(err); }
});

// DELETE /api/participants/:id
router.delete('/:id', requireEditor, async (req, res, next) => {
  try {
    const participant = await Participant.findByPk(req.params.id);
    if (!participant) return res.status(404).json({ error: 'Participant not found.' });
    await participant.destroy();
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;