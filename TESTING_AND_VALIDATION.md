# Testing & Validation Evidence

**Project:** Smart Inventory Loss Detection & Investigation System  
**Submission:** YottaFlex AI Recruitment Drive  
**Environment:** Windows, Python, FastAPI, React + TypeScript + Vite, MySQL

> **Evidence note:** The results below are recorded observations from the development run described during implementation. They are not a claim that every test has already been repeated against the final commit. Re-run the checks after the final code changes and update this document with the final date, commit hash, and any changed results.

## 1. Validation objectives

The project was checked across four areas:
1. Synthetic data quality and referential integrity.
2. Inventory movement and transfer consistency.
3. Detection-engine behavior.
4. Backend API and frontend workflow behavior.

## 2. Data generation and database loading

### Development dataset configuration

The recorded development configuration used:
- Random seed: `20261022`
- Stores: `10`
- SKUs: `100`
- Employees: `30`
- Cycle counts: `500`
- Inventory movements loaded: `5,480`

### Recorded MySQL loading results

| Table | Records inserted |
|---|---:|
| stores | 10 |
| skus | 100 |
| employees | 30 |
| roles | 5 |
| employee_roles | 30 |
| shifts | 210 |
| store_skus | 400 |
| promotions | 20 |
| promotion_skus | 100 |
| inventory_movements | 5,480 |
| returns | 80 |
| cycle_counts | 500 |

The loader reported successful completion and committed the imported records.

## 3. Data integrity checks

The data validator reported **29 checks passing** during the recorded development run.

Additional database checks performed included:
- Primary-key and foreign-key integrity.
- Transfer pairing by transfer group and SKU.
- Transfer quantity consistency between outgoing and incoming legs.
- Missing adjustment reasons.
- Inventory reconciliation.
- Timestamp consistency.
- Duplicate-record checks.

### Specific recorded SQL observations

| Check | Recorded result |
|---|---|
| Transfer groups with inconsistent outgoing/incoming legs | 0 |
| Baseline adjustment records with missing reasons | 0 |
| Transfer groups checked | 591 |
| Transfer outgoing legs | 591 |
| Transfer incoming legs | 591 |

The anomaly-injection process separately created controlled scenarios for:
- `WRONG_STORE`
- `MISSING_ADJUSTMENT_REASON`
- `COUNT_TIMESTAMP_INCONSISTENCY`
- `TRANSFER_DOUBLE_COUNT_RISK`

These anomaly records and their ground-truth labels were kept separate from the clean baseline data. They should not be mixed into the baseline production-style tables when demonstrating normal detection behavior.

## 4. Detection-engine observations

| Detection check | Recorded development result |
|---|---:|
| Shortage alerts created | 105 |
| Repeated-adjustment groups detected | 22 |
| Repeated-adjustment alerts created | 22 |
| Evidence records created for repeated-adjustment alerts | 44 |
| Inconsistent valid transfer groups detected | 0 |
| Total alerts after the recorded detection runs | 127 |

The transfer detector returning zero anomalies on the valid baseline transfer groups was an expected result for that dataset.

Risk scores are rule-based prioritization values. They are not calibrated probabilities of fraud or proof of employee misconduct.

## 5. Backend API verification

The following behavior was exercised during development:

| Area | Verification performed |
|---|---|
| Backend health | Health endpoint returned a healthy status and confirmed MySQL connectivity. |
| Dashboard summary | Dashboard summary endpoint returned database-backed metrics. |
| Recent alerts | Recent alert records were returned from the database. |
| Risk distribution | Risk-level counts were returned for the dashboard. |
| Investigation status | Status endpoint returned all five statuses, including zero-count statuses. |
| Alert trend | Trend endpoint returned a seven-day series, including dates with zero alerts. |
| Detection | Detection endpoints were exercised for shortage, repeated-adjustment, and transfer checks. |
| Investigation workflow | Investigation creation, retrieval, status updates, notes/assignment, and history were exercised during development. |

### Recorded examples

- The health endpoint returned `status: healthy` and `database_status: connected`.
- The investigation-status endpoint returned the statuses `OPEN`, `ASSIGNED`, `INVESTIGATING`, `RESOLVED`, and `ESCALATED`.
- The seven-day alert trend returned seven date buckets, including zero-count dates.

For the final submission, record the exact endpoint paths and final response examples from the running Swagger page at `/docs`. Do not document endpoints that are not present in the committed backend.

## 6. Frontend verification

The React application was run locally and manually reviewed. The recorded checks included:
- Dashboard metrics displayed from backend responses.
- Alert records displayed in the alert-management page.
- Risk distribution and alert trend displayed in charts.
- Investigation status counts displayed.
- Investigation records and staff/audit activity displayed.
- Navigation between the application pages.
- UI layout and spacing reviewed after visual refinements.

Capture fresh screenshots from the final committed build and place them in `docs/screenshots/`.

Suggested screenshots:
- `dashboard.png`
- `alerts.png`
- `investigations.png`
- `analytics.png`
- `stores.png`
- `skus.png`
- `employees.png`

Only include screenshots for pages that are available and working in the final build.

## 7. Final verification checklist

Complete this checklist after the final code changes and before submission.

- [ ] Re-run the data generator using the documented command.
- [ ] Re-run the data validator and record the final result.
- [ ] Re-run the MySQL loader against a clean development database.
- [ ] Verify primary-key and foreign-key integrity.
- [ ] Verify transfer pairing and quantity consistency.
- [ ] Verify adjustment-reason checks.
- [ ] Run each detection endpoint and record the response.
- [ ] Verify the backend health endpoint and MySQL connection.
- [ ] Verify dashboard, alerts, and investigation APIs.
- [ ] Run the frontend production build successfully.
- [ ] Test the application using the final committed code.
- [ ] Capture final screenshots.
- [ ] Record the final verification date and Git commit hash below.

## 8. Final verification record

| Item | Final value |
|---|---|
| Verification date | To be completed |
| Git commit hash | To be completed |
| Python version | To be confirmed from final environment |
| Node.js version | To be confirmed from final environment |
| MySQL version | To be confirmed from final environment |
| Frontend production build | To be completed |
| Final validator result | To be completed |
| Known failures or deviations | To be completed honestly |

## 9. Limitations and interpretation

- The recorded dataset is a development-scale dataset, not the full target-scale volume.
- Synthetic data cannot represent every real retail operation.
- Rule-based risk scores are illustrative and are not statistically calibrated fraud probabilities.
- A shortage or unusual transaction pattern is an investigation signal, not proof of theft or misconduct.
- Production deployment, authentication hardening, authorization review, monitoring, and large-scale performance testing require additional work.

## 10. Evidence integrity

Keep the raw test outputs, SQL query results, Swagger responses, and final screenshots where possible. If a result changes when tests are repeated, update the reported value rather than preserving an outdated result. Do not mark an unchecked item as passed.
