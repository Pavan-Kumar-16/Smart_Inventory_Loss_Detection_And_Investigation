import { dashboardApi } from "./dashboardApi";

async function testDashboardConnection() {
    try {
        const result = await dashboardApi.getSummary();

        console.log("REAL DATABASE DASHBOARD DATA:", result.data);
    } catch (error) {
        console.error("Dashboard connection failed:", error);
    }
}

testDashboardConnection();