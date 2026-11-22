import asyncio
from sqlalchemy import delete
from backend.database.config import session_factory
from backend.models.models import Project, Conflict

async def reset():
    async with session_factory() as session:
        # Delete all conflicts and projects to start fresh
        await session.execute(delete(Conflict))
        await session.execute(delete(Project))
        await session.commit()
        print("🗑️ Database wiped clean!")

if __name__ == "__main__":
    asyncio.run(reset())
