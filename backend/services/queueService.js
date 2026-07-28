const Appointment = require('../models/Appointment');
const nodemailer = require('nodemailer');
const { buildScheduledQueue } = require('../utils/scheduling');
const { emitQueueUpdated, emitAppointmentUpdated } = require('./realtimeService');

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-password'
  }
});

const getSafeEstimatedStartTime = (appointment) => {
  return appointment.estimatedStartTime instanceof Date && !Number.isNaN(appointment.estimatedStartTime.getTime())
    ? appointment.estimatedStartTime
    : new Date();
};

/**
 * Recalculate queue for all appointments in a hospital
 * Called after: no-show, cancellation, completion, or manual trigger
 */
const recalculateQueue = async (triggerReason = 'manual') => {
  try {
    // Only active appointments should occupy queue positions.
    const appointments = await Appointment.find({
      appointmentStatus: { $in: ['scheduled', 'checked-in', 'in-progress'] }
    }).sort({ createdAt: 1, _id: 1 });

    // If no appointments, nothing to do
    if (appointments.length === 0) {
      return { success: true, updated: 0 };
    }

    const now = new Date();
    const scheduledAppointments = buildScheduledQueue(
      appointments.map((apt) => ({
        _id: apt._id.toString(),
        queueNumber: apt.queueNumber,
        expectedTime: apt.expectedTime,
        consultTime: apt.consultTime || 15,
        priority: apt.priority || 0,
        createdAt: apt.createdAt
      }))
    );
    const updatePromises = [];

    // Recalculate queue numbers and estimated times.
    scheduledAppointments.forEach((scheduledApt) => {
      const apt = appointments.find((item) => item._id.toString() === scheduledApt._id);
      if (!apt) return;

      const waitMinutes = Math.max(0, (scheduledApt.expectedTime || 0) - (apt.consultTime || 15));
      const estimatedStartTime = new Date(now.getTime() + waitMinutes * 60000);
      const waitTimeMin = Math.max(0, waitMinutes - 5);
      const waitTimeMax = waitMinutes + 30;

      // Track if queue number changed
      const queueChanged = apt.queueNumber !== scheduledApt.queueNumber;

      // Update appointment
      const updateData = {
        queueNumber: scheduledApt.queueNumber,
        expectedTime: scheduledApt.expectedTime,
        estimatedStartTime,
        predictedWaitTime: waitMinutes,
        waitTimeMin,
        waitTimeMax,
        lastQueueUpdateAt: new Date(),
        queueChangeReason: triggerReason
      };

      updatePromises.push(
        Appointment.findByIdAndUpdate(apt._id, updateData, { new: true })
          .then(updatedApt => ({
            appointmentId: apt._id,
            queueChanged,
            oldQueue: apt.queueNumber,
            newQueue: scheduledApt.queueNumber,
            updatedApt
          }))
      );
    });

    const results = await Promise.all(updatePromises);
    
    // Send notifications for changed queues
    const changedAppointments = results.filter(r => r.queueChanged);
    for (const change of changedAppointments) {
      await sendQueueChangeNotification(change.updatedApt);
    }

    // Push realtime appointment data to every affected patient, even when only wait time changed.
    for (const result of results) {
      if (result.updatedApt?.userId) {
        emitAppointmentUpdated(result.updatedApt.userId, {
          appointmentId: result.updatedApt._id,
          queueNumber: result.updatedApt.queueNumber,
          predictedWaitTime: result.updatedApt.predictedWaitTime,
          estimatedStartTime: result.updatedApt.estimatedStartTime,
          reason: triggerReason
        });
      }
    }

    emitQueueUpdated({
      reason: triggerReason,
      queueSize: scheduledAppointments.length,
      changedCount: changedAppointments.length
    });

    return {
      success: true,
      updated: results.length,
      changedCount: changedAppointments.length,
      results
    };
  } catch (error) {
    console.error('Queue recalculation error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle patient no-show
 */
const handleNoShow = async (appointmentId) => {
  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return { success: false, message: 'Appointment not found' };
    }

    appointment.appointmentStatus = 'no-show';
    appointment.checkInStatus = 'not-checked-in';
    await appointment.save();

    const result = await recalculateQueue('no-show');
    
    return { success: true, ...result };
  } catch (error) {
    console.error('No-show handling error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle appointment cancellation
 */
const handleCancellation = async (appointmentId) => {
  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return { success: false, message: 'Appointment not found' };
    }

    appointment.appointmentStatus = 'cancelled';
    appointment.status = 'Cancelled';
    await appointment.save();

    const result = await recalculateQueue('cancellation');
    
    return { success: true, ...result };
  } catch (error) {
    console.error('Cancellation handling error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle patient check-in
 */
const handleCheckIn = async (appointmentId, isLate = false) => {
  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return { success: false, message: 'Appointment not found' };
    }

    appointment.checkInStatus = isLate ? 'late' : 'checked-in';
    appointment.appointmentStatus = 'checked-in';
    await appointment.save();

    return { success: true, appointment };
  } catch (error) {
    console.error('Check-in error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Simulate early finish - shift all subsequent appointments up
 */
const handleEarlyFinish = async (appointmentId, minutesEarlyBy) => {
  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return { success: false, message: 'Appointment not found' };
    }

    appointment.appointmentStatus = 'completed';
    appointment.status = 'Completed';
    await appointment.save();

    // Get all appointments after this one
    const laterAppointments = await Appointment.find({
      queueNumber: { $gt: appointment.queueNumber },
      appointmentStatus: { $in: ['scheduled', 'checked-in', 'in-progress'] }
    });

    // Shift their estimated times up
    for (const later of laterAppointments) {
      const baseStartTime = getSafeEstimatedStartTime(later);
      later.estimatedStartTime = new Date(
        baseStartTime.getTime() - minutesEarlyBy * 60000
      );
      later.predictedWaitTime = Math.max(0, later.predictedWaitTime - minutesEarlyBy);
      later.lastQueueUpdateAt = new Date();
      later.queueChangeReason = 'early-finish';
      await later.save();
      await sendQueueChangeNotification(later);
    }

    // Recalculate full queue
    const result = await recalculateQueue('early-finish');
    
    return { success: true, shiftedCount: laterAppointments.length, ...result };
  } catch (error) {
    console.error('Early finish handling error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Simulate doctor delay - shift all subsequent appointments down
 */
const handleDoctorDelay = async (delayMinutes) => {
  try {
    // Get all pending/checked-in appointments
    const appointments = await Appointment.find({
      appointmentStatus: { $in: ['scheduled', 'checked-in'] }
    });

    const updates = [];
    for (const apt of appointments) {
      const baseStartTime = getSafeEstimatedStartTime(apt);
      apt.estimatedStartTime = new Date(
        baseStartTime.getTime() + delayMinutes * 60000
      );
      apt.predictedWaitTime += delayMinutes;
      apt.lastQueueUpdateAt = new Date();
      apt.queueChangeReason = 'delay';
      updates.push(apt.save());
      updates.push(sendQueueChangeNotification(apt));
      if (apt.userId) {
        emitAppointmentUpdated(apt.userId, {
          appointmentId: apt._id,
          queueNumber: apt.queueNumber,
          predictedWaitTime: apt.predictedWaitTime,
          estimatedStartTime: apt.estimatedStartTime,
          reason: 'delay'
        });
      }
    }

    await Promise.all(updates);
    emitQueueUpdated({
      reason: 'delay',
      queueSize: appointments.length,
      delayMinutes
    });

    return {
      success: true,
      affectedCount: appointments.length,
      delayMinutes,
      message: `All appointments delayed by ${delayMinutes} minutes`
    };
  } catch (error) {
    console.error('Doctor delay handling error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send email notification when queue changes
 */
const sendQueueChangeNotification = async (appointment) => {
  try {
    const populatedApt = await Appointment.findById(appointment._id)
      .populate('userId', 'email name');

    if (!populatedApt || !populatedApt.userId) {
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: populatedApt.userId.email,
      subject: `Queue Update - Your Appointment #${populatedApt.queueNumber}`,
      html: `
        <h2>Your Appointment Queue Has Been Updated</h2>
        <p>Hello ${populatedApt.userId.name},</p>
        <p>Your appointment has been updated:</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Queue Number:</strong> #${populatedApt.queueNumber}</p>
          <p><strong>Estimated Start Time:</strong> ${populatedApt.estimatedStartTime?.toLocaleString() || 'TBD'}</p>
          <p><strong>Predicted Wait Time:</strong> ${populatedApt.predictedWaitTime} minutes</p>
          <p><strong>Reason:</strong> ${populatedApt.queueChangeReason?.replace(/-/g, ' ')}</p>
        </div>

        <p>Please arrive 5-10 minutes before your estimated time.</p>
        <p>Thank you!</p>
      `
    };

    await transporter.sendMail(mailOptions);
    
    // Mark notification as sent
    populatedApt.notificationSent = true;
    await populatedApt.save();

    emitAppointmentUpdated(populatedApt.userId?._id, {
      appointmentId: populatedApt._id,
      queueNumber: populatedApt.queueNumber,
      predictedWaitTime: populatedApt.predictedWaitTime
    });
    
    return true;
  } catch (error) {
    console.error('Email notification error:', error);
    return false;
  }
};

module.exports = {
  recalculateQueue,
  handleNoShow,
  handleCancellation,
  handleCheckIn,
  handleEarlyFinish,
  handleDoctorDelay,
  sendQueueChangeNotification
};
