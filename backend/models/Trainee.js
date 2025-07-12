const mongoose = require('mongoose');

const CompletedQuizSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  subcourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcourse', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  score: Number,
  passStatus: Boolean,
  attemptedAt: Date,
});

const CompletedCourseSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  scores: [Number],
  testAttempts: [
    {
      testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
      score: Number,
      passStatus: Boolean,
      attemptedAt: Date,
      notes: String, // AI-generated notes for retakes
    }
  ],
  averageScore: Number,
});

const TraineeSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  empId: String,
  phase: { type: Number, default: 1 }, // 1 or 2
  status: { type: String, enum: ['active', 'disqualified', 'pending'], default: 'active' },
  progress: {
    phase1: Number,
    phase2: Number,
    overall: Number,
  },
  specialization: String,
  password_is_temporary: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  last_login: Date,
  currentCourse: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  currentSubcourse: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcourse' },
  completedCourses: [CompletedCourseSchema],
  completedQuizzes: [CompletedQuizSchema],
});

module.exports = mongoose.model('Trainee', TraineeSchema); 