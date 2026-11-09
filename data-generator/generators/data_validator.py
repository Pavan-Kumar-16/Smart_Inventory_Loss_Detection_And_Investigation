
import pandas as pd

from config.settings import OUTPUT_DIR


def validate_data():
    errors = []
    passed = []

    def check(condition, success_message, error_message):
        if condition:
            passed.append(success_message)
        else:
            errors.append(error_message)

    def load_csv(filename):
        path = OUTPUT_DIR / filename

        if not path.exists():
            errors.append(f"Missing file: {filename}")
            return None

        return pd.read_csv(path)

    print("\n========== DATA VALIDATION STARTED ==========\n")

    # 1. Load master and transaction data
    stores = load_csv("stores.csv")
    skus = load_csv("skus.csv")
    employees = load_csv("employees.csv")
    roles = load_csv("roles.csv")
    employee_roles = load_csv("employee_roles.csv")
    shifts = load_csv("shifts.csv")
    store_skus = load_csv("store_skus.csv")
    movements = load_csv("inventory_movements.csv")
    counts = load_csv("cycle_counts.csv")
    returns = load_csv("returns.csv")
    promotions = load_csv("promotions.csv")
    promotion_skus = load_csv("promotion_skus.csv")
    ground_truth = load_csv("ground_truth.csv")
    transfer_test = load_csv("transfer_double_count_test.csv")

    required_data = [
        stores, skus, employees, roles, employee_roles,
        shifts, store_skus, movements, counts, returns,
        promotions, promotion_skus, ground_truth, transfer_test
    ]

    if any(data is None for data in required_data):
        print("\nValidation stopped: missing input files.")
        print("\n".join(errors))
        return False

    # 2. Primary key uniqueness
    primary_keys = [
        (stores, "store_id", "stores"),
        (skus, "sku_id", "skus"),
        (employees, "employee_id", "employees"),
        (roles, "role_id", "roles"),
        (employee_roles, "employee_role_id", "employee_roles"),
        (shifts, "shift_id", "shifts"),
        (store_skus, "store_sku_id", "store_skus"),
        (movements, "movement_id", "inventory_movements"),
        (counts, "count_id", "cycle_counts"),
        (returns, "return_id", "returns"),
        (promotions, "promotion_id", "promotions"),
    ]

    for df, column, name in primary_keys:
        check(
            column in df.columns and df[column].is_unique,
            f"{name}: unique {column}",
            f"{name}: missing or duplicate {column}"
        )

    # 3. Master data references
    store_ids = set(stores["store_id"])
    sku_ids = set(skus["sku_id"])
    employee_ids = set(employees["employee_id"])
    role_ids = set(roles["role_id"])

    valid_pairs = set(
        zip(store_skus["store_id"], store_skus["sku_id"])
    )

    check(
        employees["store_id"].isin(store_ids).all(),
        "Employee store references valid",
        "Invalid store reference in employees"
    )

    check(
        employee_roles["employee_id"].isin(employee_ids).all()
        and employee_roles["role_id"].isin(role_ids).all(),
        "Employee-role references valid",
        "Invalid employee or role reference"
    )

    check(
        set(zip(shifts["employee_id"], shifts["store_id"]))
        .issubset(set(zip(employees["employee_id"], employees["store_id"]))),
        "Shift employee-store assignments valid",
        "Shift employee-store mismatch"
    )

    check(
        store_skus[["store_id", "sku_id"]].apply(
            lambda row: (row["store_id"], row["sku_id"]) in valid_pairs,
            axis=1
        ).all(),
        "Store-SKU assortment valid",
        "Invalid store-SKU assignment"
    )

    # 4. Inventory movement validation
    check(
        movements["store_id"].isin(store_ids).all()
        and movements["sku_id"].isin(sku_ids).all(),
        "Movement store and SKU references valid",
        "Invalid store or SKU in inventory movements"
    )

    check(
        movements["quantity"].gt(0).all(),
        "Movement quantities are positive",
        "Zero or negative movement quantity found"
    )

    allowed_types = {
        "OPENING", "RECEIPT", "SALE", "DAMAGE",
        "ADJUSTMENT", "TRANSFER_OUT", "TRANSFER_IN", "RETURN_IN"
    }

    check(
        set(movements["movement_type"]).issubset(allowed_types),
        "Movement types valid",
        "Unknown movement type found"
    )

    check(
        movements.loc[
            movements["movement_type"] == "ADJUSTMENT",
            "reason"
        ].fillna("").str.strip().ne("").all(),
        "Baseline adjustments have reasons",
        "Baseline adjustment missing a reason"
    )

    # 5. Employee and shift references in movements
    operational = movements[
        movements["movement_type"] != "OPENING"
    ].copy()

    shift_lookup = shifts.set_index("shift_id")

    shift_references_valid = True

    for _, movement in operational.iterrows():
        shift_id = movement["shift_id"]
        employee_id = movement["employee_id"]

        if pd.isna(shift_id) or shift_id not in shift_lookup.index:
            shift_references_valid = False
            break

        shift = shift_lookup.loc[shift_id]

        if (
            shift["employee_id"] != employee_id
            or shift["store_id"] != movement["store_id"]
        ):
            shift_references_valid = False
            break

    check(
        shift_references_valid,
        "Movement employee and shift references valid",
        "Movement has an invalid employee-shift-store combination"
    )

    # 6. Transfer reconciliation
    transfer_rows = movements[
        movements["movement_type"].isin(
            ["TRANSFER_OUT", "TRANSFER_IN"]
        )
    ]

    transfer_valid = True

    for group_id, group in transfer_rows.groupby("transfer_group_id"):
        if (
            pd.isna(group_id)
            or len(group) != 2
            or set(group["movement_type"])
            != {"TRANSFER_OUT", "TRANSFER_IN"}
            or group["quantity"].nunique() != 1
            or group["sku_id"].nunique() != 1
            or group["store_id"].nunique() != 2
        ):
            transfer_valid = False
            break

    check(
        transfer_valid,
        "Transfer pairs reconcile",
        "Invalid or unmatched transfer pair found"
    )

    # 7. Ending stock validation
    signs = {
        "OPENING": 1,
        "RECEIPT": 1,
        "SALE": -1,
        "DAMAGE": -1,
        "ADJUSTMENT": -1,
        "TRANSFER_OUT": -1,
        "TRANSFER_IN": 1,
        "RETURN_IN": 1,
    }

    movements["stock_effect"] = (
        movements["quantity"]
        * movements["movement_type"].map(signs)
    )

    ending_stock = movements.groupby(
        ["store_id", "sku_id"]
    )["stock_effect"].sum()

    check(
        ending_stock.ge(0).all(),
        "Ending inventory balances are non-negative",
        "Negative ending inventory found"
    )

    # 8. Cycle count arithmetic and references
    check(
        counts["store_id"].isin(store_ids).all()
        and counts["sku_id"].isin(sku_ids).all()
        and counts["employee_id"].isin(employee_ids).all(),
        "Cycle count references valid",
        "Invalid cycle count reference"
    )

    arithmetic_valid = (
        counts["variance"]
        == counts["expected_quantity"] - counts["physical_quantity"]
    ).all()

    check(
        arithmetic_valid,
        "Cycle count variance calculations correct",
        "Incorrect cycle count variance"
    )

    # Recalculate expected inventory as of each count timestamp.
    movements["movement_timestamp"] = pd.to_datetime(
        movements["movement_timestamp"]
    )
    counts["count_timestamp"] = pd.to_datetime(
        counts["count_timestamp"]
    )

    count_totals_valid = True

    for _, count in counts.iterrows():
        relevant = movements[
            (movements["store_id"] == count["store_id"])
            & (movements["sku_id"] == count["sku_id"])
            & (
                movements["movement_timestamp"]
                <= count["count_timestamp"]
            )
        ]

        calculated = relevant["stock_effect"].sum()

        if calculated != count["expected_quantity"]:
            count_totals_valid = False
            break

    check(
        count_totals_valid,
        "Cycle count expected quantities reconcile to movements",
        "Cycle count expected quantity does not match movement history"
    )

    # 9. Return validation
    sales = movements[
        movements["movement_type"] == "SALE"
    ].set_index("movement_id")

    returns_valid = True

    for _, returned in returns.iterrows():
        original_id = returned["original_movement_id"]

        if original_id not in sales.index:
            returns_valid = False
            break

        original_sale = sales.loc[original_id]

        if (
            returned["store_id"] != original_sale["store_id"]
            or returned["sku_id"] != original_sale["sku_id"]
            or returned["return_quantity"] <= 0
            or returned["return_quantity"] > original_sale["quantity"]
        ):
            returns_valid = False
            break

    check(
        returns_valid,
        "Returns reference valid original sales",
        "Invalid return reference or quantity"
    )

    # 10. Promotion validation
    promotion_ids = set(promotions["promotion_id"])

    promotion_links_valid = (
        promotion_skus["promotion_id"].isin(promotion_ids).all()
        and promotion_skus["sku_id"].isin(sku_ids).all()
    )

    check(
        promotion_links_valid,
        "Promotion-SKU references valid",
        "Invalid promotion or SKU reference"
    )

    # 11. Ground truth validation
    expected_anomalies = {
        "WRONG_STORE",
        "MISSING_ADJUSTMENT_REASON",
        "COUNT_TIMESTAMP_INCONSISTENCY",
        "TRANSFER_DOUBLE_COUNT_RISK",
    }

    actual_anomalies = set(ground_truth["anomaly_type"])

    check(
        expected_anomalies.issubset(actual_anomalies),
        "All four planted anomaly labels exist",
        "One or more expected anomaly labels are missing"
    )

    check(
        len(transfer_test) == 2,
        "Transfer double-count test has two legs",
        "Transfer double-count test should contain two legs"
    )

    # 12. Report
    print("\n========== VALIDATION RESULTS ==========\n")

    for item in passed:
        print(f"[PASS] {item}")

    for item in errors:
        print(f"[FAIL] {item}")

    print("\n========================================")
    print(f"Checks passed: {len(passed)}")
    print(f"Checks failed: {len(errors)}")

    if not errors:
        print("\nBASELINE DATA VALIDATION PASSED")
    else:
        print("\nBASELINE DATA VALIDATION FAILED")

    print(
        "\nINFO: Returns are currently stored separately. "
        "They have not yet been added as RETURN_IN movements "
        "to the inventory ledger."
    )

    print("\n========================================")

    return len(errors) == 0


if __name__ == "__main__":
    validate_data()
