# Algorithm Design & Implementation Documentation

## Overview
This document explains the core algorithm design, prioritization logic, edge case handling, and failure modes for the OPD Token Allocation Engine.

## Core Algorithm: Priority-Based Dynamic Allocation

### Algorithm Flow

```
1. Token Request Received
   ↓
2. Validate Request (Patient, Doctor, Slot)
   ↓
3. Check Slot Availability
   ↓
4. If Available → Allocate Immediately
   ↓
5. If Full → Find Alternative Slot
   ↓
6. If No Alternative → Add to Waiting List
   ↓
7. Update Estimated Times
   ↓
8. Return Result with Token Info
```

### Step-by-Step Breakdown

#### 1. Token Request Validation
```javascript
Input: { patientId, patientName, doctorId, slotTime, source, priority }

Validations:
- Doctor exists in system
- Slot time is valid for doctor's schedule
- Source is one of: online, walkin, priority, followup
- Patient information is complete
```

#### 2. Priority Calculation
Each token gets a priority score based on:

```javascript
Priority Score = Base Priority + Manual Priority

Base Priorities:
- Emergency/Paid Priority: 1000
- Follow-up Patients: 500
- Online Booking: 100
- Walk-in: 0

Manual Priority: 0-5 (user-specified)
```

**Example Calculations:**
- Emergency patient with priority 5: 1000 + 5 = 1005
- Follow-up after 7 days: 500 + 7 = 507
- Online booking: 100 + 0 = 100
- Walk-in patient: 0 + 0 = 0

#### 3. Slot Capacity Management

**Hard Limits:**
- Each slot has a fixed capacity (default: 6 patients)
- Hard limit is NEVER exceeded (except for forced emergency insertion)
- Prevents overcrowding and unsafe patient loads

**Allocation Logic:**
```javascript
if (slot.allocated < slot.capacity) {
  // Allocate to this slot
  slot.addToken(token);
} else {
  // Try alternative slot
  findAlternativeSlot();
}
```

#### 4. Alternative Slot Finding

When the requested slot is full, the system searches for alternatives:

```javascript
Search Order:
1. Next immediate slot (same doctor)
2. Subsequent slots in chronological order
3. Previous slots (if patient prefers earlier)
4. No alternative found → Waiting list
```

**Example:**
- Patient requests 10:00 slot (full)
- System checks: 11:00 → available ✓
- Allocates to 11:00 and informs patient

## Dynamic Reallocation

### When Reallocation Occurs

1. **Cancellation**: Freed capacity offered to waiting list
2. **No-show**: After grace period, slot becomes available
3. **Emergency insertion**: Lower priority patients may be moved
4. **Delay resolution**: Delayed patients may be rescheduled

### Reallocation Algorithm

```javascript
function reallocateFromWaitingList(slot) {
  1. Check if slot has available capacity
  2. Get all waiting patients for this doctor
  3. Sort by priority (highest first)
  4. Allocate highest priority patient
  5. Notify patient of allocation
  6. Remove from waiting list
  7. Update estimated times
}
```

## Edge Case Handling

### 1. Cancellation Handling

**Scenario**: Patient cancels their appointment

**Algorithm:**
```javascript
1. Remove token from slot
2. Mark token as cancelled
3. Decrement slot allocation count
4. Check waiting list for this doctor
5. If waiting patients exist:
   a. Sort by priority
   b. Allocate highest priority patient
   c. Notify patient of earlier slot
6. Update all estimated times in slot
7. Return cancellation confirmation
```

**Example:**
```
Slot 10:00 (Dr. Sharma): [P1, P2, P3, P4, P5, P6] - FULL
Waiting List: [P7(online), P8(followup), P9(walkin)]

P3 cancels →
Slot 10:00: [P1, P2, P4, P5, P6] - 5/6
Evaluate waiting list → P8 has highest priority (followup: 507)
Slot 10:00: [P1, P2, P4, P5, P6, P8] - FULL
Waiting List: [P7(online), P9(walkin)]
```

### 2. No-Show Handling

**Scenario**: Patient doesn't arrive for appointment

**Algorithm:**
```javascript
1. Wait for grace period (15 minutes)
2. Mark token as no-show
3. Free up the slot position
4. Promote next patient in queue
5. Keep no-show record for statistics
6. If patient returns:
   a. Check if slot still available
   b. If not, add to end of queue
```

**Grace Period Logic:**
```
Token estimated time: 10:15
Grace period ends: 10:30
At 10:31 → Mark as no-show
Next patient promoted immediately
```

### 3. Emergency Insertion

**Scenario**: Emergency patient needs immediate attention

**Algorithm:**
```javascript
1. Try to find available slot near preferred time
2. If available:
   a. Allocate immediately
   b. Update estimated times
3. If all slots full:
   a. Identify target slot (preferred or earliest)
   b. Find lowest priority patient in slot
   c. Compare priorities:
      - If emergency priority > lowest priority:
        * Remove lower priority patient
        * Find alternative slot for them
        * If no alternative → waiting list
        * Insert emergency patient
      - If emergency priority ≤ lowest priority:
        * Add emergency to waiting list (rare case)
4. Notify affected patients
```

