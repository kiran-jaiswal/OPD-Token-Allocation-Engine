# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently no authentication required (would implement JWT in production)

## Response Format
All responses follow this structure:

```json
{
  "success": true|false,
  "data": {...},
  "error": "Error message if applicable",
  "message": "Human-readable message"
}
```

---

## Endpoints

### 1. Request Token

Allocate a new token for a patient.

**Endpoint:** `POST /api/tokens/request`

**Request Body:**
```json
{
  "patientId": "PAT001",
  "patientName": "Amit Sharma",
  "doctorId": "DOC001",
  "slotTime": "10:00",
  "source": "online",
  "priority": 0
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| patientId | string | Yes | Unique patient identifier |
| patientName | string | Yes | Patient's full name |
| doctorId | string | Yes | Doctor's unique identifier |
| slotTime | string | Yes | Slot time in HH:MM format |
| source | string | Yes | Token source: `online`, `walkin`, `priority`, `followup` |
| priority | number | No | Manual priority (0-5), default: 0 |

**Success Response (200):**
```json
{
  "success": true,
  "token": {
    "tokenId": "abc123-def456-ghi789",
    "tokenNumber": 3,
    "patientId": "PAT001",
    "patientName": "Amit Sharma",
    "doctorId": "DOC001",
    "slotTime": "10:00",
    "source": "online",
    "priority": 100,
    "status": "allocated",
    "createdAt": "2026-01-28T10:00:00.000Z",
    "estimatedTime": "10:20"
  },
  "message": "Token allocated successfully"
}
```

**Alternative Slot Response (200):**
```json
{
  "success": true,
  "token": {
    "tokenId": "xyz789",
    "tokenNumber": 1,
    "slotTime": "11:00",
    ...
  },
  "message": "Original slot full. Allocated to 11:00",
  "alternative": true
}
```

**Waiting List Response (400):**
```json
{
  "success": false,
  "token": {
    "tokenId": "waiting123",
    "status": "waiting",
    ...
  },
  "error": "All slots full",
  "message": "Added to waiting list",
  "waitingPosition": 5
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Missing required fields",
  "required": ["patientId", "patientName", "doctorId", "slotTime", "source"]
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/tokens/request \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PAT001",
    "patientName": "Amit Sharma",
    "doctorId": "DOC001",
    "slotTime": "10:00",
    "source": "online",
    "priority": 0
  }'
```

---

### 2. Cancel Token

Cancel an existing token and trigger reallocation from waiting list.

**Endpoint:** `POST /api/tokens/cancel`

**Request Body:**
```json
{
  "tokenId": "abc123-def456-ghi789",
  "reason": "Patient unavailable"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| tokenId | string | Yes | Token ID to cancel |
| reason | string | No | Cancellation reason |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token cancelled",
  "reallocated": {
    "tokenId": "waiting123",
    "patientName": "Priya Patel",
    "slotTime": "10:00",
    "tokenNumber": 6
  }
}
```

**No Reallocation Response (200):**
```json
{
  "success": true,
  "message": "Token cancelled",
  "reallocated": null
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Token not found"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/tokens/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": "abc123-def456-ghi789",
    "reason": "Patient unavailable"
  }'
