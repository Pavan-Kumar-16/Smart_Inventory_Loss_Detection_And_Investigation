
from datetime import datetime
import re

from sqlalchemy import text

from app.database import engine


SHORTAGE_RULE = "SHORTAGE_DETECTED"


def calculate_risk_score(expected_qty, counted_qty):
    shortage = expected_qty - counted_qty

    if expected_qty <= 0 or shortage <= 0:
        return 0.0

    shortage_percentage = (shortage / expected_qty) * 100

    # Initial prioritization score, not a probability of theft.
    score = 25 + (0.75 * shortage_percentage)

    return round(min(score, 100), 2)


def get_next_alert_number(connection):
    existing_ids = connection.execute(
        text("""
            SELECT alert_id
            FROM shrinkage_alerts
            WHERE alert_id LIKE 'SHR-2026-%'
        """)
    ).scalars().all()

    numbers = []

    for alert_id in existing_ids:
        match = re.search(r"SHR-2026-(\d+)$", alert_id)

        if match:
            numbers.append(int(match.group(1)))

    return max(numbers, default=0) + 1


def run_shrinkage_detection():
    alerts_created = 0
    evidence_created = 0
    skipped_alerts = 0

    with engine.begin() as connection:

        shortage_counts = connection.execute(
            text("""
                SELECT
                    count_id,
                    store_id,
                    sku_id,
                    expected_qty,
                    counted_qty,
                    counted_at
                FROM cycle_counts
                WHERE expected_qty > counted_qty
                ORDER BY counted_at
            """)
        ).mappings().all()

        next_number = get_next_alert_number(connection)

        for count in shortage_counts:

            # Avoid generating duplicate alerts on repeated runs.
            existing_alert = connection.execute(
                text("""
                    SELECT alert_id
                    FROM shrinkage_alerts
                    WHERE count_id = :count_id
                      AND rule_code = :rule_code
                    LIMIT 1
                """),
                {
                    "count_id": count["count_id"],
                    "rule_code": SHORTAGE_RULE
                }
            ).first()

            if existing_alert:
                skipped_alerts += 1
                continue

            shortage = (
                count["expected_qty"] - count["counted_qty"]
            )

            risk_score = calculate_risk_score(
                count["expected_qty"],
                count["counted_qty"]
            )

            alert_id = f"SHR-2026-{next_number:06d}"
            next_number += 1

            reason = (
                f"Inventory shortage detected at store "
                f"{count['store_id']} for SKU {count['sku_id']}. "
                f"Expected quantity: {count['expected_qty']}; "
                f"physical quantity: {count['counted_qty']}; "
                f"shortage: {shortage} units."
            )

            # Create the alert.
            connection.execute(
                text("""
                    INSERT INTO shrinkage_alerts (
                        alert_id,
                        store_id,
                        sku_id,
                        count_id,
                        rule_code,
                        reason,
                        risk_score,
                        status
                    )
                    VALUES (
                        :alert_id,
                        :store_id,
                        :sku_id,
                        :count_id,
                        :rule_code,
                        :reason,
                        :risk_score,
                        'OPEN'
                    )
                """),
                {
                    "alert_id": alert_id,
                    "store_id": count["store_id"],
                    "sku_id": count["sku_id"],
                    "count_id": count["count_id"],
                    "rule_code": SHORTAGE_RULE,
                    "reason": reason,
                    "risk_score": risk_score
                }
            )

            # Attach cycle count evidence.
            connection.execute(
                text("""
                    INSERT INTO alert_evidence (
                        alert_id,
                        count_id,
                        evidence_description
                    )
                    VALUES (
                        :alert_id,
                        :count_id,
                        :description
                    )
                """),
                {
                    "alert_id": alert_id,
                    "count_id": count["count_id"],
                    "description": (
                        f"Physical count was {count['counted_qty']} "
                        f"units against expected stock of "
                        f"{count['expected_qty']} units."
                    )
                }
            )

            evidence_created += 1

            # Retrieve the three most recent movements
            # before or at the cycle count timestamp.
            recent_movements = connection.execute(
                text("""
                    SELECT
                        movement_id,
                        movement_type,
                        quantity,
                        occurred_at,
                        reason
                    FROM inventory_movements
                    WHERE store_id = :store_id
                      AND sku_id = :sku_id
                      AND occurred_at <= :counted_at
                    ORDER BY occurred_at DESC, movement_id DESC
                    LIMIT 3
                """),
                {
                    "store_id": count["store_id"],
                    "sku_id": count["sku_id"],
                    "counted_at": count["counted_at"]
                }
            ).mappings().all()

            for movement in recent_movements:

                connection.execute(
                    text("""
                        INSERT INTO alert_evidence (
                            alert_id,
                            movement_id,
                            evidence_description
                        )
                        VALUES (
                            :alert_id,
                            :movement_id,
                            :description
                        )
                    """),
                    {
                        "alert_id": alert_id,
                        "movement_id": movement["movement_id"],
                        "description": (
                            f"Related movement: "
                            f"{movement['movement_type']}, "
                            f"quantity: {movement['quantity']}, "
                            f"timestamp: {movement['occurred_at']}, "
                            f"reason: {movement['reason'] or 'Not provided'}."
                        )
                    }
                )

                evidence_created += 1

            alerts_created += 1

    return {
        "message": "Shrinkage detection completed",
        "shortage_counts_found": len(shortage_counts),
        "alerts_created": alerts_created,
        "evidence_records_created": evidence_created,
        "existing_alerts_skipped": skipped_alerts
    }


