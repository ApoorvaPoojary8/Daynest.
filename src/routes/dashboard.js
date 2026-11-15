const express = require('express');
const Habit = require('../models/Habit');
const CheckIn = require('../models/CheckIn');
const { isValidDateString, todayString, addDays, weekdayFor } = require('../utils/dates');

const router = express.Router();

router.get('/', async (req, res) => {
  const date = req.query.date || todayString();
  if (!isValidDateString(date)) {
    return res.status(400).json({ error: { message: 'Dates must use the YYYY-MM-DD format' } });
  }

  const from = addDays(date, -6);
  const [habits, checkIns] = await Promise.all([
    Habit.find({ archived: false }).sort({ createdAt: -1 }).lean(),
    CheckIn.find({ date: { $gte: addDays(date, -365), $lte: date }, completed: true }).select('habit date').lean(),
  ]);

  const checksByHabit = new Map();
  for (const checkIn of checkIns) {
    const id = String(checkIn.habit);
    if (!checksByHabit.has(id)) checksByHabit.set(id, new Set());
    checksByHabit.get(id).add(checkIn.date);
  }

  const week = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(from, index);
    const scheduled = habits.filter((habit) => habit.schedule.includes(weekdayFor(day)));
    const done = scheduled.filter((habit) => checksByHabit.get(String(habit._id))?.has(day)).length;
    return { date: day, completed: done, scheduled: scheduled.length };
  });

  const todayScheduled = habits.filter((habit) => habit.schedule.includes(weekdayFor(date)));
  const todayCompleted = todayScheduled.filter((habit) => checksByHabit.get(String(habit._id))?.has(date)).length;

  const habitStats = habits.map((habit) => {
    const completedDates = checksByHabit.get(String(habit._id)) || new Set();
    let cursor = date;
    if (habit.schedule.includes(weekdayFor(cursor)) && !completedDates.has(cursor)) cursor = addDays(cursor, -1);
    let streak = 0;
    for (let i = 0; i < 366; i += 1) {
      if (habit.schedule.includes(weekdayFor(cursor))) {
        if (!completedDates.has(cursor)) break;
        streak += 1;
      }
      cursor = addDays(cursor, -1);
    }
    return { habitId: String(habit._id), streak };
  });

  res.json({
    date,
    today: { completed: todayCompleted, scheduled: todayScheduled.length },
    week,
    habits: habitStats,
  });
});

module.exports = router;