**Example:**
```
Emergency patient arrives at 11:30
Preferred slot: 12:00 (Dr. Kumar)

Slot 12:00: [P1(followup-505), P2(online-100), P3(walkin-0)] - 3/6
Available space exists → Direct allocation ✓

Emergency patient arrives at 11:30
Preferred slot: 10:00 (Dr. Sharma)

Slot 10:00: [P1(priority-1003), P2(followup-508), P3(online-100), 
             P4(online-100), P5(walkin-0), P6(walkin-0)] - FULL

Emergency priority: 1005
Lowest priority in slot: P6(walkin-0)
1005 > 0 → Force insertion

Result:
- Remove P6 from 10:00
- Check 11:00 → Available
- Move P6 to 11:00
- Insert emergency at 10:00
- Notify P6 of time change
```

### 4. Delay Propagation

**Scenario**: Doctor is running late

**Algorithm:**
```javascript
1. Add delay to affected slot
2. Propagate delay to all subsequent slots
3. Recalculate estimated times for all patients
4. Notify affected patients
5. Check if any patients want to reschedule
```

**Example:**
```
10:00 slot gets 20-minute delay at 10:15

Before:
10:00 slot: Est times [10:00, 10:10, 10:20, 10:30, 10:40, 10:50]
11:00 slot: Est times [11:00, 11:10, 11:20, 11:30]
12:00 slot: Est times [12:00, 12:10, 12:20]

After delay:
10:00 slot: Est times [10:20, 10:30, 10:40, 10:50, 11:00, 11:10]
11:00 slot: Est times [11:20, 11:30, 11:40, 11:50] (+20 min delay)
12:00 slot: Est times [12:20, 12:30, 12:40] (+20 min delay)

All patients from 10:00 onwards notified of delay
```

### 5. Slot Overflow Prevention

**Scenario**: Multiple simultaneous requests for same slot

**Algorithm:**
```javascript
// Using atomic operations to prevent race conditions
function allocateWithLock(slot, token) {
  1. Acquire slot lock
  2. Check current capacity
  3. If available:
     a. Add token
     b. Increment counter
  4. If full:
     a. Return full status
  5. Release lock
}
```

**Concurrency Handling:**
```
Time: 09:00:00.000
Slot 10:00: 5/6 allocated

Request A arrives (09:00:00.001) → Check: 5/6 → Allocate → 6/6 ✓
Request B arrives (09:00:00.002) → Check: 6/6 → Full → Alternative

Without lock:
Both might see 5/6 and both allocate → Overflow (BAD)

With lock:
Request A locks → allocates → unlocks
Request B waits → checks → sees 6/6 → alternative
```

## Prioritization Logic in Detail

### Priority Matrix

| Source | Base Priority | Additional Factors | Final Range |
|--------|--------------|-------------------|-------------|
| Emergency/Priority | 1000 | +0 to +5 (urgency) | 1000-1005 |
| Follow-up | 500 | +0 to +100 (days since visit) | 500-600 |
| Online | 100 | +0 (booking order) | 100-100 |
| Walk-in | 0 | +0 (arrival order) | 0-0 |

### Priority Comparison Examples

**Scenario 1: Emergency vs Everyone**
```
Emergency (1000) > Follow-up (507) > Online (100) > Walk-in (0)
Emergency always wins (unless another emergency has higher urgency)
```

**Scenario 2: Follow-up Patients**
```
Follow-up after 15 days (515) > Follow-up after 7 days (507)
Older follow-ups get preference
```

**Scenario 3: Same Source**
```
Online booking at 08:00 (100) vs Online booking at 09:00 (100)
First-come-first-served (timestamp used as tiebreaker)
```

### Waiting List Management

**Priority Queue Implementation:**
```javascript
Waiting list is sorted by priority:
[
  {patient: "P1", priority: 1005, source: "emergency"},
  {patient: "P2", priority: 512, source: "followup"},
  {patient: "P3", priority: 505, source: "followup"},
  {patient: "P4", priority: 100, source: "online"},
  {patient: "P5", priority: 100, source: "online"},
  {patient: "P6", priority: 0, source: "walkin"}
]

When slot becomes available:
1. Check highest priority (P1)
2. If P1's doctor matches → Allocate P1
3. If not, check P2, and so on
4. First matching patient gets allocated
```

## Failure Handling

### 1. Slot Full Failure

**Condition**: All slots for requested time are full

**Response:**
```json
{
  "success": false,
  "error": "All slots full",
  "message": "Added to waiting list",
  "waitingPosition": 5,
  "alternatives": [
    {"slotTime": "11:00", "available": 2},
    {"slotTime": "12:00", "available": 4}
  ]
}
```

**Recovery:** Patient added to waiting list, notified of alternative slots

### 2. Doctor Unavailable

**Condition**: Requested doctor not in system or not available

