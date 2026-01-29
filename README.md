# OPD Token Allocation Engine

## Overview
A backend system for managing hospital OPD (Outpatient Department) token allocation with elastic capacity management. The system handles dynamic token allocation across multiple sources while respecting slot capacity limits and prioritization rules.

## Features
- **Dynamic Token Allocation**: Allocates tokens from multiple sources (online booking, walk-in, paid priority, follow-up)
- **Elastic Capacity Management**: Handles real-world variability (delays, cancellations, emergency insertions)
- **Priority-based Scheduling**: Prioritizes between different token sources
- **Real-time Reallocation**: Dynamically reallocates tokens when conditions change
- **Simulation System**: Simulates an entire OPD day with multiple doctors

## Architecture

### Token Sources (Priority Order)
1. **Emergency/Paid Priority** (Highest)
2. **Follow-up Patients**
3. **Online Booking**
4. **Walk-in (OPD Desk)** (Lowest)

### Core Components
- **API Layer**: RESTful endpoints for token management
- **Allocation Engine**: Core algorithm for token distribution
- **Slot Manager**: Handles slot capacity and availability
- **Event Handler**: Manages cancellations, delays, and insertions

## Installation

```bash
# Install dependencies
npm install express body-parser uuid
```

## Running the Application

```bash
# Start the API server
node src/api/server.js

# Run the simulation
node src/simulation/simulation.js
```

## API Documentation

### Base URL
```
http://localhost:3000/api
```
<img width="1070" height="202" alt="Screenshot 2026-01-29 112945" src="https://github.com/user-attachments/assets/aa60f669-e462-48b9-ac2c-1a3cc4b9523c" />

### Endpoints

#### 1. Request Token
**POST** `/tokens/request`
<img width="1031" height="627" alt="Screenshot 2026-01-29 112820" src="https://github.com/user-attachments/assets/e3342400-8e41-420b-b802-065456d7cac0" />

Request a new token for a patient.

**Request Body:**
```json
{
  "source": "online|walkin|priority|followup",
  "patientId": "string",
  "patientName": "string",
  "doctorId": "string",
  "slotTime": "HH:MM",
  "priority": 1-5
}
```

**Response:**
```json
{
  "success": true,
  "token": {
    "tokenId": "string",
    "tokenNumber": "number",
    "slotTime": "string",
    "estimatedTime": "string",
    "position": "number"
  }
}
```

#### 2. Cancel Token
**POST** `/tokens/cancel`
<img width="1050" height="607" alt="Screenshot 2026-01-29 112346" src="https://github.com/user-attachments/assets/1e4a9600-16f3-4a06-9fad-b10e5c37580b" />

Cancel an existing token and reallocate.

**Request Body:**
```json
{
  "tokenId": "string",
  "reason": "string"
}
```

#### 3. Insert Emergency Token
**POST** `/tokens/emergency`
<img width="465" height="604" alt="Screenshot 2026-01-29 110259" src="https://github.com/user-attachments/assets/64b06f08-23d2-4a35-a98c-09015fb4502c" />

Insert an emergency/priority token.

**Request Body:**
```json
{
  "patientId": "string",
  "patientName": "string",
  "doctorId": "string",
  "preferredSlot": "HH:MM"
}
```

#### 4. Get Slot Status
**GET** `/slots/:doctorId/:slotTime`
**<img width="474" height="509" alt="Screenshot 2026-01-29 110327" src="https://github.com/user-attachments/assets/caee593b-ae99-4868-be9c-016e5febd205" />
<img width="482" height="611" alt="Screenshot 2026-01-29 110215" src="https://github.com/user-attachments/assets/4b569c73-4d2e-4066-ba61-a475542a82d8" />

**
Get current status of a specific slot.

#### 5. Get Doctor Schedule
**GET** `/doctors/:doctorId/schedule`
<img width="462" height="610" alt="Screenshot 2026-01-29 105810" src="https://github.com/user-attachments/assets/9adde33d-1082-442e-8f02-8b12024e3c22" />

Get complete schedule for a doctor.

## Algorithm Design

### Token Allocation Algorithm

The system uses a **Priority-based Dynamic Allocation** algorithm with the following characteristics:

#### 1. Per-Slot Hard Limits
- Each slot has a maximum capacity (default: 6 patients)
- Hard limit is enforced regardless of source
- Prevents overbooking beyond safe capacity

