from pathlib import Path
# Fixed seed for reproducible data generation
RANDOM_SEED = 20261022

# Starter dataset configuration
TOTAL_STORES = 10
TOTAL_SKUS = 100
TOTAL_EMPLOYEES = 30
TOTAL_MOVEMENTS = 5000
TOTAL_CYCLE_COUNTS = 500

# Project directory
BASE_DIR = Path(__file__).resolve().parents[1]

# Output directory
OUTPUT_DIR = BASE_DIR / "output"

# Automatically create output directory
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

