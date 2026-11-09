
from fastapi import APIRouter
from sqlalchemy import text

from app.database import engine

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)


@router.get("/summary")
def get_dashboard_summary():

    query = text("""
        SELECT
            (SELECT COUNT(*) FROM stores
             WHERE status = 'ACTIVE') AS total_stores,

            (SELECT COUNT(*) FROM skus
             WHERE status = 'ACTIVE') AS total_skus,

            (SELECT COUNT(*) FROM inventory_movements)
                AS total_movements,

            (SELECT COUNT(*) FROM cycle_counts)
                AS total_cycle_counts,

            (SELECT COUNT(*) FROM cycle_counts
             WHERE expected_qty > counted_qty)
                AS shortage_counts,

            (SELECT COALESCE(SUM(expected_qty - counted_qty), 0)
             FROM cycle_counts
             WHERE expected_qty > counted_qty)
                AS shortage_units,

            (SELECT COUNT(*) FROM shrinkage_alerts)
                AS total_alerts,

            (SELECT COUNT(*) FROM investigations
             WHERE status IN ('OPEN', 'ASSIGNED',
                              'INVESTIGATING', 'ESCALATED'))
                AS active_investigations
    """)

    with engine.connect() as connection:
        result = connection.execute(query).mappings().first()

    return {
        "message": "Dashboard summary retrieved successfully",
        "data": dict(result)
    }


@router.get("/recent-alerts")
def get_recent_alerts():

    query = text("""
        SELECT
            a.alert_id,
            a.store_id,
            s.store_name,
            a.sku_id,
            p.product_name,
            a.rule_code,
            a.reason,
            a.risk_score,
            a.status,
            a.created_at
        FROM shrinkage_alerts a
        JOIN stores s ON a.store_id = s.store_id
        JOIN skus p ON a.sku_id = p.sku_id
        ORDER BY a.created_at DESC
        LIMIT 10
    """)

    with engine.connect() as connection:
        results = connection.execute(query).mappings().all()

    return {
        "data": [dict(row) for row in results]
    }


@router.get("/risk-distribution")
def get_risk_distribution():

    query = text("""
        SELECT
            CASE
                WHEN risk_score >= 70 THEN 'High'
                WHEN risk_score >= 40 THEN 'Medium'
                ELSE 'Low'
            END AS risk_level,
            COUNT(*) AS total
        FROM shrinkage_alerts
        GROUP BY risk_level
    """)

    with engine.connect() as connection:
        results = connection.execute(query).mappings().all()

    return {
        "data": [dict(row) for row in results]
    }


@router.get("/investigation-status")
def get_investigation_status():

    query = text("""
        SELECT
            status_list.status,
            COUNT(i.investigation_id) AS total
        FROM (
            SELECT 'OPEN' AS status
            UNION ALL SELECT 'ASSIGNED'
            UNION ALL SELECT 'INVESTIGATING'
            UNION ALL SELECT 'RESOLVED'
            UNION ALL SELECT 'ESCALATED'
        ) AS status_list
        LEFT JOIN investigations i
            ON i.status = status_list.status
        GROUP BY status_list.status
        ORDER BY FIELD(
            status_list.status,
            'OPEN',
            'ASSIGNED',
            'INVESTIGATING',
            'RESOLVED',
            'ESCALATED'
        )
    """)

    with engine.connect() as connection:
        results = connection.execute(query).mappings().all()

    return {
        "data": [dict(row) for row in results]
    }




@router.get("/alert-trend")
def get_alert_trend():

    query = text("""
        WITH RECURSIVE dates AS (
            SELECT CURRENT_DATE - INTERVAL 6 DAY AS alert_date

            UNION ALL

            SELECT alert_date + INTERVAL 1 DAY
            FROM dates
            WHERE alert_date < CURRENT_DATE
        )

        SELECT
            DATE_FORMAT(d.alert_date, '%Y-%m-%d') AS alert_date,
            COUNT(a.alert_id) AS total

        FROM dates d

        LEFT JOIN shrinkage_alerts a
            ON DATE(a.created_at) = d.alert_date

        GROUP BY d.alert_date
        ORDER BY d.alert_date
    """)

    with engine.connect() as connection:
        results = connection.execute(query).mappings().all()

    return {
        "data": [dict(row) for row in results]
    }

