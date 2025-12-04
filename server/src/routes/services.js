const express = require('express');
const Service = require('../models/Service');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const items = await Service.find().sort({ serviceType: 1 });
  res.json(items);
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const item = await Service.create(req.body);
    res.status(201).json(item);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.get('/:id', async (req, res) => {
  const item = await Service.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
});

router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const item = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const item = await Service.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
});

module.exports = router;

