
import pandas as pd
import mysql.connector

from config.settings import OUTPUT_DIR
from config.db_config import DB_CONFIG


def read_csv(filename):
    path = OUTPUT_DIR / filename

    if not path.exists():
        raise FileNotFoundError(f"Missing file: {filename}")

    return pd.read_csv(path)


def clean_value(value):
    if pd.isna(value):
        return None
    return value


def insert_data(cursor, table, columns, records):
    if not records:
        print(f"{table}: 0 records")
        return

    column_names = ", ".join(f"`{col}`" for col in columns)
    placeholders = ", ".join(["%s"] * len(columns))

    query = (
        f"INSERT INTO `{table}` ({column_names}) "
        f"VALUES ({placeholders})"
    )

    cursor.executemany(query, records)

    print(f"{table}: {cursor.rowcount} records inserted")


def dataframe_records(df, columns):
    records = []

    for _, row in df.iterrows():
        records.append(
            tuple(clean_value(row[column]) for column in columns)
        )

    return records


def load_database():
    connection = None

    try:
        print("\n========== MYSQL DATA LOADING ==========\n")

        # Load generated CSV files.
        stores = read_csv("stores.csv")
        skus = read_csv("skus.csv")
        employees = read_csv("employees.csv")
        roles = read_csv("roles.csv")
        employee_roles = read_csv("employee_roles.csv")
        shifts = read_csv("shifts.csv")
        store_skus = read_csv("store_skus.csv")
        promotions = read_csv("promotions.csv")
        promotion_skus = read_csv("promotion_skus.csv")
        movements = read_csv("inventory_movements.csv")
        returns = read_csv("returns.csv")
        counts = read_csv("cycle_counts.csv")

        # Check required promotion schema.
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()

        cursor.execute("""
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'promotions'
        """)

        promotion_columns = {
            row[0] for row in cursor.fetchall()
        }

        required_promotion_columns = {
            "store_id",
            "promotion_type",
            "discount_percentage"
        }

        if not required_promotion_columns.issubset(
            promotion_columns
        ):
            raise ValueError(
                "Promotions table is missing required columns. "
                "Check the promotions schema update."
            )

        # Avoid accidentally inserting duplicate data.
        target_tables = [
            "stores",
            "skus",
            "employees",
            "roles",
            "employee_roles",
            "shifts",
            "store_skus",
            "promotions",
            "promotion_skus",
            "inventory_movements",
            "returns",
            "cycle_counts",
        ]

        for table in target_tables:
            cursor.execute(f"SELECT COUNT(*) FROM `{table}`")
            count = cursor.fetchone()[0]

            if count > 0:
                raise ValueError(
                    f"Table '{table}' already contains {count} rows. "
                    "Loader stopped to prevent duplicate imports."
                )

        # Build employee-role assignment lookup.
        role_lookup = {}

        for _, assignment in employee_roles.iterrows():
            key = (
                assignment["employee_id"],
                assignment["store_id"]
            )

            role_lookup[key] = assignment["employee_role_id"]

        # Resolve each operational movement to its role assignment.
        movement_role_ids = []

        for _, movement in movements.iterrows():
            employee_id = movement["employee_id"]
            store_id = movement["store_id"]

            if pd.isna(employee_id):
                movement_role_ids.append(None)
                continue

            key = (employee_id, store_id)

            if key not in role_lookup:
                raise ValueError(
                    f"No role assignment found for employee "
                    f"{employee_id} at {store_id}"
                )

            movement_role_ids.append(role_lookup[key])

        movements["employee_role_id"] = movement_role_ids

        # Check return movement references.
        if returns["return_movement_id"].isna().any():
            raise ValueError(
                "Some returns do not have return movement IDs. "
                "Run return_movement_integrator first."
            )

      

        # 1. Stores
        insert_data(
            cursor,
            "stores",
            [
                "store_id",
                "store_name",
                "city",
                "store_type",
                "status"
            ],
            dataframe_records(
                stores,
                [
                    "store_id",
                    "store_name",
                    "city",
                    "store_type",
                    "status"
                ]
            )
        )

        # 2. SKUs
        insert_data(
            cursor,
            "skus",
            [
                "sku_id",
                "product_name",
                "category",
                "unit",
                "status"
            ],
            dataframe_records(
                skus,
                [
                    "sku_id",
                    "product_name",
                    "category",
                    "unit",
                    "status"
                ]
            )
        )

        # 3. Employees
        insert_data(
            cursor,
            "employees",
            [
                "employee_id",
                "employee_name",
                "status"
            ],
            dataframe_records(
                employees,
                [
                    "employee_id",
                    "employee_name",
                    "status"
                ]
            )
        )

        # 4. Roles
        insert_data(
            cursor,
            "roles",
            ["role_id", "role_name"],
            dataframe_records(
                roles,
                ["role_id", "role_name"]
            )
        )

        # 5. Employee role assignments
        insert_data(
            cursor,
            "employee_roles",
            [
                "assignment_id",
                "employee_id",
                "role_id",
                "store_id",
                "valid_from",
                "valid_to"
            ],
            dataframe_records(
                employee_roles,
                [
                    "employee_role_id",
                    "employee_id",
                    "role_id",
                    "store_id",
                    "effective_from",
                    "effective_to"
                ]
            )
        )

        # 6. Shifts
        insert_data(
            cursor,
            "shifts",
            [
                "shift_id",
                "employee_id",
                "store_id",
                "start_time",
                "end_time"
            ],
            dataframe_records(
                shifts,
                [
                    "shift_id",
                    "employee_id",
                    "store_id",
                    "shift_start",
                    "shift_end"
                ]
            )
        )

        # 7. Store-SKU assortment
        # MySQL generates store_sku_id automatically.
        insert_data(
            cursor,
            "store_skus",
            [
                "store_id",
                "sku_id",
                "reorder_level",
                "is_active"
            ],
            dataframe_records(
                store_skus,
                [
                    "store_id",
                    "sku_id",
                    "reorder_level",
                    "is_active"
                ]
            )
        )

        # 8. Promotions
        insert_data(
            cursor,
            "promotions",
            [
                "promotion_id",
                "promotion_name",
                "start_date",
                "end_date",
                "status",
                "store_id",
                "promotion_type",
                "discount_percentage"
            ],
            dataframe_records(
                promotions,
                [
                    "promotion_id",
                    "promotion_name",
                    "start_date",
                    "end_date",
                    "status",
                    "store_id",
                    "promotion_type",
                    "discount_percentage"
                ]
            )
        )

        # 9. Promotion-SKU relationships
        insert_data(
            cursor,
            "promotion_skus",
            ["promotion_id", "sku_id"],
            dataframe_records(
                promotion_skus,
                ["promotion_id", "sku_id"]
            )
        )

        movements["movement_type"] = movements["movement_type"].replace({
        "ADJUSTMENT": "ADJUSTMENT_OUT"
        })
         
        # 10. Inventory movements
        insert_data(
            cursor,
            "inventory_movements",
            [
                "movement_id",
                "store_id",
                "sku_id",
                "movement_type",
                "quantity",
                "reason",
                "employee_role_id",
                "shift_id",
                "transfer_group_id",
                "occurred_at"
            ],
            dataframe_records(
                movements,
                [
                    "movement_id",
                    "store_id",
                    "sku_id",
                    "movement_type",
                    "quantity",
                    "reason",
                    "employee_role_id",
                    "shift_id",
                    "transfer_group_id",
                    "movement_timestamp"
                ]
            )
        )

        # 11. Returns
        insert_data(
            cursor,
            "returns",
            [
                "return_id",
                "store_id",
                "sku_id",
                "original_sale_id",
                "return_movement_id",
                "quantity",
                "reason",
                "returned_at"
            ],
            dataframe_records(
                returns,
                [
                    "return_id",
                    "store_id",
                    "sku_id",
                    "original_movement_id",
                    "return_movement_id",
                    "return_quantity",
                    "return_reason",
                    "return_timestamp"
                ]
            )
        )

        # 12. Cycle counts
        insert_data(
    cursor,
    "cycle_counts",
    [
        "count_id",
        "store_id",
        "sku_id",
        "expected_qty",
        "counted_qty",
        "employee_id",
        "counted_at"
    ],
    dataframe_records(
        counts,
        [
            "count_id",
            "store_id",
            "sku_id",
            "expected_quantity",
            "physical_quantity",
            "employee_id",
            "count_timestamp"
        ]
    )
)


        connection.commit()

        print("\n========================================")
        print("MYSQL DATA LOADING COMPLETED")
        print("All imported records committed successfully.")
        print("========================================")

    except Exception as error:
        if connection and connection.is_connected():
            connection.rollback()

        print("\nMYSQL DATA LOADING FAILED")
        print("Reason:", error)
        print("Transaction rolled back.")

        raise

    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()


if __name__ == "__main__":
    load_database()
