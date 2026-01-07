interface Trip {
    start: string;
    end: string;
    car_spots: number;
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

// Audio
const beep = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');

// DOM Elements
const dateInput = document.getElementById('date') as HTMLInputElement;
const directionSelect = document.getElementById('direction') as HTMLSelectElement;
const startTimeInput = document.getElementById('startTime') as HTMLInputElement;
const endTimeInput = document.getElementById('endTime') as HTMLInputElement;
const searchBtn = document.getElementById('searchBtn') as HTMLButtonElement;
const monitorBtn = document.getElementById('monitorBtn') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;
const resultsDiv = document.getElementById('results') as HTMLDivElement;

// Set default date
if (dateInput) {
    dateInput.valueAsDate = new Date();
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
        monitorBtn.style.display = 'block';

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

    lastData.forEach((trip) => {
        const start = new Date(trip.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const end = new Date(trip.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const id = trip.start;

        const isSelected = selectedTrips.has(id);
        const hasSpots = trip.car_spots > 0;

        const div = document.createElement('div');
        div.className = `trip-card ${hasSpots ? 'available' : 'full'}`;

        div.innerHTML = `
            <label style="display: flex; align-items: center; width: 100%; cursor: pointer;">
                <input type="checkbox" data-id="${id}" ${isSelected ? 'checked' : ''}>
                <div class="trip-time">${start} - ${end}</div>
                <div class="trip-spots ${hasSpots ? 'spots-available' : 'spots-full'}">
                    ${hasSpots ? trip.car_spots + ' spots' : 'FULL'}
                </div>
            </label>
        `;

        // Add event listener manually to avoid inline onclick limitations in module scope if needed, 
        // but for simplicity we'll delegate or attach here.
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
    // Re-render isn't strictly necessary for state but good for consistency if we added visuals
}

async function monitorLoop() {
    try {
        const data = await fetchTrips();
        lastData = data.items || [];
        renderResults(); // Update UI

        // Check matches
        const matches = lastData.filter(t => selectedTrips.has(t.start) && t.car_spots > 0);

        if (matches.length > 0) {
            const foundText = matches.map(t => new Date(t.start).toLocaleTimeString()).join(', ');
            statusDiv.innerHTML = `<p class="success" style="font-size: 1.2rem; animation: pulse 1s infinite;">SPOTS FOUND for ${foundText}!</p>`;

            // Play sound
            beep.play().catch(e => console.error("Audio error:", e));

            // Notification
            if (Notification.permission === "granted") {
                new Notification("Ferry Spots Found!", { body: `Spots available at: ${foundText}` });
            }

            // Don't stop automatically, just alert
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
    // Request notification permission
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
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
        // Use window.setInterval to avoid TS ambiguity with Node.js timer
        monitoringInterval = window.setInterval(monitorLoop, 30000);
        monitorBtn.innerText = "Stop Monitoring";
        monitorBtn.style.backgroundColor = "var(--danger-color)";
    }
}

// Attach global event listeners
searchBtn.addEventListener('click', checkAvailability);
monitorBtn.addEventListener('click', toggleMonitoring);
