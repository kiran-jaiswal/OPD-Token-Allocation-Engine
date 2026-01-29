const TokenAllocator = require('../core/allocator');
const Doctor = require('../models/Doctor');

class OPDSimulation {
  constructor() {
    this.allocator = new TokenAllocator();
    this.events = [];
    this.statistics = {
      totalRequests: 0,
      successfulAllocations: 0,
      waitingList: 0,
      cancellations: 0,
      emergencies: 0,
      delays: 0
    };
  }

  setupDoctors() {
    console.log('\n=== Setting up Doctors ===');
    const doctors = [
      new Doctor({ 
        doctorId: 'DOC001', 
        name: 'Dr. Sharma (Cardiology)', 
        startTime: '09:00', 
        endTime: '13:00',
        avgConsultationTime: 12
      }),
      new Doctor({ 
        doctorId: 'DOC002', 
        name: 'Dr. Patel (General Medicine)', 
        startTime: '10:00', 
        endTime: '14:00',
        avgConsultationTime: 10
      }),
      new Doctor({ 
        doctorId: 'DOC003', 
        name: 'Dr. Kumar (Orthopedics)', 
        startTime: '09:00', 
        endTime: '12:00',
        avgConsultationTime: 15
      })
    ];

    doctors.forEach(doc => {
      this.allocator.addDoctor(doc);
      console.log(`✓ Added ${doc.name} - Slots: ${doc.slots.length}, Capacity: ${doc.getTotalCapacity()}`);
    });

    return doctors;
  }

  generatePatientData() {
    const firstNames = ['Amit', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Anita', 'Rajesh', 'Kavya', 'Suresh', 'Deepa'];
    const lastNames = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Gupta', 'Mehta', 'Joshi', 'Verma', 'Rao'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return {
      name: `${firstName} ${lastName}`,
      id: `PAT${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    };
  }

  getRandomSlot(doctor) {
    const slots = doctor.slots;
    return slots[Math.floor(Math.random() * slots.length)].slotTime;
  }

  simulateOnlineBookings(doctors, count = 20) {
    console.log('\n=== Simulating Online Bookings ===');
    const results = [];

    for (let i = 0; i < count; i++) {
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const patient = this.generatePatientData();
      const slotTime = this.getRandomSlot(doctor);

      const result = this.allocator.allocateToken({
        patientId: patient.id,
        patientName: patient.name,
        doctorId: doctor.doctorId,
        slotTime: slotTime,
        source: 'online',
        priority: 0
      });

      this.statistics.totalRequests++;
      if (result.success) {
        this.statistics.successfulAllocations++;
        console.log(`✓ ${patient.name} - ${doctor.name.split('(')[0]} - ${slotTime} - Token #${result.token.tokenNumber}`);
      } else {
        this.statistics.waitingList++;
        console.log(`⏳ ${patient.name} - ${doctor.name.split('(')[0]} - Waiting List`);
      }

      results.push(result);
    }

