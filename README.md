# WattWise AI – Smart Energy Planner ⚡

WattWise AI is a full-stack web application designed to help users intelligently estimate their energy consumption, predict electricity bills, and calculate their CO₂ footprint.

Unlike standard calculators, WattWise features a **Hybrid Architecture** that combines deterministic rules with a Machine Learning adjustment model for more dynamic and realistic estimates based on historical data patterns.

---

## 🏗️ Hybrid Architecture

WattWise uses two layers to compute energy usage:

1. **Deterministic Base (Non-AI)**: Calculates the raw theoretical consumption based exactly on what you input:
   `Base Units = sum((wattage × hours × quantity × 30 days) / 1000)`

2. **Machine Learning Adjustment (AI)**: A trained XGBoost regressor takes the deterministic base, the time of day, and the month, and predicts an *adjustment percentage*. This accounts for hidden inefficiencies or seasonal behaviors learned from historical energy usage patterns.

   `Final Units = Base Units × (1 + AI Adjustment)`

---

## 📊 The Dataset & Its Limitations

This model is trained using the **Appliances Energy Prediction** Kaggle dataset.

**Important Note on Dataset Usage:**
* **Purpose**: We use the dataset *strictly* to learn broad adjustment patterns (how much actual energy consumption deviates from a calculated baseline given the hour and month).
* **Limitation**: The dataset does NOT contain individual appliance-level inputs (e.g., it doesn't know you turned on a 1500W Microwave). Therefore, it cannot be used to directly predict consumption from scratch. 
* **Implementation**: We mapped the dataset's total appliance usage against synthesized baseline averages to train the AI on realistic variance patterns, rather than faking AI logic.

### Where to Place the Dataset
To train the model yourself with the real data, you must manually download `appliances_energy.csv` from Kaggle and place it here:
`model/data/appliances_energy.csv`

*(If the dataset is missing when you run the training script, the system will automatically generate a mock dataset so you can still test the pipeline!)*

---

## 🚀 Getting Started

### 1. Install Dependencies
Make sure you have Python 3.8+ installed, then run:
```bash
pip install -r requirements.txt
```

### 2. Train the ML Model
Before running the backend, you need to generate the `model.pkl` file:
```bash
python model/train.py
```
This script will load the dataset (or create a mock one), engineer the features, train the XGBoost model, and save it.

### 3. Run the Backend API
Return to the project root and start the FastAPI server:
```bash
uvicorn backend.main:app --reload
```
The API will be available at `http://localhost:8000`.

### 4. Run the Frontend
The frontend uses pure HTML, CSS, and Vanilla JS—no build tools required! 
You can simply open `frontend/index.html` in your browser, or serve it using Python:
```bash
cd frontend
python -m http.server 3000
```
Then visit `http://localhost:3000` in your browser.

---

## 🔌 API Reference

### `POST /predict`
Calculates energy estimation.
**Body:**
```json
{
  "appliances": [
    {"name": "AC", "wattage": 1500, "hours": 6, "quantity": 1}
  ],
  "hour_of_day": 18,
  "month": 7
}
```
**Returns:** `base_units`, `adjusted_units`, `estimated_bill`, `co2_emissions`

### `POST /tips`
Generates actionable energy-saving advice.
**Body:** Identical to `/predict` appliances list.
**Returns:** A list of tips tailored to the highest-consuming appliances.

### `GET /health`
Returns `{"status": "healthy"}` to check if the API is running.

---

## 🔮 Limitations & Future Improvements
* **Dataset Relevance**: The current dataset represents a specific house in Belgium. A future improvement would be allowing users to fine-tune the model with their own smart-meter data.
* **Pricing Models**: The current tariff calculation uses a hardcoded slab approach. This should be made configurable via the UI to match different regional electricity providers.
* **Granular Appliances**: Providing a database of preset appliances (e.g., selecting "Samsung Fridge" auto-fills typical wattage) would vastly improve UX.
