const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');               // ✅ ADD
const path = require('path');               // ✅ ADD

const TokenAllocator = require('../core/allocator');
const Doctor = require('../models/Doctor');

const app = express();
const PORT = 3000;

// ======================
// Middleware
// ======================
app.use(cors());                             // ✅ Proper CORS
app.use(bodyParser.json());

// ======================
// Optional: Serve Frontend
// (agar index.html backend ke bahar hai to ignore kar sakti ho)
// ======================
/*
app.use(express.static(path.join(__dirname, '../../frontend')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});
*/

// ======================
// Initialize allocator
// ======================
const allocator = new TokenAllocator();

// Add 3 sample doctors
const doctors = [
  new Doctor({ doctorId: 'DOC001', name: 'Dr. Sharma', startTime: '09:00', endTime: '13:00' }),
  new Doctor({ doctorId: 'DOC002', name: 'Dr. Patel', startTime: '10:00', endTime: '14:00' }),
  new Doctor({ doctorId: 'DOC003', name: 'Dr. Kumar', startTime: '09:00', endTime: '12:00' })
];

doctors.forEach(doc => allocator.addDoctor(doc));

// ======================
// API ROOT (IMPORTANT FIX)
// ======================
app.get('/api', (req, res) => {
  res.json({
    message: 'OPD Token Allocation API is running 🚀',
    endpoints: {
      requestToken: 'POST /api/tokens/request',
      cancelToken: 'POST /api/tokens/cancel',
      emergencyToken: 'POST /api/tokens/emergency',
      addDelay: 'POST /api/slots/delay',
      doctors: 'GET /api/doctors',
      status: 'GET /api/status',
      health: 'GET /health'
    }
  });
});

// ======================
// ROUTES (UNCHANGED)
// ======================

app.post('/api/tokens/request', (req, res) => {
  try {
    const { patientId, patientName, doctorId, slotTime, source, priority } = req.body;

    if (!patientId || !patientName || !doctorId || !slotTime || !source) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const result = allocator.allocateToken({
      patientId,
      patientName,
      doctorId,
      slotTime,
      source,
      priority: priority || 0
    });

    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/tokens/cancel', (req, res) => {
  const { tokenId, reason } = req.body;
  if (!tokenId) return res.status(400).json({ success: false, error: 'Token ID required' });
  res.json(allocator.cancelToken(tokenId, reason || 'No reason'));
});

app.post('/api/tokens/emergency', (req, res) => {
  const { patientId, patientName, doctorId, preferredSlot } = req.body;
  if (!patientId || !patientName || !doctorId) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }
  res.json(allocator.insertEmergencyToken({ patientId, patientName, doctorId, preferredSlot }));
});

app.post('/api/slots/delay', (req, res) => {
  const { doctorId, slotTime, delayMinutes } = req.body;
  res.json(allocator.addDelay(doctorId, slotTime, delayMinutes));
});

app.get('/api/doctors', (req, res) => {
  const list = Array.from(allocator.doctors.values()).map(d => ({
    doctorId: d.doctorId,
    name: d.name,
    allocated: d.getAllocatedTokens(),
    capacity: d.getTotalCapacity(),
    utilization: d.getUtilization()
  }));
  res.json({ success: true, doctors: list });
});

app.get('/api/status', (req, res) => {
  res.json({ success: true, status: allocator.getStatus() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// ======================
// Start Server
// ======================
app.listen(PORT, () => {
  console.log('\n========================================');
  console.log(' OPD Token Allocation API Server');
  console.log('========================================');
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` API Root → http://localhost:${PORT}/api`);
  console.log('========================================\n');
});

module.exports = app;
