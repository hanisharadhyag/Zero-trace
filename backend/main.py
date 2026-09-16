from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import (
    upload_router,
    device_router,
    findings_router,
    risk_router,
    attack_router,
    copilot_router,
)
from api.report import router as report_router
from database import init_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_database()
    print("SIH26155 Backend Started")
    yield
    print("SIH26155 Backend Stopped")


app = FastAPI(
    title="Zero-Trace AI Network Security Auditor",
    description="Enterprise AI-Driven Multi-Vendor Network Security Compliance Auditor",
    version="2.0.0",
    lifespan=lifespan,
)

# ----------------------------------------------------
# CORS
# ----------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------
# API Routers
# ----------------------------------------------------
app.include_router(upload_router, prefix="/api", tags=["Upload"])
app.include_router(device_router, prefix="/api", tags=["Devices"])
app.include_router(findings_router, prefix="/api", tags=["Findings"])
app.include_router(risk_router, prefix="/api", tags=["Risk"])
app.include_router(attack_router, prefix="/api", tags=["Attack Path"])

# AI Copilot
app.include_router(copilot_router)

# Executive Report (DO NOT add another /api prefix)
app.include_router(report_router)

# ----------------------------------------------------
# System APIs
# ----------------------------------------------------
@app.get("/", tags=["System"])
def root():
    return {
        "project": "Zero-Trace",
        "status": "Running",
        "version": "2.0.0",
        "service": "Enterprise AI Network Security Auditor",
    }


@app.get("/health", tags=["System"])
def health():
    return {
        "status": "healthy",
        "database": "connected",
        "api": "online",
        "copilot": "ready",
        "report_api": "ready",
    }
