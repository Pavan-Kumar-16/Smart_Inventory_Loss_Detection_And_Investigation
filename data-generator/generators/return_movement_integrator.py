
import pandas as pd

from config.settings import OUTPUT_DIR


def integrate_returns():
    movements_file = OUTPUT_DIR / "inventory_movements.csv"
    returns_file = OUTPUT_DIR / "returns.csv"

    movements = pd.read_csv(movements_file)
    returns = pd.read_csv(returns_file)

    # Remove previously generated RETURN_IN movements.
    movements = movements[
        ~(
            (movements["movement_type"] == "RETURN_IN")
            & (movements["reason"] == "CUSTOMER_RETURN")
        )
    ].copy()

    # Clear old links so repeated execution is safe.
    returns["return_movement_id"] = None

    sales = movements[
        movements["movement_type"] == "SALE"
    ].set_index("movement_id")

    existing_numbers = (
        movements["movement_id"]
        .str.extract(r"MOV-2026-(\d+)")[0]
        .dropna()
        .astype(int)
    )

    next_number = (
        int(existing_numbers.max()) + 1
        if not existing_numbers.empty else 1
    )

    new_movements = []

    for index, returned in returns.iterrows():

        if returned["status"] != "APPROVED":
            continue

        original_id = returned["original_movement_id"]

        if original_id not in sales.index:
            raise ValueError(
                f"Original sale not found: {original_id}"
            )

        sale = sales.loc[original_id]

        if (
            returned["store_id"] != sale["store_id"]
            or returned["sku_id"] != sale["sku_id"]
            or returned["return_quantity"] <= 0
            or returned["return_quantity"] > sale["quantity"]
        ):
            raise ValueError(
                f"Invalid return: {returned['return_id']}"
            )

        movement_id = f"MOV-2026-{next_number:08d}"
        next_number += 1

        returns.loc[index, "return_movement_id"] = movement_id

        new_movements.append({
            "movement_id": movement_id,
            "store_id": returned["store_id"],
            "sku_id": returned["sku_id"],
            "movement_type": "RETURN_IN",
            "quantity": int(returned["return_quantity"]),
            "movement_timestamp": returned["return_timestamp"],
            "reason": "CUSTOMER_RETURN",
            "employee_id": returned["employee_id"],
            "shift_id": returned["shift_id"],
            "transfer_group_id": None
        })

    new_movements_df = pd.DataFrame(new_movements)

    combined = pd.concat(
        [movements, new_movements_df],
        ignore_index=True
    )

    if combined["movement_id"].duplicated().any():
        raise ValueError("Duplicate movement IDs detected.")

    if returns["return_movement_id"].isna().any():
        raise ValueError("One or more returns have no movement link.")

    combined.to_csv(movements_file, index=False)
    returns.to_csv(returns_file, index=False)

    print("Return integration completed successfully.")
    print(f"Return records: {len(returns)}")
    print(f"RETURN_IN movements: {len(new_movements_df)}")
    print(
        f"Return movement links: "
        f"{returns['return_movement_id'].nunique()}"
    )
    print(
        f"Total returned units: "
        f"{new_movements_df['quantity'].sum()}"
    )


if __name__ == "__main__":
    integrate_returns()
