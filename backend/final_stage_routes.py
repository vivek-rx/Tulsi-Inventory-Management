"""
API Endpoints for Final Stages: Quality Check, Packaging, and Dispatch
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from database import get_db
from final_stage_models import QualityInspection, PackagingRecord, DispatchRecord
from order_models import BatchTracking, ProductionOrder
from models import StageEnum

router = APIRouter()

# ==================== PYDANTIC SCHEMAS ====================

class QualityCheckPayload(BaseModel):
    inspector_name: str
    quality_status: str  # PASSED, FAILED, PENDING
    defect_type: Optional[str] = None
    defect_count: int = 0
    sample_size: Optional[float] = None
    notes: Optional[str] = None

class PackagingPayload(BaseModel):
    package_type: str
    coil_count: int
    package_weight: float
    operator_name: str
    package_number: Optional[str] = None
    notes: Optional[str] = None

class DispatchPayload(BaseModel):
    transport_mode: str
    vehicle_number: Optional[str] = None
    tracking_number: Optional[str] = None
    destination: str
    customer_contact: Optional[str] = None
    driver_name: Optional[str] = None
    notes: Optional[str] = None

class DeliveryStatusUpdate(BaseModel):
    delivery_status: str  # PENDING, IN_TRANSIT, DELIVERED
    delivered_date: Optional[date] = None

# ==================== QUALITY CHECK ENDPOINTS ====================

@router.post("/batches/{batch_id}/quality-check")
def record_quality_check(
    batch_id: int,
    payload: QualityCheckPayload,
    db: Session = Depends(get_db)
):
    """Record quality inspection for a batch"""
    batch = db.query(BatchTracking).filter(BatchTracking.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")
    
    # Create quality inspection record
    inspection = QualityInspection(
        batch_id=batch.id,
        order_id=batch.order_id,
        inspector_name=payload.inspector_name,
        inspection_date=date.today(),
        quality_status=payload.quality_status,
        defect_type=payload.defect_type,
        defect_count=payload.defect_count,
        sample_size=payload.sample_size,
        notes=payload.notes
    )
    db.add(inspection)
    
    # Update batch stage if quality passed
    if payload.quality_status == "PASSED":
        batch.current_stage = StageEnum.QUALITY_CHECK.value
    
    db.commit()
    db.refresh(inspection)
    
    return {
        "success": True,
        "message": f"Quality check recorded for batch {batch.batch_number}",
        "inspection_id": inspection.id,
        "status": inspection.quality_status
    }

@router.get("/quality-inspections")
def get_quality_inspections(
    batch_id: Optional[int] = None,
    order_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get quality inspection records"""
    query = db.query(QualityInspection)
    
    if batch_id:
        query = query.filter(QualityInspection.batch_id == batch_id)
    if order_id:
        query = query.filter(QualityInspection.order_id == order_id)
    if status:
        query = query.filter(QualityInspection.quality_status == status)
    
    inspections = query.order_by(QualityInspection.created_at.desc()).all()
    
    return [
        {
            "id": insp.id,
            "batch_id": insp.batch_id,
            "order_id": insp.order_id,
            "inspector_name": insp.inspector_name,
            "inspection_date": insp.inspection_date.isoformat(),
            "quality_status": insp.quality_status,
            "defect_type": insp.defect_type,
            "defect_count": insp.defect_count,
            "notes": insp.notes
        }
        for insp in inspections
    ]

# ==================== PACKAGING ENDPOINTS ====================

