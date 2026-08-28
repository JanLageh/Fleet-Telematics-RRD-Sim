from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import simulation, telemetry, vehicles

app = FastAPI(
    title="EV Fleet Telematics & RRD Simulation API",
    version="1.0.0",
)

# CORS setup for Vite frontend dev server (port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vehicles.router, prefix="/api/vehicles", tags=["Vehicles"])
app.include_router(telemetry.router, prefix="/api/telemetry", tags=["Telemetry"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["Simulation"])


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
