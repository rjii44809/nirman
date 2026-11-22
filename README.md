# 🏗️ Nirman — Civic Infrastructure Coordination Platform

<p align="center">
  **Building Smarter Cities Through Geospatial Intelligence**
</p>

<p align="center">
  A GIS-powered platform designed to help municipal authorities coordinate civic infrastructure projects, identify spatial conflicts, and improve urban development planning.
</p>

---

## 🌍 Overview

**Nirman** is a Geographic Information System (GIS)-based civic infrastructure coordination platform designed to make urban development more organized, transparent, and efficient.

In rapidly growing cities, multiple infrastructure projects often operate simultaneously. Road construction, drainage maintenance, water pipelines, and other public works can overlap geographically and temporally, resulting in unnecessary road closures, duplicated efforts, resource wastage, and delays.

Nirman addresses this challenge through spatial and temporal intelligence.

By combining geospatial data, interactive mapping, and conflict detection, Nirman aims to provide municipal authorities with a centralized system to visualize infrastructure projects, identify overlapping activities, and make better coordination decisions.

## 🎯 Problem Statement

Urban infrastructure development involves multiple departments working independently:

- Road construction and maintenance.
- Water supply and pipeline installation.
- Drainage and sewage infrastructure.
- Electricity and utility maintenance.
- Other municipal development projects.

When these activities are not properly coordinated, they can create:

- Multiple projects operating on the same road simultaneously.
- Repeated excavation of recently constructed roads.
- Scheduling conflicts between municipal departments.
- Inefficient allocation of public resources.
- Delays in infrastructure development.

**Nirman aims to solve this through a unified geospatial coordination system.**

## ✨ Core Capabilities

### 🗺️ Interactive GIS Mapping
- Visualize roads and civic infrastructure on an interactive city map.
- Display infrastructure projects using their geographical locations.
- Work with standardized GeoJSON spatial data.
- Explore project locations and their geographical relationships.

### ⚠️ Spatial Conflict Detection
- Identify geographically overlapping infrastructure projects.
- Detect intersections between project geometries and road networks.
- Leverage PostGIS spatial functions for efficient geospatial queries.

### 📅 Temporal Conflict Detection
- Evaluate project timelines using start and end dates.
- Identify projects that overlap both geographically and temporally.
- Help authorities identify scheduling conflicts before execution.

### 📊 Centralized Project Dashboard
- Monitor civic infrastructure projects.
- View project and conflict information.
- Provide a centralized overview of municipal development activities.

### 🏛️ Municipal Coordination
- Organize infrastructure information across different agencies.
- Support better coordination between municipal departments.
- Provide spatial insights to assist infrastructure planning.

## 🧠 How Nirman Works

Nirman follows a spatial-temporal analysis workflow.

1. **Data Collection:** Infrastructure and road-network data are collected from relevant sources.
2. **Geospatial Processing:** Geographic information is processed and standardized into spatial formats.
3. **Project Registration:** Infrastructure projects are represented using geographical boundaries and execution timelines.
4. **Spatial Analysis:** The system evaluates geographical intersections between projects.
5. **Temporal Analysis:** Project schedules are compared to identify overlapping execution periods.
6. **Conflict Identification:** Projects satisfying both spatial and temporal overlap conditions are flagged as potential conflicts.
7. **Visualization:** Relevant information is presented through an interactive GIS interface.

### Conflict Detection Logic

A potential infrastructure conflict exists when:

- Two projects overlap geographically.
- Their execution periods overlap.

In simplified terms:

`Conflict = Spatial Overlap AND Temporal Overlap`

This allows Nirman to distinguish actual coordination conflicts from projects that merely exist in the same geographical area at different times.

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| Mapping | Leaflet, React Leaflet |
| Backend | Python, FastAPI |
| ORM | SQLAlchemy 2.0 |
| Spatial Database | PostgreSQL, PostGIS |
| GIS Processing | GeoAlchemy2, Shapely |
| Geospatial Data | GeoPandas, OSMnx |
| Data Format | GeoJSON |

## 🏛️ System Architecture

```text
              NIRMAN PLATFORM
                     |
          +----------+----------+
          |                     |
      FRONTEND               BACKEND
          |                     |
   React + TypeScript       FastAPI
          |                     |
   Interactive GIS Map       API Routes
          |                     |
   React Leaflet          Business Logic
          |                     |
          |              GIS Processing
          |                     |
          |              Spatial Analysis
          |                     |
          +----------+----------+
                     |
              PostgreSQL
                     |
                  PostGIS
                     |
          Geospatial Data Storage
```

### Project Structure

```text
nirman/
│
├── backend/
│   ├── api/
│   │   └── routes/
│   ├── database/
│   ├── gis/
│   ├── models/
│   ├── services/
│   └── main.py
│
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── map/
│       ├── dashboard/
│       └── services/
│
├── CLAUDE.md
└── README.md
```

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/)
- [Python](https://www.python.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [PostGIS](https://postgis.net/)
- [Git](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/rjii44809/nirman.git

cd nirman
```

### 2. Backend Setup

Create and activate a Python virtual environment:

```bash
python -m venv venv
```

Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

Install the backend dependencies according to the project's Python dependency configuration.

Configure PostgreSQL with the PostGIS extension and provide the database connection settings required by the backend.

Start the FastAPI server:

```bash
uvicorn backend.main:app --reload
```

Backend API:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at the local URL displayed by Vite.

## 🗺️ Geospatial Data Standards

Nirman follows important GIS data-handling conventions:

- **Coordinate Reference System:** EPSG:4326 (WGS 84).
- **Spatial Data Format:** GeoJSON.
- **Database:** PostgreSQL with PostGIS spatial extensions.
- **Spatial Queries:** PostGIS functions such as `ST_Intersects` and `ST_Within`.
- **Coordinate Ordering:** GeoJSON uses `[Longitude, Latitude]`, while Leaflet uses `[Latitude, Longitude]`.

These standards help maintain consistency between the database, backend processing, and interactive frontend maps.

## 🔮 Future Scope

Potential areas for further development include:

- Real-time infrastructure project monitoring.
- Advanced conflict detection and prioritization.
- Automated project scheduling recommendations.
- Integration with additional municipal datasets.
- Department-wise project management.
- Infrastructure progress tracking.
- Predictive analytics for urban infrastructure planning.
- AI-assisted decision support for municipal authorities.

## 🌱 Vision

Nirman aims to move civic infrastructure management from disconnected departmental planning towards coordinated, data-driven urban development.

By bringing geospatial intelligence and project coordination together, the platform seeks to help cities reduce infrastructure conflicts, improve resource utilization, and build more efficiently.

**Better coordination. Smarter infrastructure. Stronger cities.**

---

## 👨‍💻 Contributors

Developed as a civic technology initiative focused on improving infrastructure coordination through geospatial intelligence.

## 📄 License

License information will be added when the project license is established.

---

<p align="center">
  **NIRMAN — Building Better Cities, Together.**
</p>