```

---

### 3. Insert Emergency Token

Insert a high-priority emergency token, potentially moving lower-priority patients.

**Endpoint:** `POST /api/tokens/emergency`

**Request Body:**
```json
{
  "patientId": "PAT999",
  "patientName": "Emergency Patient",
  "doctorId": "DOC001",
  "preferredSlot": "10:00"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| patientId | string | Yes | Patient identifier |
| patientName | string | Yes | Patient name |
| doctorId | string | Yes | Doctor identifier |
| preferredSlot | string | No | Preferred slot time (HH:MM) |

**Success Response (200):**
```json
{
  "success": true,
  "token": {
    "tokenId": "emergency123",
    "tokenNumber": 1,
    "patientId": "PAT999",
    "patientName": "Emergency Patient",
    "doctorId": "DOC001",
    "slotTime": "10:00",
    "source": "priority",
    "priority": 1005,
    "status": "allocated",
    "estimatedTime": "10:00"
  },
  "message": "Emergency token inserted"
}
```

**Forced Insertion Response (200):**
```json
{
  "success": true,
  "token": {
    "tokenId": "emergency123",
    "slotTime": "10:00",
    ...
  },
  "message": "Emergency token inserted by moving lower priority patient",
  "movedPatient": "PAT005"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Cannot insert emergency token"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/tokens/emergency \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PAT999",
    "patientName": "Emergency Patient",
    "doctorId": "DOC001",
    "preferredSlot": "10:00"
  }'
```

---

### 4. Add Delay to Slot

Add delay to a slot, which propagates to subsequent slots.

**Endpoint:** `POST /api/slots/delay`

**Request Body:**
```json
{
  "doctorId": "DOC001",
  "slotTime": "10:00",
  "delayMinutes": 20
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| doctorId | string | Yes | Doctor identifier |
| slotTime | string | Yes | Slot time (HH:MM) |
| delayMinutes | number | Yes | Delay in minutes |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Delay of 20 minutes added",
  "affectedSlots": 3
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Slot not found"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/slots/delay \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "DOC001",
    "slotTime": "10:00",
    "delayMinutes": 20
  }'
```

---

### 5. Get Slot Status

Get current status and allocation details for a specific slot.

**Endpoint:** `GET /api/slots/:doctorId/:slotTime`

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| doctorId | string | Doctor identifier |
| slotTime | string | Slot time (HH:MM) |

**Success Response (200):**
```json
{
  "success": true,
  "slot": {
    "slotId": "slot123",
    "doctorId": "DOC001",
    "slotTime": "10:00",
    "capacity": 6,
    "allocated": 4,
    "available": 2,
    "status": "available",
    "delayMinutes": 0,
    "tokens": [
      {
        "tokenId": "token1",
        "tokenNumber": 1,
        "patientName": "Amit Sharma",
        "source": "online",
        "priority": 100,
        "estimatedTime": "10:00"
      },
      {
        "tokenId": "token2",
        "tokenNumber": 2,
        "patientName": "Priya Patel",
        "source": "followup",
        "priority": 507,
        "estimatedTime": "10:10"
      }
    ]
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Slot not found"
}
```

**cURL Example:**
```bash
curl http://localhost:3000/api/slots/DOC001/10:00
```

---

### 6. Get Doctor Schedule

Get complete schedule with all slots and tokens for a doctor.

**Endpoint:** `GET /api/doctors/:doctorId/schedule`

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| doctorId | string | Doctor identifier |

**Success Response (200):**
```json
{
  "success": true,
  "doctor": {
    "doctorId": "DOC001",
    "name": "Dr. Sharma (Cardiology)",
    "startTime": "09:00",
    "endTime": "13:00",
    "avgConsultationTime": 12,
    "totalCapacity": 24,
    "allocated": 18,
    "utilization": 75,
    "slots": [
      {
        "slotId": "slot1",
        "slotTime": "09:00",
        "capacity": 6,
        "allocated": 5,
        "available": 1,
        "status": "available",
        "tokens": [...]
      },
      {
        "slotId": "slot2",
        "slotTime": "10:00",
        "capacity": 6,
        "allocated": 6,
        "available": 0,
        "status": "full",
        "tokens": [...]
      }
    ]
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Doctor not found"
}
```

**cURL Example:**
```bash
curl http://localhost:3000/api/doctors/DOC001/schedule
```

---

### 7. List All Doctors

Get list of all doctors with their utilization stats.

**Endpoint:** `GET /api/doctors`

**Success Response (200):**
```json
{
  "success": true,
  "doctors": [
    {
      "doctorId": "DOC001",
      "name": "Dr. Sharma (Cardiology)",
      "startTime": "09:00",
      "endTime": "13:00",
      "allocated": 18,
      "capacity": 24,
      "utilization": 75
    },
    {
      "doctorId": "DOC002",
      "name": "Dr. Patel (General Medicine)",
      "startTime": "10:00",
      "endTime": "14:00",
      "allocated": 20,
      "capacity": 24,
      "utilization": 83.33
    }
  ]
}
```

**cURL Example:**
```bash
curl http://localhost:3000/api/doctors
```

---

### 8. Get System Status

Get overall system status including all doctors and waiting list.

**Endpoint:** `GET /api/status`

**Success Response (200):**
```json
{
  "success": true,
  "status": {
    "totalDoctors": 3,
    "totalTokens": 42,
    "waitingList": 5,
    "doctors": [
      {
        "doctorId": "DOC001",
        "name": "Dr. Sharma (Cardiology)",
        "allocated": 18,
        "capacity": 24,
        "utilization": 75
      },
      {
        "doctorId": "DOC002",
        "name": "Dr. Patel (General Medicine)",
        "allocated": 20,
        "capacity": 24,
        "utilization": 83.33
      },
      {
        "doctorId": "DOC003",
        "name": "Dr. Kumar (Orthopedics)",
        "allocated": 4,
        "capacity": 18,
        "utilization": 22.22
      }
    ]
  }
}
```

**cURL Example:**
```bash
curl http://localhost:3000/api/status
```

---

### 9. Health Check

Simple health check endpoint.

**Endpoint:** `GET /health`

**Success Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2026-01-28T10:00:00.000Z"
}
```

**cURL Example:**
```bash
curl http://localhost:3000/health
```

---

## Complete Usage Example

### Scenario: Book appointments for multiple patients

```bash
# 1. Check available doctors
curl http://localhost:3000/api/doctors

