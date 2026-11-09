
import pandas as pd
import numpy as np

from config.settings import RANDOM_SEED, OUTPUT_DIR


def generate_store_skus():
    stores_file = OUTPUT_DIR / "stores.csv"
    skus_file = OUTPUT_DIR / "skus.csv"

    if not stores_file.exists():
        raise FileNotFoundError("stores.csv not found.")

    if not skus_file.exists():
        raise FileNotFoundError("skus.csv not found.")

    stores = pd.read_csv(stores_file)
    skus = pd.read_csv(skus_file)

    rng = np.random.default_rng(RANDOM_SEED + 4)

    store_skus = []
    assignment_number = 1

    # Each store receives approximately 40% of the SKU catalogue.
    assortment_ratio = 0.40

    for _, store in stores.iterrows():

        assortment_size = max(
            1,
            int(len(skus) * assortment_ratio)
        )

        # Randomly select SKUs for this store.
        selected_indices = rng.choice(
            len(skus),
            size=assortment_size,
            replace=False
        )

        for sku_index in selected_indices:
            sku = skus.iloc[int(sku_index)]

            store_skus.append({
                "store_sku_id": f"SS-{assignment_number:08d}",
                "store_id": store["store_id"],
                "sku_id": sku["sku_id"],
                "reorder_level": int(rng.integers(10, 51)),
                "is_active": True
            })

            assignment_number += 1

    result = pd.DataFrame(store_skus)

    # Check that each store-SKU combination is unique.
    duplicates = result.duplicated(
        subset=["store_id", "sku_id"]
    ).sum()

    if duplicates > 0:
        raise ValueError(
            f"Found {duplicates} duplicate store-SKU combinations."
        )

    output_file = OUTPUT_DIR / "store_skus.csv"
    result.to_csv(output_file, index=False)

    print(f"Generated {len(result)} store-SKU assignments")
    print(f"Stores covered: {result['store_id'].nunique()}")
    print(f"SKUs covered: {result['sku_id'].nunique()}")
    print(f"Duplicate combinations: {duplicates}")
    print(f"Saved to: {output_file}")

    return result


if __name__ == "__main__":
    generate_store_skus()
