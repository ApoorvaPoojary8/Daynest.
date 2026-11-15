const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    color: { type: String, trim: true, match: /^#[0-9a-fA-F]{6}$/, default: '#6366f1' },
    schedule: {
      type: [{ type: Number, min: 0, max: 6 }],
      default: [0, 1, 2, 3, 4, 5, 6],
      validate: {
        validator: (days) => days.length > 0 && new Set(days).size === days.length,
        message: 'Schedule must contain one or more unique weekdays (0 Sunday through 6 Saturday)',
      },
    },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

habitSchema.index({ archived: 1, createdAt: -1 });

module.exports = mongoose.model('Habit', habitSchema);
