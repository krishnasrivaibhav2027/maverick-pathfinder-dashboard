const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctAnswer: String,
});

const TestSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  traineeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainee', required: true },
  questions: [QuestionSchema],
  totalQuestions: Number,
  createdAt: { type: Date, default: Date.now },
  attempted: { type: Boolean, default: false },
  score: Number,
  passStatus: Boolean,
  attemptNumber: { type: Number, default: 1 },
  notes: String, // AI-generated notes for retakes
  adminApproval: { type: Boolean, default: false },
  disqualified: { type: Boolean, default: false },
});

module.exports = mongoose.model('Test', TestSchema); 