@router.post("/batches/{batch_id}/package")
def record_packaging(
    batch_id: int,
    payload: PackagingPayload,
    db: Session = Depends(get_db)
):
    """Record packaging for a batch"""
    batch = db.query(BatchTracking).filter(BatchTracking.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")
    
    # Create packaging record
    packaging = PackagingRecord(
        batch_id=batch.id,
        order_id=batch.order_id,
        package_type=payload.package_type,
        coil_count=payload.coil_count,
        package_weight=payload.package_weight,
        operator_name=payload.operator_name,
        packing_date=date.today(),
        package_number=payload.package_number,
        notes=payload.notes
    )
    db.add(packaging)
    
    # Update batch stage
    batch.current_stage = StageEnum.PACKAGING.value
    
    db.commit()
    db.refresh(packaging)
    
    return {
        "success": True,
        "message": f"Packaging recorded for batch {batch.batch_number}",
        "packaging_id": packaging.id,
        "package_type": packaging.package_type
    }

@router.get("/packaging-records")
def get_packaging_records(
    batch_id: Optional[int] = None,
    order_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get packaging records"""
    query = db.query(PackagingRecord)
    
    if batch_id:
        query = query.filter(PackagingRecord.batch_id == batch_id)
    if order_id:
        query = query.filter(PackagingRecord.order_id == order_id)
    
    records = query.order_by(PackagingRecord.created_at.desc()).all()
    
    return [
        {
            "id": rec.id,
            "batch_id": rec.batch_id,
            "order_id": rec.order_id,
            "package_type": rec.package_type,
            "coil_count": rec.coil_count,
            "package_weight": rec.package_weight,
            "operator_name": rec.operator_name,
            "packing_date": rec.packing_date.isoformat(),
            "package_number": rec.package_number,
            "notes": rec.notes
        }
        for rec in records
    ]

# ==================== DISPATCH ENDPOINTS ====================

@router.post("/orders/{order_id}/dispatch")
def record_dispatch(
    order_id: int,
    payload: DispatchPayload,
    db: Session = Depends(get_db)
):
    """Record dispatch for an order"""
    order = db.query(ProductionOrder).filter(ProductionOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    
    # Create dispatch record
    dispatch = DispatchRecord(
        order_id=order.id,
        dispatch_date=date.today(),
        transport_mode=payload.transport_mode,
        vehicle_number=payload.vehicle_number,
        tracking_number=payload.tracking_number,
        destination=payload.destination,
        customer_contact=payload.customer_contact,
        delivery_status="IN_TRANSIT",
        driver_name=payload.driver_name,
        notes=payload.notes
    )
    db.add(dispatch)
    
    # Update order status
    order.status = "DISPATCHED"
    order.current_stage = StageEnum.DISPATCH.value
    
    db.commit()
    db.refresh(dispatch)
    
    return {
        "success": True,
        "message": f"Dispatch recorded for order {order.order_number}",
        "dispatch_id": dispatch.id,
        "tracking_number": dispatch.tracking_number
    }

@router.get("/dispatches")
def get_dispatches(
    order_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get dispatch records"""
    query = db.query(DispatchRecord)
    
    if order_id:
        query = query.filter(DispatchRecord.order_id == order_id)
    if status:
        query = query.filter(DispatchRecord.delivery_status == status)
    
    records = query.order_by(DispatchRecord.created_at.desc()).all()
    
    return [
        {
            "id": rec.id,
            "order_id": rec.order_id,
            "dispatch_date": rec.dispatch_date.isoformat(),
            "transport_mode": rec.transport_mode,
            "vehicle_number": rec.vehicle_number,
            "tracking_number": rec.tracking_number,
            "destination": rec.destination,
            "delivery_status": rec.delivery_status,
            "delivered_date": rec.delivered_date.isoformat() if rec.delivered_date else None,
            "driver_name": rec.driver_name,
            "notes": rec.notes
        }
        for rec in records
    ]

@router.patch("/dispatches/{dispatch_id}/status")
def update_delivery_status(
    dispatch_id: int,
    payload: DeliveryStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update delivery status"""
    dispatch = db.query(DispatchRecord).filter(DispatchRecord.id == dispatch_id).first()
    if not dispatch:
        raise HTTPException(status_code=404, detail=f"Dispatch record {dispatch_id} not found")
    
    dispatch.delivery_status = payload.delivery_status
    if payload.delivered_date:
        dispatch.delivered_date = payload.delivered_date
    
    # Update order if delivered
    if payload.delivery_status == "DELIVERED":
        order = db.query(ProductionOrder).filter(ProductionOrder.id == dispatch.order_id).first()
        if order:
            order.status = "DELIVERED"
            order.actual_delivery_date = payload.delivered_date or date.today()
    
    db.commit()
    db.refresh(dispatch)
    
    return {
        "success": True,
        "message": f"Delivery status updated to {payload.delivery_status}",
        "dispatch_id": dispatch.id,
        "delivery_status": dispatch.delivery_status
    }
