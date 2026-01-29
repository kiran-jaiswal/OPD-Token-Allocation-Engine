const Token = require('../models/Token');

class TokenAllocator {
  constructor() {
    this.doctors = new Map();
    this.tokens = new Map();
    this.waitingList = [];
  }

  addDoctor(doctor) {
    this.doctors.set(doctor.doctorId, doctor);
  }

  getDoctor(doctorId) {
    return this.doctors.get(doctorId);
  }

  /**
   * Main allocation algorithm
   * Allocates a token to a slot based on priority and availability
   */
  allocateToken({
    patientId,
    patientName,
    doctorId,
    slotTime,
    source,
    priority = 0
  }) {
    const doctor = this.getDoctor(doctorId);
    if (!doctor) {
      return {
        success: false,
        error: 'Doctor not found',
        suggestion: 'Please check doctor ID'
      };
    }

    const slot = doctor.getSlot(slotTime);
    if (!slot) {
      return {
        success: false,
        error: 'Slot not found',
        suggestion: 'Please check slot time'
      };
    }

    // Create token
    const token = new Token({
      patientId,
      patientName,
      doctorId,
      slotTime,
      source,
      priority
    });

    // Check if slot has capacity
    if (slot.canAllocate()) {
      slot.addToken(token);
      this.tokens.set(token.tokenId, token);
      this.updateEstimatedTimes(doctor, slot);

      return {
        success: true,
        token: token.toJSON(),
        message: 'Token allocated successfully'
      };
    } else {
      // Try to find alternative slot
      const alternativeSlot = this.findAlternativeSlot(doctor, slotTime);
      
      if (alternativeSlot) {
        alternativeSlot.addToken(token);
        this.tokens.set(token.tokenId, token);
        this.updateEstimatedTimes(doctor, alternativeSlot);

        return {
          success: true,
          token: token.toJSON(),
          message: `Original slot full. Allocated to ${alternativeSlot.slotTime}`,
          alternative: true
        };
      } else {
        // Add to waiting list
        token.status = 'waiting';
        this.waitingList.push(token);
        this.tokens.set(token.tokenId, token);

        return {
          success: false,
          token: token.toJSON(),
          error: 'All slots full',
          message: 'Added to waiting list',
          waitingPosition: this.waitingList.length
        };
      }
    }
  }

  /**
   * Find alternative slot near the requested time
   */
  findAlternativeSlot(doctor, requestedTime) {
    const slots = doctor.slots;
    const requestedIndex = slots.findIndex(s => s.slotTime === requestedTime);
    
    if (requestedIndex === -1) return null;

    // Check next slots
    for (let i = requestedIndex + 1; i < slots.length; i++) {
      if (slots[i].canAllocate()) {
        return slots[i];
      }
    }

    // Check previous slots
    for (let i = requestedIndex - 1; i >= 0; i--) {
      if (slots[i].canAllocate()) {
        return slots[i];
      }
    }

    return null;
  }

  /**
   * Cancel a token and attempt reallocation
   */
  cancelToken(tokenId, reason) {
    const token = this.tokens.get(tokenId);
    if (!token) {
      return {
        success: false,
        error: 'Token not found'
      };
    }

    const doctor = this.getDoctor(token.doctorId);
    const slot = doctor.getSlot(token.slotTime);
    
    // Remove token from slot
    slot.removeToken(tokenId);
    token.cancel(reason);

    // Try to reallocate from waiting list
    const reallocated = this.reallocateFromWaitingList(doctor, slot);

    return {
      success: true,
      message: 'Token cancelled',
      reallocated: reallocated
    };
  }

  /**
   * Insert emergency token with highest priority
   */
  insertEmergencyToken({
    patientId,
    patientName,
    doctorId,
    preferredSlot = null
  }) {
    const doctor = this.getDoctor(doctorId);
    if (!doctor) {
      return {
        success: false,
        error: 'Doctor not found'
      };
    }

    const token = new Token({
      patientId,
      patientName,
      doctorId,
      slotTime: preferredSlot || doctor.slots[0].slotTime,
      source: 'priority',
      priority: 5 // Highest manual priority
    });

    // Try preferred slot first
    let targetSlot = preferredSlot ? doctor.getSlot(preferredSlot) : null;
    
    // If preferred not available or not specified, find best slot
    if (!targetSlot || !targetSlot.canAllocate()) {
      targetSlot = this.findBestSlotForEmergency(doctor);
    }

    if (targetSlot && targetSlot.canAllocate()) {
      targetSlot.addToken(token);
      this.tokens.set(token.tokenId, token);
      this.updateEstimatedTimes(doctor, targetSlot);

      return {
        success: true,
        token: token.toJSON(),
        message: 'Emergency token inserted'
      };
    } else {
      // Force insertion by moving lower priority patient
      const result = this.forceInsertEmergency(doctor, token, targetSlot);
      return result;
    }
  }

