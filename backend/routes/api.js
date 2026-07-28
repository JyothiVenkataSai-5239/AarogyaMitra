const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
  calculatePriority,
  calculateConsultTime
} = require('../utils/scheduling');
const {
  recalculateQueue,
  handleNoShow,
  handleCancellation,
  handleCheckIn,
  handleEarlyFinish,
  handleDoctorDelay
} = require('../services/queueService');
const {
  predictNoShowRisk,
  predictWaitingTime,
  recommendReschedule
} = require('../services/predictionService');

// Mapping from disease to doctor type
const getDoctorType = (disease) => {
  const diseaseMap = {
    'Fever': 'General Practitioner',
    'General Checkup': 'General Practitioner',
    'Heart Disease': 'Cardiologist',
    'Cancer': 'Oncologist',
    'Neurological Disorder': 'Neurologist',
    'Kidney Disease': 'Nephrologist',
    'Dental Issue': 'Dentist',
    'Eye Problem': 'Ophthalmologist',
    'Diabetes': 'Endocrinologist',
    'Fracture': 'Orthopedic'
  };
  return diseaseMap[disease] || 'General Practitioner';
};

// POST book appointment (protected route)
router.post('/book', authMiddleware, async (req, res) => {
  const { ageGroup, disease, visitType } = req.body;
  const userId = req.user.id;

  if (!ageGroup || !disease || !visitType) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const doctorType = getDoctorType(disease);
    
    // Convert age group to a number for priority calculation
    const ageMap = {
      'Child (0-12)': 6,
      'Teen (13-17)': 15,
      'Adult (18-40)': 30,
      'Middle-aged (41-60)': 50,
      'Senior (60+)': 70
    };
    const age = ageMap[ageGroup] || 30;

    const priority = calculatePriority({ age, disease, visitType });
    const consultTime = calculateConsultTime({ doctorType, visitType });

    const appointment = new Appointment({
      userId,
      ageGroup,
      disease,
      visitType,
      doctorType,
      bookingSource: 'online',
      priority,
      consultTime,
      queueNumber: 0,
      expectedTime: 0
    });

    const savedAppointment = await appointment.save();
    await recalculateQueue('initial');

    const updatedAppointment = await Appointment.findById(savedAppointment._id);

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST add walk-in appointment (admin/staff)
router.post('/admin/walk-in', authMiddleware, adminMiddleware, async (req, res) => {
  const { ageGroup, disease, visitType, patientName = 'Walk-in Patient' } = req.body;

  if (!ageGroup || !disease || !visitType) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const doctorType = getDoctorType(disease);
    const ageMap = {
      'Child (0-12)': 6,
      'Teen (13-17)': 15,
      'Adult (18-40)': 30,
      'Middle-aged (41-60)': 50,
      'Senior (60+)': 70
    };
    const age = ageMap[ageGroup] || 30;

    const priority = calculatePriority({ age, disease, visitType });
    const consultTime = calculateConsultTime({ doctorType, visitType });

    const walkInAppointment = new Appointment({
      // Temporary link to admin creating walk-in; ideally should point to dedicated walk-in patient record.
      userId: req.user.id,
      ageGroup,
      disease,
      visitType,
      doctorType,
      bookingSource: 'walk-in',
      priority,
      consultTime,
      queueNumber: 0,
      expectedTime: 0
    });

    const savedAppointment = await walkInAppointment.save();
    await recalculateQueue('manual');

    const updatedAppointment = await Appointment.findById(savedAppointment._id);

    res.status(201).json({
      message: `Walk-in appointment added for ${patientName}`,
      appointment: updatedAppointment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET user's appointments (protected route)
router.get('/appointments', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user.id });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all appointments - Admin only
router.get('/admin/appointments', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE appointment status - Admin only
router.patch('/admin/appointments/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { status } = req.body;

  if (!['Pending', 'Completed', 'Cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (status === 'Completed') {
      appointment.status = 'Completed';
      appointment.appointmentStatus = 'completed';
      await appointment.save();
      await recalculateQueue('completion');
    } else if (status === 'Cancelled') {
      await handleCancellation(appointment._id);
    } else {
      appointment.status = 'Pending';
      appointment.appointmentStatus = appointment.checkInStatus === 'checked-in' ? 'checked-in' : 'scheduled';
      await appointment.save();
      await recalculateQueue('manual');
    }

    const updatedAppointment = await Appointment.findById(req.params.id)
      .populate('userId', 'name');

    res.json({
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// ==================== QUEUE MANAGEMENT ENDPOINTS ====================

// GET live queue - Admin only
router.get('/admin/queue', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      appointmentStatus: { $ne: 'cancelled' }
    })
      .populate('userId', 'name email')
      .sort({ queueNumber: 1 });

    res.json({
      message: 'Queue retrieved',
      queueSize: appointments.length,
      appointments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST handle patient no-show - Admin only
router.post('/admin/appointments/:id/no-show', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const result = await handleNoShow(req.params.id);
    
    res.json({
      message: 'No-show recorded and queue recalculated',
      ...result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST handle appointment cancellation - Protected route
router.post('/appointments/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user owns this appointment
    if (appointment.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const result = await handleCancellation(req.params.id);
    
    res.json({
      message: 'Appointment cancelled and queue updated',
      ...result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST check-in appointment - Protected route
router.post('/appointments/:id/check-in', authMiddleware, async (req, res) => {
  try {
    const { isLate = false } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const result = await handleCheckIn(req.params.id, isLate);
    
    res.json({
      message: 'Check-in successful',
      appointment: result.appointment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST mark appointment completed - Admin only
router.post('/admin/appointments/:id/complete', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.appointmentStatus = 'completed';
    appointment.status = 'Completed';
    await appointment.save();

    const result = await recalculateQueue('completion');

    res.json({
      message: 'Appointment marked completed and queue recalculated',
      appointment,
      queueUpdate: result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST handle doctor delay - Admin only
router.post('/admin/queue/delay', authMiddleware, adminMiddleware, async (req, res) => {
  const { delayMinutes } = req.body;

  if (!delayMinutes || delayMinutes <= 0) {
    return res.status(400).json({ message: 'Valid delayMinutes required' });
  }

  try {
    const result = await handleDoctorDelay(delayMinutes);
    
    res.json({
      message: 'Doctor delay recorded',
      ...result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST handle early finish - Admin only
router.post('/admin/appointments/:id/early-finish', authMiddleware, adminMiddleware, async (req, res) => {
  const { minutesEarlyBy = 5 } = req.body;

  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const result = await handleEarlyFinish(req.params.id, minutesEarlyBy);
    
    res.json({
      message: 'Early finish recorded and appointments shifted',
      ...result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST recalculate queue manually - Admin only
router.post('/admin/queue/recalculate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await recalculateQueue('manual');
    
    res.json({
      message: 'Queue recalculated successfully',
      ...result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== PREDICTION ENDPOINTS ====================

// POST predict no-show risk
router.post('/predict/no-show', authMiddleware, async (req, res) => {
  try {
    const {
      ageGroup,
      visitType,
      disease,
      dayOfWeek = new Date().getDay(),
      timeOfDay = new Date().getHours(),
      previousNoShows = 0
    } = req.body;

    const prediction = await predictNoShowRisk({
      ageGroup,
      visitType,
      disease,
      dayOfWeek,
      timeOfDay,
      previousNoShows
    });

    res.json({
      message: 'No-show risk prediction',
      prediction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST predict waiting time
router.post('/predict/waiting-time', authMiddleware, async (req, res) => {
  try {
    const {
      queuePosition = 1,
      dayOfWeek = new Date().getDay(),
      timeOfDay = new Date().getHours(),
      consultTime = 15
    } = req.body;

    const activeAppointments = await Appointment.countDocuments({
      appointmentStatus: { $in: ['scheduled', 'checked-in'] }
    });

    const prediction = await predictWaitingTime({
      queuePosition,
      dayOfWeek,
      timeOfDay,
      hospitalCurrentLoad: activeAppointments / 20, // Normalize
      consultTime
    });

    res.json({
      message: 'Waiting time prediction',
      prediction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST recommend reschedule
router.post('/recommend/reschedule/:appointmentId', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const allAppointments = await Appointment.find({
      appointmentStatus: { $ne: 'cancelled' }
    });

    const recommendation = await recommendReschedule(req.params.appointmentId, allAppointments);

    res.json({
      message: 'Reschedule recommendation',
      recommendation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
