# Inventory Management System

## Overview

The inventory management system tracks stock levels of wire material at each production stage in real-time. This enables effective stock control, preventing stockouts and identifying bottlenecks in the production pipeline.

## Features

### 1. Real-Time Stock Tracking
- **Stage-wise Inventory**: Track wire quantities at each of the 5 production stages:
  - **RBD** (Rod Breakdown): Raw wire input (3.0mm)
  - **Inter** (Intermediate): After initial processing (2.0-2.5mm)
  - **Oven** (Annealing): After heat treatment
  - **DPC** (Drawing/Pointing/Cutting): Fine wire (1.0mm)
  - **Rewind**: Final packaged product

- **Current Stock Levels**: Real-time display of stock in kilograms at each stage
- **Wire Specifications**: Track wire size (mm and SWG) for each inventory item
- **Auto-Refresh**: Inventory data refreshes every 30 seconds

### 2. Stock Alerts
- **Low Stock Warnings**: Automatic alerts when inventory falls below minimum threshold
- **High Stock Warnings**: Alerts when inventory exceeds maximum capacity
- **Visual Indicators**: Color-coded status (green=normal, yellow=high, red=low)
- **Alert Dashboard**: Dedicated panel showing all active inventory alerts

### 3. Stock Movement Tracking
- **Material Movements**: Record transfers between production stages
- **Transaction History**: Complete audit trail of all stock additions/removals
- **Automatic Sync**: Inventory automatically updates based on production records
- **Manual Adjustments**: Ability to manually adjust stock levels with notes

### 4. Inventory Analytics
- **Total Stock**: Overall inventory across all stages
- **Stage Utilization**: Percentage of capacity used at each stage
- **Stock Status**: Real-time assessment of stock health (LOW/NORMAL/HIGH)
- **Historical Trends**: Track inventory changes over time

## API Endpoints

### Get All Inventory
```http
GET /api/inventory/all
```
Returns current stock levels for all stages with detailed information.

**Response:**
```json
[
  {
    "id": 1,
    "stage": "RBD",
    "current_stock": 2500.5,
    "wire_size_mm": 3.0,
    "wire_size_swg": "10",
    "min_stock_level": 500.0,
    "max_stock_level": 5000.0,
    "stock_status": "NORMAL",
    "last_updated": "2025-12-24T10:30:00"
  }
]
```

### Get Inventory Summary
```http
GET /api/inventory/summary
```
Returns overall inventory statistics and summary.

**Response:**
```json
{
  "total_stock": 12500.75,
  "stages": [
    {
      "stage": "RBD",
      "stock": 2500.5,
      "status": "NORMAL",
      "utilization_percentage": 50.0
    }
  ],
  "low_stock_count": 0,
  "high_stock_count": 0,
  "last_updated": "2025-12-24T10:30:00"
}
```

### Get Stage Inventory
```http
GET /api/inventory/stage/{stage}
```
Returns inventory details for a specific production stage.

**Path Parameters:**
- `stage`: One of `RBD`, `INTER`, `OVEN`, `DPC`, `REWIND`

### Update Inventory
```http
POST /api/inventory/update
```
Manually update inventory for a stage.

**Query Parameters:**
- `stage`: Production stage
- `quantity`: Amount to add/remove (kg)
- `transaction_type`: `IN` (add stock) or `OUT` (remove stock)
- `notes` (optional): Reason for adjustment

**Example:**
```bash
curl -X POST "http://localhost:8000/api/inventory/update?stage=RBD&quantity=100&transaction_type=IN&notes=Raw material delivery"
```

### Record Material Movement
```http
POST /api/inventory/movement
```
Record material transfer between production stages.

**Query Parameters:**
- `from_stage`: Source stage
- `to_stage`: Destination stage
- `quantity`: Amount transferred (kg)
- `wire_size_mm` (optional): Wire diameter
- `wire_size_swg` (optional): Wire gauge
- `notes` (optional): Movement notes

**Example:**
```bash
curl -X POST "http://localhost:8000/api/inventory/movement?from_stage=RBD&to_stage=INTER&quantity=200"
```

### Get Inventory Alerts
```http
GET /api/inventory/alerts
```
Returns all active inventory alerts (low/high stock warnings).

**Response:**
```json
{
  "alert_count": 2,
  "alerts": [
    {
      "stage": "DPC",
      "alert_type": "LOW_STOCK",
      "current_stock": 350.5,
      "threshold": 500.0,
      "message": "Stock level below minimum threshold"
    }
  ]
}
```

### Get Transaction History
```http
GET /api/inventory/transactions?stage={stage}&limit={limit}
```
Returns history of inventory transactions.

**Query Parameters:**
- `stage` (optional): Filter by production stage
- `limit` (optional): Maximum number of records (default: 50, max: 500)

### Get Material Movements
```http
GET /api/inventory/movements?from_stage={from}&to_stage={to}&limit={limit}
```
Returns history of material movements between stages.

**Query Parameters:**
- `from_stage` (optional): Filter by source stage
- `to_stage` (optional): Filter by destination stage
- `limit` (optional): Maximum number of records (default: 50, max: 500)

### Sync Inventory
```http
POST /api/inventory/sync?start_date={date}
```
Recalculate inventory from production records.

