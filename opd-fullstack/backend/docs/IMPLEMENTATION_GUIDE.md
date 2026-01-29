# Implementation Guide

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Extract the project
unzip opd-token-allocation.zip
cd opd-token-allocation

# Install dependencies
npm install
```

### Running the Project

#### Option 1: Run the API Server
```bash
npm start
```

The API server will start on http://localhost:3000

#### Option 2: Run the Simulation
```bash
npm run simulate
```

This runs a complete OPD day simulation with 3 doctors and demonstrates:
- 20 online bookings
- 15 walk-in patients
- 10 follow-up patients
- 7 cancellations
- 4 emergency insertions
- 3 delays

## Project Structure

```
opd-token-allocation/
├── src/
│   ├── models/              # Data models
│   │   ├── Token.js         # Token model with priority calculation
│   │   ├── Slot.js          # Slot model with capacity management
│   │   └── Doctor.js        # Doctor model with schedule
│   ├── core/
│   │   └── allocator.js     # Core allocation algorithm
│   ├── api/
│   │   └── server.js        # Express API server
│   └── simulation/
│       └── simulation.js    # Full day simulation
├── docs/
│   ├── ALGORITHM_DESIGN.md  # Detailed algorithm documentation
│   └── API_DOCUMENTATION.md # API reference
├── package.json
└── README.md
```

## Core Components

### 1. Token Model (`src/models/Token.js`)

Represents a patient appointment token with:
- Unique token ID
- Patient information
- Doctor and slot assignment
- Priority scoring
- Status tracking

**Key Methods:**
- `calculatePriority()` - Computes priority score based on source
- `cancel()` - Marks token as cancelled
- `complete()` - Marks consultation complete
- `markNoShow()` - Handles patient no-shows

### 2. Slot Model (`src/models/Slot.js`)

Manages a time slot with capacity limits:
- Fixed capacity (default: 6 patients)
- Token list management
- Status tracking
- Delay handling

**Key Methods:**
- `addToken()` - Add token to slot
- `removeToken()` - Remove and renumber tokens
- `isFull()` - Check capacity
- `addDelay()` - Handle delays

### 3. Doctor Model (`src/models/Doctor.js`)

Represents a doctor with their schedule:
- Personal information
- Working hours
- Slot generation
- Utilization tracking

**Key Methods:**
- `generateSlots()` - Create slots based on schedule
- `getSlot()` - Get specific slot
- `getAvailableSlots()` - Find available slots
- `getUtilization()` - Calculate capacity usage

### 4. Token Allocator (`src/core/allocator.js`)

Core algorithm implementation:

**Main Operations:**

1. **allocateToken()** - Primary allocation logic
   ```javascript
   allocateToken({
     patientId,
     patientName,
     doctorId,
     slotTime,
     source,
     priority
   })
   ```
   - Validates request
   - Checks slot availability
   - Finds alternatives if needed
   - Adds to waiting list if full

2. **cancelToken()** - Cancellation with reallocation
   ```javascript
   cancelToken(tokenId, reason)
   ```
   - Removes token from slot
   - Triggers waiting list reallocation
   - Updates estimated times

3. **insertEmergencyToken()** - Priority insertion
   ```javascript
   insertEmergencyToken({
     patientId,
     patientName,
     doctorId,
     preferredSlot
   })
   ```
   - Forces insertion if needed
   - May move lower priority patients
   - Handles slot overflow

4. **addDelay()** - Delay propagation
   ```javascript
   addDelay(doctorId, slotTime, delayMinutes)
   ```
   - Adds delay to slot
   - Propagates to subsequent slots
   - Recalculates all estimated times

## Algorithm Flow

### Token Allocation Flow

```
┌─────────────────────┐
│  Token Request      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Validate Request   │
│  - Doctor exists?   │
│  - Slot valid?      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Calculate Priority │
│  Based on Source    │
└──────────┬──────────┘
           │
           ▼
     ┌────┴────┐
     │ Slot    │
     │ Check   │
     └────┬────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
Available    Full
    │           │
    │           ▼
    │     ┌──────────┐
    │     │Find Alt  │
    │     │Slot      │
    │     └────┬─────┘
    │          │
    │     ┌────┴─────┐
    │     │          │
    │     ▼          ▼
    │  Found    Not Found
    │     │          │
    │     │          ▼
    │     │    ┌──────────┐
    │     │    │ Waiting  │
    │     │    │ List     │
    │     │    └──────────┘
    │     │
    └─────┴───────┐
                  │
                  ▼
          ┌──────────────┐
          │  Add Token   │
          │  to Slot     │
          └──────┬───────┘
                 │
                 ▼
          ┌──────────────┐
          │Update Times  │
          └──────┬───────┘
                 │
                 ▼
          ┌──────────────┐
          │   Return     │
          │   Result     │
          └──────────────┘
```

### Cancellation & Reallocation Flow

```
┌─────────────────────┐
│  Cancel Request     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Find & Remove      │
│  Token from Slot    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Mark Cancelled     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Check Waiting List │
└──────────┬──────────┘
           │
      ┌────┴────┐
      │ Empty?  │
      └────┬────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
   Yes          No
     │           │
     │           ▼
     │    ┌──────────────┐
     │    │Sort by       │
     │    │Priority      │
     │    └──────┬───────┘
     │           │
     │           ▼
     │    ┌──────────────┐
     │    │Find Matching │
     │    │Doctor        │
     │    └──────┬───────┘
     │           │
     │      ┌────┴────┐
     │      │ Found?  │
     │      └────┬────┘
     │           │
     │      ┌────┴────┐
     │      │         │
     │      ▼         ▼
     │    Yes        No
     │      │         │
     │      ▼         │
     │  ┌────────┐   │
     │  │Allocate│   │
     │  │to Slot │   │
     │  └────┬───┘   │
     │       │       │
     └───────┴───────┘
                │
                ▼
         ┌──────────────┐
         │  Return      │
         │  Result      │
         └──────────────┘
