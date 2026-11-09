
from pathlib import Path
import pandas as pd


# Locate the main project directory.
PROJECT_ROOT = Path(__file__).resolve().parents[3]

# Generated test datasets.
OUTPUT_DIR = PROJECT_ROOT / "data-generator" / "output"


def load_test_data():
    """Load generated anomaly datasets."""

    required_files = [
        "inventory_movements.csv",
        "anomaly_movements.csv",
        "anomaly_cycle_counts.csv",
        "shifts.csv",
        "transfer_double_count_test.csv",
        "ground_truth.csv"
    ]

    for filename in required_files:
        file_path = OUTPUT_DIR / filename

        if not file_path.exists():
            raise FileNotFoundError(
                f"Required test file not found: {file_path}"
            )

    return {
        "movements": pd.read_csv(
            OUTPUT_DIR / "inventory_movements.csv"
        ),
        "anomaly_movements": pd.read_csv(
            OUTPUT_DIR / "anomaly_movements.csv"
        ),
        "cycle_counts": pd.read_csv(
            OUTPUT_DIR / "anomaly_cycle_counts.csv"
        ),
        "shifts": pd.read_csv(
            OUTPUT_DIR / "shifts.csv"
        ),
        "transfers": pd.read_csv(
            OUTPUT_DIR / "transfer_double_count_test.csv"
        ),
        "ground_truth": pd.read_csv(
            OUTPUT_DIR / "ground_truth.csv"
        )
    }


# RULE 1: Detect movements recorded against the wrong store.
def detect_wrong_store(record, shifts):

    matching_shift = shifts[
        shifts["shift_id"].astype(str)
        == str(record["shift_id"])
    ]

    if matching_shift.empty:
        return "FLAG", "Referenced shift was not found"

    assigned_store = str(
        matching_shift.iloc[0]["store_id"]
    )

    movement_store = str(record["store_id"])

    if movement_store != assigned_store:
        return (
            "FLAG",
            f"Movement store {movement_store} differs "
            f"from employee shift store {assigned_store}"
        )

    return "NO_FLAG", "Movement and shift stores match"


# RULE 2: Detect adjustments without reasons.
def detect_missing_reason(record):

    movement_type = str(record["movement_type"]).strip()

    adjustment_types = {
        "ADJUSTMENT",
        "ADJUSTMENT_IN",
        "ADJUSTMENT_OUT"
    }

    reason = record.get("reason")

    missing_reason = (
        pd.isna(reason)
        or not str(reason).strip()
    )

    if movement_type in adjustment_types and missing_reason:
        return "FLAG", "Adjustment has no recorded reason"

    return "NO_FLAG", "Adjustment reason is present"


# RULE 3: Reconstruct inventory as of the cycle-count timestamp.
def detect_count_timestamp(record, movements):

    count_time = pd.to_datetime(
        record["count_timestamp"]
    )

    matching = movements[
        (movements["store_id"].astype(str)
         == str(record["store_id"]))
        &
        (movements["sku_id"].astype(str)
         == str(record["sku_id"]))
    ].copy()

    matching["parsed_time"] = pd.to_datetime(
        matching["movement_timestamp"]
    )

    # Exclude every movement occurring after the count.
    movements_as_of_count = matching[
        matching["parsed_time"] <= count_time
    ]

    signs = {
        "OPENING": 1,
        "RECEIPT": 1,
        "RETURN_IN": 1,
        "SALE": -1,
        "DAMAGE": -1,
        "ADJUSTMENT": -1,
        "ADJUSTMENT_IN": 1,
        "ADJUSTMENT_OUT": -1,
        "RETURN_OUT": -1,
        "TRANSFER_IN": 1,
        "TRANSFER_OUT": -1
    }

    unknown_types = (
        set(movements_as_of_count["movement_type"])
        - set(signs.keys())
    )

    if unknown_types:
        return (
            "ERROR",
            f"Unknown movement types: {unknown_types}"
        )

    calculated_expected = sum(
        float(row["quantity"])
        * signs[row["movement_type"]]
        for _, row in movements_as_of_count.iterrows()
    )

    recorded_expected = float(
        record["expected_quantity"]
    )

    if calculated_expected != recorded_expected:
        return (
            "FLAG",
            f"Recorded expected stock: {recorded_expected}; "
            f"reconstructed stock at count time: "
            f"{calculated_expected}"
        )

    return (
        "NO_FLAG",
        "Expected stock reconciles at the count timestamp"
    )


