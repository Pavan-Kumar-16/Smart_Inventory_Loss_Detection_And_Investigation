from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.investigation_service import (
    create_investigation,
    get_all_investigations,
    get_investigation_by_id,
    update_investigation_status,
    add_investigation_note,
    assign_investigation,
)

router = APIRouter(
    prefix="/api/investigations",
    tags=["Investigations"]
)


# Request models

class CreateInvestigationRequest(BaseModel):
    alert_id: str
    assigned_to: Optional[str] = None
    changed_by: Optional[str] = None


class UpdateStatusRequest(BaseModel):
    status: str
    outcome: Optional[str] = None
    notes: Optional[str] = None
    changed_by: Optional[str] = None


class AddNoteRequest(BaseModel):
    notes: str
    changed_by: Optional[str] = None

class AssignInvestigationRequest(BaseModel):
    assigned_to: str
    changed_by: Optional[str] = None

# Create an investigation

@router.post("/")
def create_new_investigation(request: CreateInvestigationRequest):
    try:
        return create_investigation(
            alert_id=request.alert_id,
            assigned_to=request.assigned_to,
            changed_by=request.changed_by
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


# Get all investigations

@router.get("/")
def list_investigations():
    return get_all_investigations()


# Get one investigation with its history

@router.get("/{investigation_id}")
def get_investigation(investigation_id: str):
    try:
        return get_investigation_by_id(investigation_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))


# Update investigation status

@router.patch("/{investigation_id}/status")
def update_status(
    investigation_id: str,
    request: UpdateStatusRequest
):
    try:
        return update_investigation_status(
            investigation_id=investigation_id,
            new_status=request.status,
            outcome=request.outcome,
            notes=request.notes,
            changed_by=request.changed_by
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


# Add an investigation note

@router.post("/{investigation_id}/notes")
def add_note(
    investigation_id: str,
    request: AddNoteRequest
):
    try:
        return add_investigation_note(
            investigation_id=investigation_id,
            notes=request.notes,
            changed_by=request.changed_by
        )
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))

@router.patch("/{investigation_id}/assign")
def assign_existing_investigation(
    investigation_id: str,
    request: AssignInvestigationRequest
):
    try:
        return assign_investigation(
            investigation_id=investigation_id,
            assigned_to=request.assigned_to,
            changed_by=request.changed_by
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))