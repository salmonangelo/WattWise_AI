const API_URL = "http://localhost:8000";

let appliances = [];
let chartInstance = null;

const APPLIANCE_WATTS = {
    "Fan": 75,
    "LED Bulb": 10,
    "Tube Light": 40,
    "TV": 120,
    "Refrigerator": 150,
    "Washing Machine": 500,
    "Air Conditioner (1.5 Ton)": 1500,
    "Laptop": 65,
    "Water Heater": 2000,
    "Mixer Grinder": 750,
    "Iron Box": 1000
};

// DOM Elements
const form = document.getElementById("appliance-form");
const appSelect = document.getElementById("app-select");
const customNameContainer = document.getElementById("custom-name-container");
const appNameCustom = document.getElementById("app-name-custom");
const wattInput = document.getElementById("app-wattage");
const hoursInput = document.getElementById("app-hours");
const qtyInput = document.getElementById("app-quantity");
const appList = document.getElementById("appliance-list");
const calcBtn = document.getElementById("calculate-btn");

const resBase = document.getElementById("res-base");
const resAdjusted = document.getElementById("res-adjusted");
const resBill = document.getElementById("res-bill");
const resCo2 = document.getElementById("res-co2");
const tipsList = document.getElementById("tips-list");

// Handle appliance selection pre-fill
appSelect.addEventListener("change", (e) => {
    const selected = e.target.value;
    if (selected === "Custom") {
        customNameContainer.style.display = "flex";
        appNameCustom.required = true;
        wattInput.value = "";
    } else {
        customNameContainer.style.display = "none";
        appNameCustom.required = false;
        if (APPLIANCE_WATTS[selected]) {
            wattInput.value = APPLIANCE_WATTS[selected];
        }
    }
});

function initChart() {
    const ctx = document.getElementById('usageChart').getContext('2d');
    Chart.defaults.color = '#9aa4b2'; // text-secondary
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Monthly Usage (kWh)',
                data: [],
                backgroundColor: '#4f6bff',
                borderColor: '#4f6bff',
                borderWidth: 1,
                borderRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: '#2a2f38' } // border-color
                },
                x: { 
                    grid: { display: false } 
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function updateList() {
    appList.innerHTML = "";
    appliances.forEach((app, index) => {
        const li = document.createElement("li");
        li.className = "app-item";
        li.innerHTML = `
            <div class="app-info">
                <strong>${app.name}</strong>
                <small>${app.wattage}W | ${app.hours}hrs/day | Qty: ${app.quantity}</small>
            </div>
            <button type="button" class="btn-delete" onclick="removeAppliance(${index})">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        appList.appendChild(li);
    });
    updateChart();
}

function updateChart() {
    if (!chartInstance) return;
    chartInstance.data.labels = appliances.map(a => a.name);
    chartInstance.data.datasets[0].data = appliances.map(a => (a.wattage * a.hours * a.quantity * 30) / 1000);
    chartInstance.update();
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    let finalName = appSelect.value;
    if (finalName === "Custom") {
        finalName = appNameCustom.value.trim();
    }
    
    if (!finalName) {
        alert("Please provide an appliance name.");
        return;
    }

    appliances.push({
        name: finalName,
        wattage: parseFloat(wattInput.value),
        hours: parseFloat(hoursInput.value),
        quantity: parseInt(qtyInput.value)
    });
    
    updateList();
    
    // Reset inputs
    form.reset();
    customNameContainer.style.display = "none";
    appNameCustom.required = false;
    qtyInput.value = 1;
});

window.removeAppliance = (index) => {
    appliances.splice(index, 1);
    updateList();
};

calcBtn.addEventListener("click", async () => {
    if (appliances.length === 0) {
        alert("Please add at least one appliance.");
        return;
    }

    const hourOfDay = parseInt(document.getElementById("calc-hour").value) || 12;
    const month = parseInt(document.getElementById("calc-month").value) || 1;

    calcBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running Estimation...';
    calcBtn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appliances, hour_of_day: hourOfDay, month: month })
        });
        
        const data = await res.json();
        
        resBase.innerHTML = `${data.base_units.toFixed(2)} <span class="unit">kWh</span>`;
        resAdjusted.innerHTML = `${data.adjusted_units.toFixed(2)} <span class="unit">kWh</span>`;
        resBill.innerText = `$${data.estimated_bill.toFixed(2)}`;
        resCo2.innerHTML = `${data.co2_emissions.toFixed(2)} <span class="unit">kg</span>`;

        const tipRes = await fetch(`${API_URL}/tips`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appliances })
        });
        const tipData = await tipRes.json();
        
        tipsList.innerHTML = "";
        if (tipData.tips && tipData.tips.length > 0) {
            tipData.tips.forEach(t => {
                const li = document.createElement("li");
                li.innerHTML = `<strong>${t.appliance}</strong>: ${t.tip}`;
                tipsList.appendChild(li);
            });
        } else {
            tipsList.innerHTML = `<li class="empty-state">Add more appliances to get personalized tips.</li>`;
        }

    } catch (err) {
        console.error(err);
        alert("Make sure the backend is running at " + API_URL);
    } finally {
        calcBtn.innerHTML = '<i class="fa-solid fa-calculator"></i> Run Estimation';
        calcBtn.disabled = false;
    }
});

initChart();
