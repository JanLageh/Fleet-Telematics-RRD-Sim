from pydantic import BaseModel, Field


class VehicleBase(BaseModel):
    id: str = Field(..., description="Unique vehicle identifier")
    name: str = Field(..., description="Display name / Fleet ID")
    model: str = Field(..., description="Vehicle make and model")
    battery_capacity_kwh: float = Field(..., description="Nominal battery capacity in kWh")
    baseline_efficiency_wh_km: float = Field(..., description="Baseline efficiency in Wh/km")
    current_soc: float = Field(..., ge=0.0, le=100.0, description="Current State of Charge (%)")
    current_soh: float = Field(..., ge=0.0, le=100.0, description="Current State of Health (%)")
    status: str = Field(default="AVAILABLE", description="Vehicle operational status")


class Vehicle(VehicleBase):
    pass
