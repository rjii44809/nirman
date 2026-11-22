# Project: Nirman (Civic Infrastructure Coordination)

## System Prompt & Core Rules
You are an expert full-stack developer and GIS engineer working on Nirman. Nirman is a spatial-temporal conflict detection platform for municipal bodies. You must adhere to these rules strictly. If asked to implement a feature, keep changes small, localized, and modular to avoid context degradation.

## Tech Stack
*   **Database:** PostgreSQL + PostGIS (Mandatory).
*   **Backend:** FastAPI (Python), SQLAlchemy 2.0, GeoAlchemy2, Shapely.
*   **Frontend:** React (Vite), TypeScript, Tailwind CSS v4, `react-leaflet`.
*   **Data Ingestion:** `osmnx`, `geopandas`.

## Architecture & Folder Structure
Follow this strict structure when reading or writing files. A well-structured FastAPI project separates concerns into different modules, ensuring clear boundaries:
*   `frontend/src/`
    *   `app/`: Routing and layout
    *   `components/`: Shared UI components
    *   `map/`: Interactive city map (roads, projects, conflicts)
    *   `dashboard/`: Stats and conflict overview
    *   `services/`: API client
*   `backend/`
    *   `main.py`: Application entrypoint
    *   `api/`: Route handlers (projects, roads, conflicts, agencies)
    *   `services/`: Conflict detection, scheduling, recommendations
    *   `gis/`: Spatial queries and geometry processing
    *   `models/`: Database models
    *   `database/`: DB connection/config

## GIS & Spatial Data Rules (CRITICAL)
1.  **Coordinate Reference System:** All spatial data must use **EPSG:4326** (WGS 84).
2.  **Data Formats:** The backend must ALWAYS serialize spatial data as valid **GeoJSON** before sending it to the frontend.
3.  **Coordinate Order Trap:** 
    *   GeoJSON and PostGIS natively expect `[Longitude, Latitude]`.
    *   Leaflet natively expects `[Latitude, Longitude]`. 
    *   Handle this translation strictly in the frontend API client or Leaflet mapping layer, never mix them up in the database.
4.  **Spatial Queries:** Use PostGIS spatial functions (e.g., `ST_Intersects`, `ST_Within`) via GeoAlchemy2 for overlap detection. Do not use bounding box math in pure Python.

## Coding Standards & Behavior
*   **Bite-sized execution:** Never rewrite an entire file if you only need to change a single function. Never attempt to build the entire backend or frontend in one prompt.
*   **No placeholders:** Do not write "dummy" or "mock" API routes. If a database query is needed, write the actual SQLAlchemy/GeoAlchemy2 query.
*   **Types:** Always use TypeScript interfaces in the frontend and Pydantic schemas in the backend. Ensure spatial types are clearly typed (e.g., `FeatureCollection`, `Polygon`).
*   **Temporal Logic:** Conflicts are defined as overlapping Geometries AND overlapping time frames (`start_date` and `end_date`). Always check both.

## Execution Priority
When writing new code, prioritize database structure -> API routes -> Frontend components.