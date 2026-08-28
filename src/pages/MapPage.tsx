import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Layers, 
  Bot, 
  Plus, 
  Compass, 
  ChevronRight,
  Boxes
} from 'lucide-react';
import { EvidenceMap, MapMarkerItem } from '../components/common/EvidenceMap';
import { RealisticTerrainViewer } from '../components/3d/RealisticTerrainViewer';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getUserReports } from '../services/reports';
import { FloodReport } from '../types';
import { 
  LocationSearchResult, 
  CHITTOOR_AP_LOCATIONS, 
  DEFAULT_MAP_LOCATION
} from '../services/gis';

export const MapPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [reports, setReports] = useState<FloodReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mapMode, setMapMode] = useState<'2d_gis' | '3d_dem'>('2d_gis');

  // Active Map Focus Coordinates
  const [currentLat, setCurrentLat] = useState<number>(DEFAULT_MAP_LOCATION.latitude);
  const [currentLng, setCurrentLng] = useState<number>(DEFAULT_MAP_LOCATION.longitude);
  const [currentAddress, setCurrentAddress] = useState<string>(DEFAULT_MAP_LOCATION.name);

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      try {
        const uid = currentUser?.uid || 'user';
        const data = await getUserReports(uid);
        setReports(data);
      } catch (err) {
        console.error('Failed to load map case dossiers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, [currentUser]);

  const geocodedReports = useMemo(() => {
    return reports.filter(
      r =>
        typeof r.location.latitude === 'number' &&
        typeof r.location.longitude === 'number' &&
        !(r.location.latitude === 0 && r.location.longitude === 0)
    );
  }, [reports]);

  const mapMarkers: MapMarkerItem[] = useMemo(() => {
    return geocodedReports.map(r => ({
      id: r.id,
      latitude: r.location.latitude,
      longitude: r.location.longitude,
      title: r.title,
      address: r.location.address,
      score: r.verification?.confidenceScore,
      primaryImageUrl: r.primaryImageUrl,
    }));
  }, [geocodedReports]);

  const handleSelectGisLocation = (loc: LocationSearchResult) => {
    setCurrentLat(loc.latitude);
    setCurrentLng(loc.longitude);
    setCurrentAddress(`${loc.name}, ${loc.hierarchy}`);
  };

  // Pre-configured Quick Navigation Chips
  const quickLocations: LocationSearchResult[] = [
    CHITTOOR_AP_LOCATIONS.chittoorDistrict,
    CHITTOOR_AP_LOCATIONS.chittoorCity,
    CHITTOOR_AP_LOCATIONS.tirupati,
    CHITTOOR_AP_LOCATIONS.andhraPradesh,
    CHITTOOR_AP_LOCATIONS.vijayawada,
    CHITTOOR_AP_LOCATIONS.visakhapatnam,
    CHITTOOR_AP_LOCATIONS.india,
  ];

  return (
    <div className="space-y-5 pb-16 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#0284c7]/10 border border-[#0284c7]/20 text-[#0284c7] text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>3D Spatial &amp; GIS Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">
            {t('map.title', 'GIS Spatial Map')}
          </h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Geographic evidence verification with Indian administrative boundaries (India &rarr; Andhra Pradesh &rarr; Chittoor &rarr; Mandals).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* 3D vs 2D Toggle */}
          <div className="flex items-center rounded-xl bg-white p-1 border border-[#cbd5e1] text-xs font-mono font-bold shadow-xs">
            <button
              type="button"
              onClick={() => setMapMode('2d_gis')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                mapMode === '2d_gis' 
                  ? 'bg-[#0284c7] text-white shadow-xs' 
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>2D GIS Map</span>
            </button>
            <button
              type="button"
              onClick={() => setMapMode('3d_dem')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                mapMode === '3d_dem' 
                  ? 'bg-[#0284c7] text-white shadow-xs' 
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>3D DEM Mesh</span>
            </button>
          </div>

          <Link
            to="/chat"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#f1f5f9] text-[#0284c7] border border-[#cbd5e1] text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>AI Assistant</span>
          </Link>

          <Link
            to="/submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl btn-3d-primary text-white text-xs font-bold transition shadow-md shadow-sky-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Upload Evidence</span>
          </Link>
        </div>
      </div>

      {/* Prominent Quick-Location Region Chips */}
      <div className="p-4 rounded-2xl bg-white border border-[#cbd5e1] shadow-sm space-y-3 card-3d-realistic">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-mono font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#0284c7]" />
            Quick Geographic Focus (India &bull; Andhra Pradesh &bull; Chittoor):
          </span>
          <span className="text-[11px] font-mono text-[#0284c7] font-semibold">
            Active: {currentAddress}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold font-mono">
          {quickLocations.map((loc) => {
            const isActive = currentLat === loc.latitude && currentLng === loc.longitude;
            return (
              <button
                key={loc.id}
                onClick={() => handleSelectGisLocation(loc)}
                className={`px-3 py-1.5 rounded-xl border transition shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-xs'
                    : 'bg-[#f8fafc] text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] border-[#cbd5e1]'
                }`}
              >
                {loc.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Map Workspace (8 cols Map + 4 cols Case Dossiers) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Leaflet Map Interactive Viewport / 3D DEM (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="rounded-3xl overflow-hidden border border-[#cbd5e1] shadow-md bg-white">
            {mapMode === '2d_gis' ? (
              <EvidenceMap
                latitude={currentLat}
                longitude={currentLng}
                address={currentAddress}
                height="580px"
                showSearch={true}
                interactive={true}
                markers={mapMarkers}
                onMarkerClick={(m) => {
                  setCurrentLat(m.latitude);
                  setCurrentLng(m.longitude);
                  if (m.address) setCurrentAddress(m.address);
                }}
                onLocationSelect={(lat, lng, addr) => {
                  setCurrentLat(lat);
                  setCurrentLng(lng);
                  if (addr) setCurrentAddress(addr);
                }}
              />
            ) : (
              <RealisticTerrainViewer 
                locationName={currentAddress}
                latitude={currentLat}
                longitude={currentLng}
                height="580px"
              />
            )}
          </div>

          {/* Map Telemetry Strip */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#cbd5e1] flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-xs card-3d-realistic">
            <div className="flex items-center gap-2">
              <span className="text-[#64748b] uppercase font-bold">LOCKED COORDINATES:</span>
              <span className="text-[#0284c7] font-bold">
                {currentLat.toFixed(4)}° N, {currentLng.toFixed(4)}° E
              </span>
            </div>
            <div className="flex items-center gap-3 text-[#64748b]">
              <span>{mapMode === '2d_gis' ? 'CartoDB Voyager Light GIS' : 'Three.js Realistic 3D DEM'}</span>
              <span>&bull;</span>
              <span className="text-[#10b981] font-bold">60 FPS Real-time</span>
            </div>
          </div>
        </div>

        {/* Evidence Dossiers on Map (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-white border border-[#cbd5e1] space-y-4 shadow-sm card-3d-realistic">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0284c7]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] font-mono">
                Geocoded Evidence Dossiers
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-[#0284c7] bg-[#0284c7]/10 px-2 py-0.5 rounded border border-[#0284c7]/20">
              {geocodedReports.length} Mapped
            </span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-[#64748b]">
              Loading geocoded map markers...
            </div>
          ) : geocodedReports.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#f8fafc] border border-[#cbd5e1] border-dashed space-y-2">
              <MapPin className="w-8 h-8 text-[#94a3b8] mx-auto" />
              <div className="text-xs font-bold text-[#0f172a]">No geocoded cases yet</div>
              <p className="text-[11px] text-[#64748b]">
                Upload evidence with GPS metadata or select coordinates on the map.
              </p>
              <Link
                to="/submit"
                className="inline-block mt-2 px-4 py-2 rounded-xl btn-3d-primary text-white font-bold text-xs"
              >
                + Upload Evidence
              </Link>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {geocodedReports.map((r) => {
                const isFocused = currentLat === r.location.latitude && currentLng === r.location.longitude;
                const score = r.verification?.confidenceScore;

                return (
                  <div
                    key={r.id}
                    className={`p-3.5 rounded-2xl border transition space-y-2 cursor-pointer ${
                      isFocused
                        ? 'bg-[#f0f9ff] border-[#0284c7] shadow-xs'
                        : 'bg-[#f8fafc] hover:bg-[#f1f5f9] border-[#e2e8f0]'
                    }`}
                    onClick={() => {
                      setCurrentLat(r.location.latitude);
                      setCurrentLng(r.location.longitude);
                      setCurrentAddress(r.location.address);
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <img
                        src={r.primaryImageUrl}
                        alt={r.title}
                        className="w-12 h-12 rounded-xl object-cover border border-[#cbd5e1] shrink-0 bg-white shadow-xs"
                      />
                      <div className="truncate flex-1">
                        <div className="text-xs font-bold text-[#0f172a] truncate font-sans">
                          {r.title}
                        </div>
                        <div className="text-[10px] font-mono text-[#64748b] truncate mt-0.5 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-[#0284c7]" />
                          <span>{r.location.address}</span>
                        </div>
                        {score !== undefined && (
                          <div className="text-[10px] font-mono text-[#0284c7] font-bold mt-1">
                            {score}% Confidence Score
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#e2e8f0] text-[11px]">
                      <span className="font-mono text-[10px] text-[#94a3b8]">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                      <Link
                        to={`/report/${r.id}`}
                        className="text-[#0284c7] hover:underline font-bold flex items-center gap-1"
                      >
                        <span>View Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
