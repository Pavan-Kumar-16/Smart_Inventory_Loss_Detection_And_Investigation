
import pandas as pd

from config.settings import OUTPUT_DIR


def inject_anomalies():
    movements_file = OUTPUT_DIR / "inventory_movements.csv"
    counts_file = OUTPUT_DIR / "cycle_counts.csv"
    assortment_file = OUTPUT_DIR / "store_skus.csv"

    for file in [movements_file, counts_file, assortment_file]:
        if not file.exists():
            raise FileNotFoundError(f"{file.name} not found.")

    movements = pd.read_csv(movements_file)
    counts = pd.read_csv(counts_file)
    assortment = pd.read_csv(assortment_file)

    anomalous_movements = movements.copy()
    anomalous_counts = counts.copy()

    ground_truth = []
    anomaly_number = 1

    # ------------------------------------------------
    # CASE 1: Movement recorded against the wrong store
    # ------------------------------------------------

    candidates = anomalous_movements[
        anomalous_movements["movement_type"].isin(
            ["SALE", "RECEIPT", "DAMAGE"]
        )
    ]

    wrong_store_found = False

    for index, movement in candidates.iterrows():
        alternative_stores = assortment[
            (assortment["sku_id"] == movement["sku_id"])
            & (assortment["store_id"] != movement["store_id"])
        ]["store_id"].tolist()

        if alternative_stores:
            original_store = movement["store_id"]
            incorrect_store = sorted(alternative_stores)[0]

            anomalous_movements.loc[index, "store_id"] = incorrect_store

            ground_truth.append({
                "anomaly_id": f"ANOM-{anomaly_number:06d}",
                "entity_type": "INVENTORY_MOVEMENT",
                "record_id": movement["movement_id"],
                "anomaly_type": "WRONG_STORE",
                "expected_decision": "FLAG",
                "details": (
                    f"Original store: {original_store}; "
                    f"incorrect store: {incorrect_store}"
                )
            })

            anomaly_number += 1
            wrong_store_found = True
            break

    if not wrong_store_found:
        raise ValueError("Could not find a valid wrong-store test case.")

    # ------------------------------------------------
    # CASE 2: Adjustment without a reason
    # ------------------------------------------------

    adjustment_rows = anomalous_movements[
        anomalous_movements["movement_type"] == "ADJUSTMENT"
    ]

    if adjustment_rows.empty:
        raise ValueError("No adjustment movement available.")

    adjustment_index = adjustment_rows.index[0]
    adjustment_id = anomalous_movements.loc[
        adjustment_index, "movement_id"
    ]

    anomalous_movements.loc[adjustment_index, "reason"] = ""

    ground_truth.append({
        "anomaly_id": f"ANOM-{anomaly_number:06d}",
        "entity_type": "INVENTORY_MOVEMENT",
        "record_id": adjustment_id,
        "anomaly_type": "MISSING_ADJUSTMENT_REASON",
        "expected_decision": "FLAG",
        "details": "Adjustment has no recorded reason."
    })

    anomaly_number += 1

    # ------------------------------------------------
    # CASE 3: Cycle count timestamp precedes a movement
    # ------------------------------------------------

    count_timestamp_found = False

    for count_index, count in anomalous_counts.iterrows():

        matching_movements = movements[
            (movements["store_id"] == count["store_id"])
            & (movements["sku_id"] == count["sku_id"])
        ].copy()

        matching_movements["movement_timestamp"] = pd.to_datetime(
            matching_movements["movement_timestamp"]
        )

        # Find a movement included in the original count,
        # then move the count timestamp before that movement.
        matching_movements = matching_movements[
            matching_movements["movement_timestamp"]
            < pd.Timestamp(count["count_timestamp"])
        ]

        if not matching_movements.empty:
            selected_movement = matching_movements.iloc[-1]

            earlier_timestamp = (
                selected_movement["movement_timestamp"]
                - pd.Timedelta(minutes=1)
            )

            anomalous_counts.loc[
                count_index, "count_timestamp"
            ] = earlier_timestamp.strftime("%Y-%m-%d %H:%M:%S")

            ground_truth.append({
                "anomaly_id": f"ANOM-{anomaly_number:06d}",
                "entity_type": "CYCLE_COUNT",
                "record_id": count["count_id"],
                "anomaly_type": "COUNT_TIMESTAMP_INCONSISTENCY",
                "expected_decision": "FLAG",
                "details": (
                    "Recorded expected quantity includes movement "
                    f"{selected_movement['movement_id']}, which occurred "
                    "after the modified count timestamp."
                )
            })

            anomaly_number += 1
            count_timestamp_found = True
            break

    if not count_timestamp_found:
        raise ValueError(
            "Could not find a suitable cycle count timing test case."
        )

    # ------------------------------------------------
    # CASE 4: Transfer counted as shrinkage at both ends
    # ------------------------------------------------

    transfers = movements[
        movements["movement_type"].isin(
            ["TRANSFER_OUT", "TRANSFER_IN"]
        )
        & movements["transfer_group_id"].notna()
    ]

    transfer_groups = transfers.groupby("transfer_group_id")

    transfer_case_found = False
    transfer_test_rows = []

    for transfer_group_id, group in transfer_groups:
        if (
            len(group) == 2
            and set(group["movement_type"])
            == {"TRANSFER_OUT", "TRANSFER_IN"}
            and group["quantity"].nunique() == 1
        ):
            outgoing = group[
                group["movement_type"] == "TRANSFER_OUT"
            ].iloc[0]

            incoming = group[
                group["movement_type"] == "TRANSFER_IN"
            ].iloc[0]

            transfer_test_rows.extend([
                {
                    "transfer_group_id": transfer_group_id,
                    "movement_id": outgoing["movement_id"],
                    "store_id": outgoing["store_id"],
                    "movement_type": "TRANSFER_OUT",
                    "quantity": outgoing["quantity"],
                    "simulated_naive_shrinkage": outgoing["quantity"]
                },
                {
                    "transfer_group_id": transfer_group_id,
                    "movement_id": incoming["movement_id"],
                    "store_id": incoming["store_id"],
                    "movement_type": "TRANSFER_IN",
                    "quantity": incoming["quantity"],
                    "simulated_naive_shrinkage": incoming["quantity"]
                }
            ])

            ground_truth.append({
                "anomaly_id": f"ANOM-{anomaly_number:06d}",
                "entity_type": "TRANSFER_GROUP",
                "record_id": transfer_group_id,
                "anomaly_type": "TRANSFER_DOUBLE_COUNT_RISK",
                "expected_decision": "DO_NOT_DOUBLE_COUNT",
                "details": (
                    "Both transfer legs belong to one transaction. "
                    "Reconcile the pair instead of counting both as losses."
                )
            })

            anomaly_number += 1
            transfer_case_found = True
            break

    if not transfer_case_found:
        raise ValueError(
            "Could not find a valid paired transfer test case."
        )

    # Save isolated anomaly datasets.
    anomalous_movements.to_csv(
        OUTPUT_DIR / "anomaly_movements.csv",
        index=False
    )

    anomalous_counts.to_csv(
        OUTPUT_DIR / "anomaly_cycle_counts.csv",
        index=False
    )

    pd.DataFrame(transfer_test_rows).to_csv(
        OUTPUT_DIR / "transfer_double_count_test.csv",
        index=False
    )

    ground_truth_df = pd.DataFrame(ground_truth)

    ground_truth_df.to_csv(
        OUTPUT_DIR / "ground_truth.csv",
        index=False
    )

    print("\nAnomaly injection completed successfully.")
    print(f"Test scenarios created: {len(ground_truth_df)}")
    print("\nAnomaly summary:")
    print(ground_truth_df["anomaly_type"].to_string(index=False))
    print(f"\nFiles saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    inject_anomalies()
