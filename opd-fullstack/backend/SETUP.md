# Setup Instructions

## Quick Setup (3 steps)

### Step 1: Install Dependencies
```bash
npm install
```

This will install:
- express: Web framework for API
- body-parser: Parse JSON request bodies
- uuid: Generate unique token IDs

### Step 2: Choose what to run

#### Option A: Run the Full Simulation
```bash
npm run simulate
```

This demonstrates:
- Complete OPD day with 3 doctors
- 45+ patient appointments
- Real-world scenarios (cancellations, emergencies, delays)
- Final statistics and schedule

#### Option B: Run the API Server
```bash
npm start
```

Then test with:
```bash
# In another terminal, test the API
curl http://localhost:3000/api/doctors
curl http://localhost:3000/api/status
```

### Step 3: Explore the Code

Key files to review:
1. `src/core/allocator.js` - Core allocation algorithm
2. `src/models/Token.js` - Token with priority logic
3. `src/simulation/simulation.js` - Full day simulation
4. `docs/ALGORITHM_DESIGN.md` - Detailed algorithm explanation

## What You'll See

### Simulation Output Example:
```
=== Setting up Doctors ===
✓ Added Dr. Sharma (Cardiology) - Slots: 4, Capacity: 24
✓ Added Dr. Patel (General Medicine) - Slots: 4, Capacity: 24
✓ Added Dr. Kumar (Orthopedics) - Slots: 3, Capacity: 18

=== Simulating Online Bookings ===
✓ Amit Sharma - Dr. Sharma - 10:00 - Token #1
✓ Priya Patel - Dr. Patel - 11:00 - Token #1
...

=== Final OPD Schedule ===
Dr. Sharma (Cardiology)
  🟢 09:00 [5/6]
    💻 #1 Amit Kumar (online) - Est: 09:00
    🔄 #2 Priya Singh (followup) - Est: 09:12
    ...

=== Simulation Statistics ===
Total Token Requests: 45
Successful Allocations: 40 (88.9%)
Waiting List: 5
Doctor Utilization:
  Dr. Sharma [████████████████░░░░] 83.3%
```

## Testing Individual Features

### Test Token Allocation
```bash
curl -X POST http://localhost:3000/api/tokens/request \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PAT001",
    "patientName": "John Doe",
    "doctorId": "DOC001",
    "slotTime": "10:00",
    "source": "online"
  }'
```

### Test Emergency Insertion
```bash
curl -X POST http://localhost:3000/api/tokens/emergency \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PAT999",
    "patientName": "Emergency Patient",
    "doctorId": "DOC001"
  }'
```

### View Schedule
```bash
curl http://localhost:3000/api/doctors/DOC001/schedule
```

## Project Deliverables Checklist

✅ **API Design**
- RESTful endpoints for token management
- Complete request/response schemas
- Error handling

✅ **Algorithm Implementation**
- Priority-based allocation
- Dynamic reallocation on cancellation
- Emergency insertion with priority override
- Delay propagation

✅ **Documentation**
- Algorithm design with flow diagrams
- Priority logic explanation
- Edge case handling
- Failure modes and recovery

✅ **Simulation**
- Full OPD day with 3 doctors
- 45+ token requests
- Multiple token sources
- Real-world events (cancellations, emergencies, delays)
- Statistics and utilization reports

## Architecture Overview

```
┌─────────────────────────────────────────┐
│           API Layer (Express)            │
│  POST /tokens/request, /tokens/cancel   │
│  POST /tokens/emergency, /slots/delay   │
│  GET /doctors, /slots, /status          │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│      Token Allocation Engine             │
│  - Priority calculation                  │
│  - Slot availability checking            │
│  - Alternative slot finding              │
│  - Waiting list management               │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│         Data Models                      │
│  Token (with priority scoring)           │
│  Slot (with capacity management)         │
│  Doctor (with schedule generation)       │
└──────────────────────────────────────────┘
```

## Features Demonstrated

### 1. Per-slot Hard Limits ✅
- Maximum 6 patients per slot
- Hard enforcement prevents overbooking

### 2. Dynamic Reallocation ✅
- Cancellation triggers waiting list check
- Highest priority waiting patient promoted
- Automatic notification (logged)

### 3. Priority Between Sources ✅
```
Emergency (1000+) > Follow-up (500+) > Online (100) > Walk-in (0)
```

### 4. Edge Case Handling ✅
- Slot full → Alternative slot or waiting list
- Cancellation → Automatic reallocation
- Emergency → Force insertion if needed
- No-show → Slot freed for next patient
- Delay → Propagates to all future slots

## Need Help?

1. **API not responding?**
   - Check if server is running: `npm start`
   - Verify port 3000 is free
   - Check logs for errors

2. **Want to modify parameters?**
   - Slot capacity: `src/models/Slot.js`
   - Doctor schedules: `src/models/Doctor.js`
   - Priority weights: `src/models/Token.js`

3. **Understanding the algorithm?**
   - Read: `docs/ALGORITHM_DESIGN.md`
   - See flow diagrams and examples
   - Review edge case handling

4. **API reference needed?**
   - See: `docs/API_DOCUMENTATION.md`
   - Complete endpoint documentation
   - Request/response examples

## Next Steps

After reviewing this implementation:
1. Run the simulation to see it in action
2. Review the algorithm documentation
3. Test the API endpoints
4. Explore the code structure
5. Consider production enhancements

Enjoy exploring the OPD Token Allocation Engine! 🏥
