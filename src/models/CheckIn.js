const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema(
  {
    habit: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    completed: { type: Boolean, required: true, default: true },
    note: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true, versionKey: false }
);

checkInSchema.index({ habit: 1, date: 1 }, { unique: true });
checkInSchema.index({ date: 1, completed: 1 });

module.exports = mongoose.model('CheckIn', checkInSchema);
