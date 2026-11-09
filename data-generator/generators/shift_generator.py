
import pandas as pd
import numpy as np

from config.settings import RANDOM_SEED, OUTPUT_DIR


def generate_shifts():
    employees_file = OUTPUT_DIR / "employees.csv"

    if not employees_file.exists():
        raise FileNotFoundError(
            "employees.csv not found. Run employee_generator first."
        )

    employees = pd.read_csv(employees_file)

    rng = np.random.default_rng(RANDOM_SEED + 3)

    shifts = []

    # Generate shifts for seven days
    dates = pd.date_range(
        start="2026-01-01",
        periods=7,
        freq="D"
    )

    shift_patterns = [
        ("08:00:00", "16:00:00"),
        ("09:00:00", "17:00:00"),
        ("14:00:00", "22:00:00"),
    ]

    shift_number = 1

    for _, employee in employees.iterrows():
        for shift_date in dates:

            # Choose one shift pattern for the employee
            pattern_index = int(rng.integers(0, len(shift_patterns)))
            start_time, end_time = shift_patterns[pattern_index]

            shift_start = pd.Timestamp(
                f"{shift_date.date()} {start_time}"
            )
            shift_end = pd.Timestamp(
                f"{shift_date.date()} {end_time}"
            )

            shifts.append({
                "shift_id": f"SHIFT-2026-{shift_number:06d}",
                "employee_id": employee["employee_id"],
                "store_id": employee["store_id"],
                "shift_start": shift_start,
                "shift_end": shift_end,
                "status": "COMPLETED"
            })

            shift_number += 1

    shifts_df = pd.DataFrame(shifts)

    output_file = OUTPUT_DIR / "shifts.csv"
    shifts_df.to_csv(output_file, index=False)

    print(f"Generated {len(shifts_df)} shifts")
    print(f"Unique employees: {shifts_df['employee_id'].nunique()}")
    print(f"Saved to: {output_file}")

    return shifts_df


if __name__ == "__main__":
    generate_shifts()
