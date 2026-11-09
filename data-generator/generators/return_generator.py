
import pandas as pd
import numpy as np

from config.settings import RANDOM_SEED, OUTPUT_DIR


def generate_returns():
    rng = np.random.default_rng(RANDOM_SEED + 8)

    movements = pd.read_csv(
        OUTPUT_DIR / "inventory_movements.csv"
    )
    shifts = pd.read_csv(OUTPUT_DIR / "shifts.csv")

    movements["movement_timestamp"] = pd.to_datetime(
        movements["movement_timestamp"]
    )
    shifts["shift_start"] = pd.to_datetime(shifts["shift_start"])
    shifts["shift_end"] = pd.to_datetime(shifts["shift_end"])

    sales = movements[
        movements["movement_type"] == "SALE"
    ].copy()

    # Only select sales with a following day in our shift schedule.
    sales = sales[
        sales["movement_timestamp"].dt.date
        < pd.Timestamp("2026-01-07").date()
    ]

    return_count = max(1, int(len(sales) * 0.05))

    selected = rng.choice(
        sales.index,
        size=min(return_count, len(sales)),
        replace=False
    )

    returns = []

    for number, index in enumerate(selected, start=1):
        sale = sales.loc[index]

        next_day = (
            sale["movement_timestamp"].normalize()
            + pd.Timedelta(days=1)
        )

        eligible_shifts = shifts[
            (shifts["store_id"] == sale["store_id"])
            & (shifts["shift_start"].dt.date == next_day.date())
        ]

        if eligible_shifts.empty:
            continue

        shift = eligible_shifts.iloc[
            int(rng.integers(0, len(eligible_shifts)))
        ]

        duration = int(
            (shift["shift_end"] - shift["shift_start"]).total_seconds()
        )

        return_timestamp = shift["shift_start"] + pd.Timedelta(
            seconds=int(rng.integers(0, duration))
        )

        quantity = int(
            rng.integers(1, int(sale["quantity"]) + 1)
        )

        returns.append({
            "return_id": f"RET-2026-{number:06d}",
            "store_id": sale["store_id"],
            "sku_id": sale["sku_id"],
            "original_movement_id": sale["movement_id"],
            "employee_id": shift["employee_id"],
            "shift_id": shift["shift_id"],
            "return_quantity": quantity,
            "return_reason": rng.choice([
                "CUSTOMER_DAMAGED",
                "WRONG_PRODUCT",
                "CUSTOMER_CHANGED_MIND",
                "DEFECTIVE_PRODUCT"
            ]),
            "return_timestamp": return_timestamp,
            "status": "APPROVED"
        })

    result = pd.DataFrame(returns)

    result.to_csv(
        OUTPUT_DIR / "returns.csv",
        index=False
    )

    print(f"Generated {len(result)} returns")
    print(
        f"Total returned units: "
        f"{result['return_quantity'].sum()}"
    )
    print("Employee and shift references included.")
    print(f"Saved to: {OUTPUT_DIR / 'returns.csv'}")

    return result


if __name__ == "__main__":
    generate_returns()
