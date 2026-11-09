// Master Store records corresponding to the MySQL database stores table
export interface DatabaseStoreRecord {
  store_id: string;
  store_name: string;
  city: string;
  store_type: string;
  status: string;
}

export const DATABASE_STORES: DatabaseStoreRecord[] = [
  {
    "store_id": "STORE-000001",
    "store_name": "Retail Store 001",
    "city": "Bangalore",
    "store_type": "RETAIL",
    "status": "ACTIVE"
  },
  {
    "store_id": "STORE-000002",
    "store_name": "Retail Store 002",
    "city": "Mumbai",
    "store_type": "RETAIL",
    "status": "ACTIVE"
  },
  {
    "store_id": "STORE-000003",
    "store_name": "Retail Store 003",
    "city": "Chennai",
    "store_type": "RETAIL",
    "status": "ACTIVE"
  },
  {
    "store_id": "STORE-000004",
    "store_name": "Retail Store 004",
    "city": "Hyderabad",
    "store_type": "RETAIL",
    "status": "ACTIVE"
  },
  {
    "store_id": "STORE-000005",
    "store_name": "Retail Store 005",
    "city": "Pune",
    "store_type": "RETAIL",
    "status": "ACTIVE"
  },
  {
    "store_id": "STORE-000006",
    "store_name": "Retail Store 006",
    "city": "Delhi",
    "store_type": "RETAIL",
    "status": "ACTIVE"
  },
  {
    "store_id": "STORE-000007",
    "store_name": "Retail Store 007",
    "city": "Kolkata",
    "store_type": "RETAIL",
    "status": "ACTIVE"
  },
  {
    "store_id": "STORE-000008",
    "store_name": "Retail Store 008",
    "city": "Mysore",
    "store_type": "RETAIL",
    "status": "ACTIVE"
  },
  {
    "store_id": "STORE-000009",
    "store_name": "Retail Store 009",
    "city": "Coimbatore",
    "store_type": "RETAIL",
    "status": "ACTIVE"
  },
  {
    "store_id": "STORE-000010",
    "store_name": "Retail Store 010",
    "city": "Kochi",
    "store_type": "WAREHOUSE",
    "status": "ACTIVE"
  }
];
