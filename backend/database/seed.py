import asyncio
from datetime import date
from geoalchemy2.elements import WKTElement
from backend.database.config import session_factory
from backend.models.models import Agency, Project

async def seed_data():
    async with session_factory() as session:
        # Create Nagpur Municipal Agencies
        nmc = Agency(name="Nagpur Municipal Corporation (Water Works)")
        msedcl = Agency(name="MSEDCL (Electricity)")
        bsnl = Agency(name="BSNL (Telecom)")
        
        session.add_all([nmc, msedcl, bsnl])
        await session.commit()
        
        # Refresh to obtain generated IDs
        await session.refresh(nmc)
        await session.refresh(msedcl)
        await session.refresh(bsnl)

        # Create Sample Excavation Projects in Nagpur (SRID 4326)
        projects = [
            Project(
                title="Water Pipeline Repair - Sitabuldi Main Road",
                agency_id=nmc.id,
                start_date=date(2026, 8, 20),
                end_date=date(2026, 9, 5),
                geometry=WKTElement('LINESTRING(79.0820 21.1450, 79.0900 21.1500)', srid=4326)
            ),
            Project(
                title="Underground Cable Laying - Sitabuldi Junction",
                agency_id=msedcl.id,
                start_date=date(2026, 8, 25),
                end_date=date(2026, 9, 10),
                geometry=WKTElement('LINESTRING(79.0850 21.1460, 79.0920 21.1480)', srid=4326) # Overlaps spatially and temporally
            ),
            Project(
                title="Fiber Optic Ducting - Civil Lines",
                agency_id=bsnl.id,
                start_date=date(2026, 10, 1),
                end_date=date(2026, 10, 15),
                geometry=WKTElement('LINESTRING(79.0600 21.1550, 79.0700 21.1600)', srid=4326) # Independent location
        )
        ]

        session.add_all(projects)
        await session.commit()
        print("Successfully seeded Nagpur municipal agencies and excavation projects into PostGIS!")

if __name__ == "__main__":
    asyncio.run(seed_data())