const express = require('express');
const mongoose = require('mongoose');
const Habit = require('../models/Habit');
const CheckIn = require('../models/CheckIn');
const { isValidDateString, todayString, addDays } = require('../utils/dates');

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

function getRange(query) {
  const to = getDate(query.to);
  const from = getDate(query.from, addDays(to, -29));
  if (from > to) throw httpError(400, 'The from date must be on or before the to date');
  if ((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000 > 365) {
    throw httpError(400, 'Date range cannot exceed 366 days');
  }
  return { from, to };
}

router.put('/:id/check-ins/:date', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, 'Invalid habit id');
  const date = getDate(req.params.date);
  const habit = await Habit.findById(req.params.id);
  if (!habit) throw httpError(404, 'Habit not found');
  const completed = req.body.completed !== false;

  if (!completed) {
    await CheckIn.findOneAndDelete({ habit: habit._id, date });
    return res.json({ date, habitId: String(habit._id), completed: false });
  }

  const checkIn = await CheckIn.findOneAndUpdate(
    { habit: habit._id, date },
    { $set: { completed: true, note: req.body.note || '' } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json({ checkIn });
});

router.get('/:id/check-ins', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, 'Invalid habit id');
  const { from, to } = getRange(req.query);
  const habit = await Habit.findById(req.params.id).select('_id').lean();
  if (!habit) throw httpError(404, 'Habit not found');
  const checkIns = await CheckIn.find({ habit: habit._id, date: { $gte: from, $lte: to } }).sort({ date: 1 }).lean();
  res.json({ habitId: String(habit._id), from, to, checkIns });
});

module.exports = router;
