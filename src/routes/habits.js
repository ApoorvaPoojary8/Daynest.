const express = require('express');
const mongoose = require('mongoose');
const Habit = require('../models/Habit');
const CheckIn = require('../models/CheckIn');
const { isValidDateString, todayString } = require('../utils/dates');

const router = express.Router();

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getDate(value, fallback = todayString()) {
  const date = value || fallback;
  if (!isValidDateString(date)) throw httpError(400, 'Dates must use the YYYY-MM-DD format');
  return date;
}

router.get('/', async (req, res) => {
  const date = getDate(req.query.date);
  const filter = req.query.includeArchived === 'true' ? {} : { archived: false };
  const [habits, checkIns] = await Promise.all([
    Habit.find(filter).sort({ createdAt: -1 }).lean(),
    CheckIn.find({ date, completed: true }).select('habit').lean(),
  ]);
  const completedIds = new Set(checkIns.map((item) => String(item.habit)));
  res.json({ date, habits: habits.map((habit) => ({ ...habit, completed: completedIds.has(String(habit._id)) })) });
});

router.post('/', async (req, res) => {
  const habit = await Habit.create({
    name: req.body.name,
    description: req.body.description,
    color: req.body.color,
    schedule: req.body.schedule,
  });
  res.status(201).json({ habit });
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, 'Invalid habit id');
  const habit = await Habit.findById(req.params.id).lean();
  if (!habit) throw httpError(404, 'Habit not found');
  res.json({ habit });
});

router.patch('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, 'Invalid habit id');
  const allowed = ['name', 'description', 'color', 'schedule', 'archived'];
  const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (!Object.keys(update).length) throw httpError(400, 'Provide at least one editable habit field');
  const habit = await Habit.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!habit) throw httpError(404, 'Habit not found');
  res.json({ habit });
});

router.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, 'Invalid habit id');
  const habit = await Habit.findByIdAndDelete(req.params.id);
  if (!habit) throw httpError(404, 'Habit not found');
  await CheckIn.deleteMany({ habit: habit._id });
  res.status(204).end();
});

module.exports = router;
