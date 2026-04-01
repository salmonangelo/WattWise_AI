from typing import List, Any

def generate_tips(appliances: List[Any]) -> list:
    # Sort appliances by total monthly usage (wattage * hours * quantity * 30 / 1000)
    sorted_apps = sorted(
        appliances, 
        key=lambda x: (x.wattage * x.hours * x.quantity * 30) / 1000.0, 
        reverse=True
    )
    
    tips = []
    # Provide tips for top consuming appliances (up to 3)
    count = 0
    for app in sorted_apps:
        if count >= 3:
            break
        count += 1
        name_lower = app.name.lower()
        tip_text = f"Consider reducing the usage of the {app.name} to lower your bill."
        if "ac" in name_lower or "conditioner" in name_lower:
            tip_text = f"Set your {app.name} thermostat to 24°C (75°F) for optimal efficiency. Clean the filters monthly."
        elif "heater" in name_lower:
            tip_text = f"Use your {app.name} efficiently by insulating the room. Consider turning it off early."
        elif "fridge" in name_lower or "refrigerator" in name_lower:
            tip_text = f"Ensure the {app.name} door seals are tight and keep it away from heat sources."
        elif "washer" in name_lower or "washing" in name_lower:
            tip_text = f"Run full loads in your {app.name} and use cold water when possible."
        elif "tv" in name_lower or "television" in name_lower:
            tip_text = f"Lower the brightness on your {app.name} and turn it off when nobody is watching."
            
        tips.append({"appliance": app.name, "tip": tip_text})
        
    return tips
