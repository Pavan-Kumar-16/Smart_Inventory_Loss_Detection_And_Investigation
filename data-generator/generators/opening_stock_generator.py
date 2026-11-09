
import pandas as pd
import numpy as np

from config.settings import RANDOM_SEED, OUTPUT_DIR


def generate_opening_stock():
    input_file = OUTPUT_DIR / "store_skus.csv"

    if not input_file.exists():
        raise FileNotFoundError(
            "store_skus.csv not found. Run store_sku_generator first."
        )

    store_skus = pd.read_csv(input_file)

    rng = np.random.default_rng(RANDOM_SEED + 5)

    opening_movements = []

    for index, row in store_skus.iterrows():
        opening_quantity = int(rng.integers(20, 201))

        opening_movements.append({
            "movement_id": f"MOV-2026-{index + 1:08d}",
            "store_id": row["store_id"],
            "sku_id": row["sku_id"],
            "movement_type": "OPENING",
            "quantity": opening_quantity,
            "movement_timestamp": "2026-01-01 00:00:00",
            "reason": "INITIAL_STOCK_LOAD",
            "employee_id": None,
            "shift_id": None,
            "transfer_group_id": None
        })

    result = pd.DataFrame(opening_movements)

    # Basic validation
    if result["movement_id"].duplicated().any():
        raise ValueError("Duplicate movement IDs detected.")

    if (result["quantity"] <= 0).any():
        raise ValueError("Opening quantities must be positive.")

    if result[["store_id", "sku_id"]].duplicated().any():
        raise ValueError("Duplicate opening stock for a store-SKU pair.")

    output_file = OUTPUT_DIR / "opening_movements.csv"
    result.to_csv(output_file, index=False)

    print(f"Generated {len(result)} opening stock movements")
    print(f"Unique stores: {result['store_id'].nunique()}")
    print(f"Unique SKUs: {result['sku_id'].nunique()}")
    print(f"Total opening units: {result['quantity'].sum()}")
    print(f"Saved to: {output_file}")

    return result


if __name__ == "__main__":
    generate_opening_stock()

