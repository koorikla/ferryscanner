
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
let beepInterval: number | null = null;
const selectedTrips = new Set<string>();
let lastData: Trip[] = [];
let lastEmailSentTime: number = 0;
const EMAIL_COOLDOWN = 10 * 60 * 1000; // 10 minutes

// Audio
const beep = new Audio('https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg');

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
const alertTelegramCheck = document.getElementById('alertTelegram') as HTMLInputElement;
const emailInput = document.getElementById('email') as HTMLInputElement;
const telegramInputWrapper = document.getElementById('telegramInputWrapper') as HTMLDivElement;
const telegramChatIdInput = document.getElementById('telegramChatId') as HTMLInputElement;


// Audio Helper
function playBeep() {
    beep.play().catch(e => console.error("Audio error:", e));
}

function stopBeep() {
    if (beepInterval) {
        clearInterval(beepInterval);
        beepInterval = null;
    }
}

// ... (Audio Helper remains)

function saveSettings() {
    const settings = {
        date: dateInput.value,
        direction: directionSelect.value,
        vehicleType: vehicleTypeSelect.value,
        startTime: startTimeInput.value,
        endTime: endTimeInput.value,
        alertBrowser: alertBrowserCheck.checked,
        alertEmail: alertEmailCheck.checked,
        email: emailInput.value || ""
        // alertTelegram and telegramChatId will be added here later
    };
    localStorage.setItem('ferrySettings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('ferrySettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            if (settings.date) dateInput.value = settings.date;
            else dateInput.valueAsDate = new Date(); // Default if not saved

            if (settings.direction) directionSelect.value = settings.direction;
            if (settings.vehicleType) vehicleTypeSelect.value = settings.vehicleType;
            if (settings.startTime) startTimeInput.value = settings.startTime;
            if (settings.endTime) endTimeInput.value = settings.endTime;

            if (settings.alertBrowser !== undefined) alertBrowserCheck.checked = settings.alertBrowser;
            if (settings.alertEmail !== undefined) {
                alertEmailCheck.checked = settings.alertEmail;
                if (settings.alertEmail) emailInput.style.display = 'block';
            }
            if (settings.email) emailInput.value = settings.email;
        } catch (e) {
            console.error("Failed to load settings", e);
            dateInput.valueAsDate = new Date();
        }
    } else {
        dateInput.valueAsDate = new Date();
    }
}

// Initialize
function init() {
    if (!dateInput) {
        console.error("Critical elements missing");
        return;
    }

    loadSettings();

    // Change Listeners for persistence
    const inputs = [dateInput, directionSelect, vehicleTypeSelect, startTimeInput, endTimeInput, alertBrowserCheck, alertEmailCheck, alertTelegramCheck, emailInput, telegramChatIdInput];
    inputs.forEach(input => {
        if (input) input.addEventListener('change', saveSettings);
    });
    if (emailInput) emailInput.addEventListener('input', saveSettings);
    if (telegramChatIdInput) telegramChatIdInput.addEventListener('input', saveSettings);

    if (alertEmailCheck) {
        alertEmailCheck.addEventListener('change', () => {
            if (emailInput) {
                emailInput.style.display = alertEmailCheck.checked ? 'block' : 'none';
                if (alertEmailCheck.checked) emailInput.focus();
            }
        });
    }

    if (alertTelegramCheck) {
        alertTelegramCheck.addEventListener('change', () => {
            if (telegramInputWrapper) {
                telegramInputWrapper.style.display = alertTelegramCheck.checked ? 'block' : 'none';
                if (alertTelegramCheck.checked) telegramChatIdInput.focus();
            }
        });
    }

    // Attach global event listeners
    if (searchBtn) searchBtn.addEventListener('click', checkAvailability);
    if (monitorBtn) monitorBtn.addEventListener('click', toggleMonitoring);
}
//...

// Run init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
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
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`API ${response.status}: ${text}`);
    }
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

async function sendEmailAlert(email: string, telegramChatId: string, message: string) {
    try {
        await fetch('/api/alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, telegram_chat_id: telegramChatId, message })
        });
        console.log("Alert requested");
    } catch (e) {
        console.error("Failed to send alert", e);
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
                if (!beepInterval) {
                    playBeep();
                    beepInterval = window.setInterval(playBeep, 5000);
                }

                if (Notification.permission === "granted") {
                    new Notification("Ferry Spots Found!", { body: `Spots available at: ${foundText}` });
                }
            } else {
                stopBeep();
            }

            // Logic: Email & Telegram Alert
            const useEmail = alertEmailCheck && alertEmailCheck.checked;
            const useTelegram = alertTelegramCheck && alertTelegramCheck.checked;

            if (useEmail || useTelegram) {
                const now = Date.now();
                if (now - lastEmailSentTime > EMAIL_COOLDOWN) {
                    if (useEmail || useTelegram) {
                        const email = (useEmail && emailInput) ? emailInput.value : "";
                        const telegram = (useTelegram && telegramChatIdInput) ? telegramChatIdInput.value : "";

                        if (email || telegram) {
                            await sendEmailAlert(email, telegram, `Spots available for ferries at: ${foundText} (${type.toUpperCase()})`);
                            lastEmailSentTime = now;
                            statusDiv.innerHTML += `<br><small style="color: #666">Alerts sent!</small>`;
                        }
                    }
                }
            }

        } else {
            stopBeep();
            const time = new Date().toLocaleTimeString();
            statusDiv.innerHTML = `<p class="monitoring">Monitoring ${selectedTrips.size} ferries... <br>Last checked: ${time}</p>`;
        }

    } catch (err) {
        console.error("Monitor error", err);
        stopBeep();
        if (err instanceof Error) {
            statusDiv.innerHTML += ` <span style="color:red">(Error refreshing: ${err.message})</span>`;
        } else {
            statusDiv.innerHTML += ` <span style="color:red">(Error refreshing)</span>`;
        }
    }
}

function toggleMonitoring() {
    const useBrowser = alertBrowserCheck ? alertBrowserCheck.checked : true;
    const useEmail = alertEmailCheck ? alertEmailCheck.checked : false;
    const useTelegram = alertTelegramCheck ? alertTelegramCheck.checked : false;

    // Request notification permission
    if (useBrowser && "Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    // Validation
    if (useEmail && (!emailInput || !emailInput.value)) {
        alert("Enter email address.");
        if (emailInput) emailInput.focus();
        return;
    }
    if (useTelegram && (!telegramChatIdInput || !telegramChatIdInput.value)) {
        alert("Enter Telegram Chat ID.");
        if (telegramChatIdInput) telegramChatIdInput.focus();
        return;
    }

    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
        stopBeep();
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
