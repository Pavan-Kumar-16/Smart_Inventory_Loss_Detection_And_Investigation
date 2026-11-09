// Master employee records corresponding to the MySQL database `employees`, `roles`, and `employee_roles` tables

export interface DatabaseEmployeeRecord {
  employee_id: string;
  employee_name: string;
  role: string;
  store_id: string;
  status: string;
}

export const DATABASE_EMPLOYEES: DatabaseEmployeeRecord[] = [
  { employee_id: "EMP-000001", employee_name: "Employee 001", role: "STORE_MANAGER", store_id: "STORE-000001", status: "ACTIVE" },
  { employee_id: "EMP-000002", employee_name: "Employee 002", role: "INVENTORY_MANAGER", store_id: "STORE-000002", status: "ACTIVE" },
  { employee_id: "EMP-000003", employee_name: "Employee 003", role: "CASHIER", store_id: "STORE-000003", status: "ACTIVE" },
  { employee_id: "EMP-000004", employee_name: "Employee 004", role: "STOCK_ASSOCIATE", store_id: "STORE-000004", status: "ACTIVE" },
  { employee_id: "EMP-000005", employee_name: "Employee 005", role: "AUDITOR", store_id: "STORE-000005", status: "ACTIVE" },
  { employee_id: "EMP-000006", employee_name: "Employee 006", role: "STORE_MANAGER", store_id: "STORE-000006", status: "ACTIVE" },
  { employee_id: "EMP-000007", employee_name: "Employee 007", role: "INVENTORY_MANAGER", store_id: "STORE-000007", status: "ACTIVE" },
  { employee_id: "EMP-000008", employee_name: "Employee 008", role: "CASHIER", store_id: "STORE-000008", status: "ACTIVE" },
  { employee_id: "EMP-000009", employee_name: "Employee 009", role: "STOCK_ASSOCIATE", store_id: "STORE-000009", status: "ACTIVE" },
  { employee_id: "EMP-000010", employee_name: "Employee 010", role: "AUDITOR", store_id: "STORE-000010", status: "ACTIVE" },
  { employee_id: "EMP-000011", employee_name: "Employee 011", role: "STORE_MANAGER", store_id: "STORE-000001", status: "ACTIVE" },
  { employee_id: "EMP-000012", employee_name: "Employee 012", role: "INVENTORY_MANAGER", store_id: "STORE-000002", status: "ACTIVE" },
  { employee_id: "EMP-000013", employee_name: "Employee 013", role: "CASHIER", store_id: "STORE-000003", status: "ACTIVE" },
  { employee_id: "EMP-000014", employee_name: "Employee 014", role: "STOCK_ASSOCIATE", store_id: "STORE-000004", status: "ACTIVE" },
  { employee_id: "EMP-000015", employee_name: "Employee 015", role: "AUDITOR", store_id: "STORE-000005", status: "ACTIVE" },
  { employee_id: "EMP-000016", employee_name: "Employee 016", role: "STORE_MANAGER", store_id: "STORE-000006", status: "ACTIVE" },
  { employee_id: "EMP-000017", employee_name: "Employee 017", role: "INVENTORY_MANAGER", store_id: "STORE-000007", status: "ACTIVE" },
  { employee_id: "EMP-000018", employee_name: "Employee 018", role: "CASHIER", store_id: "STORE-000008", status: "ACTIVE" },
  { employee_id: "EMP-000019", employee_name: "Employee 019", role: "STOCK_ASSOCIATE", store_id: "STORE-000009", status: "ACTIVE" },
  { employee_id: "EMP-000020", employee_name: "Employee 020", role: "AUDITOR", store_id: "STORE-000010", status: "ACTIVE" },
  { employee_id: "EMP-000021", employee_name: "Employee 021", role: "STORE_MANAGER", store_id: "STORE-000001", status: "ACTIVE" },
  { employee_id: "EMP-000022", employee_name: "Employee 022", role: "INVENTORY_MANAGER", store_id: "STORE-000002", status: "ACTIVE" },
  { employee_id: "EMP-000023", employee_name: "Employee 023", role: "CASHIER", store_id: "STORE-000003", status: "ACTIVE" },
  { employee_id: "EMP-000024", employee_name: "Employee 024", role: "STOCK_ASSOCIATE", store_id: "STORE-000004", status: "ACTIVE" },
  { employee_id: "EMP-000025", employee_name: "Employee 025", role: "AUDITOR", store_id: "STORE-000005", status: "ACTIVE" },
  { employee_id: "EMP-000026", employee_name: "Employee 026", role: "STORE_MANAGER", store_id: "STORE-000006", status: "ACTIVE" },
  { employee_id: "EMP-000027", employee_name: "Employee 027", role: "INVENTORY_MANAGER", store_id: "STORE-000007", status: "ACTIVE" },
  { employee_id: "EMP-000028", employee_name: "Employee 028", role: "CASHIER", store_id: "STORE-000008", status: "ACTIVE" },
  { employee_id: "EMP-000029", employee_name: "Employee 029", role: "STOCK_ASSOCIATE", store_id: "STORE-000009", status: "ACTIVE" },
  { employee_id: "EMP-000030", employee_name: "Employee 030", role: "AUDITOR", store_id: "STORE-000010", status: "ACTIVE" },
];

