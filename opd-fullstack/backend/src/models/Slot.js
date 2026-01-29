const { v4: uuidv4 } = require('uuid');

class Slot {
  constructor({
    doctorId,
    slotTime,
    capacity = 6
  }) {
    this.slotId = uuidv4();
    this.doctorId = doctorId;
    this.slotTime = slotTime;
    this.capacity = capacity;
    this.tokens = [];
    this.status = 'available'; // 'available', 'full', 'delayed', 'blocked'
    this.delayMinutes = 0;
  }

  get allocated() {
    return this.tokens.filter(t => t.status === 'allocated').length;
  }

  get available() {
    return this.capacity - this.allocated;
  }

  isFull() {
    return this.allocated >= this.capacity;
  }

  canAllocate(count = 1) {
    return this.available >= count;
  }

  addToken(token) {
    if (this.isFull()) {
      throw new Error('Slot is at full capacity');
    }
    token.tokenNumber = this.tokens.length + 1;
    this.tokens.push(token);
    this.updateStatus();
    return token;
  }

  removeToken(tokenId) {
    const index = this.tokens.findIndex(t => t.tokenId === tokenId);
    if (index !== -1) {
      const token = this.tokens.splice(index, 1)[0];
      this.renumberTokens();
      this.updateStatus();
      return token;
    }
    return null;
  }

  renumberTokens() {
    this.tokens.forEach((token, index) => {
      token.tokenNumber = index + 1;
    });
  }

  updateStatus() {
    if (this.isFull()) {
      this.status = 'full';
    } else if (this.delayMinutes > 0) {
      this.status = 'delayed';
    } else {
      this.status = 'available';
    }
  }

  addDelay(minutes) {
    this.delayMinutes += minutes;
    this.status = 'delayed';
  }

  clearDelay() {
    this.delayMinutes = 0;
    this.updateStatus();
  }

  getTokensSortedByPriority() {
    return [...this.tokens].sort((a, b) => b.priority - a.priority);
  }

  toJSON() {
    return {
      slotId: this.slotId,
      doctorId: this.doctorId,
      slotTime: this.slotTime,
      capacity: this.capacity,
      allocated: this.allocated,
      available: this.available,
      status: this.status,
      delayMinutes: this.delayMinutes,
      tokens: this.tokens.map(t => t.toJSON())
    };
  }
}

module.exports = Slot;