    return results;
  }

  simulateWalkIns(doctors, count = 15) {
    console.log('\n=== Simulating Walk-in Patients ===');
    const results = [];

    for (let i = 0; i < count; i++) {
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const patient = this.generatePatientData();
      const slotTime = this.getRandomSlot(doctor);

      const result = this.allocator.allocateToken({
        patientId: patient.id,
        patientName: patient.name,
        doctorId: doctor.doctorId,
        slotTime: slotTime,
        source: 'walkin',
        priority: 0
      });

      this.statistics.totalRequests++;
      if (result.success) {
        this.statistics.successfulAllocations++;
        console.log(`✓ ${patient.name} - ${doctor.name.split('(')[0]} - ${slotTime} - Token #${result.token.tokenNumber}`);
      } else {
        this.statistics.waitingList++;
        console.log(`⏳ ${patient.name} - ${doctor.name.split('(')[0]} - Waiting List`);
      }

      results.push(result);
    }

    return results;
  }

  simulateFollowUps(doctors, count = 10) {
    console.log('\n=== Simulating Follow-up Patients ===');
    const results = [];

    for (let i = 0; i < count; i++) {
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const patient = this.generatePatientData();
      const slotTime = this.getRandomSlot(doctor);

      const result = this.allocator.allocateToken({
        patientId: patient.id,
        patientName: patient.name,
        doctorId: doctor.doctorId,
        slotTime: slotTime,
        source: 'followup',
        priority: Math.floor(Math.random() * 10) // Days since last visit
      });

      this.statistics.totalRequests++;
      if (result.success) {
        this.statistics.successfulAllocations++;
        console.log(`✓ ${patient.name} - ${doctor.name.split('(')[0]} - ${slotTime} - Follow-up - Token #${result.token.tokenNumber}`);
      } else {
        this.statistics.waitingList++;
        console.log(`⏳ ${patient.name} - ${doctor.name.split('(')[0]} - Waiting List`);
      }

      results.push(result);
    }

    return results;
  }

  simulateCancellations(tokens, count = 7) {
    console.log('\n=== Simulating Cancellations ===');
    
    // Get allocated tokens
    const allocatedTokens = Array.from(this.allocator.tokens.values())
      .filter(t => t.status === 'allocated');

    if (allocatedTokens.length === 0) {
      console.log('No allocated tokens to cancel');
      return;
    }

    const cancellationCount = Math.min(count, allocatedTokens.length);
    
    for (let i = 0; i < cancellationCount; i++) {
      const token = allocatedTokens[Math.floor(Math.random() * allocatedTokens.length)];
      const reasons = ['Patient unavailable', 'Rescheduled', 'Emergency at home', 'Feeling better'];
      const reason = reasons[Math.floor(Math.random() * reasons.length)];

      const result = this.allocator.cancelToken(token.tokenId, reason);
      
      if (result.success) {
        this.statistics.cancellations++;
        console.log(`✗ Cancelled: ${token.patientName} - ${token.slotTime} - Reason: ${reason}`);
        
        if (result.reallocated) {
          console.log(`  ↪ Reallocated from waiting list: ${result.reallocated.patientName}`);
        }
      }
    }
  }

  simulateEmergencies(doctors, count = 4) {
    console.log('\n=== Simulating Emergency Insertions ===');

    for (let i = 0; i < count; i++) {
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const patient = this.generatePatientData();
      const preferredSlot = this.getRandomSlot(doctor);

      const result = this.allocator.insertEmergencyToken({
        patientId: patient.id,
        patientName: patient.name,
        doctorId: doctor.doctorId,
        preferredSlot: preferredSlot
      });

      this.statistics.emergencies++;
      
      if (result.success) {
        console.log(`🚨 EMERGENCY: ${patient.name} - ${doctor.name.split('(')[0]} - ${result.token.slotTime}`);
        if (result.movedPatient) {
          console.log(`  ↪ Moved lower priority patient: ${result.movedPatient}`);
        }
      }
    }
  }

  simulateDelays(doctors, count = 3) {
    console.log('\n=== Simulating Delays ===');

    for (let i = 0; i < count; i++) {
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const slotTime = this.getRandomSlot(doctor);
      const delayMinutes = [10, 15, 20, 30][Math.floor(Math.random() * 4)];

      const result = this.allocator.addDelay(doctor.doctorId, slotTime, delayMinutes);
      
      if (result.success) {
        this.statistics.delays++;
        console.log(`⏰ Delay: ${doctor.name.split('(')[0]} - ${slotTime} - ${delayMinutes} mins - Affects ${result.affectedSlots} slots`);
      }
    }
  }

  printSchedule(doctors) {
    console.log('\n=== Final OPD Schedule ===');
    
    doctors.forEach(doctor => {
      console.log(`\n${doctor.name}`);
      console.log(`${'='.repeat(doctor.name.length)}`);
      console.log(`Utilization: ${doctor.getUtilization().toFixed(1)}% (${doctor.getAllocatedTokens()}/${doctor.getTotalCapacity()})`);
      
      doctor.slots.forEach(slot => {
        const statusIcon = slot.status === 'full' ? '🔴' : slot.status === 'delayed' ? '⏰' : '🟢';
        console.log(`\n  ${statusIcon} ${slot.slotTime} [${slot.allocated}/${slot.capacity}]${slot.delayMinutes > 0 ? ` +${slot.delayMinutes}min delay` : ''}`);
        
        if (slot.tokens.length > 0) {
          slot.tokens.forEach(token => {
            const sourceIcon = {
              priority: '🚨',
              followup: '🔄',
              online: '💻',
              walkin: '🚶'
            }[token.source] || '•';
            
            console.log(`    ${sourceIcon} #${token.tokenNumber} ${token.patientName} (${token.source}) - Est: ${token.estimatedTime || 'N/A'}`);
          });
        }
      });
    });
  }

  printStatistics() {
    console.log('\n\n=== Simulation Statistics ===');
    console.log(`Total Token Requests: ${this.statistics.totalRequests}`);
    console.log(`Successful Allocations: ${this.statistics.successfulAllocations} (${(this.statistics.successfulAllocations / this.statistics.totalRequests * 100).toFixed(1)}%)`);
    console.log(`Waiting List: ${this.statistics.waitingList}`);
    console.log(`Cancellations: ${this.statistics.cancellations}`);
    console.log(`Emergency Insertions: ${this.statistics.emergencies}`);
    console.log(`Delays: ${this.statistics.delays}`);
    
    const status = this.allocator.getStatus();
    console.log(`\nCurrent System State:`);
    console.log(`Total Active Tokens: ${status.totalTokens}`);
    console.log(`Active Waiting List: ${status.waitingList}`);
    
    console.log('\nDoctor Utilization:');
    status.doctors.forEach(doc => {
      const bar = '█'.repeat(Math.floor(doc.utilization / 5)) + '░'.repeat(20 - Math.floor(doc.utilization / 5));
      console.log(`  ${doc.name.padEnd(30)} [${bar}] ${doc.utilization.toFixed(1)}%`);
    });
  }

  async run() {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║       OPD TOKEN ALLOCATION ENGINE - SIMULATION            ║');
    console.log('║              Full Day Simulation with 3 Doctors           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');

    // Setup
    const doctors = this.setupDoctors();

    // Phase 1: Morning online bookings
    await this.delay(500);
    this.simulateOnlineBookings(doctors, 20);

    // Phase 2: Walk-in patients
    await this.delay(500);
    this.simulateWalkIns(doctors, 15);

    // Phase 3: Follow-up patients
    await this.delay(500);
    this.simulateFollowUps(doctors, 10);

    // Phase 4: Some cancellations
    await this.delay(500);
    this.simulateCancellations(doctors, 7);

    // Phase 5: Emergency insertions
    await this.delay(500);
    this.simulateEmergencies(doctors, 4);

    // Phase 6: Delays
    await this.delay(500);
    this.simulateDelays(doctors, 3);

    // Final results
    await this.delay(500);
    this.printSchedule(doctors);
    this.printStatistics();

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║              SIMULATION COMPLETED SUCCESSFULLY            ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run simulation
if (require.main === module) {
  const simulation = new OPDSimulation();
  simulation.run().catch(console.error);
}

module.exports = OPDSimulation;
