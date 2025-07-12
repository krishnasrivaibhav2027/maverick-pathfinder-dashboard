const mongoose = require('mongoose');

const SubcourseSchema = new mongoose.Schema({
  subcourse_id: { type: String, unique: true },
  title: String,
  description: String,
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  quiz_enabled: { type: Boolean, default: false },
});

module.exports = mongoose.model('Subcourse', SubcourseSchema); 