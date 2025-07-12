const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctAnswer: String,
});

const QuizSchema = new mongoose.Schema({
  subcourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcourse', required: true },
  traineeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainee', required: true },
  questions: [QuestionSchema],
  totalQuestions: Number,
  createdAt: { type: Date, default: Date.now },
  attempted: { type: Boolean, default: false },
  score: Number,
  passStatus: Boolean,
});

module.exports = mongoose.model('Quiz', QuizSchema); 