# 2. Request token for online booking
curl -X POST http://localhost:3000/api/tokens/request \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PAT001",
    "patientName": "Amit Sharma",
    "doctorId": "DOC001",
    "slotTime": "10:00",
    "source": "online"
  }'

# 3. Request token for follow-up patient
curl -X POST http://localhost:3000/api/tokens/request \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PAT002",
    "patientName": "Priya Patel",
    "doctorId": "DOC001",
    "slotTime": "10:00",
    "source": "followup",
    "priority": 7
  }'

# 4. Check slot status
curl http://localhost:3000/api/slots/DOC001/10:00

# 5. Insert emergency patient
curl -X POST http://localhost:3000/api/tokens/emergency \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PAT999",
    "patientName": "Emergency Patient",
    "doctorId": "DOC001",
    "preferredSlot": "10:00"
  }'

# 6. Cancel a token
curl -X POST http://localhost:3000/api/tokens/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": "abc123-def456-ghi789",
    "reason": "Patient rescheduled"
  }'

# 7. Add delay
curl -X POST http://localhost:3000/api/slots/delay \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "DOC001",
    "slotTime": "10:00",
    "delayMinutes": 15
  }'

# 8. Check system status
curl http://localhost:3000/api/status
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error, slot full) |
| 404 | Not Found (doctor/slot/token not found) |
| 500 | Internal Server Error |

## Rate Limiting

Currently no rate limiting (would implement in production)

**Production Recommendations:**
- 100 requests per minute per IP
- 1000 requests per hour per API key
- Burst allowance of 20 requests

## Webhooks (Future Enhancement)

In production, the system would support webhooks for:
- Token allocation confirmation
- Cancellation notifications
- Delay alerts
- Waiting list promotions

## Data Schema Reference

See main README.md for complete data models:
- Token
- Slot
- Doctor

## Testing the API

Use the included Postman collection or run the simulation:

```bash
# Run full simulation
npm run simulate

# Start API server
npm start
```
