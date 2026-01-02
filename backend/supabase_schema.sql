-- Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE shift_enum AS ENUM ('Morning', 'Afternoon', 'Night');
CREATE TYPE stage_enum AS ENUM ('RBD', 'Inter', 'Oven', 'DPC', 'Rewind');
CREATE TYPE order_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE stock_status AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- Production Records Table
CREATE TABLE production_records (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    shift shift_enum NOT NULL,
    stage stage_enum NOT NULL,
    input_qty FLOAT NOT NULL DEFAULT 0.0,
    output_qty FLOAT NOT NULL DEFAULT 0.0,
    scrap_qty FLOAT NOT NULL DEFAULT 0.0,
    input_size_mm FLOAT,
    output_size_mm FLOAT,
    input_size_swg INTEGER,
    output_size_swg INTEGER,
    efficiency FLOAT,
    loss_percentage FLOAT,
    operator_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Stage Configuration Table
CREATE TABLE stage_configuration (
    id SERIAL PRIMARY KEY,
    stage stage_enum UNIQUE NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    sequence_order INTEGER NOT NULL,
    target_efficiency FLOAT DEFAULT 95.0,
    max_scrap_percentage FLOAT DEFAULT 5.0,
    is_active BOOLEAN DEFAULT true
);

-- Stage Inventory Table
CREATE TABLE stage_inventory (
    id SERIAL PRIMARY KEY,
    stage stage_enum UNIQUE NOT NULL,
    current_stock FLOAT NOT NULL DEFAULT 0.0,
    wire_size_mm FLOAT,
    wire_size_swg VARCHAR(10),
    min_stock_level FLOAT DEFAULT 500.0,
    max_stock_level FLOAT DEFAULT 5000.0,
    stock_status stock_status DEFAULT 'NORMAL',
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Inventory Transactions Table
CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    stage stage_enum NOT NULL,
    transaction_type VARCHAR(10) NOT NULL,
    quantity FLOAT NOT NULL,
    transaction_date TIMESTAMP DEFAULT NOW(),
    reference_id INTEGER,
    notes TEXT
);

-- Material Movements Table
CREATE TABLE material_movements (
    id SERIAL PRIMARY KEY,
    from_stage stage_enum,
    to_stage stage_enum NOT NULL,
    quantity FLOAT NOT NULL,
    movement_date TIMESTAMP DEFAULT NOW(),
    batch_number VARCHAR(100),
    notes TEXT
);

-- Production Orders Table
CREATE TABLE production_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    product_specification TEXT,
    ordered_quantity FLOAT NOT NULL,
    completed_quantity FLOAT DEFAULT 0.0,
    target_wire_size_mm FLOAT,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    status order_status DEFAULT 'PENDING',
    priority INTEGER DEFAULT 1,
    current_stage stage_enum,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Order Stage Progress Table
CREATE TABLE order_stage_progress (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES production_orders(id) ON DELETE CASCADE,
    stage stage_enum NOT NULL,
    stage_status VARCHAR(20) DEFAULT 'PENDING',
    output_quantity FLOAT DEFAULT 0.0,
    scrap_quantity FLOAT DEFAULT 0.0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(order_id, stage)
);

-- Batch Tracking Table
CREATE TABLE batch_tracking (
    id SERIAL PRIMARY KEY,
    batch_number VARCHAR(100) UNIQUE NOT NULL,
    quantity FLOAT NOT NULL,
    remaining_quantity FLOAT,
    current_stage stage_enum DEFAULT 'RBD',
    current_status VARCHAR(20) DEFAULT 'ACTIVE',
    material_type VARCHAR(50),
    lot_number VARCHAR(100),
    supplier_name VARCHAR(200),
    received_date DATE,
    order_id INTEGER REFERENCES production_orders(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Batch Journey Events Table
CREATE TABLE batch_journey_events (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES batch_tracking(id) ON DELETE CASCADE,
    from_stage stage_enum,
    to_stage stage_enum NOT NULL,
    quantity FLOAT NOT NULL,
    scrap_quantity FLOAT DEFAULT 0.0,
    operator VARCHAR(100),
    event_timestamp TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

-- Create Indexes for Performance
CREATE INDEX idx_production_date ON production_records(date);
CREATE INDEX idx_production_shift ON production_records(shift);
CREATE INDEX idx_production_stage ON production_records(stage);
CREATE INDEX idx_orders_status ON production_orders(status);
CREATE INDEX idx_orders_customer ON production_orders(customer_name);
CREATE INDEX idx_batch_status ON batch_tracking(current_status);
CREATE INDEX idx_batch_stage ON batch_tracking(current_stage);

-- Insert Default Stage Configurations
INSERT INTO stage_configuration (stage, display_name, sequence_order, target_efficiency) VALUES
('RBD', 'Rod Breakdown', 1, 95.0),
('Inter', 'Intermediate Drawing', 2, 96.0),
('Oven', 'Annealing', 3, 98.0),
('DPC', 'Drawing & Pointing', 4, 94.0),
('Rewind', 'Final Rewind', 5, 97.0);

-- Initialize Stage Inventory
INSERT INTO stage_inventory (stage, current_stock, min_stock_level, max_stock_level) VALUES
('RBD', 0, 500, 5000),
('Inter', 0, 500, 5000),
('Oven', 0, 500, 5000),
('DPC', 0, 500, 5000),
('Rewind', 0, 500, 5000);
