
import pandas as pd
import numpy as np

from config.settings import RANDOM_SEED, OUTPUT_DIR


def generate_promotions():
    rng = np.random.default_rng(RANDOM_SEED + 9)

    stores_file = OUTPUT_DIR / "stores.csv"
    skus_file = OUTPUT_DIR / "skus.csv"
    store_skus_file = OUTPUT_DIR / "store_skus.csv"

    for file in [stores_file, skus_file, store_skus_file]:
        if not file.exists():
            raise FileNotFoundError(f"{file.name} not found.")

    stores = pd.read_csv(stores_file)
    skus = pd.read_csv(skus_file)
    store_skus = pd.read_csv(store_skus_file)

    promotions = []
    promotion_skus = []

    promotion_types = [
        "SEASONAL",
        "CLEARANCE",
        "FESTIVE",
        "WEEKEND",
        "FLASH_SALE",
    ]

    promotion_count = min(20, len(stores) * 2)

    for i in range(1, promotion_count + 1):
        store = stores.iloc[(i - 1) % len(stores)]

        start_day = int(rng.integers(1, 6))
        duration = int(rng.integers(1, 4))

        start_date = pd.Timestamp("2026-01-01") + pd.Timedelta(
            days=start_day
        )
        end_date = start_date + pd.Timedelta(days=duration)

        promotion_id = f"PROMO-2026-{i:06d}"

        promotions.append({
            "promotion_id": promotion_id,
            "store_id": store["store_id"],
            "promotion_name": f"Campaign {i:03d}",
            "promotion_type": promotion_types[
                (i - 1) % len(promotion_types)
            ],
            "discount_percentage": int(
                rng.choice([5, 10, 15, 20, 25, 30])
            ),
            "start_date": start_date,
            "end_date": end_date,
            "status": "COMPLETED",
        })

        eligible_skus = store_skus[
            store_skus["store_id"] == store["store_id"]
        ]

        selected_count = min(
            5, len(eligible_skus)
        )

        selected_indices = rng.choice(
            eligible_skus.index,
            size=selected_count,
            replace=False
        )

        for sku_index in selected_indices:
            sku = eligible_skus.loc[sku_index]

            promotion_skus.append({
                "promotion_id": promotion_id,
                "sku_id": sku["sku_id"],
            })

    promotions_df = pd.DataFrame(promotions)
    promotion_skus_df = pd.DataFrame(promotion_skus)

    promotions_df.to_csv(
        OUTPUT_DIR / "promotions.csv",
        index=False
    )

    promotion_skus_df.to_csv(
        OUTPUT_DIR / "promotion_skus.csv",
        index=False
    )

    print(f"Generated {len(promotions_df)} promotions")
    print(f"Generated {len(promotion_skus_df)} promotion-SKU links")
    print(
        f"Unique stores covered: "
        f"{promotions_df['store_id'].nunique()}"
    )
    print(f"Saved to: {OUTPUT_DIR}")

    return promotions_df, promotion_skus_df


if __name__ == "__main__":
    generate_promotions()
