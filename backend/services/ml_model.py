import os
import joblib
import logging

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "model", "model.pkl")

_model = None
logger = logging.getLogger(__name__)

def load_model():
    global _model
    if _model is not None:
        return
        
    try:
        if os.path.exists(MODEL_PATH):
            _model = joblib.load(MODEL_PATH)
            logger.info("Loaded ML adjustment model successfully.")
        else:
            logger.warning(f"Model not found at {MODEL_PATH}. It will need to be trained.")
    except Exception as e:
        logger.error(f"Error loading model: {e}")

def get_adjustment_factor(base_units: float, hour_of_day: int, month: int) -> float:
    # Attempt to load just in case it wasn't
    if _model is None:
        load_model()
        
    if _model is None:
        # Fallback if no model exists so app doesn't break
        return 0.0
        
    try:
        import pandas as pd
        input_data = pd.DataFrame([{
            'base_units': base_units,
            'hour_of_day': hour_of_day,
            'month': month
        }])
        
        pred = _model.predict(input_data)
        # XGBoost output depends on objective, assuming float
        return float(pred[0])
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        return 0.0