**Query Parameters:**
- `start_date` (optional): Calculate from this date (default: all records)

## Database Schema

### StageInventory Table
Stores current inventory levels at each stage.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| stage | String | Production stage name |
| current_stock | Float | Current stock in kg |
| wire_size_mm | Float | Wire diameter in mm |
| wire_size_swg | Integer | Wire standard gauge |
| min_stock_level | Float | Minimum threshold (default: 500 kg) |
| max_stock_level | Float | Maximum capacity (default: 5000 kg) |
| last_updated | DateTime | Last update timestamp |

### InventoryTransaction Table
Records all stock additions and removals.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| stage | String | Production stage |
| transaction_type | String | IN (add) or OUT (remove) |
| quantity | Float | Amount in kg |
| stock_before | Float | Stock before transaction |
| stock_after | Float | Stock after transaction |
| production_record_id | Integer | Related production record (optional) |
| notes | String | Transaction notes |
| timestamp | DateTime | Transaction time |

### MaterialMovement Table
Tracks material transfers between stages.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| from_stage | String | Source stage |
| to_stage | String | Destination stage |
| quantity | Float | Amount transferred (kg) |
| wire_size_mm | Float | Wire diameter |
| wire_size_swg | Integer | Wire gauge |
| movement_date | Date | Movement date |
| notes | String | Movement notes |

## Frontend Components

### InventoryOverview Component
Located in: `frontend/src/components/InventoryOverview.tsx`

**Features:**
- Grid layout showing all 5 production stages
- Color-coded cards based on stock status
- Visual progress bars showing stock levels
- Real-time updates every 30 seconds
- Total stock summary at the top
- Low stock alert counter

**Display Elements:**
- Stage name and icon
- Current stock quantity
- Wire specifications (mm and SWG)
- Min/max thresholds
- Stock level progress bar
- Status badge (LOW/NORMAL/HIGH)
- Last updated timestamp

## Usage Examples

### Monitor Stock Levels
Open the dashboard in your browser to see the inventory overview section at the top. Each stage shows:
- Current stock in kg
- Visual indicator of stock health
- Whether it's below minimum or above maximum threshold

### Add Stock (Manual Entry)
When receiving raw materials or adjusting inventory:
```bash
curl -X POST "http://localhost:8000/api/inventory/update?stage=RBD&quantity=500&transaction_type=IN&notes=Weekly raw material delivery"
```

### Record Production Movement
When material moves from one stage to the next:
```bash
curl -X POST "http://localhost:8000/api/inventory/movement?from_stage=RBD&to_stage=INTER&quantity=300&wire_size_mm=3.0"
```

### Check for Low Stock
```bash
curl http://localhost:8000/api/inventory/alerts
```

### View Transaction History
```bash
curl "http://localhost:8000/api/inventory/transactions?stage=DPC&limit=20"
```

### Recalculate Inventory
If you need to resync inventory based on production records:
```bash
curl -X POST "http://localhost:8000/api/inventory/sync?start_date=2025-01-01"
```

## Configuration

### Stock Thresholds
Default thresholds can be adjusted in the database or via API:
- **Minimum Stock Level**: 500 kg (triggers LOW_STOCK alert)
- **Maximum Stock Level**: 5000 kg (triggers HIGH_STOCK alert)

### Refresh Intervals
- **Inventory Data**: Auto-refreshes every 30 seconds
- **Production Data**: Auto-refreshes every 60 seconds

## Integration with Production Records

The inventory system automatically integrates with production data:

1. **Auto-Sync on Startup**: Inventory initializes based on historical production records
2. **Real-Time Updates**: As production records are added, inventory is automatically adjusted
3. **Material Flow**: Output from one stage becomes input for the next stage
4. **Scrap Tracking**: Scrap quantities are automatically deducted from inventory

## Best Practices

### Daily Operations
1. **Morning**: Check inventory dashboard for low stock alerts
2. **Material Receipt**: Use inventory update API to record incoming raw materials
3. **Production Shifts**: Monitor stage-wise inventory to identify bottlenecks
4. **End of Day**: Review transaction history for any discrepancies

### Stock Management
- Maintain safety stock above minimum thresholds
- Plan raw material orders based on consumption trends
- Investigate when stock levels approach maximum capacity (may indicate downstream bottleneck)
- Use material movement tracking for quality traceability

### Troubleshooting
- **Inaccurate Inventory**: Use `/api/inventory/sync` to recalculate from production records
- **Missing Transactions**: Check transaction history to identify gaps
- **Persistent Alerts**: Adjust min/max thresholds if alerts are too sensitive

## Future Enhancements

Potential future features:
- **Predictive Analytics**: Forecast when stock will run out based on consumption trends
- **Automatic Reordering**: Trigger purchase orders when stock falls below threshold
- **Cost Tracking**: Link inventory with material costs for financial reporting
- **Batch Tracking**: Track specific material batches through production stages
- **Quality Holds**: Ability to mark inventory as "on hold" pending quality inspection

## Support

For questions or issues related to inventory management:
1. Check API endpoint documentation above
2. Review transaction history for audit trail
3. Use sync endpoint to recalculate inventory if data seems incorrect
4. Contact system administrator for database-level issues

---

**Note**: Inventory data is stored in SQLite database at `backend/production.db`. Regular backups are recommended to prevent data loss.
