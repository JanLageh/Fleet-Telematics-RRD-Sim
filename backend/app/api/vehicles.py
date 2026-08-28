from fastapi import APIRouter, HTTPException

from app.schemas.vehicle import Vehicle

router = APIRouter()

# Mock vehicle data store for initial development
MOCK_FLEET: dict[str, Vehicle] = {
    "EV-001": Vehicle(
        id="EV-001",
        name="Delivery Van Alpha",
        model="BrightDrop Zevo 600",
        battery_capacity_kwh=165.0,
        baseline_efficiency_wh_km=320.0,
        current_soc=85.0,
        current_soh=94.0,
        status="AVAILABLE",
    ),
    "EV-002": Vehicle(
        id="EV-002",
        name="Cargo Van Beta",
        model="Ford E-Transit",
        battery_capacity_kwh=68.0,
        baseline_efficiency_wh_km=280.0,
        current_soc=45.0,
        current_soh=88.0,
        status="CHARGING",
    ),
    "EV-003": Vehicle(
        id="EV-003",
        name="Utility Truck Gamma",
        model="Rivian EDV 700",
        battery_capacity_kwh=135.0,
        baseline_efficiency_wh_km=310.0,
        current_soc=92.0,
        current_soh=98.0,
        status="AVAILABLE",
    ),
}


@router.get("/", response_model=list[Vehicle])
def list_vehicles() -> list[Vehicle]:
    """Retrieve all vehicles in the fleet."""
    return list(MOCK_FLEET.values())


@router.get("/{vehicle_id}", response_model=Vehicle)
def get_vehicle(vehicle_id: str) -> Vehicle:
    """Retrieve details for a single vehicle."""
    vehicle = MOCK_FLEET.get(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehicle '{vehicle_id}' not found")
    return vehicle