def run_repeated_adjustment_detection():
    rule_code = "REPEATED_ADJUSTMENTS"

    alerts_created = 0
    evidence_created = 0
    skipped_alerts = 0

    with engine.begin() as connection:

        groups = connection.execute(
            text("""
                SELECT
                    store_id,
                    sku_id,
                    employee_role_id,
                    DATE(occurred_at) AS adjustment_date,
                    COUNT(*) AS adjustment_count,
                    SUM(quantity) AS total_units
                FROM inventory_movements
                WHERE movement_type = 'ADJUSTMENT_OUT'
                  AND employee_role_id IS NOT NULL
                GROUP BY
                    store_id,
                    sku_id,
                    employee_role_id,
                    DATE(occurred_at)
                HAVING COUNT(*) >= 2
                ORDER BY adjustment_count DESC
            """)
        ).mappings().all()

        next_number = get_next_alert_number(connection)

        for group in groups:

            reason = (
                f"Repeated outgoing adjustments detected at "
                f"store {group['store_id']} for SKU {group['sku_id']}, "
                f"employee-role assignment {group['employee_role_id']}, "
                f"on {group['adjustment_date']}. "
                f"Adjustment count: {group['adjustment_count']}; "
                f"total adjusted units: {group['total_units']}."
            )

            # Prevent duplicate alerts when this rule is run again.
            existing = connection.execute(
                text("""
                    SELECT alert_id
                    FROM shrinkage_alerts
                    WHERE rule_code = :rule_code
                      AND reason = :reason
                    LIMIT 1
                """),
                {
                    "rule_code": rule_code,
                    "reason": reason
                }
            ).first()

            if existing:
                skipped_alerts += 1
                continue

            # Initial prioritization score, not fraud probability.
            risk_score = min(
                40 + (group["adjustment_count"] - 2) * 10
                + float(group["total_units"]) * 0.5,
                90
            )

            alert_id = f"SHR-2026-{next_number:06d}"
            next_number += 1

            connection.execute(
                text("""
                    INSERT INTO shrinkage_alerts (
                        alert_id,
                        store_id,
                        sku_id,
                        count_id,
                        rule_code,
                        reason,
                        risk_score,
                        status
                    )
                    VALUES (
                        :alert_id,
                        :store_id,
                        :sku_id,
                        NULL,
                        :rule_code,
                        :reason,
                        :risk_score,
                        'OPEN'
                    )
                """),
                {
                    "alert_id": alert_id,
                    "store_id": group["store_id"],
                    "sku_id": group["sku_id"],
                    "rule_code": rule_code,
                    "reason": reason,
                    "risk_score": round(risk_score, 2)
                }
            )

            # Retrieve every movement supporting this alert.
            related_movements = connection.execute(
                text("""
                    SELECT movement_id, quantity, occurred_at, reason
                    FROM inventory_movements
                    WHERE store_id = :store_id
                      AND sku_id = :sku_id
                      AND employee_role_id = :employee_role_id
                      AND movement_type = 'ADJUSTMENT_OUT'
                      AND DATE(occurred_at) = :adjustment_date
                    ORDER BY occurred_at
                """),
                {
                    "store_id": group["store_id"],
                    "sku_id": group["sku_id"],
                    "employee_role_id": group["employee_role_id"],
                    "adjustment_date": group["adjustment_date"]
                }
            ).mappings().all()

            for movement in related_movements:
                connection.execute(
                    text("""
                        INSERT INTO alert_evidence (
                            alert_id,
                            movement_id,
                            evidence_description
                        )
                        VALUES (
                            :alert_id,
                            :movement_id,
                            :description
                        )
                    """),
                    {
                        "alert_id": alert_id,
                        "movement_id": movement["movement_id"],
                        "description": (
                            f"Outgoing adjustment of "
                            f"{movement['quantity']} units at "
                            f"{movement['occurred_at']}. "
                            f"Recorded reason: "
                            f"{movement['reason'] or 'Not provided'}."
                        )
                    }
                )

                evidence_created += 1

            alerts_created += 1

    return {
        "message": "Repeated adjustment detection completed",
        "repeated_groups_found": len(groups),
        "alerts_created": alerts_created,
        "evidence_records_created": evidence_created,
        "existing_alerts_skipped": skipped_alerts
    }

    