# RULE 4: Detect whether a transfer should be counted as one transaction.
def detect_transfer_double_count(group_id, transfers):

    group = transfers[
        transfers["transfer_group_id"].astype(str)
        == str(group_id)
    ]

    outgoing = group[
        group["movement_type"] == "TRANSFER_OUT"
    ]

    incoming = group[
        group["movement_type"] == "TRANSFER_IN"
    ]

    valid_pair = (
        len(group) == 2
        and len(outgoing) == 1
        and len(incoming) == 1
        and float(outgoing.iloc[0]["quantity"])
        == float(incoming.iloc[0]["quantity"])
        and outgoing.iloc[0]["store_id"]
        != incoming.iloc[0]["store_id"]
    )

    if valid_pair:
        return (
            "DO_NOT_DOUBLE_COUNT",
            "Matching outgoing and incoming legs "
            "represent one transfer transaction"
        )

    return (
        "FLAG",
        "Transfer legs are missing, duplicated or inconsistent"
    )


def run_anomaly_validation():

    data = load_test_data()

    movements = data["movements"]
    anomaly_movements = data["anomaly_movements"]
    cycle_counts = data["cycle_counts"]
    shifts = data["shifts"]
    transfers = data["transfers"]
    ground_truth = data["ground_truth"]

    results = []

    for _, truth in ground_truth.iterrows():

        record_id = str(truth["record_id"])
        anomaly_type = truth["anomaly_type"]

        if anomaly_type == "WRONG_STORE":

            record = anomaly_movements[
                anomaly_movements["movement_id"].astype(str)
                == record_id
            ]

            if record.empty:
                actual, details = "ERROR", "Movement not found"
            else:
                actual, details = detect_wrong_store(
                    record.iloc[0], shifts
                )

        elif anomaly_type == "MISSING_ADJUSTMENT_REASON":

            record = anomaly_movements[
                anomaly_movements["movement_id"].astype(str)
                == record_id
            ]

            if record.empty:
                actual, details = "ERROR", "Movement not found"
            else:
                actual, details = detect_missing_reason(
                    record.iloc[0]
                )

        elif anomaly_type == "COUNT_TIMESTAMP_INCONSISTENCY":

            record = cycle_counts[
                cycle_counts["count_id"].astype(str)
                == record_id
            ]

            if record.empty:
                actual, details = "ERROR", "Cycle count not found"
            else:
                actual, details = detect_count_timestamp(
                    record.iloc[0], movements
                )

        elif anomaly_type == "TRANSFER_DOUBLE_COUNT_RISK":

            actual, details = detect_transfer_double_count(
                record_id, transfers
            )

        else:
            actual, details = "ERROR", "Unknown anomaly type"

        expected = str(truth["expected_decision"]).strip()

        results.append({
            "anomaly_id": truth["anomaly_id"],
            "anomaly_type": anomaly_type,
            "record_id": record_id,
            "expected": expected,
            "actual": actual,
            "result": (
                "PASS" if actual == expected else "FAIL"
            ),
            "details": details
        })

    results_df = pd.DataFrame(results)

    # Display individual test results.
    print("\n========== ANOMALY TEST RESULTS ==========\n")
    print(results_df.to_string(index=False))

    passed = int(
        (results_df["result"] == "PASS").sum()
    )

    total = len(results_df)

    print("\n========== TEST SUMMARY ==========")
    print(f"Total scenarios: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")

    accuracy = passed / total * 100 if total else 0

    print(f"Scenario accuracy: {accuracy:.2f}%")

    # Evaluate FLAG decisions separately.
    expected_flags = results_df["expected"] == "FLAG"
    actual_flags = results_df["actual"] == "FLAG"

    true_positives = int(
        (expected_flags & actual_flags).sum()
    )

    false_positives = int(
        (~expected_flags & actual_flags).sum()
    )

    false_negatives = int(
        (expected_flags & ~actual_flags).sum()
    )

    precision = (
        true_positives / (true_positives + false_positives)
        if true_positives + false_positives else 0
    )

    recall = (
        true_positives / (true_positives + false_negatives)
        if true_positives + false_negatives else 0
    )

    f1_score = (
        2 * precision * recall / (precision + recall)
        if precision + recall else 0
    )

    print("\n========== CLASSIFICATION METRICS ==========")
    print(f"Precision: {precision * 100:.2f}%")
    print(f"Recall: {recall * 100:.2f}%")
    print(f"F1-score: {f1_score * 100:.2f}%")

    # Save the report.
    report_path = OUTPUT_DIR / "anomaly_test_results.csv"

    results_df.to_csv(report_path, index=False)

    print(f"\nTest report saved to: {report_path}")

    return {
        "message": "Anomaly validation completed",
        "total_scenarios": total,
        "passed": passed,
        "failed": total - passed,
        "accuracy": round(accuracy, 2),
        "precision": round(precision * 100, 2),
        "recall": round(recall * 100, 2),
        "f1_score": round(f1_score * 100, 2),
        "results": results_df.to_dict(orient="records")
    }
