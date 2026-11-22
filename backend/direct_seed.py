import asyncio
from sqlalchemy import text
from geoalchemy2.elements import WKTElement
from backend.database.config import session_factory
from backend.models.models import Project, Conflict
from backend.api.routes import recalculate_all_conflicts
from datetime import date

projects_data = [
    {
        "title": "PWD - Wardha Road Concretisation",
        "agency_id": 1,
        "start_date": date(2026, 8, 1),
        "end_date": date(2026, 12, 31),
        "coords": [[21.1313, 79.0789], [21.1355, 79.0815], [21.1400, 79.0830]]
    },
    {
        "title": "NMC - Nag River Sewer Pipeline",
        "agency_id": 1,
        "start_date": date(2026, 8, 15),
        "end_date": date(2026, 9, 30),
        "coords": [[21.1387, 79.0847], [21.1370, 79.0835], [21.1350, 79.0848], [21.1325, 79.0848]]
    },
    {
        "title": "MSEDCL - High-Tension Cabling (Dharampeth)",
        "agency_id": 2,
        "start_date": date(2026, 8, 10),
        "end_date": date(2026, 8, 28),
        "coords": [[21.1401, 79.0673], [21.1368, 79.0658], [21.1317, 79.0654]]
    },
    {
        "title": "Maha Metro - Reach 3A (Hingna Viaduct)",
        "agency_id": 2,
        "start_date": date(2026, 8, 15),
        "end_date": date(2026, 11, 30),
        "coords": [[21.1245, 79.0264], [21.1210, 79.0142], [21.1172, 79.0021], [21.1098, 78.9875]]
    },
    {
        "title": "Maha Metro - Reach 4A Pier Construction (Central Ave)",
        "agency_id": 2,
        "start_date": date(2026, 9, 1),
        "end_date": date(2026, 12, 15),
        "coords": [[21.1498, 79.1382], [21.1512, 79.1490], [21.1528, 79.1620], [21.1541, 79.1755]]
    },
    {
        "title": "BSNL - Optical Fiber Trenching (Pardi Stretch)",
        "agency_id": 3,
        "start_date": date(2026, 9, 5),
        "end_date": date(2026, 9, 25),
        "coords": [[21.1505, 79.1450], [21.1520, 79.1580], [21.1535, 79.1710]]
    },
    {
        "title": "Maha Metro - Reach 2B Kamptee Road Viaduct",
        "agency_id": 2,
        "start_date": date(2026, 8, 20),
        "end_date": date(2026, 12, 20),
        "coords": [[21.1965, 79.0965], [21.2080, 79.1080], [21.2215, 79.1235], [21.2380, 79.1420]]
    }
]

async def hard_seed():
    async with session_factory() as session:
        print("🗑️ Resetting tables...")
        await session.execute(text("TRUNCATE TABLE conflicts, projects RESTART IDENTITY CASCADE;"))
        await session.commit()
        
        print("🌱 Seeding exactly 7 real projects...")
        for p in projects_data:
            wkt = f"LINESTRING({', '.join([f'{pt[1]} {pt[0]}' for pt in p['coords']])})"
            new_proj = Project(
                title=p['title'],
                agency_id=p['agency_id'],
                start_date=p['start_date'],
                end_date=p['end_date'],
                geometry=WKTElement(wkt, srid=4326)
            )
            session.add(new_proj)
        await session.commit()
        
        print("⚙️ Recalculating PostGIS collisions...")
        await recalculate_all_conflicts(session)
        print("✅ Database cleanly reset with 7 active corridors!")

if __name__ == "__main__":
    asyncio.run(hard_seed())
