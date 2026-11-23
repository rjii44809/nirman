import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, useMap, useMapEvents, Polyline, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Project {
  id: number;
  title: string;
  agency_id: number;
  start_date: string;
  end_date: string;
  geometry: any;
}

interface Conflict {
  id: number;
  project_1_id: number;
  project_2_id: number;
  project_1_title: string;
  project_2_title: string;
  severity: string;
  recommendations: {
    joint_trenching: {
      start_date: string;
      end_date: string;
      description: string;
    };
    sequential_reschedule: {
      target_project_id: number;
      target_project_title: string;
      new_start_date: string;
      new_end_date: string;
      description: string;
    };
  };
}

function MapController({ selectedCoords }: { selectedCoords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedCoords) {
      map.flyTo(selectedCoords, 16, { duration: 1.5 });
    }
  }, [selectedCoords, map]);
  return null;
}

function DrawingHandler({
  isDrawing,
  drawingPoints,
  setDrawingPoints
}: {
  isDrawing: boolean;
  drawingPoints: [number, number][];
  setDrawingPoints: React.Dispatch<React.SetStateAction<[number, number][]>>;
}) {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        setDrawingPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
      }
    },
  });
  return null;
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeConflict, setActiveConflict] = useState<Conflict | null>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newAgencyId, setNewAgencyId] = useState(1);
  const [newStartDate, setNewStartDate] = useState('2026-08-22');
  const [newEndDate, setNewEndDate] = useState('2026-09-02');

  // Timeline Slider State
  const [timelineFilterActive, setTimelineFilterActive] = useState(false);
  const [timelineDate, setTimelineDate] = useState('2026-08-25');

  const fetchData = async () => {
    try {
      const [projRes, confRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/projects'),
        fetch('http://127.0.0.1:8000/api/conflicts')
      ]);
      const projData = await projRes.json();
      const confData = await confRes.json();
      setProjects(projData);
      setConflicts(confData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const conflictedProjectIds = useMemo(() => {
    return new Set(conflicts.flatMap((c) => [c.project_1_id, c.project_2_id]));
  }, [conflicts]);

  // Filter projects by active timeline date if slider filter is active
  const visibleProjects = useMemo(() => {
    if (!timelineFilterActive) return projects;
    return projects.filter((p) => p.start_date <= timelineDate && p.end_date >= timelineDate);
  }, [projects, timelineFilterActive, timelineDate]);

  const handleFocusProject = (project: Project) => {
    setSelectedProjectId(project.id);
    if (project.geometry && project.geometry.coordinates) {
      const firstCoord = project.geometry.coordinates[0];
      setSelectedCoords([firstCoord[1], firstCoord[0]]);
    }
  };

  const clearDrawing = () => {
    setIsDrawing(false);
    setDrawingPoints([]);
  };

  const handleSaveProject = async () => {
    if (!newTitle.trim()) {
      alert('Please enter a project title.');
      return;
    }
    if (drawingPoints.length < 2) {
      alert('Please click on the map to plot at least 2 points.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          agency_id: newAgencyId,
          start_date: newStartDate,
          end_date: newEndDate,
          coordinates: drawingPoints
        })
      });

      if (!res.ok) throw new Error('Failed to save project');
      const data = await res.json();

      if (data.conflicts_detected > 0) {
        alert('⚠️ Project saved! PostGIS detected ' + data.conflicts_detected + ' collision(s) with active timelines!');
      } else {
        alert('✅ Project saved successfully with 0 spatial/temporal conflicts!');
      }

      await fetchData();
      clearDrawing();
      setNewTitle('');
    } catch (err) {
      console.error(err);
      alert('Failed to save. Ensure backend is running.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (projectId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this excavation corridor?')) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete project');
      if (selectedProjectId === projectId) setSelectedProjectId(null);
      if (activeConflict && (activeConflict.project_1_id === projectId || activeConflict.project_2_id === projectId)) {
        setActiveConflict(null);
      }
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete project.');
    }
  };

  // Resolution Action: Joint Trenching
  const applyJointTrenching = async (conflict: Conflict) => {
    try {
      const { start_date, end_date } = conflict.recommendations.joint_trenching;
      await Promise.all([
        fetch(`http://127.0.0.1:8000/api/projects/${conflict.project_1_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start_date, end_date })
        }),
        fetch(`http://127.0.0.1:8000/api/projects/${conflict.project_2_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start_date, end_date })
        })
      ]);
      alert('✅ Joint Trenching window applied! Both agencies scheduled simultaneously.');
      setActiveConflict(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to apply resolution.');
    }
  };

  // Resolution Action: Sequential Reschedule
  const applySequentialReschedule = async (conflict: Conflict) => {
    try {
      const { target_project_id, new_start_date, new_end_date } = conflict.recommendations.sequential_reschedule;
      const res = await fetch(`http://127.0.0.1:8000/api/projects/${target_project_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_date: new_start_date, end_date: new_end_date })
      });
      if (!res.ok) throw new Error('Failed to update project schedule');
      alert('✅ Project timeline shifted! Temporal conflict resolved.');
      setActiveConflict(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to apply resolution.');
    }
  };

  const downloadNocReport = () => {
    window.open('http://127.0.0.1:8000/api/reports/noc-csv', '_blank');
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Header */}
      <header style={{ padding: '12px 24px', background: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', zIndex: 1000 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>🏛️ Nirman Spatial Utility Coordinator</h2>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nagpur Municipal Corporation GIS Command Center</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={downloadNocReport}
            style={{
              background: '#047857',
              color: 'white',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            📑 Export Municipal NOC Audit
          </button>
          <button
            onClick={() => setIsDrawing(!isDrawing)}
            style={{
              background: isDrawing ? '#ef4444' : '#2563eb',
              color: 'white',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            {isDrawing ? '✖ Cancel Drawing' : '✏️ Draw Excavation Corridor'}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Left Sidebar */}
        <aside style={{ width: '370px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {isDrawing ? (
            <div style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#1e293b' }}>Draw New Excavation Corridor</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px 0' }}>
                Click anywhere on the map to plot route vertices.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Project Title</label>
                  <input
                    type="text"
                    placeholder="e.g. 5G Fiber Trenching"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Agency</label>
                  <select
                    value={newAgencyId}
                    onChange={(e) => setNewAgencyId(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  >
                    <option value={1}>NMC (Water Works)</option>
                    <option value={2}>MSEDCL (Electricity)</option>
                    <option value={3}>BSNL (Telecom)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Start Date</label>
                    <input
                      type="date"
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>End Date</label>
                    <input
                      type="date"
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ background: '#e2e8f0', padding: '10px', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <strong>Plotted Points:</strong> {drawingPoints.length}
                </div>

                <button
                  onClick={handleSaveProject}
                  disabled={saving || drawingPoints.length < 2 || !newTitle.trim()}
                  style={{
                    padding: '12px',
                    background: (drawingPoints.length >= 2 && newTitle.trim()) ? '#16a34a' : '#94a3b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (drawingPoints.length >= 2 && newTitle.trim()) ? 'pointer' : 'not-allowed',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {saving ? 'Analyzing...' : '💾 Save & Detect Conflicts'}
                </button>

                <button
                  onClick={clearDrawing}
                  style={{ padding: '8px', background: '#cbd5e1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Reset Points
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, background: '#fee2e2', padding: '12px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b' }}>COLLISIONS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b91c1c' }}>{conflicts.length}</div>
                </div>
                <div style={{ flex: 1, background: '#dcfce7', padding: '12px', borderRadius: '8px', border: '1px solid #86efac' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>ACTIVE CORRIDORS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d' }}>{visibleProjects.length}</div>
                </div>
              </div>

              {/* Conflict Action Cards */}
              {conflicts.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ⚠️ Road Collisions Requiring Action
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {conflicts.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          background: '#fff1f2',
                          border: '1px solid #fda4af',
                          borderRadius: '8px',
                          padding: '10px'
                        }}
                      >
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#9f1239' }}>
                          {c.project_1_title} ⚡ {c.project_2_title}
                        </div>
                        <button
                          onClick={() => setActiveConflict(c)}
                          style={{
                            marginTop: '8px',
                            background: '#be123c',
                            color: 'white',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            width: '100%'
                          }}
                        >
                          ⚡ Resolve Conflict
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h4 style={{ margin: '16px 0 8px 0', fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Excavation Corridors {timelineFilterActive && '(Filtered)'}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {visibleProjects.map((p) => {
                  const hasConflict = conflictedProjectIds.has(p.id);
                  const isSelected = selectedProjectId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleFocusProject(p)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: isSelected ? '#e0f2fe' : 'white',
                        border: isSelected ? '2px solid #0284c7' : hasConflict ? '1px solid #fecaca' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: '24px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{p.title}</span>
                        {hasConflict && (
                          <span style={{ background: '#ef4444', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            COLLISION
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                        📅 {p.start_date} → {p.end_date}
                      </div>

                      <button
                        onClick={(e) => handleDeleteProject(p.id, e)}
                        title="Delete project"
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          color: '#94a3b8'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Map Viewport */}
        <main style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            {loading ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                Loading spatial network...
              </div>
            ) : (
              <MapContainer center={[21.1458, 79.0882]} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                <MapController selectedCoords={selectedCoords} />
                <DrawingHandler isDrawing={isDrawing} drawingPoints={drawingPoints} setDrawingPoints={setDrawingPoints} />

                {visibleProjects.map((project) => {
                  const hasConflict = conflictedProjectIds.has(project.id);
                  const isSelected = selectedProjectId === project.id;
                  return (
                    <GeoJSON
                      key={String(project.id) + '-' + String(isSelected) + '-' + timelineDate}
                      data={project.geometry}
                      style={{
                        color: hasConflict ? '#ef4444' : '#10b981',
                        weight: isSelected ? 8 : 5,
                        opacity: isSelected ? 1 : 0.8
                      }}
                      eventHandlers={{
                        click: () => handleFocusProject(project),
                      }}
                    >
                      <Popup>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0' }}>{project.title}</h4>
                          <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                            Timeline: {project.start_date} to {project.end_date}
                          </div>
                          {hasConflict && (
                            <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.8rem', marginTop: '6px' }}>
                              ⚠️ Active Excavation Conflict Detected!
                            </div>
                          )}
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            style={{
                              marginTop: '10px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            🗑️ Delete Corridor
                          </button>
                        </div>
                      </Popup>
                    </GeoJSON>
                  );
                })}

                {drawingPoints.length > 1 && (
                  <Polyline positions={drawingPoints} color="#3b82f6" dashArray="8, 8" weight={4} />
                )}
                {drawingPoints.map((pt, idx) => (
                  <CircleMarker key={idx} center={pt} radius={5} color="#1d4ed8" fillColor="#60a5fa" fillOpacity={1} />
                ))}
              </MapContainer>
            )}
          </div>

          {/* Bottom Interactive Timeline Scrubber (Option 2) */}
          <div style={{
            padding: '12px 24px',
            background: 'white',
            borderTop: '1px solid #e2e8f0',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <button
              onClick={() => setTimelineFilterActive(!timelineFilterActive)}
              style={{
                background: timelineFilterActive ? '#0284c7' : '#f1f5f9',
                color: timelineFilterActive ? 'white' : '#475569',
                border: '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {timelineFilterActive ? '🕒 Timeline Active' : '▶ Enable Timeline Filter'}
            </button>

            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', minWidth: '110px' }}>
              Simulated Date: <strong>{timelineDate}</strong>
            </span>

            <input
              type="date"
              value={timelineDate}
              onChange={(e) => setTimelineDate(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />

            <input
              type="range"
              min="2026-08-01"
              max="2026-10-31"
              value={timelineDate}
              onChange={(e) => setTimelineDate(e.target.value)}
              style={{ flex: 1, cursor: 'pointer' }}
            />
          </div>
        </main>
      </div>

      {/* Smart Conflict Resolution Modal (Option 1) */}
      {activeConflict && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '540px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#991b1b' }}>⚡ Spatial Conflict Resolution Engine</h3>
              <button
                onClick={() => setActiveConflict(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 16px 0' }}>
              Overlapping corridor detected between <strong>{activeConflict.project_1_title}</strong> and <strong>{activeConflict.project_2_title}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Option A: Joint Trenching */}
              <div style={{ border: '1px solid #bbf7d0', background: '#f0fdf4', padding: '14px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#166534', fontSize: '0.95rem' }}>Option A: Joint Trenching (Co-Digging)</strong>
                  <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                    Recommended
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#14532d', margin: '6px 0 10px 0' }}>
                  {activeConflict.recommendations.joint_trenching.description}
                  <br />
                  <strong>Unified Window:</strong> {activeConflict.recommendations.joint_trenching.start_date} to {activeConflict.recommendations.joint_trenching.end_date}
                </p>
                <button
                  onClick={() => applyJointTrenching(activeConflict)}
                  style={{
                    background: '#16a34a',
                    color: 'white',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  🤝 Apply Joint Trenching Window
                </button>
              </div>

              {/* Option B: Sequential Rescheduling */}
              <div style={{ border: '1px solid #bfdbfe', background: '#eff6ff', padding: '14px', borderRadius: '8px' }}>
                <strong style={{ color: '#1e40af', fontSize: '0.95rem' }}>Option B: Sequential Reschedule</strong>
                <p style={{ fontSize: '0.85rem', color: '#1e3a8a', margin: '6px 0 10px 0' }}>
                  {activeConflict.recommendations.sequential_reschedule.description}
                  <br />
                  <strong>New Timeline:</strong> {activeConflict.recommendations.sequential_reschedule.new_start_date} to {activeConflict.recommendations.sequential_reschedule.new_end_date}
                </p>
                <button
                  onClick={() => applySequentialReschedule(activeConflict)}
                  style={{
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  📅 Shift Project 2 Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
