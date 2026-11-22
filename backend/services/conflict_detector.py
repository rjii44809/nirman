import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from geoalchemy2.functions import ST_Intersects
from backend.database.config import session_factory
from backend.models.models import Project, Conflict

async def run_conflict_detection():
    async with session_factory() as session:
        result = await session.execute(select(Project))
        projects = result.scalars().all()
        
        print(f"Running conflict detection across {len(projects)} projects...")
        conflict_count = 0

        for i in range(len(projects)):
            for j in range(i + 1, len(projects)):
                p1 = projects[i]
                p2 = projects[j]

                # 1. Temporal Overlap Check
                temporal_overlap = (p1.start_date <= p2.end_date) and (p1.end_date >= p2.start_date)
                
                if temporal_overlap:
                    # 2. Spatial Overlap Check using PostGIS ST_Intersects
                    spatial_res = await session.execute(select(ST_Intersects(p1.geometry, p2.geometry)))
                    is_intersecting = spatial_res.scalar()

                    if is_intersecting:
                        p_min = min(p1.id, p2.id)
                        p_max = max(p1.id, p2.id)

                        # Check if conflict already exists
                        existing = await session.execute(
                            select(Conflict).where(
                                and_(
                                    Conflict.project_1_id == p_min,
                                    Conflict.project_2_id == p_max
                                )
                            )
                        )
                        if not existing.scalars().first():
                            conflict = Conflict(
                                project_1_id=p_min,
                                project_2_id=p_max,
                                severity="HIGH"
                            )
                            session.add(conflict)
                            conflict_count += 1
                            print(f"CONFLICT DETECTED: [{p1.title}] intersects [{p2.title}]!")

        await session.commit()
        print(f"Conflict detection complete. Added {conflict_count} new conflicts to PostGIS.")

if __name__ == "__main__":
    asyncio.run(run_conflict_detection())
