# 🚀 QUICK SETUP GUIDE

## 3 Steps to Get Started

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Start the System

**Windows:**
```bash
# Double-click start.bat
# OR run from command prompt:
start.bat
```

**Mac/Linux:**
```bash
chmod +x start.sh
./start.sh
```

**Manual Start:**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
python -m http.server 8080
# OR: http-server -p 8080
```

### Step 3: Open Browser
```
http://localhost:8080
```

## ✅ What You'll See

1. **Futuristic Dashboard** - 3D visualization with glassmorphic UI
2. **Token Request Form** - Add new patients
3. **Live Doctor Cards** - Real-time utilization stats
4. **Activity Feed** - Recent actions log

## 🎮 Quick Actions

**Allocate a Token:**
1. Enter patient details
2. Select doctor → slots load automatically
3. Choose time slot
4. Click "Allocate Token"

**Try Emergency Insert:**
- Click "🚨 Emergency Insert" button
- Fill details and insert

**Run Simulation:**
- Click "🎲 Run Simulation"
- Watch 10 tokens auto-generate!

## 🐛 Troubleshooting

**"Cannot connect to server"**
→ Make sure backend is running on port 3000

**"Port already in use"**
→ Change port in backend/src/api/server.js

**"Module not found"**
→ Run `npm install` in backend folder

**3D not rendering**
→ Use Chrome/Firefox with hardware acceleration enabled

## 📖 Full Documentation

- **Main README.md** - Complete feature list
- **backend/README.md** - Backend API details
- **frontend/README.md** - Frontend features
- **backend/docs/** - Algorithm & API docs

## 🎯 Test Features

### Basic Test
1. Allocate 3-4 tokens to different doctors
2. Watch 3D cubes update colors/heights
3. Switch to Timeline view
4. Check activity feed

### Advanced Test
1. Fill all slots for one doctor
2. Try adding more → goes to waiting list
3. Cancel a token → waiting list promotes
4. Add emergency → see priority handling

### Simulation Test
```bash
cd backend
npm run simulate
```
See complete day simulation in terminal!

## 💡 Pro Tips

- **Auto-refresh:** Dashboard updates every 5 seconds
- **Mouse control:** Move mouse to rotate 3D view
- **Color coding:** Green=available, Yellow=partial, Red=full
- **Click tokens:** View details in timeline view
- **Activity feed:** Scrolls automatically

## 🎨 Customize

**Change colors:** `frontend/css/styles.css` → `:root` variables
**Add doctors:** `backend/src/api/server.js` → doctors array
**Modify slots:** `backend/src/models/Slot.js` → capacity

## 📚 Learn More

Read the full documentation in README.md and backend/docs/ for:
- Algorithm design explanation
- API endpoint reference
- Implementation details
- Edge case handling
- Future enhancements

---

**Enjoy your OPD Token Allocation System!** 🏥✨
