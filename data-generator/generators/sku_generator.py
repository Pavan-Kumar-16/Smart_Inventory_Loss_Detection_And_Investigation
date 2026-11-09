
import numpy as np
import pandas as pd

from config.settings import RANDOM_SEED, TOTAL_SKUS, OUTPUT_DIR


def generate_skus():

    rng = np.random.default_rng(RANDOM_SEED + 2)

    categories = {
        "Grocery": ["Rice", "Wheat", "Sugar", "Oil", "Flour"],
        "Personal Care": ["Shampoo", "Soap", "Toothpaste", "Lotion"],
        "Electronics": ["Headphones", "Charger", "Keyboard", "Mouse"],
        "Household": ["Detergent", "Cleaner", "Tissue", "Container"],
        "Beverages": ["Juice", "Coffee", "Tea", "Water"]
    }

    units = ["PCS", "PACK", "KG", "LITRE"]

    category_names = list(categories.keys())

    skus = []

    for i in range(1, TOTAL_SKUS + 1):

        category = category_names[(i - 1) % len(category_names)]

        product_list = categories[category]

        product = product_list[
            (i - 1) % len(product_list)
        ]

        sku = {
            "sku_id": f"SKU-{i:06d}",
            "product_name": f"{product} Product {i:04d}",
            "category": category,
            "unit": units[int(rng.integers(0, len(units)))],
            "status": "ACTIVE"
        }

        skus.append(sku)

    df = pd.DataFrame(skus)

    output_file = OUTPUT_DIR / "skus.csv"
    df.to_csv(output_file, index=False)

    print(f"Generated {len(df)} SKUs")
    print(f"Saved to: {output_file}")

    return df


if __name__ == "__main__":
    generate_skus()
