def calculate_base_units(appliances) -> float:
    # units = sum((wattage × hours × quantity × 30) / 1000)
    total_units = 0.0
    for app in appliances:
        total_units += (app.wattage * app.hours * app.quantity * 30.0) / 1000.0
    return total_units
