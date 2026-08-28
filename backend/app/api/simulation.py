from fastapi import APIRouter, HTTPException

from app.api.vehicles import MOCK_FLEET
from app.core.simulator import calculate_simulation
from app.schemas.simulation import SimulationRequest, SimulationResponse

router = APIRouter()


@router.post("/run", response_model=SimulationResponse)
def run_simulation(req: SimulationRequest) -> SimulationResponse:
    """Run route range degradation simulation for a specified vehicle and route."""
    vehicle = MOCK_FLEET.get(req.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehicle '{req.vehicle_id}' not found")

    return calculate_simulation(req, vehicle)
