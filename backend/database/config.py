from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://postgres:0987@localhost:5432/nirman"

engine = create_async_engine(DATABASE_URL, echo=True)
session_factory = sessionmaker(
    bind=engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)
