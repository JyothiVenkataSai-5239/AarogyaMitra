/**
 * Mock ML Prediction Service
 * Provides predictions for no-show risk and waiting times
 * Can be replaced with real trained models later
 */

/**
 * Predict no-show risk using mock logistic regression
 * Real implementation would use trained model
 */
const predictNoShowRisk = async (appointmentData) => {
  try {
    const {
      ageGroup,
      visitType,
      disease,
      dayOfWeek,
      timeOfDay,
      previousNoShows = 0,
      appointmentHistory = []
    } = appointmentData;

    // Mock factors for no-show risk calculation
    let riskScore = 0.1; // Base risk

    // Age factor
    const ageRiskMap = {
      'Child (0-12)': 0.05,
      'Teen (13-17)': 0.15,
      'Adult (18-40)': 0.12,
      'Middle-aged (41-60)': 0.08,
      'Senior (60+)': 0.06
    };
    riskScore += ageRiskMap[ageGroup] || 0.1;

    // Visit type factor (Emergency lower risk, Follow-up higher)
    const visitRiskMap = {
      'Emergency': 0.05,
      'Consultation': 0.12,
      'Follow-up': 0.18,
      'Routine Checkup': 0.10
    };
    riskScore += visitRiskMap[visitType] || 0.1;

    // Disease complexity factor
    const diseaseRiskMap = {
      'Fever': 0.08,
      'Diabetes': 0.15,
      'Heart Disease': 0.05,
      'Cancer': 0.03,
      'Fracture': 0.10,
      'Neurological Disorder': 0.12,
      'Kidney Disease': 0.10,
      'Eye Problem': 0.14,
      'Dental Issue': 0.20,
      'General Checkup': 0.15,
      'Other': 0.10
    };
    riskScore += diseaseRiskMap[disease] || 0.1;

    // Day of week factor (weekends higher)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      riskScore += 0.15; // Weekend
    } else {
      riskScore += 0.05; // Weekday
    }

    // Time of day factor (early morning lower, late afternoon higher)
    if (timeOfDay >= 9 && timeOfDay <= 12) {
      riskScore += 0.05; // Morning
    } else if (timeOfDay >= 14 && timeOfDay <= 17) {
      riskScore += 0.12; // Afternoon
    } else {
      riskScore += 0.10; // Evening
    }

    // History factor (patients with previous no-shows have higher risk)
    riskScore += previousNoShows * 0.1;

    // Appointment history factor
    if (appointmentHistory.length > 5) {
      riskScore -= 0.05; // Regular patients have lower risk
    }

    // Normalize to 0-1
    riskScore = Math.min(1, Math.max(0, riskScore));

    return {
      noShowRisk: parseFloat(riskScore.toFixed(3)),
      riskLevel: riskScore > 0.25 ? 'High' : riskScore > 0.15 ? 'Medium' : 'Low',
      factors: {
        ageGroup,
        visitType,
        disease,
        dayOfWeek,
        timeOfDay,
        previousNoShows
      }
    };
  } catch (error) {
    console.error('No-show prediction error:', error);
    return { noShowRisk: 0.1, riskLevel: 'Low', error: error.message };
  }
};

/**
 * Predict waiting time using mock gradient boosting regressor
 * Real implementation would use trained model
 */
const predictWaitingTime = async (appointmentData) => {
  try {
    const {
      queuePosition = 1,
      dayOfWeek,
      timeOfDay,
      hospitalCurrentLoad = 0,
      consultTime = 15
    } = appointmentData;

    // Deterministic baseline prediction (no random jitter)
    let basePredictedTime = Math.max(0, (queuePosition - 1) * consultTime);

    // Day of week factor (weekends busier)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      basePredictedTime *= 1.3; // 30% increase on weekends
    } else if (dayOfWeek === 1 || dayOfWeek === 2) {
      basePredictedTime *= 0.9; // 10% decrease on Mon/Tue
    }

    // Time of day factor
    if (timeOfDay >= 10 && timeOfDay <= 12) {
      basePredictedTime *= 1.4; // Peak morning hours
    } else if (timeOfDay >= 14 && timeOfDay <= 16) {
      basePredictedTime *= 1.2; // Moderate afternoon
    } else if (timeOfDay >= 17 && timeOfDay <= 19) {
      basePredictedTime *= 1.5; // Peak evening
    } else {
      basePredictedTime *= 0.8; // Off-peak
    }

    // Hospital load factor
    basePredictedTime *= (1 + hospitalCurrentLoad * 0.1);

    // Keep delay uncertainty bounded to 30 minutes max.
    const predictedTime = Math.max(5, Math.round(basePredictedTime));
    const predictedRange = {
      min: Math.max(0, predictedTime - 5),
      max: predictedTime + 30
    };

    return {
      predictedWaitTime: predictedTime,
      predictedRange,
      confidence: 0.82,
      factors: {
        queuePosition,
        hospitalCurrentLoad,
        dayOfWeek,
        timeOfDay,
        consultTime
      }
    };
  } catch (error) {
    console.error('Waiting time prediction error:', error);
    return {
      predictedWaitTime: 15,
      predictedRange: { min: 10, max: 45 },
      confidence: 0.5,
      error: error.message
    };
  }
};

/**
 * Recommend rescheduling opportunities
 * Suggests if patient can be moved up or should be moved down
 */
const recommendReschedule = async (appointmentId, allHospitalAppointments) => {
  try {
    const currentApt = allHospitalAppointments.find(a => a._id.toString() === appointmentId);
    if (!currentApt) {
      return { recommendation: 'none', reason: 'Appointment not found' };
    }

    // Check for no-show risk
    const noShowPrediction = await predictNoShowRisk({
      ageGroup: currentApt.ageGroup,
      visitType: currentApt.visitType,
      disease: currentApt.disease,
      dayOfWeek: new Date(currentApt.createdAt).getDay(),
      timeOfDay: new Date(currentApt.createdAt).getHours()
    });

    // High no-show risk patients might be moved down/rescheduled
    if (noShowPrediction.noShowRisk > 0.3) {
      return {
        recommendation: 'move-down',
        reason: 'High no-show risk detected',
        riskScore: noShowPrediction.noShowRisk,
        suggestion: 'Consider moving to later time for confirmation'
      };
    }

    // Look for empty slots (cancelled/no-show in earlier queue)
    const earlierSlots = allHospitalAppointments.filter(
      a => a.queueNumber < currentApt.queueNumber &&
           (a.appointmentStatus === 'no-show' || a.appointmentStatus === 'cancelled')
    );

    if (earlierSlots.length > 0) {
      return {
        recommendation: 'move-up',
        reason: `${earlierSlots.length} empty slot(s) available`,
        availableSlots: earlierSlots.length,
        suggestion: `Patient can move up by ${earlierSlots.length} position(s)`
      };
    }

    // Check if patient is significantly delayed
    const expectedTime = new Date(currentApt.estimatedStartTime);
    const now = new Date();
    const delayMinutes = Math.round((now - expectedTime) / 60000);

    if (delayMinutes > 30 && currentApt.checkInStatus !== 'checked-in') {
      return {
        recommendation: 'reschedule-different-day',
        reason: `Appointment delayed by ${delayMinutes} minutes`,
        suggestion: 'Offer patient to reschedule to another day'
      };
    }

    return {
      recommendation: 'none',
      reason: 'No reschedule needed - appointment on track'
    };
  } catch (error) {
    console.error('Reschedule recommendation error:', error);
    return { recommendation: 'error', error: error.message };
  }
};

module.exports = {
  predictNoShowRisk,
  predictWaitingTime,
  recommendReschedule
};
