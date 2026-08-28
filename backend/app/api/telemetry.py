from datetime import UTC, datetime

from fastapi import APIRouter

from app.schemas.telemetry import TelemetryEvent, TelemetryResponse

router = APIRouter()

# In-memory latest telemetry storage
LATEST_TELEMETRY: dict[str, TelemetryEvent] = {}


@router.post("/ingest", response_model=TelemetryResponse)
def ingest_telemetry(event: TelemetryEvent) -> TelemetryResponse:
    """Ingest a single telemetry snapshot for a vehicle."""
    LATEST_TELEMETRY[event.vehicle_id] = event
    return TelemetryResponse(
        success=True,
        message=f"Telemetry ingested for {event.vehicle_id}",
        data=event,
    )


@router.get("/{vehicle_id}/latest", response_model=TelemetryResponse)
def get_latest_telemetry(vehicle_id: str) -> TelemetryResponse:
    """Retrieve the latest telemetry recorded for a vehicle."""
    event = LATEST_TELEMETRY.get(vehicle_id)
    if not event:
        # Provide fallback/synthetic reading if none ingested yet
        event = TelemetryEvent(
            vehicle_id=vehicle_id,
            timestamp=datetime.now(UTC),
            soc=80.0,
            soh=95.0,
            speed_kph=0.0,
            odometer_km=12500.0,
            ambient_temp_c=22.0,
            pack_temp_c=25.0,
        )
    return TelemetryResponse(
        success=True,
        message="Telemetry retrieved",
        data=event,
    )
