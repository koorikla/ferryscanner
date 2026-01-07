
interface Trip {
    start: string;
    end: string;
    car_spots: number;
    passenger_spots: number;
    bus_spots: number;
}

interface FerryResponse {
    date: string;
    direction: string;
    items: Trip[];
}

// State
let monitoringInterval: number | null = null;
const selectedTrips = new Set<string>();
let lastData: Trip[] = [];
let lastEmailSentTime: number = 0;
const EMAIL_COOLDOWN = 10 * 60 * 1000; // 10 minutes

// Audio
const beep = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');

// DOM Elements
const dateInput = document.getElementById('date') as HTMLInputElement;
const directionSelect = document.getElementById('direction') as HTMLSelectElement;
const vehicleTypeSelect = document.getElementById('vehicleType') as HTMLSelectElement;
const startTimeInput = document.getElementById('startTime') as HTMLInputElement;
const endTimeInput = document.getElementById('endTime') as HTMLInputElement;
const searchBtn = document.getElementById('searchBtn') as HTMLButtonElement;
const monitorBtn = document.getElementById('monitorBtn') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;
const resultsDiv = document.getElementById('results') as HTMLDivElement;

// Monitor Control Elements
const monitorControls = document.getElementById('monitorControls') as HTMLDivElement;
const alertBrowserCheck = document.getElementById('alertBrowser') as HTMLInputElement;
const alertEmailCheck = document.getElementById('alertEmail') as HTMLInputElement;
const emailInput = document.getElementById('email') as HTMLInputElement;

// Initialize
if (dateInput) {
    dateInput.valueAsDate = new Date();
}

if (alertEmailCheck) {
    alertEmailCheck.addEventListener('change', () => {
        if (emailInput) {
            emailInput.style.display = alertEmailCheck.checked ? 'block' : 'none';
            if (alertEmailCheck.checked) emailInput.focus();
        }
    });
}