  /**
   * Find best available slot for emergency
   */
  findBestSlotForEmergency(doctor) {
    // Prefer earliest available slot
    return doctor.slots.find(s => s.canAllocate());
  }

  /**
   * Force insert emergency by moving lower priority patient
   */
  forceInsertEmergency(doctor, emergencyToken, targetSlot) {
    if (!targetSlot) {
      targetSlot = doctor.slots[0];
    }

    // Find lowest priority token in the slot
    const sortedTokens = targetSlot.getTokensSortedByPriority();
    const lowestPriorityToken = sortedTokens[sortedTokens.length - 1];

    if (emergencyToken.priority > lowestPriorityToken.priority) {
      // Move lower priority to next available slot
      const nextSlot = this.findAlternativeSlot(doctor, targetSlot.slotTime);
      
      targetSlot.removeToken(lowestPriorityToken.tokenId);
      
      if (nextSlot) {
        lowestPriorityToken.slotTime = nextSlot.slotTime;
        nextSlot.addToken(lowestPriorityToken);
      } else {
        lowestPriorityToken.status = 'waiting';
        this.waitingList.push(lowestPriorityToken);
      }

      // Insert emergency token
      targetSlot.addToken(emergencyToken);
      this.tokens.set(emergencyToken.tokenId, emergencyToken);
      this.updateEstimatedTimes(doctor, targetSlot);

      return {
        success: true,
        token: emergencyToken.toJSON(),
        message: 'Emergency token inserted by moving lower priority patient',
        movedPatient: lowestPriorityToken.patientId
      };
    }

    return {
      success: false,
      error: 'Cannot insert emergency token'
    };
  }

  /**
   * Handle delay in a slot
   */
  addDelay(doctorId, slotTime, delayMinutes) {
    const doctor = this.getDoctor(doctorId);
    const slot = doctor.getSlot(slotTime);
    
    if (!slot) {
      return { success: false, error: 'Slot not found' };
    }

    slot.addDelay(delayMinutes);
    
    // Propagate delay to subsequent slots
    const slotIndex = doctor.slots.findIndex(s => s.slotTime === slotTime);
    for (let i = slotIndex + 1; i < doctor.slots.length; i++) {
      doctor.slots[i].addDelay(delayMinutes);
    }

    // Update all estimated times
    doctor.slots.forEach(s => this.updateEstimatedTimes(doctor, s));

    return {
      success: true,
      message: `Delay of ${delayMinutes} minutes added`,
      affectedSlots: doctor.slots.length - slotIndex
    };
  }

  /**
   * Reallocate tokens from waiting list
   */
  reallocateFromWaitingList(doctor, slot) {
    if (this.waitingList.length === 0 || !slot.canAllocate()) {
      return null;
    }

    // Find highest priority waiting token for this doctor
    const compatibleTokens = this.waitingList
      .filter(t => t.doctorId === doctor.doctorId)
      .sort((a, b) => b.priority - a.priority);

    if (compatibleTokens.length === 0) {
      return null;
    }

    const token = compatibleTokens[0];
    const index = this.waitingList.indexOf(token);
    this.waitingList.splice(index, 1);

    token.status = 'allocated';
    token.slotTime = slot.slotTime;
    slot.addToken(token);
    this.updateEstimatedTimes(doctor, slot);

    return token.toJSON();
  }

  /**
   * Update estimated times for all tokens in a slot
   */
  updateEstimatedTimes(doctor, slot) {
    const slotIndex = doctor.slots.findIndex(s => s.slotId === slot.slotId);
    const baseTime = this.parseTime(slot.slotTime);
    
    slot.tokens.forEach((token, index) => {
      const estimatedMinutes = baseTime + (index * doctor.avgConsultationTime) + slot.delayMinutes;
      token.updateEstimatedTime(this.formatTime(estimatedMinutes));
    });
  }

  parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Get status summary
   */
  getStatus() {
    const doctorStats = Array.from(this.doctors.values()).map(d => ({
      doctorId: d.doctorId,
      name: d.name,
      allocated: d.getAllocatedTokens(),
      capacity: d.getTotalCapacity(),
      utilization: d.getUtilization()
    }));

    return {
      totalDoctors: this.doctors.size,
      totalTokens: this.tokens.size,
      waitingList: this.waitingList.length,
      doctors: doctorStats
    };
  }
}

module.exports = TokenAllocator;
