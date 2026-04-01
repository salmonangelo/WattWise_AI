def calculate_co2(units: float) -> float:
    # Approx 0.4 kg of CO2 per kWh
    CO2_FACTOR = 0.4
    return units * CO2_FACTOR
