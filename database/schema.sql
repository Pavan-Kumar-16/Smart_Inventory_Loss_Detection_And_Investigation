CREATE DATABASE IF NOT EXISTS inventory_loss_db;
USE inventory_loss_db;

CREATE TABLE stores (
    store_id VARCHAR(20) PRIMARY KEY,
    store_name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    store_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE skus (
    sku_id VARCHAR(20) PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE employees (
    employee_id VARCHAR(20) PRIMARY KEY,
    employee_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE roles (
    role_id VARCHAR(20) PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE employee_roles (
    assignment_id VARCHAR(30) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    role_id VARCHAR(20) NOT NULL,
    store_id VARCHAR(20),
    valid_from DATETIME NOT NULL,
    valid_to DATETIME,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    CHECK (valid_to IS NULL OR valid_to > valid_from)
);

CREATE TABLE shifts (
    shift_id VARCHAR(30) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    store_id VARCHAR(20) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    CHECK (end_time > start_time)
);

CREATE TABLE store_skus (
    store_sku_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    store_id VARCHAR(20) NOT NULL,
    sku_id VARCHAR(20) NOT NULL,
    reorder_level INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (store_id, sku_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (sku_id) REFERENCES skus(sku_id),
    CHECK (reorder_level >= 0)
);

CREATE TABLE promotions (
    promotion_id VARCHAR(30) PRIMARY KEY,
    promotion_name VARCHAR(100) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL,
    CHECK (end_date > start_date)
);

CREATE TABLE promotion_skus (
    promotion_id VARCHAR(30) NOT NULL,
    sku_id VARCHAR(20) NOT NULL,
    PRIMARY KEY (promotion_id, sku_id),
    FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id),
    FOREIGN KEY (sku_id) REFERENCES skus(sku_id)
);

CREATE TABLE inventory_movements (
    movement_id VARCHAR(30) PRIMARY KEY,
    store_id VARCHAR(20) NOT NULL,
    sku_id VARCHAR(20) NOT NULL,
    movement_type VARCHAR(30) NOT NULL,
    quantity INT NOT NULL,
    reason VARCHAR(255),
    employee_role_id VARCHAR(30),
    shift_id VARCHAR(30),
    transfer_group_id VARCHAR(40),
    promotion_id VARCHAR(30),
    occurred_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (sku_id) REFERENCES skus(sku_id),
    FOREIGN KEY (employee_role_id)
        REFERENCES employee_roles(assignment_id),
    FOREIGN KEY (shift_id) REFERENCES shifts(shift_id),
    FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id),

    CHECK (quantity > 0),
    CHECK (movement_type IN (
        'OPENING', 'RECEIPT', 'SALE',
        'TRANSFER_IN', 'TRANSFER_OUT',
        'DAMAGE', 'RETURN_IN', 'RETURN_OUT',
        'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'
    ))
);

CREATE TABLE cycle_counts (
    count_id VARCHAR(30) PRIMARY KEY,
    store_id VARCHAR(20) NOT NULL,
    sku_id VARCHAR(20) NOT NULL,
    expected_qty INT NOT NULL,
    counted_qty INT NOT NULL,
    employee_id VARCHAR(20),
    shift_id VARCHAR(30),
    counted_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (sku_id) REFERENCES skus(sku_id),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    FOREIGN KEY (shift_id) REFERENCES shifts(shift_id),

    CHECK (expected_qty >= 0),
    CHECK (counted_qty >= 0)
);

CREATE TABLE returns (
    return_id VARCHAR(30) PRIMARY KEY,
    store_id VARCHAR(20) NOT NULL,
    sku_id VARCHAR(20) NOT NULL,
    original_sale_id VARCHAR(30),
    return_movement_id VARCHAR(30),
    quantity INT NOT NULL,
    reason VARCHAR(100) NOT NULL,
    returned_at DATETIME NOT NULL,

    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (sku_id) REFERENCES skus(sku_id),
    FOREIGN KEY (original_sale_id)
        REFERENCES inventory_movements(movement_id),
    FOREIGN KEY (return_movement_id)
        REFERENCES inventory_movements(movement_id),

    CHECK (quantity > 0)
);

CREATE TABLE shrinkage_alerts (
    alert_id VARCHAR(30) PRIMARY KEY,
    store_id VARCHAR(20) NOT NULL,
    sku_id VARCHAR(20) NOT NULL,
    count_id VARCHAR(30),
    rule_code VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    risk_score DECIMAL(5,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (sku_id) REFERENCES skus(sku_id),
    FOREIGN KEY (count_id) REFERENCES cycle_counts(count_id),

    CHECK (risk_score BETWEEN 0 AND 100),
    CHECK (status IN (
        'OPEN', 'ASSIGNED', 'INVESTIGATING',
        'RESOLVED', 'ESCALATED'
    ))
);

CREATE TABLE alert_evidence (
    evidence_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    alert_id VARCHAR(30) NOT NULL,
    movement_id VARCHAR(30),
    count_id VARCHAR(30),
    evidence_description TEXT NOT NULL,

    FOREIGN KEY (alert_id) REFERENCES shrinkage_alerts(alert_id),
    FOREIGN KEY (movement_id)
        REFERENCES inventory_movements(movement_id),
    FOREIGN KEY (count_id) REFERENCES cycle_counts(count_id),

    CHECK (movement_id IS NOT NULL OR count_id IS NOT NULL)
);

CREATE TABLE investigations (
    investigation_id VARCHAR(30) PRIMARY KEY,
    alert_id VARCHAR(30) NOT NULL,
    assigned_to VARCHAR(20),
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    outcome VARCHAR(40),
    opened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,

    FOREIGN KEY (alert_id) REFERENCES shrinkage_alerts(alert_id),
    FOREIGN KEY (assigned_to) REFERENCES employees(employee_id),

    CHECK (status IN (
        'OPEN', 'ASSIGNED', 'INVESTIGATING',
        'RESOLVED', 'ESCALATED'
    ))
);

CREATE TABLE investigation_history (
    history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    investigation_id VARCHAR(30) NOT NULL,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    notes TEXT,
    changed_by VARCHAR(20),
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (investigation_id)
        REFERENCES investigations(investigation_id),
    FOREIGN KEY (changed_by) REFERENCES employees(employee_id)
);

CREATE INDEX idx_movement_store_sku
ON inventory_movements(store_id, sku_id);

CREATE INDEX idx_movement_date
ON inventory_movements(occurred_at);

CREATE INDEX idx_movement_type
ON inventory_movements(movement_type);

CREATE INDEX idx_count_store_sku_date
ON cycle_counts(store_id, sku_id, counted_at);

CREATE INDEX idx_alert_status
ON shrinkage_alerts(status);

CREATE INDEX idx_alert_risk
ON shrinkage_alerts(risk_score);
