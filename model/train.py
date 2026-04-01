import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
import joblib
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "appliances_energy.csv")
MODEL_OUT_PATH = os.path.join(BASE_DIR, "model.pkl")

def main():
    # 1. Strict Dataset Loading
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}. Please ensure it is downloaded.")
        
    print(f"Loading dataset from: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    
    # Print dataset shape for verification
    print(f"Initial Dataset Shape: {df.shape}")
    
    # Provide fallback parsing if date column format differs, but usually it's standard.
    df['date'] = pd.to_datetime(df['date'])
    
    # 2. Proper Feature Engineering
    # We name it 'hour_of_day' as required by the existing ml_model.py
    df['hour_of_day'] = df['date'].dt.hour
    df['day_of_week'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    
    # Sort by date chronologically to ensure rolling works well temporally
    df = df.sort_values('date').reset_index(drop=True)
    
    # 3. Target Engineering (CRITICAL)
    # Use "Appliances" column
    # Compute rolling mean
    rolling_mean = df['Appliances'].rolling(window=10).mean()
    
    # Map proxy for 'base_units' to fit backend feature name
    df['base_units'] = rolling_mean
    
    # Define adjustment
    df['adjustment'] = (df['Appliances'] - df['base_units']) / df['base_units']
    
    # Drop rows with NaN values after rolling operation
    df = df.dropna(subset=['base_units', 'adjustment'])
    
    # Remove any infinite values in case base_units was somehow 0
    df = df.replace([np.inf, -np.inf], np.nan).dropna(subset=['adjustment'])
    
    # 4. Feature Selection
    # Use features: rolling_mean (base_units), hour, month
    feature_cols = ['base_units', 'hour_of_day', 'month']
    target_col = 'adjustment'
    
    X = df[feature_cols]
    y = df[target_col]
    
    # Logging feature columns
    print(f"Feature Columns: {feature_cols}")
    print(f"Processed Dataset Shape: {df.shape}")
    
    # 5. Model Training
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, shuffle=False)
    
    print("Training XGBoost Regressor...")
    model = xgb.XGBRegressor(
        objective='reg:squarederror',
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        random_state=42
    )
    model.fit(X_train, y_train)
    
    # Evaluate using R² score
    score = model.score(X_test, y_test)
    print(f"Model Test R² Score: {score:.4f}")
    
    # 6. Model Saving
    joblib.dump(model, MODEL_OUT_PATH)
    print(f"Model successfully saved to: {MODEL_OUT_PATH}")

if __name__ == "__main__":
    main()
