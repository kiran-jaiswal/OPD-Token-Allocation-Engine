const { v4: uuidv4 } = require('uuid');

class Token {
  constructor({
    patientId,
    patientName,
    doctorId,
    slotTime,
    source,
    priority = 0,
    tokenNumber = null
  }) {
    this.tokenId = uuidv4();
    this.tokenNumber = tokenNumber;
    this.patientId = patientId;
    this.patientName = patientName;
    this.doctorId = doctorId;
    this.slotTime = slotTime;
    this.source = source; // 'online', 'walkin', 'priority', 'followup'
    this.priority = this.calculatePriority(source, priority);
    this.status = 'allocated'; // 'allocated', 'waiting', 'completed', 'cancelled', 'noshow'
    this.createdAt = new Date();
    this.estimatedTime = null;
  }

  calculatePriority(source, manualPriority) {
    // Priority scoring system
    const basePriorities = {
      priority: 1000,  // Emergency/Paid priority
      followup: 500,   // Follow-up patients
      online: 100,     // Online bookings
      walkin: 0        // Walk-in patients
    };

    const base = basePriorities[source] || 0;
    return base + manualPriority;
  }

  cancel(reason) {
    this.status = 'cancelled';
    this.cancellationReason = reason;
    this.cancelledAt = new Date();
  }

  complete() {
    this.status = 'completed';
    this.completedAt = new Date();
  }

  markNoShow() {
    this.status = 'noshow';
    this.noShowAt = new Date();
  }

  updateEstimatedTime(time) {
    this.estimatedTime = time;
  }

  toJSON() {
    return {
      tokenId: this.tokenId,
      tokenNumber: this.tokenNumber,
      patientId: this.patientId,
      patientName: this.patientName,
      doctorId: this.doctorId,
      slotTime: this.slotTime,
      source: this.source,
      priority: this.priority,
      status: this.status,
      createdAt: this.createdAt,
      estimatedTime: this.estimatedTime
    };
  }
}

module.exports = Token;