async function fetchTrips(): Promise<FerryResponse> {
    const date = dateInput.value;
    const direction = directionSelect.value;
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;

    let url = `/api/scan?date=${date}&direction=${direction}`;
    if (startTime) url += `&from=${startTime}`;
    if (endTime) url += `&to=${endTime}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('API Error');
    return await response.json();
}

async function checkAvailability() {
    try {
        statusDiv.innerText = "Loading...";
        const data = await fetchTrips();
        lastData = data.items || [];
        statusDiv.innerText = "";

        renderResults();

        if (monitorControls) monitorControls.style.display = 'flex';

    } catch (err) {
        if (err instanceof Error) {
            statusDiv.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
        }
    }
}

function renderResults() {
    resultsDiv.innerHTML = '';

    if (lastData.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align: center; color: #666;">No ferries found for this criteria.</p>';
        return;
    }

    const type = vehicleTypeSelect ? vehicleTypeSelect.value : 'sv';

    lastData.forEach((trip) => {
        const start = new Date(trip.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const end = new Date(trip.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const id = trip.start;

        const isSelected = selectedTrips.has(id);

        let hasSpots = false;
        let spotsText = "";

        if (type === 'sv') {
            hasSpots = trip.car_spots > 0;
            spotsText = `${trip.car_spots} car spots`;
        } else if (type === 'bv') {
            hasSpots = trip.bus_spots > 0;
            spotsText = `${trip.bus_spots} bus spots`;
        } else if (type === 'pcs') {
            hasSpots = trip.passenger_spots > 0;
            spotsText = `${trip.passenger_spots} passengers`;
        } else {
            // Any
            hasSpots = (trip.car_spots + trip.bus_spots + trip.passenger_spots) > 0;
            spotsText = `${trip.car_spots}C / ${trip.bus_spots}B / ${trip.passenger_spots}P`;
        }

        const div = document.createElement('div');
        div.className = `trip-card ${hasSpots ? 'available' : 'full'}`;

        div.innerHTML = `
            <label style="display: flex; align-items: center; width: 100%; cursor: pointer;">
                <input type="checkbox" data-id="${id}" ${isSelected ? 'checked' : ''}>
                <div class="trip-time">${start} - ${end}</div>
                <div class="trip-spots ${hasSpots ? 'spots-available' : 'spots-full'}">
                    ${hasSpots ? spotsText : 'FULL'}
                </div>
            </label>
        `;

        const checkbox = div.querySelector('input[type="checkbox"]');
        checkbox?.addEventListener('change', () => toggleSelection(id));

        resultsDiv.appendChild(div);
    });
}

function toggleSelection(id: string) {
    if (selectedTrips.has(id)) {
        selectedTrips.delete(id);
    } else {
        selectedTrips.add(id);
    }
}

async function sendEmailAlert(email: string, message: string) {
    try {
        await fetch('/api/alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, message })
        });
        console.log("Email alert requested");
    } catch (e) {
        console.error("Failed to send email alert", e);
    }
}

async function monitorLoop() {
    try {
        const data = await fetchTrips();
        lastData = data.items || [];
        renderResults(); // Update UI

        // Check matches based on filter
        const type = vehicleTypeSelect ? vehicleTypeSelect.value : 'sv';

        const matches = lastData.filter(t => {
            if (!selectedTrips.has(t.start)) return false;

            if (type === 'sv') return t.car_spots > 0;
            if (type === 'bv') return t.bus_spots > 0;
            if (type === 'pcs') return t.passenger_spots > 0;
            // Any
            return (t.car_spots + t.bus_spots + t.passenger_spots) > 0;
        });

        if (matches.length > 0) {
            const foundText = matches.map(t => new Date(t.start).toLocaleTimeString()).join(', ');
            statusDiv.innerHTML = `<p class="success" style="font-size: 1.2rem; animation: pulse 1s infinite;">SPOTS FOUND for ${foundText}!</p>`;

            // Logic: Browser Alert
            if (alertBrowserCheck && alertBrowserCheck.checked) {
                // Play sound
                beep.play().catch(e => console.error("Audio error:", e));

                // Browser Notification
                if (Notification.permission === "granted") {
                    new Notification("Ferry Spots Found!", { body: `Spots available at: ${foundText}` });
                }
            }

            // Logic: Email Alert
            if (alertEmailCheck && alertEmailCheck.checked) {
                const email = emailInput.value;
                const now = Date.now();
                if (email && (now - lastEmailSentTime > EMAIL_COOLDOWN)) {
                    await sendEmailAlert(email, `Spots available for ferries at: ${foundText} (${type.toUpperCase()})`);
                    lastEmailSentTime = now;
                    statusDiv.innerHTML += `<br><small style="color: #666">Email alert sent!</small>`;
                } else if (!email) {
                    statusDiv.innerHTML += `<br><small style="color: red">Email checked but address missing!</small>`;
                }
            }

        } else {
            const time = new Date().toLocaleTimeString();
            statusDiv.innerHTML = `<p class="monitoring">Monitoring ${selectedTrips.size} ferries... <br>Last checked: ${time}</p>`;
        }

    } catch (err) {
        console.error("Monitor error", err);
        statusDiv.innerHTML += ` <span style="color:red">(Error refreshing)</span>`;
    }
}

function toggleMonitoring() {
    const useBrowser = alertBrowserCheck ? alertBrowserCheck.checked : true;
    const useEmail = alertEmailCheck ? alertEmailCheck.checked : false;

    // Request notification permission if browser option checked
    if (useBrowser && "Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    // Validate Email if checked
    if (useEmail && !emailInput.value) {
        alert("Please enter an email address for email alerts.");
        if (emailInput) emailInput.focus();
        return;
    }

    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
        monitorBtn.innerText = "Start Monitoring Selected";
        monitorBtn.style.backgroundColor = "var(--success-color)";
        statusDiv.innerText = "Monitoring stopped.";
    } else {
        if (selectedTrips.size === 0) {
            alert("Please select at least one ferry to monitor.");
            return;
        }

        monitorLoop(); // Check immediately
        monitoringInterval = window.setInterval(monitorLoop, 30000);
        monitorBtn.innerText = "Stop Monitoring";
        monitorBtn.style.backgroundColor = "var(--danger-color)";
    }
}

// Attach global event listeners
searchBtn.addEventListener('click', checkAvailability);
monitorBtn.addEventListener('click', toggleMonitoring);
