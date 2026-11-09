from datetime import datetime
from sqlalchemy import text

from app.database import engine


ALLOWED_STATUSES = {
    "OPEN",
    "ASSIGNED",
    "INVESTIGATING",
    "RESOLVED",
    "ESCALATED",
}


def get_next_investigation_id(connection):
    """Generate the next ID in the format INV-2026-000001."""

    result = connection.execute(
        text("""
            SELECT COALESCE(
                MAX(CAST(SUBSTRING(investigation_id, 10) AS UNSIGNED)),
                0
            ) + 1
            FROM investigations
            WHERE investigation_id LIKE 'INV-2026-%'
        """)
    )

    next_number = result.scalar()

    return f"INV-2026-{int(next_number):06d}"


def create_investigation(alert_id, assigned_to=None, changed_by=None):
    """Create an investigation for an existing shrinkage alert."""

    with engine.begin() as connection:

        # Check whether the alert exists.
        alert = connection.execute(
            text("""
                SELECT alert_id
                FROM shrinkage_alerts
                WHERE alert_id = :alert_id
            """),
            {"alert_id": alert_id}
        ).first()

        if not alert:
            raise ValueError("Shrinkage alert not found.")

        # Prevent duplicate investigations for the same alert.
        existing = connection.execute(
            text("""
                SELECT investigation_id
                FROM investigations
                WHERE alert_id = :alert_id
            """),
            {"alert_id": alert_id}
        ).first()

        if existing:
            raise ValueError(
                f"An investigation already exists: {existing[0]}"
            )

        # Validate the assigned employee, if provided.
        if assigned_to:
            employee = connection.execute(
                text("""
                    SELECT employee_id
                    FROM employees
                    WHERE employee_id = :employee_id
                """),
                {"employee_id": assigned_to}
            ).first()

            if not employee:
                raise ValueError("Assigned employee not found.")

        # Validate the person creating the investigation.
        if changed_by:
            creator = connection.execute(
                text("""
                    SELECT employee_id
                    FROM employees
                    WHERE employee_id = :employee_id
                """),
                {"employee_id": changed_by}
            ).first()

            if not creator:
                raise ValueError("Employee creating the investigation not found.")

        investigation_id = get_next_investigation_id(connection)

        initial_status = "ASSIGNED" if assigned_to else "OPEN"

        # Create the investigation.
        connection.execute(
            text("""
                INSERT INTO investigations (
                    investigation_id,
                    alert_id,
                    assigned_to,
                    status
                )
                VALUES (
                    :investigation_id,
                    :alert_id,
                    :assigned_to,
                    :status
                )
            """),
            {
                "investigation_id": investigation_id,
                "alert_id": alert_id,
                "assigned_to": assigned_to,
                "status": initial_status
            }
        )

        # Record the initial event in the audit history.
        connection.execute(
            text("""
                INSERT INTO investigation_history (
                    investigation_id,
                    previous_status,
                    new_status,
                    notes,
                    changed_by
                )
                VALUES (
                    :investigation_id,
                    NULL,
                    :new_status,
                    :notes,
                    :changed_by
                )
            """),
            {
                "investigation_id": investigation_id,
                "new_status": initial_status,
                "notes": "Investigation created from shrinkage alert.",
                "changed_by": changed_by
            }
        )

        return {
            "message": "Investigation created successfully.",
            "investigation_id": investigation_id,
            "alert_id": alert_id,
            "status": initial_status,
            "assigned_to": assigned_to
        }


def get_all_investigations():
    """Retrieve all investigations with their related alert details."""

    with engine.connect() as connection:

        result = connection.execute(
            text("""
                SELECT
                    i.investigation_id,
                    i.alert_id,
                    i.assigned_to,
                    i.status,
                    i.outcome,
                    i.opened_at,
                    i.closed_at,
                    a.store_id,
                    a.sku_id,
                    a.rule_code,
                    a.reason,
                    a.risk_score
                FROM investigations i
                JOIN shrinkage_alerts a
                    ON i.alert_id = a.alert_id
                ORDER BY i.opened_at DESC
            """)
        )

        return [dict(row) for row in result.mappings().all()]


def get_investigation_by_id(investigation_id):
    """Retrieve one investigation and its history."""

    with engine.connect() as connection:

        investigation = connection.execute(
            text("""
                SELECT
                    i.*,
                    a.store_id,
                    a.sku_id,
                    a.rule_code,
                    a.reason,
                    a.risk_score
                FROM investigations i
                JOIN shrinkage_alerts a
                    ON i.alert_id = a.alert_id
                WHERE i.investigation_id = :investigation_id
            """),
            {"investigation_id": investigation_id}
        ).mappings().first()

        if not investigation:
            raise ValueError("Investigation not found.")

        history = connection.execute(
            text("""
                SELECT
                    history_id,
                    previous_status,
                    new_status,
                    notes,
                    changed_by,
                    changed_at
                FROM investigation_history
                WHERE investigation_id = :investigation_id
                ORDER BY changed_at ASC, history_id ASC
            """),
            {"investigation_id": investigation_id}
        ).mappings().all()

        return {
            "investigation": dict(investigation),
            "history": [dict(row) for row in history]
        }