#### 2. Dynamic Reallocation
When conditions change (cancellation, delay, emergency), the system:
1. Identifies affected slots
2. Evaluates available capacity
3. Redistributes tokens based on priority
4. Notifies affected patients

#### 3. Priority Logic

**Priority Scoring System:**
```
Emergency/Paid Priority: 1000 + manual priority (1-5)
Follow-up Patients: 500 + days since last visit
Online Booking: 100 + booking timestamp order
Walk-in: Arrival timestamp order
```

#### 4. Edge Cases

**Cancellation Handling:**
- Freed slot capacity offered to waiting list
- Higher priority sources get preference
- Patients notified of earlier slot availability

**No-show Handling:**
- After 15-minute grace period, slot marked available
- Next patient in queue promoted
- Original patient moved to end if returns

**Emergency Insertion:**
- Scans adjacent slots for capacity
- Splits overbooked slot if possible
- May delay lower-priority patients to next slot

**Delay Handling:**
- Propagates delay through subsequent slots
- Recalculates estimated wait times
- Notifies affected patients

### Failure Handling

1. **Slot Full**: Add to waiting list, suggest alternative slots
2. **Doctor Unavailable**: Suggest alternative doctors
3. **System Overload**: Queue requests, process in priority order
4. **Data Inconsistency**: Validate and reconcile state

## Data Schema

### Token
```typescript
{
  tokenId: string (UUID)
  tokenNumber: number (sequential)
  patientId: string
  patientName: string
  doctorId: string
  slotTime: string (HH:MM)
  source: 'online' | 'walkin' | 'priority' | 'followup'
  priority: number
  status: 'allocated' | 'waiting' | 'completed' | 'cancelled' | 'noshow'
  createdAt: timestamp
  estimatedTime: timestamp
}
```

### Slot
```typescript
{
  slotId: string
  doctorId: string
  slotTime: string (HH:MM)
  capacity: number (max patients)
  allocated: number (current allocation)
  tokens: Token[]
  status: 'available' | 'full' | 'delayed' | 'blocked'
}
```

### Doctor
```typescript
{
  doctorId: string
  name: string
  slots: Slot[]
  avgConsultationTime: number (minutes)
}
```

## Simulation

The simulation runs a complete OPD day with 3 doctors and generates:
- 40-60 token requests from various sources
- 5-10 cancellations
- 3-5 emergency insertions
- 2-3 delays

Run with:
```bash
node src/simulation/simulation.js
```

## Code Structure

```
opd-token-allocation/
├── src/
│   ├── api/
│   │   ├── server.js           # Express server setup
│   │   └── routes/
│   │       └── tokens.js       # Token endpoints
│   ├── core/
│   │   ├── allocator.js        # Core allocation algorithm
│   │   ├── slotManager.js      # Slot capacity management
│   │   └── priorityEngine.js   # Priority calculation
│   ├── models/
│   │   ├── Token.js            # Token data model
│   │   ├── Slot.js             # Slot data model
│   │   └── Doctor.js           # Doctor data model
│   ├── services/
│   │   ├── tokenService.js     # Business logic
│   │   └── notificationService.js
│   └── simulation/
│       └── simulation.js       # Full day simulation
├── tests/
│   └── allocation.test.js      # Unit tests
├── package.json
└── README.md
```

## Trade-offs and Design Decisions

### 1. In-Memory vs Database
**Decision**: Use in-memory storage for the assignment
**Trade-off**: Fast performance but no persistence
**Production**: Would use Redis for real-time data + PostgreSQL for persistence

### 2. Synchronous vs Asynchronous Processing
**Decision**: Synchronous allocation with async notifications
**Trade-off**: Simpler logic but potential bottleneck at scale
**Production**: Would use event-driven architecture with message queue

### 3. Hard Limits vs Soft Limits
**Decision**: Enforce hard per-slot limits
**Trade-off**: May turn away patients vs potential overcrowding
**Production**: Would have configurable soft/hard limits per doctor preference

### 4. Simple Priority vs Complex Scoring
**Decision**: Multi-factor priority scoring
**Trade-off**: More complex logic but fairer allocation
**Production**: Would add ML-based prediction for optimal allocation

## Testing

Run tests with:
```bash
npm test
```

Tests cover:
- Basic token allocation
- Priority enforcement
- Cancellation handling
- Emergency insertion
- Edge cases

## License
MIT
