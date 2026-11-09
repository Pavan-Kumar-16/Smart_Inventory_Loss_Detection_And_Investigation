
import numpy as np
import pandas as pd

from config.settings import RANDOM_SEED, TOTAL_STORES, OUTPUT_DIR


def generate_stores():

    rng = np.random.default_rng(RANDOM_SEED + 1)

    cities = [
        "Bangalore",
        "Mumbai",
        "Chennai",
        "Hyderabad",
        "Pune",
        "Delhi",
        "Kolkata",
        "Mysore",
        "Coimbatore",
        "Kochi"
    ]

    stores = []

    for i in range(1, TOTAL_STORES + 1):

        store = {
            "store_id": f"STORE-{i:06d}",
            "store_name": f"Retail Store {i:03d}",
            "city": cities[(i - 1) % len(cities)],
            "store_type": (
                "WAREHOUSE" if i == TOTAL_STORES
                else "RETAIL"
            ),
            "status": "ACTIVE"
        }

        stores.append(store)

    df = pd.DataFrame(stores)

    # Export master data
    output_file = OUTPUT_DIR / "stores.csv"
    df.to_csv(output_file, index=False)

    print(f"Generated {len(df)} stores")
    print(f"Saved to: {output_file}")

    return df


if __name__ == "__main__":
    generate_stores()
