function normalizeValue(value) {
  return String(value || '').trim().toLowerCase();
}

function calculatePriority({ age, disease, visitType }) {
  const normalizedVisitType = normalizeValue(visitType);
  const normalizedDisease = normalizeValue(disease);
  const numericAge = Number(age) || 0;

  const diseaseSeverity = {
    'cancer': 30,
    'heart disease': 30,
    'kidney disease': 30,
    'neurological disorder': 25,
    'fracture': 20,
    'diabetes': 20,
    'eye problem': 15,
    'dental issue': 15,
    'fever': 10,
    'general checkup': 5,
    'other': 10
  };

  let priority = 0;

  if (normalizedVisitType === 'emergency') {
    priority += 100;
  }

  priority += diseaseSeverity[normalizedDisease] || 10;

  if (numericAge >= 60) {
    priority += 20;
  }

  if (numericAge >= 60 && diseaseSeverity[normalizedDisease] >= 25) {
    priority += 10;
  }

  if (normalizedVisitType === 'follow-up') {
    priority -= 10;
  }

  return priority;
}

function calculateConsultTime({ doctorType, visitType }) {
  const normalizedDoctorType = normalizeValue(doctorType || '');
  const normalizedVisitType = normalizeValue(visitType);
  const isFollowUp = normalizedVisitType === 'follow-up';
  const isEmergency = normalizedVisitType === 'emergency';

  // Keep consultation estimates realistic and bounded (10-30 min).
  if (isEmergency) {
    return 30;
  }

  if (isFollowUp) {
    return 10;
  }

  if (
    normalizedDoctorType.includes('cardio') ||
    normalizedDoctorType.includes('neuro') ||
    normalizedDoctorType.includes('onco') ||
    normalizedDoctorType.includes('nephro')
  ) {
    return 25;
  }

  return 15;
}

function reorderAppointments(appointments) {
  return appointments
    .slice()
    .sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }

      return new Date(a.createdAt) - new Date(b.createdAt);
    });
}

function assignQueueDetails(appointments) {
  let totalConsultTime = 0;

  return appointments.map((appointment, index) => {
    totalConsultTime += appointment.consultTime;

    return {
      ...appointment,
      queueNumber: index + 1,
      expectedTime: totalConsultTime
    };
  });
}

function buildScheduledQueue(appointments) {
  return assignQueueDetails(reorderAppointments(appointments));
}

module.exports = {
  calculatePriority,
  calculateConsultTime,
  reorderAppointments,
  assignQueueDetails,
  buildScheduledQueue
};
