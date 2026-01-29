const Slot = require('./Slot');

class Doctor {
  constructor({
    doctorId,
    name,
    startTime = '09:00',
    endTime = '13:00',
    slotDuration = 60,
    avgConsultationTime = 10
  }) {
    this.doctorId = doctorId;
    this.name = name;
    this.startTime = startTime;
    this.endTime = endTime;
    this.slotDuration = slotDuration;
    this.avgConsultationTime = avgConsultationTime;
    this.slots = this.generateSlots();
  }

  generateSlots() {
    const slots = [];
    const start = this.parseTime(this.startTime);
    const end = this.parseTime(this.endTime);
    
    let current = start;
    while (current < end) {
      const slotTime = this.formatTime(current);
      slots.push(new Slot({
        doctorId: this.doctorId,
        slotTime: slotTime,
        capacity: 6
      }));
      current += this.slotDuration;
    }
    
    return slots;
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

  getSlot(slotTime) {
    return this.slots.find(s => s.slotTime === slotTime);
  }

  getAvailableSlots() {
    return this.slots.filter(s => !s.isFull());
  }

  getSlotByIndex(index) {
    return this.slots[index];
  }

  getAllocatedTokens() {
    return this.slots.reduce((total, slot) => total + slot.allocated, 0);
  }

  getTotalCapacity() {
    return this.slots.reduce((total, slot) => total + slot.capacity, 0);
  }

  getUtilization() {
    const total = this.getTotalCapacity();
    const allocated = this.getAllocatedTokens();
    return total > 0 ? (allocated / total) * 100 : 0;
  }

  toJSON() {
    return {
      doctorId: this.doctorId,
      name: this.name,
      startTime: this.startTime,
      endTime: this.endTime,
      avgConsultationTime: this.avgConsultationTime,
      totalCapacity: this.getTotalCapacity(),
      allocated: this.getAllocatedTokens(),
      utilization: this.getUtilization(),
      slots: this.slots.map(s => s.toJSON())
    };
  }
}

module.exports = Doctor;
