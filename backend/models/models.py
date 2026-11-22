from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship, DeclarativeBase
from geoalchemy2 import Geometry

# Standard SQLAlchemy 2.0 Base class
class Base(DeclarativeBase):
    pass

class Agency(Base):
    __tablename__ = 'agencies'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    # One Agency can have many Projects
    projects = relationship('Project', back_populates='agency')

class Project(Base):
    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    agency_id = Column(Integer, ForeignKey('agencies.id'), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # The crucial spatial column!
    geometry = Column(Geometry(geometry_type='GEOMETRY', srid=4326))

    agency = relationship('Agency', back_populates='projects')

class Conflict(Base):
    __tablename__ = 'conflicts'

    id = Column(Integer, primary_key=True, index=True)
    project_1_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    project_2_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    severity = Column(String, default="Medium") # e.g., 'High', 'Low'

    project_1 = relationship('Project', foreign_keys=[project_1_id])
    project_2 = relationship('Project', foreign_keys=[project_2_id])