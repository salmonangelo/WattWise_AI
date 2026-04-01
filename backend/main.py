from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.schemas import PredictRequest, PredictResponse, TipsRequest, TipsResponse
from backend.services import calculator, tariff, co2, ml_model, tips
import logging

app = FastAPI(title="WattWise AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logging.basicConfig(level=logging.INFO)
    ml_model.load_model()

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/predict", response_model=PredictResponse)
def predict_energy(request: PredictRequest):
    # 1. Base consumption calculation
    base = calculator.calculate_base_units(request.appliances)
    
    # 2. ML Adjustment
    adj_factor = ml_model.get_adjustment_factor(base, request.hour_of_day, request.month)
    
    # Final adjusted value
    adjusted = base * (1 + adj_factor)
    
    # Prevent negative values just in case
    adjusted = max(adjusted, 0.0)
    
    # 3. Tariff
    bill = tariff.calculate_bill(adjusted)
    
    # 4. CO2
    carbon = co2.calculate_co2(adjusted)
    
    return PredictResponse(
        base_units=float(base),
        adjusted_units=float(adjusted),
        estimated_bill=float(bill),
        co2_emissions=float(carbon)
    )

@app.post("/tips", response_model=TipsResponse)
def get_tips(request: TipsRequest):
    suggestions = tips.generate_tips(request.appliances)
    return TipsResponse(tips=suggestions)

# Mount the static frontend directory AFTER APIs
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
