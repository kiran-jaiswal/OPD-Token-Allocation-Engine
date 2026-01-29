const BASE_URL = "http://localhost:3000/api";

// DOM elements
const loader = document.getElementById("loader");
const output = document.getElementById("output");
const totalTokens = document.getElementById("totalTokens");
const waiting = document.getElementById("waiting");
const doctorList = document.getElementById("doctorList");

// ------------------ helpers ------------------

function showLoader(show) {
  loader.classList.toggle("hidden", !show);
}

function showOutput(data) {
  showLoader(false);
  output.textContent = JSON.stringify(data, null, 2);
}

// ------------------ API calls ------------------

function requestToken() {
  showLoader(true);

  fetch(`${BASE_URL}/tokens/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patientId: pId.value,
      patientName: pName.value,
      doctorId: doctor.value,
      slotTime: slot.value,
      source: source.value
    })
  })
    .then(r => r.json())
    .then(d => {
      showOutput(d);
      loadStatus();
    })
    .catch(() => showOutput({ error: "Backend error" }));
}

function emergencyToken() {
  showLoader(true);

  fetch(`${BASE_URL}/tokens/emergency`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patientId: eId.value,
      patientName: eName.value,
      doctorId: eDoctor.value,
      preferredSlot: eSlot.value
    })
  })
    .then(r => r.json())
    .then(d => {
      showOutput(d);
      loadStatus();
    })
    .catch(() => showOutput({ error: "Backend error" }));
}

function loadStatus() {
  fetch(`${BASE_URL}/status`)
    .then(r => r.json())
    .then(res => {
      totalTokens.textContent = res.status.totalTokens;
      waiting.textContent = res.status.waitingCount;
      renderDoctors(res.status.doctors);
    })
    .catch(() => {
      totalTokens.textContent = "-";
      waiting.textContent = "-";
    });
}

function renderDoctors(doctors) {
  doctorList.innerHTML = "";

  doctors.forEach(d => {
    doctorList.innerHTML += `
      <div class="doctor">
        <b>${d.name}</b><br/>
        ${d.allocated} / ${d.capacity} tokens |
        ${d.utilization.toFixed(1)}%
      </div>
    `;
  });
}

// ------------------ init ------------------

loadStatus();
