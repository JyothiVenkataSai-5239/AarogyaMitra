const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ageGroup: {
    type: String,
    enum: ['Child (0-12)', 'Teen (13-17)', 'Adult (18-40)', 'Middle-aged (41-60)', 'Senior (60+)'],
    required: true
  },
  disease: {
    type: String,
    enum: ['Fever', 'Diabetes', 'Heart Disease', 'Cancer', 'Fracture', 
           'Neurological Disorder', 'Kidney Disease', 'Eye Problem', 
           'Dental Issue', 'General Checkup', 'Other'],
    required: true
  },
  visitType: {
    type: String,
    enum: ['Emergency', 'Consultation', 'Follow-up', 'Routine Checkup'],
    required: true
  },
  doctorType: {
    type: String,
    required: true
  },
  bookingSource: {
    type: String,
    enum: ['online', 'walk-in'],
    default: 'online'
  },
  priority: {
    type: Number,
    default: 0
  },
  consultTime: {
    type: Number,
    default: 15
  },
  queueNumber: {
    type: Number,
    required: true
  },
  expectedTime: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  appointmentStatus: {
    type: String,
    enum: ['scheduled', 'checked-in', 'in-progress', 'completed', 'no-show', 'cancelled'],
    default: 'scheduled'
  },
  checkInStatus: {
    type: String,
    enum: ['not-checked-in', 'checked-in', 'late'],
    default: 'not-checked-in'
  },
  estimatedStartTime: {
    type: Date,
    required: false
  },
  predictedWaitTime: {
    type: Number,
    default: 0
  },
  waitTimeMin: {
    type: Number,
    default: 0
  },
  waitTimeMax: {
    type: Number,
    default: 0
  },
  noShowRisk: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  rescheduleCount: {
    type: Number,
    default: 0
  },
  lastQueueUpdateAt: {
    type: Date,
    required: false
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  queueChangeReason: {
    type: String,
    enum: ['initial', 'no-show', 'cancellation', 'early-finish', 'delay', 'manual'],
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