def run_transfer_inconsistency_detection():
    rule_code = "TRANSFER_INCONSISTENCY"

    alerts_created = 0
    evidence_created = 0
    skipped_alerts = 0

    with engine.begin() as connection:

        # Find transfer groups that do not reconcile.
        groups = connection.execute(
            text("""
                SELECT
                    transfer_group_id,
                    sku_id,
                    COUNT(*) AS movement_count,

                    SUM(
                        CASE WHEN movement_type = 'TRANSFER_OUT'
                        THEN 1 ELSE 0 END
                    ) AS outgoing_count,

                    SUM(
                        CASE WHEN movement_type = 'TRANSFER_IN'
                        THEN 1 ELSE 0 END
                    ) AS incoming_count,

                    SUM(
                        CASE WHEN movement_type = 'TRANSFER_OUT'
                        THEN quantity ELSE 0 END
                    ) AS outgoing_units,

                    SUM(
                        CASE WHEN movement_type = 'TRANSFER_IN'
                        THEN quantity ELSE 0 END
                    ) AS incoming_units,

                    COUNT(DISTINCT store_id) AS store_count

                FROM inventory_movements
                WHERE transfer_group_id IS NOT NULL
                GROUP BY transfer_group_id, sku_id

                HAVING
                    COUNT(*) != 2
                    OR outgoing_count != 1
                    OR incoming_count != 1
                    OR outgoing_units != incoming_units
                    OR store_count != 2
            """)
        ).mappings().all()

        next_number = get_next_alert_number(connection)

        for group in groups:

            # Retrieve all movement records for this transfer.
            movements = connection.execute(
                text("""
                    SELECT
                        movement_id,
                        store_id,
                        sku_id,
                        movement_type,
                        quantity,
                        occurred_at,
                        reason
                    FROM inventory_movements
                    WHERE transfer_group_id = :transfer_group_id
                      AND sku_id = :sku_id
                    ORDER BY occurred_at
                """),
                {
                    "transfer_group_id": group["transfer_group_id"],
                    "sku_id": group["sku_id"]
                }
            ).mappings().all()

            if not movements:
                continue

            # Use the outgoing store as the primary alert location.
            # If no outgoing leg exists, use the first available store.
            outgoing = next(
                (
                    movement for movement in movements
                    if movement["movement_type"] == "TRANSFER_OUT"
                ),
                None
            )

            primary_store = (
                outgoing["store_id"]
                if outgoing else movements[0]["store_id"]
            )

            reason = (
                f"Transfer reconciliation failed for transfer group "
                f"{group['transfer_group_id']} and SKU "
                f"{group['sku_id']}. "
                f"Movement records: {group['movement_count']}; "
                f"outgoing legs: {group['outgoing_count']}; "
                f"incoming legs: {group['incoming_count']}; "
                f"outgoing units: {group['outgoing_units']}; "
                f"incoming units: {group['incoming_units']}; "
                f"distinct stores: {group['store_count']}."
            )

            # Prevent duplicate alerts.
            existing = connection.execute(
                text("""
                    SELECT alert_id
                    FROM shrinkage_alerts
                    WHERE rule_code = :rule_code
                      AND reason = :reason
                    LIMIT 1
                """),
                {
                    "rule_code": rule_code,
                    "reason": reason
                }
            ).first()

            if existing:
                skipped_alerts += 1
                continue

            # High-priority review score, not fraud probability.
            risk_score = 85.0

            alert_id = f"SHR-2026-{next_number:06d}"
            next_number += 1

            connection.execute(
                text("""
                    INSERT INTO shrinkage_alerts (
                        alert_id,
                        store_id,
                        sku_id,
                        count_id,
                        rule_code,
                        reason,
                        risk_score,
                        status
                    )
                    VALUES (
                        :alert_id,
                        :store_id,
                        :sku_id,
                        NULL,
                        :rule_code,
                        :reason,
                        :risk_score,
                        'OPEN'
                    )
                """),
                {
                    "alert_id": alert_id,
                    "store_id": primary_store,
                    "sku_id": group["sku_id"],
                    "rule_code": rule_code,
                    "reason": reason,
                    "risk_score": risk_score
                }
            )

            # Attach every transfer leg as supporting evidence.
            for movement in movements:

                connection.execute(
                    text("""
                        INSERT INTO alert_evidence (
                            alert_id,
                            movement_id,
                            evidence_description
                        )
                        VALUES (
                            :alert_id,
                            :movement_id,
                            :description
                        )
                    """),
                    {
                        "alert_id": alert_id,
                        "movement_id": movement["movement_id"],
                        "description": (
                            f"Transfer movement: "
                            f"{movement['movement_type']}; "
                            f"store: {movement['store_id']}; "
                            f"quantity: {movement['quantity']}; "
                            f"timestamp: {movement['occurred_at']}; "
                            f"reason: {movement['reason'] or 'Not provided'}."
                        )
                    }
                )

                evidence_created += 1

            alerts_created += 1

    return {
        "message": "Transfer inconsistency detection completed",
        "inconsistent_groups_found": len(groups),
        "alerts_created": alerts_created,
        "evidence_records_created": evidence_created,
        "existing_alerts_skipped": skipped_alerts
    }

