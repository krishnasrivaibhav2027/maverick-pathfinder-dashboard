const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  batch_id: { type: String, unique: true },
  phase: { type: Number, required: true },
  trainees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trainee' }],
  is_next_batch: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  // Add more fields as needed (e.g., name, status, etc.)
});

module.exports = mongoose.model('Batch', BatchSchema); 