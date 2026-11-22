import json
import csv
import io
from typing import List, Optional
from datetime import date, timedelta
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, and_, or_, delete
from geoalchemy2.elements import WKTElement
from geoalchemy2.functions import ST_AsGeoJSON, ST_DWithin
from backend.database.config import session_factory
from backend.models.models import Project, Conflict

router = APIRouter()

class ProjectCreate(BaseModel):
    title: str
    agency_id: int
    start_date: date
    end_date: date
    coordinates: List[List[float]]

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

async def recalculate_all_conflicts(session):
    await session.execute(delete(Conflict))
    
    result = await session.execute(select(Project))
    projects = result.scalars().all()
    
    for i in range(len(projects)):
        for j in range(i + 1, len(projects)):
            p1 = projects[i]
            p2 = projects[j]
            
            # Temporal Overlap Check
            if (p1.start_date <= p2.end_date) and (p1.end_date >= p2.start_date):
                # 0.0002 degrees ~= 20 meters proximity buffer in PostGIS
                spatial_res = await session.execute(
                    select(
                        func.ST_DWithin(
                            p1.geometry,
                            p2.geometry,
                            0.0002
                        )
                    )
                )
                if spatial_res.scalar():
                    session.add(Conflict(
                        project_1_id=min(p1.id, p2.id),
                        project_2_id=max(p1.id, p2.id),
                        severity="HIGH"
                    ))
    await session.commit()

@router.get('/projects')
async def get_projects():
    async with session_factory() as session:
        query = select(
            Project.id,
            Project.title,
            Project.agency_id,
            Project.start_date,
            Project.end_date,
            func.ST_AsGeoJSON(Project.geometry).label("geojson")
        ).order_by(Project.id.asc())
        result = await session.execute(query)
        rows = result.all()
        return [
            {
                "id": r.id,
                "title": r.title,
                "agency_id": r.agency_id,
                "start_date": str(r.start_date),
                "end_date": str(r.end_date),
                "geometry": json.loads(r.geojson) if r.geojson else None
            } for r in rows
        ]

@router.post('/projects')
async def create_project(data: ProjectCreate):
    async with session_factory() as session:
        coord_strings = [f"{pt[1]} {pt[0]}" for pt in data.coordinates]
        wkt = f"LINESTRING({', '.join(coord_strings)})"
        
        new_project = Project(
            title=data.title,
            agency_id=data.agency_id,
            start_date=data.start_date,
            end_date=data.end_date,
            geometry=WKTElement(wkt, srid=4326)
        )
        session.add(new_project)
        await session.commit()
        await session.refresh(new_project)
        await recalculate_all_conflicts(session)

        conf_res = await session.execute(
            select(Conflict).where(
                or_(Conflict.project_1_id == new_project.id, Conflict.project_2_id == new_project.id)
            )
        )
        return {
            "status": "success",
            "project_id": new_project.id,
            "conflicts_detected": len(conf_res.scalars().all())
        }

@router.patch('/projects/{project_id}')
async def update_project(project_id: int, data: ProjectUpdate):
    async with session_factory() as session:
        res = await session.execute(select(Project).where(Project.id == project_id))
        project = res.scalars().first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if data.title is not None:
            project.title = data.title
        if data.start_date is not None:
            project.start_date = data.start_date
        if data.end_date is not None:
            project.end_date = data.end_date

        await session.commit()
        await recalculate_all_conflicts(session)
        return {"status": "success", "updated_id": project_id}

@router.delete('/projects/{project_id}')
async def delete_project(project_id: int):
    async with session_factory() as session:
        await session.execute(
            delete(Conflict).where(
                or_(Conflict.project_1_id == project_id, Conflict.project_2_id == project_id)
            )
        )
        await session.execute(delete(Project).where(Project.id == project_id))
        await session.commit()
        await recalculate_all_conflicts(session)
        return {"status": "success", "deleted_id": project_id}

@router.get('/conflicts')
async def get_conflicts():
    async with session_factory() as session:
        result = await session.execute(select(Conflict))
        conflicts = result.scalars().all()
        
        enhanced_conflicts = []
        for c in conflicts:
            p1_res = await session.execute(select(Project).where(Project.id == c.project_1_id))
            p2_res = await session.execute(select(Project).where(Project.id == c.project_2_id))
            p1 = p1_res.scalars().first()
            p2 = p2_res.scalars().first()

            if p1 and p2:
                joint_start = min(p1.start_date, p2.start_date)
                joint_end = max(p1.end_date, p2.end_date)

                p2_duration = max((p2.end_date - p2.start_date).days, 1)
                shifted_p2_start = p1.end_date + timedelta(days=2)
                shifted_p2_end = shifted_p2_start + timedelta(days=p2_duration)

                enhanced_conflicts.append({
                    "id": c.id,
                    "project_1_id": c.project_1_id,
                    "project_2_id": c.project_2_id,
                    "project_1_title": p1.title,
                    "project_2_title": p2.title,
                    "severity": c.severity,
                    "recommendations": {
                        "joint_trenching": {
                            "start_date": str(joint_start),
                            "end_date": str(joint_end),
                            "description": "Unified excavation window: dig once for both utilities."
                        },
                        "sequential_reschedule": {
                            "target_project_id": p2.id,
                            "target_project_title": p2.title,
                            "new_start_date": str(shifted_p2_start),
                            "new_end_date": str(shifted_p2_end),
                            "description": f"Delay '{p2.title}' until after '{p1.title}' completes."
                        }
                    }
                })
        return enhanced_conflicts

@router.get('/reports/noc-csv')
async def export_noc_report():
    async with session_factory() as session:
        proj_res = await session.execute(select(Project))
        projects = proj_res.scalars().all()
        
        conf_res = await session.execute(select(Conflict))
        conflicts = conf_res.scalars().all()
        
        conflicted_ids = set()
        for c in conflicts:
            conflicted_ids.add(c.project_1_id)
            conflicted_ids.add(c.project_2_id)

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Corridor ID",
            "Project Title",
            "Agency ID",
            "Start Date",
            "End Date",
            "NOC Status",
            "Collision Advisory"
        ])

        for p in projects:
            has_conflict = p.id in conflicted_ids
            status = "ACTION REQUIRED - ROAD COLLISION" if has_conflict else "NOC ISSUED / APPROVED"
            advisory = "Coordinate Joint Trenching or reschedule timeline" if has_conflict else "No spatial clashes detected"
            writer.writerow([
                p.id,
                p.title,
                p.agency_id,
                p.start_date,
                p.end_date,
                status,
                advisory
            ])

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=Nirman_Municipal_NOC_Audit.csv"}
        )