def update_investigation_status(
    investigation_id,
    new_status,
    outcome=None,
    notes=None,
    changed_by=None
):
    """Update investigation status and preserve its history."""

    new_status = new_status.upper()

    if new_status not in ALLOWED_STATUSES:
        raise ValueError(
            f"Invalid status. Allowed statuses: {sorted(ALLOWED_STATUSES)}"
        )

    with engine.begin() as connection:

        investigation = connection.execute(
            text("""
                SELECT status
                FROM investigations
                WHERE investigation_id = :investigation_id
            """),
            {"investigation_id": investigation_id}
        ).mappings().first()

        if not investigation:
            raise ValueError("Investigation not found.")

        previous_status = investigation["status"]

        if changed_by:
            employee = connection.execute(
                text("""
                    SELECT employee_id
                    FROM employees
                    WHERE employee_id = :employee_id
                """),
                {"employee_id": changed_by}
            ).first()

            if not employee:
                raise ValueError("Employee making the update not found.")

        # Set the closure timestamp only when resolved.
        connection.execute(
            text("""
                UPDATE investigations
                SET
                    status = :new_status,
                    outcome = :outcome,
                    closed_at = CASE
                        WHEN :new_status = 'RESOLVED' THEN CURRENT_TIMESTAMP
                        ELSE NULL
                    END
                WHERE investigation_id = :investigation_id
            """),
            {
                "new_status": new_status,
                "outcome": outcome,
                "investigation_id": investigation_id
            }
        )

        # Save the status change in the history table.
        connection.execute(
            text("""
                INSERT INTO investigation_history (
                    investigation_id,
                    previous_status,
                    new_status,
                    notes,
                    changed_by
                )
                VALUES (
                    :investigation_id,
                    :previous_status,
                    :new_status,
                    :notes,
                    :changed_by
                )
            """),
            {
                "investigation_id": investigation_id,
                "previous_status": previous_status,
                "new_status": new_status,
                "notes": notes or "Investigation status updated.",
                "changed_by": changed_by
            }
        )

        return {
            "message": "Investigation updated successfully.",
            "investigation_id": investigation_id,
            "previous_status": previous_status,
            "new_status": new_status,
            "outcome": outcome
        }


def add_investigation_note(investigation_id, notes, changed_by=None):
    """Add a note without changing the investigation status."""

    if not notes or not notes.strip():
        raise ValueError("Investigation note cannot be empty.")

    with engine.begin() as connection:

        investigation = connection.execute(
            text("""
                SELECT status
                FROM investigations
                WHERE investigation_id = :investigation_id
            """),
            {"investigation_id": investigation_id}
        ).mappings().first()

        if not investigation:
            raise ValueError("Investigation not found.")

        if changed_by:
            employee = connection.execute(
                text("""
                    SELECT employee_id
                    FROM employees
                    WHERE employee_id = :employee_id
                """),
                {"employee_id": changed_by}
            ).first()

            if not employee:
                raise ValueError("Employee making the note not found.")

        current_status = investigation["status"]

        connection.execute(
            text("""
                INSERT INTO investigation_history (
                    investigation_id,
                    previous_status,
                    new_status,
                    notes,
                    changed_by
                )
                VALUES (
                    :investigation_id,
                    :previous_status,
                    :new_status,
                    :notes,
                    :changed_by
                )
            """),
            {
                "investigation_id": investigation_id,
                "previous_status": current_status,
                "new_status": current_status,
                "notes": notes.strip(),
                "changed_by": changed_by
            }
        )

        return {
            "message": "Investigation note added successfully.",
            "investigation_id": investigation_id,
            "status": current_status
        }
def assign_investigation(investigation_id, assigned_to, changed_by=None):
    """Assign an investigation to an existing employee."""

    with engine.begin() as connection:

        # Check that the investigation exists.
        investigation = connection.execute(
            text("""
                SELECT status
                FROM investigations
                WHERE investigation_id = :investigation_id
            """),
            {"investigation_id": investigation_id}
        ).mappings().first()

        if not investigation:
            raise ValueError("Investigation not found.")

        # Check that the employee exists.
        employee = connection.execute(
            text("""
                SELECT employee_id
                FROM employees
                WHERE employee_id = :employee_id
            """),
            {"employee_id": assigned_to}
        ).first()

        if not employee:
            raise ValueError("Assigned employee not found.")

        # Validate the person making the assignment.
        if changed_by:
            creator = connection.execute(
                text("""
                    SELECT employee_id
                    FROM employees
                    WHERE employee_id = :employee_id
                """),
                {"employee_id": changed_by}
            ).first()

            if not creator:
                raise ValueError("Employee making the assignment not found.")

        previous_status = investigation["status"]

        if previous_status == "RESOLVED":
            raise ValueError("A resolved investigation cannot be reassigned.")

        # Update employee assignment and investigation status.
        connection.execute(
            text("""
                UPDATE investigations
                SET
                    assigned_to = :assigned_to,
                    status = 'ASSIGNED'
                WHERE investigation_id = :investigation_id
            """),
            {
                "assigned_to": assigned_to,
                "investigation_id": investigation_id
            }
        )

        # Record the assignment in the audit history.
        connection.execute(
            text("""
                INSERT INTO investigation_history (
                    investigation_id,
                    previous_status,
                    new_status,
                    notes,
                    changed_by
                )
                VALUES (
                    :investigation_id,
                    :previous_status,
                    'ASSIGNED',
                    :notes,
                    :changed_by
                )
            """),
            {
                "investigation_id": investigation_id,
                "previous_status": previous_status,
                "notes": f"Investigation assigned to employee {assigned_to}.",
                "changed_by": changed_by
            }
        )

        return {
            "message": "Investigation assigned successfully.",
            "investigation_id": investigation_id,
            "assigned_to": assigned_to,
            "previous_status": previous_status,
            "new_status": "ASSIGNED"
        }