
from fastapi import APIRouter, HTTPException
from app.services.anomaly_validator import run_anomaly_validation

from app.services.detection_engine import (
    run_shrinkage_detection,
    run_repeated_adjustment_detection,
    run_transfer_inconsistency_detection
)

router = APIRouter(
    prefix="/api/detection",
    tags=["Inventory Loss Detection"]
)


@router.post("/run")
def run_detection():
    try:
        return run_shrinkage_detection()

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Detection failed: {str(error)}"
       )
@router.post("/repeated-adjustments")
def detect_repeated_adjustments():
    try:
        return run_repeated_adjustment_detection()

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Repeated adjustment detection failed: {str(error)}"
        )

@router.post("/transfer-inconsistencies")
def detect_transfer_inconsistencies():
    try:
        return run_transfer_inconsistency_detection()

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Transfer detection failed: {str(error)}"
        )

@router.post("/validate-anomalies")
def validate_anomalies():
    try:
        return run_anomaly_validation()

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Anomaly validation failed: {str(error)}"
        )
