
import pandas as pd
import numpy as np

from config.settings import RANDOM_SEED, TOTAL_MOVEMENTS, OUTPUT_DIR


def generate_inventory_movements():
    rng = np.random.default_rng(RANDOM_SEED + 6)

    required_files = [
        "opening_movements.csv",
        "store_skus.csv",
        "employees.csv",
        "shifts.csv",
    ]

    for filename in required_files:
        if not (OUTPUT_DIR / filename).exists():
            raise FileNotFoundError(f"{filename} not found.")

    opening = pd.read_csv(OUTPUT_DIR / "opening_movements.csv")
    store_skus = pd.read_csv(OUTPUT_DIR / "store_skus.csv")
    employees = pd.read_csv(OUTPUT_DIR / "employees.csv")
    shifts = pd.read_csv(OUTPUT_DIR / "shifts.csv")

    shifts["shift_start"] = pd.to_datetime(shifts["shift_start"])
    shifts["shift_end"] = pd.to_datetime(shifts["shift_end"])

    # Track stock separately for every store-SKU combination.
    stock = {
        (row["store_id"], row["sku_id"]): int(row["quantity"])
        for _, row in opening.iterrows()
    }

    employees_by_store = {
        store_id: group.to_dict("records")
        for store_id, group in employees.groupby("store_id")
    }

    shifts_by_employee = {
        employee_id: group.to_dict("records")
        for employee_id, group in shifts.groupby("employee_id")
    }

    assortment_by_store = {
        store_id: group["sku_id"].tolist()
        for store_id, group in store_skus.groupby("store_id")
    }

    stores = list(assortment_by_store.keys())

    movements = []
    movement_number = len(opening) + 1
    transfer_number = 1

    movement_types = [
        "RECEIPT", "SALE", "SALE", "SALE",
        "DAMAGE", "ADJUSTMENT", "TRANSFER"
    ]

    def create_movement(
        store_id, sku_id, movement_type, quantity,
        timestamp, employee, shift, reason,
        transfer_group_id=None
    ):
        nonlocal movement_number

        movements.append({
            "movement_id": f"MOV-2026-{movement_number:08d}",
            "store_id": store_id,
            "sku_id": sku_id,
            "movement_type": movement_type,
            "quantity": int(quantity),
            "movement_timestamp": timestamp.strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
            "reason": reason,
            "employee_id": employee["employee_id"],
            "shift_id": shift["shift_id"],
            "transfer_group_id": transfer_group_id,
        })

        movement_number += 1

    def get_employee_and_shift(store_id):
        employee_options = employees_by_store.get(store_id, [])

        if not employee_options:
            raise ValueError(f"No employees found for {store_id}")

        employee = employee_options[
            int(rng.integers(0, len(employee_options)))
        ]

        employee_shifts = shifts_by_employee.get(
            employee["employee_id"], []
        )

        shift = employee_shifts[
            int(rng.integers(0, len(employee_shifts)))
        ]

        duration = int(
            (shift["shift_end"] - shift["shift_start"]).total_seconds()
        )

        offset = int(rng.integers(0, duration))

        timestamp = shift["shift_start"] + pd.Timedelta(
            seconds=offset
        )

        return employee, shift, timestamp

    attempts = 0
    max_attempts = TOTAL_MOVEMENTS * 10

    while len(movements) < TOTAL_MOVEMENTS and attempts < max_attempts:
        attempts += 1

        source_store = stores[
            int(rng.integers(0, len(stores)))
        ]

        sku_options = assortment_by_store[source_store]

        sku_id = sku_options[
            int(rng.integers(0, len(sku_options)))
        ]

        movement_type = movement_types[
            int(rng.integers(0, len(movement_types)))
        ]

        requested_quantity = int(rng.integers(1, 21))

        employee, shift, timestamp = get_employee_and_shift(
            source_store
        )

        source_key = (source_store, sku_id)
        available_stock = stock[source_key]

        if movement_type == "TRANSFER":
            destinations = [
                store_id for store_id in stores
                if store_id != source_store
                and sku_id in assortment_by_store[store_id]
            ]

            if not destinations or available_stock <= 0:
                continue

            destination_store = destinations[
                int(rng.integers(0, len(destinations)))
            ]

            destination_options = []

            for destination_employee in employees_by_store.get(
                destination_store, []
            ):
                for destination_shift in shifts_by_employee.get(
                    destination_employee["employee_id"], []
                ):
                    overlap_start = max(
                        timestamp,
                        destination_shift["shift_start"]
                    )

                    overlap_end = min(
                        shift["shift_end"],
                        destination_shift["shift_end"]
                    )

                    if (
                        destination_shift["shift_start"].date()
                        == timestamp.date()
                        and overlap_start < overlap_end
                    ):
                        destination_options.append(
                            (destination_employee, destination_shift)
                        )

            if not destination_options:
                continue

            destination_employee, destination_shift = (
                destination_options[
                    int(rng.integers(0, len(destination_options)))
                ]
            )

            transfer_timestamp = max(
                timestamp,
                destination_shift["shift_start"]
            )

            quantity = min(requested_quantity, available_stock)

            transfer_group_id = (
                f"TRF-2026-{transfer_number:06d}"
            )
            transfer_number += 1

            create_movement(
                source_store, sku_id, "TRANSFER_OUT",
                quantity, transfer_timestamp,
                employee, shift, "INTER_STORE_TRANSFER",
                transfer_group_id
            )

            create_movement(
                destination_store, sku_id, "TRANSFER_IN",
                quantity, transfer_timestamp,
                destination_employee, destination_shift,
                "INTER_STORE_TRANSFER", transfer_group_id
            )

            # Update both stores' balances.
            stock[source_key] -= quantity

            destination_key = (destination_store, sku_id)
            stock[destination_key] += quantity

        else:
            if movement_type == "RECEIPT":
                quantity = requested_quantity
                reason = "SUPPLIER_DELIVERY"

                stock[source_key] += quantity

            else:
                # Never allow an outgoing movement to exceed stock.
                if available_stock <= 0:
                    continue

                quantity = min(
                    requested_quantity,
                    available_stock
                )

                reason = {
                    "SALE": "CUSTOMER_PURCHASE",
                    "DAMAGE": "DAMAGED_PRODUCT",
                    "ADJUSTMENT": "STOCK_CORRECTION",
                }[movement_type]

                stock[source_key] -= quantity

            create_movement(
                source_store, sku_id, movement_type,
                quantity, timestamp,
                employee, shift, reason
            )

    if len(movements) < TOTAL_MOVEMENTS:
        raise ValueError(
            f"Could only generate {len(movements)} movement rows "
            f"after {attempts} attempts. Check the assortment and "
            "opening stock configuration."
        )

    operational = pd.DataFrame(movements)

    combined = pd.concat(
        [opening, operational],
        ignore_index=True
    )

    if combined["movement_id"].duplicated().any():
        raise ValueError("Duplicate movement IDs detected.")

    if (combined["quantity"] <= 0).any():
        raise ValueError("Movement quantities must be positive.")

    if min(stock.values()) < 0:
        raise ValueError("Negative inventory balance detected.")

    output_file = OUTPUT_DIR / "inventory_movements.csv"
    combined.to_csv(output_file, index=False)

    print(f"Opening movements: {len(opening)}")
    print(f"Operational movement rows: {len(operational)}")
    print(f"Total movement rows: {len(combined)}")
    print(f"Minimum ending stock: {min(stock.values())}")
    print("\nMovement type summary:")
    print(combined["movement_type"].value_counts().to_string())
    print(f"\nSaved to: {output_file}")

    return combined


if __name__ == "__main__":
    generate_inventory_movements()
