
import pandas as pd
import numpy as np

from config.settings import RANDOM_SEED, TOTAL_CYCLE_COUNTS, OUTPUT_DIR


def generate_cycle_counts():
    rng = np.random.default_rng(RANDOM_SEED + 7)

    movements_file = OUTPUT_DIR / "inventory_movements.csv"
    store_skus_file = OUTPUT_DIR / "store_skus.csv"
    employees_file = OUTPUT_DIR / "employees.csv"

    for file in [movements_file, store_skus_file, employees_file]:
        if not file.exists():
            raise FileNotFoundError(f"{file.name} not found.")

    movements = pd.read_csv(movements_file)
    store_skus = pd.read_csv(store_skus_file)
    employees = pd.read_csv(employees_file)

    movements["movement_timestamp"] = pd.to_datetime(
        movements["movement_timestamp"]
    )

    # Define inventory effects.
    # Quantities are stored as positive numbers.
    movement_signs = {
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
        * movements["movement_type"].map(movement_signs)
    )

    if movements["stock_effect"].isna().any():
        raise ValueError("Unknown movement type found.")

    # Generate counts only for valid store-SKU combinations.
    eligible_pairs = store_skus[
        ["store_id", "sku_id"]
    ].drop_duplicates()

    employees_by_store = {
        store_id: group["employee_id"].tolist()
        for store_id, group in employees.groupby("store_id")
    }

    count_records = []

    for count_number in range(1, TOTAL_CYCLE_COUNTS + 1):

        pair_index = int(
            rng.integers(0, len(eligible_pairs))
        )
        pair = eligible_pairs.iloc[pair_index]

        store_id = pair["store_id"]
        sku_id = pair["sku_id"]

        # Choose a count date within the generated activity period.
        count_timestamp = pd.Timestamp("2026-01-08 10:00:00")

        # Only movements at or before the count timestamp count.
        relevant = movements[
            (movements["store_id"] == store_id)
            & (movements["sku_id"] == sku_id)
            & (
                movements["movement_timestamp"]
                <= count_timestamp
            )
        ]

        expected_stock = int(relevant["stock_effect"].sum())

        if expected_stock < 0:
            raise ValueError(
                f"Negative expected stock for {store_id}, {sku_id}. "
                "Movement generator needs stock-balance validation."
            )

        # Physical count starts close to expected stock.
        # Some counts contain small legitimate differences.
        variance = int(rng.choice([-2, -1, 0, 0, 0, 1, 2]))

        physical_count = max(0, expected_stock - variance)

        employee_options = employees_by_store.get(store_id, [])

        if not employee_options:
            raise ValueError(f"No employee found for {store_id}")

        employee_id = employee_options[
            int(rng.integers(0, len(employee_options)))
        ]

        count_records.append({
            "count_id": f"CNT-2026-{count_number:06d}",
            "store_id": store_id,
            "sku_id": sku_id,
            "employee_id": employee_id,
            "count_timestamp": count_timestamp,
            "expected_quantity": expected_stock,
            "physical_quantity": physical_count,
            "variance": expected_stock - physical_count,
            "status": (
                "SHORTAGE"
                if expected_stock > physical_count
                else "OVERAGE"
                if expected_stock < physical_count
                else "MATCHED"
            )
        })

    counts_df = pd.DataFrame(count_records)

    output_file = OUTPUT_DIR / "cycle_counts.csv"
    counts_df.to_csv(output_file, index=False)

    print(f"Generated {len(counts_df)} cycle counts")
    print("\nCount status summary:")
    print(counts_df["status"].value_counts().to_string())
    print(f"\nTotal shortage units: {counts_df['variance'].clip(lower=0).sum()}")
    print(f"Saved to: {output_file}")

    return counts_df


if __name__ == "__main__":
    generate_cycle_counts()
