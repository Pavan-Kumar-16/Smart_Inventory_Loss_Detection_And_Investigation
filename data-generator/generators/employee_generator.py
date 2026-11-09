import pandas as pd

from config.settings import TOTAL_EMPLOYEES, OUTPUT_DIR


def generate_employees_and_roles():
    stores_file = OUTPUT_DIR / "stores.csv"

    if not stores_file.exists():
        raise FileNotFoundError(
            "stores.csv not found. Run the store generator first."
        )

    stores = pd.read_csv(stores_file)

    # Master role records
    role_data = [
        {"role_id": "ROLE-000001", "role_name": "STORE_MANAGER"},
        {"role_id": "ROLE-000002", "role_name": "INVENTORY_MANAGER"},
        {"role_id": "ROLE-000003", "role_name": "CASHIER"},
        {"role_id": "ROLE-000004", "role_name": "STOCK_ASSOCIATE"},
        {"role_id": "ROLE-000005", "role_name": "AUDITOR"},
    ]

    roles_df = pd.DataFrame(role_data)

    employees = []
    employee_roles = []

    role_ids = [role["role_id"] for role in role_data]

    for i in range(1, TOTAL_EMPLOYEES + 1):
        employee_id = f"EMP-{i:06d}"

        # Assign employees across available stores
        store = stores.iloc[(i - 1) % len(stores)]
        store_id = store["store_id"]

        role_index = (i - 1) % len(role_ids)
        role_id = role_ids[role_index]

        employees.append({
            "employee_id": employee_id,
            "employee_name": f"Employee {i:03d}",
            "email": f"employee{i:03d}@inventorydemo.com",
            "store_id": store_id,
            "status": "ACTIVE"
        })

        employee_roles.append({
            "employee_role_id": f"ER-{i:06d}",
            "employee_id": employee_id,
            "role_id": role_id,
            "store_id": store_id,
            "effective_from": "2026-01-01",
            "effective_to": None,
            "is_active": True
        })

    employees_df = pd.DataFrame(employees)
    employee_roles_df = pd.DataFrame(employee_roles)

    employees_df.to_csv(
        OUTPUT_DIR / "employees.csv", index=False
    )
    roles_df.to_csv(
        OUTPUT_DIR / "roles.csv", index=False
    )
    employee_roles_df.to_csv(
        OUTPUT_DIR / "employee_roles.csv", index=False
    )

    print(f"Generated {len(employees_df)} employees")
    print(f"Generated {len(roles_df)} roles")
    print(f"Generated {len(employee_roles_df)} role assignments")
    print(f"Files saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    generate_employees_and_roles()