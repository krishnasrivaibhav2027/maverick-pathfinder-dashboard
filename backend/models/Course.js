const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  course_id: { type: String, unique: true },
  title: String,
  description: String,
  phase: { type: Number, required: true }, // 1 or 2
  subcourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subcourse' }],
  test_enabled: { type: Boolean, default: false },
});

module.exports = mongoose.model('Course', CourseSchema); 