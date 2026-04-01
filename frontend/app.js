const API_URL = "";

let appliances = [];
// Chart variables
let comparisonChart = null;
let appliancePieChart = null;
let usageChart = null;
let trendChart = null;

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

// Colors for Pie chart
const industrialColors = [
    '#4f6bff', '#5b73e8', '#6a82fb', '#485582', '#6b7280',
    '#9aa4b2', '#374151', '#1f2937', '#2a2f38', '#4b5563'
];

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

function initCharts() {
    Chart.defaults.color = '#9aa4b2';
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";

    // 1. Comparison Chart (Base vs Adjusted)
    const ctxComp = document.getElementById('comparisonChart').getContext('2d');
    comparisonChart = new Chart(ctxComp, {
        type: 'bar',
        data: {
            labels: ['Base Units', 'Model Adjusted'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#2a2f38', '#4f6bff'],
                borderRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: '#2a2f38' } },
                x: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // 2. Appliance Contribution Pie Chart
    const ctxPie = document.getElementById('appliancePieChart').getContext('2d');
    appliancePieChart = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: industrialColors,
                borderWidth: 1,
                borderColor: '#16191f'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#9aa4b2', boxWidth: 12 } }
            }
        }
    });

    // 3. Overall Appliance Usage Bar Chart
    const ctxUsage = document.getElementById('usageChart').getContext('2d');
    usageChart = new Chart(ctxUsage, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Monthly Usage (kWh)',
                data: [],
                backgroundColor: '#4f6bff',
                borderRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: '#2a2f38' } },
                x: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // 4. Trend Chart (Simulated)
    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    trendChart = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
                {
                    label: 'Base Load',
                    data: Array(12).fill(0),
                    borderColor: '#4b5563',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    tension: 0.4
                },
                {
                    label: 'Adjusted AI Trend',
                    data: Array(12).fill(0),
                    borderColor: '#4f6bff',
                    backgroundColor: 'rgba(79, 107, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: '#2a2f38' } },
                x: { grid: { color: '#2a2f38' } }
            },
            plugins: {
                legend: { position: 'top', labels: { color: '#9aa4b2', boxWidth: 12 } }
            }
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

    // Update local usage chart immediately based on active appliances
    if (usageChart && appliancePieChart) {
        const labels = appliances.map(a => a.name);
        const data = appliances.map(a => (a.wattage * a.hours * a.quantity * 30) / 1000);

        usageChart.data.labels = labels;
        usageChart.data.datasets[0].data = data;
        usageChart.update();

        appliancePieChart.data.labels = labels;
        appliancePieChart.data.datasets[0].data = data;
        appliancePieChart.update();
    }
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

        // Update Comparison Chart
        if (comparisonChart) {
            comparisonChart.data.datasets[0].data = [data.base_units, data.adjusted_units];
            comparisonChart.update();
        }

        // Simulate Trend logic across 12 months using the adjustment scale
        if (trendChart) {
            const baseMonthAvg = data.base_units;
            const varianceRatio = data.adjusted_units / (data.base_units || 1);

            const simulatedBase = Array(12).fill(0).map((_, i) => {
                const seasonFactor = 1 + (0.2 * Math.sin((i / 11) * Math.PI * 2));
                return baseMonthAvg * seasonFactor;
            });

            const simulatedAdj = simulatedBase.map(b => b * varianceRatio);

            trendChart.data.datasets[0].data = simulatedBase;
            trendChart.data.datasets[1].data = simulatedAdj;
            trendChart.update();
        }

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

initCharts();