```

## Testing the Implementation

### Unit Testing Individual Components

```javascript
// Test Token creation
const Token = require('./src/models/Token');

const token = new Token({
  patientId: 'PAT001',
  patientName: 'Test Patient',
  doctorId: 'DOC001',
  slotTime: '10:00',
  source: 'online',
  priority: 0
});

console.log(token.priority); // Should be 100 (base online priority)
```

### Integration Testing

```javascript
// Test full allocation flow
const TokenAllocator = require('./src/core/allocator');
const Doctor = require('./src/models/Doctor');

const allocator = new TokenAllocator();
const doctor = new Doctor({
  doctorId: 'DOC001',
  name: 'Test Doctor',
  startTime: '09:00',
  endTime: '12:00'
});

allocator.addDoctor(doctor);

const result = allocator.allocateToken({
  patientId: 'PAT001',
  patientName: 'Test Patient',
  doctorId: 'DOC001',
  slotTime: '10:00',
  source: 'online',
  priority: 0
});

console.log(result.success); // Should be true
console.log(result.token.tokenNumber); // Should be 1
```

### Load Testing

```bash
# Run simulation with metrics
npm run simulate

# Output shows:
# - Total requests processed
# - Success rate
# - Average allocation time
# - Doctor utilization
```

## Configuration Options

### Slot Configuration

Modify in `src/models/Slot.js`:
```javascript
capacity: 6  // Default patients per slot
```

### Doctor Configuration

Modify in `src/models/Doctor.js`:
```javascript
slotDuration: 60           // Minutes per slot
avgConsultationTime: 10    // Average consultation time
```

### Priority Configuration

Modify in `src/models/Token.js`:
```javascript
basePriorities = {
  priority: 1000,  // Emergency/Paid
  followup: 500,   // Follow-ups
  online: 100,     // Online bookings
  walkin: 0        // Walk-ins
}
```

## Extending the System

### Adding New Token Sources

1. Update Token model with new source type
2. Add priority calculation logic
3. Update API validation

Example:
```javascript
// In Token.js
const basePriorities = {
  priority: 1000,
  followup: 500,
  telemedicine: 200,  // NEW
  online: 100,
  walkin: 0
};
```

### Adding Notification System

```javascript
// Create src/services/notificationService.js
class NotificationService {
  notifyAllocation(token) {
    // Send SMS/Email
    console.log(`Notifying ${token.patientName}`);
  }
  
  notifyDelay(token, delayMinutes) {
    // Send delay notification
  }
  
  notifyPromotion(token) {
    // Notify promotion from waiting list
  }
}
```

### Adding Persistence Layer

```javascript
// Create src/services/persistenceService.js
const { Pool } = require('pg');

class PersistenceService {
  async saveToken(token) {
    // Save to PostgreSQL
    await this.pool.query(
      'INSERT INTO tokens VALUES ($1, $2, $3)',
      [token.tokenId, token.patientId, token.status]
    );
  }
  
  async loadSchedule(doctorId) {
    // Load from database
  }
}
```

## Production Deployment Checklist

### Pre-deployment

- [ ] Set up PostgreSQL database
- [ ] Configure Redis for caching
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure logging (Winston/Morgan)
- [ ] Set up error tracking (Sentry)
- [ ] Implement authentication (JWT)
- [ ] Add rate limiting
- [ ] Set up API documentation (Swagger)
- [ ] Configure CORS
- [ ] Set up CI/CD pipeline

### Environment Configuration

```bash
# .env file
DATABASE_URL=postgresql://user:pass@host:5432/opd
REDIS_URL=redis://host:6379
JWT_SECRET=your-secret-key
API_PORT=3000
NODE_ENV=production
```

### Scaling Considerations

1. **Horizontal Scaling**
   - Use load balancer (NGINX/AWS ALB)
   - Deploy multiple API instances
   - Share state via Redis

2. **Database Optimization**
   - Index token queries
   - Partition by date
   - Use read replicas

3. **Caching Strategy**
   - Cache doctor schedules
   - Cache slot availability
   - Invalidate on updates

4. **Monitoring Metrics**
   - Request latency
   - Allocation success rate
   - Doctor utilization
   - Waiting list size
   - Error rates

## Troubleshooting

### Common Issues

**Issue**: Port 3000 already in use
```bash
# Solution: Kill the process or use different port
PORT=3001 npm start
```

**Issue**: Dependencies not installing
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue**: Simulation not showing output
```bash
# Solution: Check Node version
node --version  # Should be v14+
```

## Performance Benchmarks

Expected performance (single instance):
- Token allocation: < 10ms
- Cancellation: < 5ms
- Slot query: < 2ms
- Throughput: 100+ req/sec

## Support & Feedback

For issues or enhancements:
1. Check the documentation
2. Review the algorithm design
3. Run the simulation for examples
4. Refer to API documentation

## License

MIT
