def calculate_bill(units: float) -> float:
    """Implement slab-based billing"""
    bill = 0.0
    if units <= 100:
        bill = units * 0.10
    elif units <= 300:
        bill = (100 * 0.10) + ((units - 100) * 0.15)
    else:
        bill = (100 * 0.10) + (200 * 0.15) + ((units - 300) * 0.20)
    return bill