**Response:**
```json
{
  "success": false,
  "error": "Doctor not found",
  "suggestion": "Please check doctor ID",
  "availableDoctors": [
    {"doctorId": "DOC001", "name": "Dr. Sharma"},
    {"doctorId": "DOC002", "name": "Dr. Patel"}
  ]
}
```

**Recovery:** Suggest alternative doctors with availability

### 3. System Overload

**Condition**: Too many simultaneous requests

**Response:**
- Queue requests in memory
- Process in priority order
- Return estimated processing time

**Implementation:**
```javascript
Request queue: [R1, R2, R3, ... R100]
Process rate: 50 requests/second
Queue time for R100: 2 seconds

Return to user: "Request queued, estimated wait: 2s"
```

### 4. Data Inconsistency

**Condition**: Token exists but slot doesn't have it (corrupt state)

**Recovery Algorithm:**
```javascript
1. Detect inconsistency
2. Log error with details
3. Reconcile state:
   a. If token in memory but not in slot → Add to slot
   b. If token in slot but not in memory → Add to memory
   c. If conflict → Trust slot state (source of truth)
4. Notify admin of inconsistency
5. Continue operation
```

## Performance Considerations

### Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Allocate token | O(1) | Direct slot access |
| Find alternative | O(n) | n = number of slots (~4-8) |
| Cancel token | O(1) | Direct token access |
| Emergency insert | O(k) | k = tokens in slot (~6) |
| Waiting list pop | O(w log w) | w = waiting list size |

### Space Complexity

| Data Structure | Size | Notes |
|----------------|------|-------|
| Doctor map | O(d) | d = number of doctors (~3-10) |
| Token map | O(t) | t = total tokens (~100-500/day) |
| Waiting list | O(w) | w = waiting patients (~10-50) |
| Slots per doctor | O(s) | s = slots per day (~4-8) |

**Total Memory:** O(d × s × c + t) where c = capacity per slot

### Optimization Strategies

1. **In-memory storage**: Fast access, no disk I/O
2. **Direct hash map lookups**: O(1) token/doctor access
3. **Sorted waiting list**: O(log n) insertion, O(1) pop
4. **Batch notifications**: Reduce notification overhead
5. **Lazy delay propagation**: Update only when queried

## Trade-offs Analysis

### 1. Hard Limits vs Soft Limits

**Decision**: Enforce hard per-slot capacity

**Pros:**
- Prevents overcrowding
- Ensures manageable patient load
- Predictable wait times

**Cons:**
- May turn away patients
- Less flexible for emergencies
- Potential revenue loss

**Mitigation:** Waiting list + alternative slot suggestions

### 2. Synchronous vs Asynchronous

**Decision**: Synchronous allocation with async notifications

**Pros:**
- Simpler logic and debugging
- Immediate feedback to user
- Easier state consistency

**Cons:**
- Potential bottleneck at high load
- Blocking API calls

**Mitigation:** Request queuing + fast in-memory operations

### 3. In-Memory vs Persistent Storage

**Decision**: In-memory for assignment (would use DB in production)

**Pros:**
- Extremely fast (microsecond latency)
- No database overhead
- Simple implementation

**Cons:**
- No persistence across restarts
- No audit trail
- Limited scalability

**Production Solution:** 
- Redis for real-time state
- PostgreSQL for persistence
- Event log for audit trail

### 4. Priority Scoring System

**Decision**: Multi-factor numeric priority

**Pros:**
- Flexible and extensible
- Clear ordering
- Easy to adjust weights

**Cons:**
- More complex than simple tiers
- Requires tuning
- May need adjustment over time

**Alternative Considered:** Simple tiers (High/Medium/Low)
**Reason for Current Approach:** Finer control over allocation

## Testing Strategy

### Unit Tests
```javascript
- Token creation and priority calculation
- Slot capacity management
- Allocation algorithm
- Cancellation handling
- Emergency insertion
- Delay propagation
```

### Integration Tests
```javascript
- Full allocation flow
- Multiple concurrent requests
- Edge cases (full slots, no doctors, etc.)
- Waiting list management
```

### Simulation Tests
```javascript
- Full day simulation with realistic load
- Stress testing (100+ concurrent requests)
- Edge case combinations
```

## Future Enhancements

1. **Machine Learning Integration**
   - Predict no-show probability
   - Optimize slot allocation based on historical data
   - Dynamic capacity adjustment

2. **Advanced Features**
   - Multi-doctor consultation support
   - Telemedicine integration
   - Real-time patient tracking
   - SMS/Email notifications

3. **Scalability**
   - Horizontal scaling with load balancer
   - Distributed caching
   - Microservices architecture

4. **Analytics**
   - Doctor utilization reports
   - Patient wait time analysis
   - Revenue optimization

## Conclusion

The OPD Token Allocation Engine implements a robust, priority-based dynamic allocation algorithm that handles real-world complexities including cancellations, delays, and emergency insertions. The system prioritizes patient safety and fair access while maintaining operational efficiency through smart slot management and dynamic reallocation.
