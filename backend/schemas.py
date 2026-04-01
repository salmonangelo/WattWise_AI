from pydantic import BaseModel
from typing import List, Optional

class ApplianceInput(BaseModel):
    name: str
    wattage: float
    hours: float
    quantity: int

class PredictRequest(BaseModel):
    appliances: List[ApplianceInput]
    hour_of_day: int
    month: int

class PredictResponse(BaseModel):
    base_units: float
    adjusted_units: float
    estimated_bill: float
    co2_emissions: float

class TipsRequest(BaseModel):
    appliances: List[ApplianceInput]

class TipItem(BaseModel):
    appliance: str
    tip: str

class TipsResponse(BaseModel):
    tips: List[TipItem]
