let ioInstance = null;

function setIo(io) {
  ioInstance = io;
}

function getIo() {
  return ioInstance;
}

function emitQueueUpdated(payload = {}) {
  if (!ioInstance) return;

  ioInstance.emit('queue:updated', {
    updatedAt: new Date().toISOString(),
    ...payload
  });
}

function emitAppointmentUpdated(userId, payload = {}) {
  if (!ioInstance || !userId) return;

  ioInstance.to(`user:${userId}`).emit('appointment:updated', {
    userId: String(userId),
    updatedAt: new Date().toISOString(),
    ...payload
  });
}

module.exports = {
  setIo,
  getIo,
  emitQueueUpdated,
  emitAppointmentUpdated
};
