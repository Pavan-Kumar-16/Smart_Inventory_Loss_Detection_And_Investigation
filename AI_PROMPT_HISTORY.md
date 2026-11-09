# AI-Assisted Development & Prompt History

**Project:** Smart Inventory Loss Detection & Investigation System  
**Submission:** YottaFlex AI Recruitment Drive  
**Purpose:** Disclose AI assistance honestly and show how AI-supported work was reviewed and validated.

> **Important note on transcript accuracy:** This document is a structured summary of the AI-assisted work recorded during development. The prompt examples below are representative descriptions of the requests made; they are not presented as a complete verbatim export of every chat message or tool interaction. If the recruitment team requests raw prompt logs, attach/export the original ChatGPT and Antigravity histories where available.

## 1. AI tools used

| Tool | How it was used |
|---|---|
| ChatGPT | Planning the project structure, explaining implementation concepts, helping design database and API logic, debugging errors, reviewing frontend behavior, and organizing technical documentation. |
| Antigravity | Include only the work actually performed with Antigravity. During final review, replace this description with the specific code-generation, editing, or UI tasks it performed. |
| Other tools | Add only tools that were actually used. |

## 2. Representative prompt history

The following examples summarize the main categories of requests made during development.

| Area | Representative prompt / request | AI assistance provided | What I needed to review or validate |
|---|---|---|---|
| Project planning | Help me break the inventory-loss detection assignment into a practical implementation plan, with a clear sequence for database, data generation, backend, and frontend work. | Helped organize the work into implementation stages and identify key entities and deliverables. | Confirmed the plan against the assignment requirements and the actual project structure. |
| Data model and business rules | Explain how to model stores, SKUs, inventory movements, cycle counts, employees, shifts, alerts, and investigations, including relationships and validation rules. | Helped reason about relational structure, stock reconciliation, movement types, and investigation traceability. | Reviewed the SQL schema and checked primary/foreign-key relationships and business rules. |
| Synthetic data generation | Help me build a reproducible Python data generator with deterministic IDs, valid baseline records, and separate labelled anomaly scenarios. | Supported generator organization, data-generation logic, and validation approach. | Ran the generator and validator; checked generated files, row counts, and database integrity. |
| Data loading and database debugging | Help me debug the MySQL loading process and resolve database connection or insertion errors from the traceback. | Explained errors and suggested targeted code/configuration corrections. | Re-ran the loader and checked the resulting MySQL records and reconciliation queries. |
| Detection logic | Help implement rule-based shrinkage detection, repeated-adjustment detection, and transfer inconsistency checks, with supporting evidence. | Helped structure detection rules and evidence creation. | Tested against the development dataset and verified that valid transfer groups were not incorrectly flagged. |
| Backend APIs | Help build and debug FastAPI endpoints for dashboard metrics, alerts, detection, and investigation workflows. | Supported endpoint structure, SQL queries, response handling, and debugging. | Tested endpoints through Swagger and checked returned data against MySQL. |
| Frontend integration | Help connect the React/TypeScript pages to the FastAPI endpoints and display database-backed dashboard and investigation information. | Helped with API integration, state handling, and component-level debugging. | Ran the frontend and backend together and checked displayed values against API responses. |
| UI refinement | Review the application layout and suggest focused improvements while preserving the existing design, navigation, and working behavior. | Helped identify spacing, width, and component presentation improvements. | Visually checked the pages after changes and ensured existing functionality remained intact. |
| Documentation | Help prepare one complete README describing the architecture, setup, data generation, detection logic, validation, limitations, and screenshots. | Helped organize the documentation and submission checklist. | Compared the documentation with the actual repository structure and commands. |

## 3. Where AI accelerated development

AI assistance was useful for:
- Breaking a broad assignment into manageable implementation stages.
- Explaining unfamiliar concepts and helping reason about database relationships and inventory calculations.
- Interpreting Python, MySQL, FastAPI, and frontend errors.
- Suggesting implementation patterns for detection rules and evidence records.
- Organizing API integration and technical documentation.

## 4. Where AI assistance was substantial

AI assistance was substantial in planning, debugging, implementation guidance, API integration support, UI refinement, and documentation. Code suggestions were not treated as automatically correct. They needed to be checked against the database schema, project requirements, and actual application behavior.

Update this section with the exact Antigravity contributions and any other AI tools actually used. Do not claim independent implementation for work that was generated or substantially assisted by AI.

## 5. My review, changes, and validation

During development, I personally:
- Ran the data-generation and MySQL loading commands.
- Reviewed generated CSV files and database records.
- Executed SQL checks for transfer pairing and missing adjustment reasons.
- Ran the data validator and reviewed its results.
- Started the FastAPI backend and tested endpoints through Swagger.
- Started the React frontend and checked the pages against live API responses.
- Reviewed and debugged errors encountered during integration.
- Checked that the investigation workflow and audit-history information appeared in the application.

Before submission, I will re-run the key checks against the exact code committed to the public repository.

## 6. Transparency statement

AI tools were used as development assistants. They accelerated planning, explanations, debugging, implementation guidance, UI refinement, and documentation. I reviewed and tested the resulting work in the local application and database. This disclosure distinguishes AI assistance from the checks and decisions I personally performed.
