const express = require('express');
const Resident = require('../models/Resident');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const items = await Resident.find().sort({ name: 1 });
  res.json(items);
});

router.post('/', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const item = await Resident.create(req.body);
    res.status(201).json(item);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.get('/:id', async (req, res) => {
  const item = await Resident.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
});

router.put('/:id', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const item = await Resident.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const item = await Resident.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
});

module.exports = router;

