"""
Business logic for KPI calculations and analytics
Handles production metrics, bottleneck detection, and WIP calculations
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from models import ProductionRecord, StageConfiguration, StageEnum, ShiftEnum
from schemas import StageStats, ProcessFlowNode, Alert, TimelineDataPoint
from datetime import date, timedelta
from typing import List, Optional, Dict
from config import settings

class ProductionAnalytics:
    """
    Analytics engine for production monitoring
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_stage_statistics(
        self, 
        stage: StageEnum,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        shift: Optional[ShiftEnum] = None
    ) -> StageStats:
        """
        Calculate comprehensive statistics for a specific stage
        """
        query = self.db.query(ProductionRecord).filter(ProductionRecord.stage == stage)
        
        if start_date:
            query = query.filter(ProductionRecord.date >= start_date)
        if end_date:
            query = query.filter(ProductionRecord.date <= end_date)
        if shift:
            query = query.filter(ProductionRecord.shift == shift)
        
        records = query.all()
        
        if not records:
            return StageStats(
                stage=stage,
                total_input=0,
                total_output=0,
                total_scrap=0,
                avg_efficiency=0,
                avg_loss_percentage=0,
                record_count=0
            )
        
        total_input = sum(r.input_qty for r in records)
        total_output = sum(r.output_qty for r in records)
        total_scrap = sum(r.scrap_qty for r in records)
        
        # Calculate averages
        avg_efficiency = (total_output / total_input * 100) if total_input > 0 else 0
        avg_loss = (total_scrap / total_input * 100) if total_input > 0 else 0
        
        return StageStats(
            stage=stage,
            total_input=round(total_input, 2),
            total_output=round(total_output, 2),
            total_scrap=round(total_scrap, 2),
            avg_efficiency=round(avg_efficiency, 2),
            avg_loss_percentage=round(avg_loss, 2),
            record_count=len(records)
        )
    
    def get_process_flow(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[ProcessFlowNode]:
        """
        Get the complete production flow with all stages
        Shows sequential flow: RBD → Inter → Oven → DPC → Rewind
        """
        # Get stage configurations for sequence order
        stage_configs = self.db.query(StageConfiguration).order_by(
            StageConfiguration.sequence_order
        ).all()
        
        flow_nodes = []
        
        for config in stage_configs:
            stats = self.get_stage_statistics(config.stage, start_date, end_date)
            
            # Determine status based on efficiency
            if stats.avg_efficiency >= settings.efficiency_warning_threshold:
                status = "good"
            elif stats.avg_efficiency >= settings.efficiency_critical_threshold:
                status = "warning"
            else:
                status = "critical"
            
            node = ProcessFlowNode(
                stage=config.stage,
                sequence_order=config.sequence_order,
                input_qty=stats.total_input,
                output_qty=stats.total_output,
                efficiency=stats.avg_efficiency,
                status=status,
                expected_input_size_mm=config.expected_input_size_mm,
                expected_output_size_mm=config.expected_output_size_mm
            )
            flow_nodes.append(node)
        
        return flow_nodes
    
    def detect_bottleneck(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Optional[StageEnum]:
        """
        Detect the bottleneck stage (lowest efficiency or highest loss)
        """
        stages = [StageEnum.RBD, StageEnum.INTER, StageEnum.OVEN, StageEnum.DPC, StageEnum.REWIND]
        
        min_efficiency = float('inf')
        bottleneck = None
        
        for stage in stages:
            stats = self.get_stage_statistics(stage, start_date, end_date)
            if stats.record_count > 0 and stats.avg_efficiency < min_efficiency:
                min_efficiency = stats.avg_efficiency
                bottleneck = stage
        
        return bottleneck
    
    def calculate_wip(
        self,
        from_stage: StageEnum,
        to_stage: StageEnum,
        target_date: date
    ) -> float:
        """
        Calculate Work-in-Progress between two stages
        WIP = Output of from_stage - Input of to_stage
        """
        # Get output from previous stage
        from_output = self.db.query(
            func.sum(ProductionRecord.output_qty)
        ).filter(
            and_(
                ProductionRecord.stage == from_stage,
                ProductionRecord.date <= target_date
            )
        ).scalar() or 0
        
        # Get input to next stage
        to_input = self.db.query(
            func.sum(ProductionRecord.input_qty)
        ).filter(
            and_(
                ProductionRecord.stage == to_stage,
                ProductionRecord.date <= target_date
            )
        ).scalar() or 0
        
        wip = from_output - to_input
        return max(0, wip)  # WIP cannot be negative
    
    def get_timeline_data(
        self,
        start_date: date,
        end_date: date,
        stage: Optional[StageEnum] = None
    ) -> List[Dict]:
        """
        Get daily production timeline data for charts
        """
        query = self.db.query(
            ProductionRecord.date,
            ProductionRecord.stage,
            func.sum(ProductionRecord.output_qty).label('total_output'),
            func.avg(ProductionRecord.efficiency).label('avg_efficiency')
        ).filter(
            and_(
                ProductionRecord.date >= start_date,
                ProductionRecord.date <= end_date
            )
        ).group_by(
            ProductionRecord.date,
            ProductionRecord.stage
        ).order_by(
            ProductionRecord.date
        )
        
        if stage:
            query = query.filter(ProductionRecord.stage == stage)
        
        results = query.all()
        
        timeline = []
        for row in results:
            timeline.append({
                "date": row.date.isoformat(),
                "stage": row.stage.value,
                "output_qty": round(row.total_output, 2),
                "efficiency": round(row.avg_efficiency, 2)
            })
        
        return timeline
    
    def generate_alerts(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Alert]:
        """
        Generate alerts for production issues
        - Low efficiency
        - High loss
        - Bottlenecks
        """
        if not start_date:
            start_date = date.today() - timedelta(days=7)
        if not end_date:
            end_date = date.today()
        
        alerts = []
        
        # Get stage configurations for thresholds
        stage_configs = {
            sc.stage: sc for sc in self.db.query(StageConfiguration).all()
        }
        
        # Check each stage
        for stage in StageEnum:
            config = stage_configs.get(stage)
            if not config:
                continue
            
            # Get recent records
            records = self.db.query(ProductionRecord).filter(
                and_(
                    ProductionRecord.stage == stage,
                    ProductionRecord.date >= start_date,
                    ProductionRecord.date <= end_date
                )
            ).order_by(desc(ProductionRecord.date)).limit(10).all()
            
            for record in records:
                # Low efficiency alert
                if record.efficiency and record.efficiency < config.min_efficiency:
                    severity = "critical" if record.efficiency < settings.efficiency_critical_threshold else "warning"
                    alerts.append(Alert(
                        severity=severity,
                        stage=stage,
                        message=f"Low efficiency: {record.efficiency:.1f}% (expected: >{config.min_efficiency}%)",
                        date=record.date,
                        shift=record.shift,
                        metric_value=record.efficiency
                    ))
                
                # High loss alert
                if record.loss_percentage and record.loss_percentage > config.max_loss_percentage:
                    severity = "critical" if record.loss_percentage > settings.loss_critical_threshold else "warning"
                    alerts.append(Alert(
                        severity=severity,
                        stage=stage,
                        message=f"High loss: {record.loss_percentage:.1f}% (max: {config.max_loss_percentage}%)",
                        date=record.date,
                        shift=record.shift,
                        metric_value=record.loss_percentage
                    ))
        
        # Bottleneck alert
        bottleneck = self.detect_bottleneck(start_date, end_date)
        if bottleneck:
            stats = self.get_stage_statistics(bottleneck, start_date, end_date)
            alerts.append(Alert(
                severity="warning",
                stage=bottleneck,
                message=f"Bottleneck detected: {bottleneck.value} stage has lowest efficiency ({stats.avg_efficiency:.1f}%)",
                date=end_date,
                shift=ShiftEnum.MORNING,
                metric_value=stats.avg_efficiency
            ))
        
        # Sort by severity and date
        severity_order = {"critical": 0, "warning": 1, "info": 2}
        alerts.sort(key=lambda x: (severity_order[x.severity], x.date), reverse=True)
        
        return alerts[:20]  # Return top 20 alerts
    
    def get_overall_metrics(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict:
        """
        Get overall production metrics for dashboard summary
        """
        # Total production is final output from Rewind stage
        total_production = self.db.query(
            func.sum(ProductionRecord.output_qty)
        ).filter(
            ProductionRecord.stage == StageEnum.REWIND
        )
        
        if start_date:
            total_production = total_production.filter(ProductionRecord.date >= start_date)
        if end_date:
            total_production = total_production.filter(ProductionRecord.date <= end_date)
        
        total_production = total_production.scalar() or 0
        
        # Total scrap across all stages
        total_scrap = self.db.query(
            func.sum(ProductionRecord.scrap_qty)
        ).filter(
            ProductionRecord.date >= start_date if start_date else True,
            ProductionRecord.date <= end_date if end_date else True
        ).scalar() or 0
        
        # Overall efficiency (final output / initial input)
        initial_input = self.db.query(
            func.sum(ProductionRecord.input_qty)
        ).filter(
            ProductionRecord.stage == StageEnum.RBD
        )
        
        if start_date:
            initial_input = initial_input.filter(ProductionRecord.date >= start_date)
        if end_date:
            initial_input = initial_input.filter(ProductionRecord.date <= end_date)
        
        initial_input = initial_input.scalar() or 0
        
        overall_efficiency = (total_production / initial_input * 100) if initial_input > 0 else 0
        
        return {
            "total_production": round(total_production, 2),
            "total_scrap": round(total_scrap, 2),
            "overall_efficiency": round(overall_efficiency, 2),
            "initial_input": round(initial_input, 2)
        }

    def get_efficiency_stats(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict]:
        """
        Get daily efficiency statistics
        """
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()
            
        # Query daily efficiency
        daily_stats = self.db.query(
            ProductionRecord.date,
            func.avg(ProductionRecord.efficiency).label('avg_efficiency'),
            func.sum(ProductionRecord.output_qty).label('total_output')
        ).filter(
            ProductionRecord.date >= start_date,
            ProductionRecord.date <= end_date,
            ProductionRecord.efficiency > 0  # Exclude zero efficiency records
        ).group_by(
            ProductionRecord.date
        ).order_by(
            ProductionRecord.date
        ).all()
        
        return [
            {
                "date": stat.date.isoformat(),
                "efficiency": round(stat.avg_efficiency, 1),
                "output": round(stat.total_output, 1)
            }
            for stat in daily_stats
        ]

    def get_scrap_analysis(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict]:
        """
        Get scrap analysis by stage
        """
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()
            
        # Query scrap by stage
        scrap_stats = self.db.query(
            ProductionRecord.stage,
            func.sum(ProductionRecord.scrap_qty).label('total_scrap')
        ).filter(
            ProductionRecord.date >= start_date,
            ProductionRecord.date <= end_date,
            ProductionRecord.scrap_qty > 0
        ).group_by(
            ProductionRecord.stage
        ).all()
        
        return [
            {
                "stage": stat.stage.value,
                "value": round(stat.total_scrap, 1)
            }
            for stat in scrap_stats
        ]
