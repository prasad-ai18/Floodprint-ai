import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Search, X, Loader2 } from 'lucide-react';
import { LocationSource } from '../../types';
import { searchLocations, reverseGeocode, LocationSearchResult, DEFAULT_MAP_LOCATION } from '../../services/gis';

interface EvidenceMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  locationSource?: LocationSource;
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number, address?: string) => void;
  height?: string;
  showSearch?: boolean;
}

export const EvidenceMap: React.FC<EvidenceMapProps> = ({
  latitude,
  longitude,
  address,
  locationSource = 'manual',
  interactive = false,
  onLocationSelect,
  height = '320px',
  showSearch = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [showResultsDropdown, setShowResultsDropdown] = useState<boolean>(false);

  const hasValidCoords = 
    typeof latitude === 'number' && 
    typeof longitude === 'number' && 
    !isNaN(latitude) && 
    !isNaN(longitude) && 
    !(latitude === 0 && longitude === 0);

  const centerLat = hasValidCoords ? latitude : DEFAULT_MAP_LOCATION.latitude;
  const centerLng = hasValidCoords ? longitude : DEFAULT_MAP_LOCATION.longitude;
  const zoomLevel = hasValidCoords ? 14 : DEFAULT_MAP_LOCATION.zoom;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: zoomLevel,
      zoomControl: true,
      attributionControl: true,
    });

    // High-resolution clean light GIS tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &bull; &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const customIcon = L.divIcon({
      className: 'custom-flood-pin',
      html: `
        <div style="
          background: radial-gradient(circle, #0284c7 0%, #0369a1 100%);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4), 0 2px 4px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    if (hasValidCoords) {
      const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
      markerRef.current = marker;

      const popupContent = `
        <div style="padding: 4px; font-family: sans-serif;">
          <div style="font-size: 11px; font-weight: bold; color: #0284c7; text-transform: uppercase; margin-bottom: 2px;">
            Evidence Location
          </div>
          <div style="font-size: 12px; font-weight: 600; color: #0f172a;">
            ${address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
          </div>
          <div style="font-size: 10px; color: #64748b; font-family: monospace; margin-top: 2px;">
            ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${locationSource})
          </div>
        </div>
      `;
      marker.bindPopup(popupContent);

      const circle = L.circle([latitude, longitude], {
        color: '#0284c7',
        fillColor: '#38bdf8',
        fillOpacity: 0.2,
        radius: 350,
      }).addTo(map);
      circleRef.current = circle;
    }

    if (interactive && onLocationSelect) {
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const roundedLat = Number(lat.toFixed(6));
        const roundedLng = Number(lng.toFixed(6));

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        }

        if (circleRef.current) {
          circleRef.current.setLatLng([lat, lng]);
        } else {
          circleRef.current = L.circle([lat, lng], {
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 0.2,
            radius: 350,
          }).addTo(map);
        }

        const geoAddress = await reverseGeocode(roundedLat, roundedLng);
        onLocationSelect(roundedLat, roundedLng, geoAddress);
      });
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [latitude, longitude, interactive, address, locationSource]);

  // Handle Search Execution
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchLocations(searchQuery);
      setSearchResults(results);
      setShowResultsDropdown(results.length > 0);
      if (results.length > 0) {
        handleSelectLocation(results[0]);
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSelectLocation = (loc: LocationSearchResult) => {
    setShowResultsDropdown(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.latitude, loc.longitude], loc.zoom, { duration: 1.2 });
    }
    if (onLocationSelect) {
      onLocationSelect(loc.latitude, loc.longitude, `${loc.name}, ${loc.hierarchy}`);
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#e2e8f0] bg-white shadow-md">
      
      {/* Optional Integrated GIS Search Bar */}
      {showSearch && (
        <div className="absolute top-3 left-3 right-3 z-30 max-w-md">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.length > 1) {
                  searchLocations(e.target.value).then(res => {
                    setSearchResults(res);
                    setShowResultsDropdown(res.length > 0);
                  });
                } else {
                  setShowResultsDropdown(false);
                }
              }}
              placeholder="Search India, Andhra Pradesh, Chittoor, mandal, or coordinates..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/95 backdrop-blur-md border border-[#cbd5e1] text-xs text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:border-[#0284c7] shadow-lg font-sans"
            />
            {searching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0284c7] absolute right-3 top-1/2 -translate-y-1/2" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setShowResultsDropdown(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0f172a]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </form>

          {/* Autocomplete Dropdown */}
          {showResultsDropdown && searchResults.length > 0 && (
            <div className="mt-1 rounded-xl bg-white border border-[#cbd5e1] shadow-2xl overflow-hidden max-h-56 overflow-y-auto font-mono text-xs">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleSelectLocation(result)}
                  className="w-full text-left px-3 py-2.5 hover:bg-[#f1f5f9] border-b border-[#e2e8f0] last:border-0 transition flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="truncate">
                    <span className="font-bold text-[#0f172a] block truncate font-sans text-xs">
                      {result.name}
                    </span>
                    <span className="text-[10px] text-[#64748b] truncate block">
                      {result.hierarchy}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#0284c7] shrink-0 font-mono">
                    {result.latitude.toFixed(2)}, {result.longitude.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-10" />

      {/* Overlay Badge */}
      <div className={`absolute z-20 pointer-events-none flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#e2e8f0] text-xs shadow-sm ${showSearch ? 'bottom-3 left-3' : 'top-3 left-3'}`}>
        <MapPin className="w-3.5 h-3.5 text-[#0284c7]" />
        <span className="font-mono text-[#0f172a] font-medium">
          {hasValidCoords 
            ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            : 'Chittoor District, AP (13.2172, 79.1003)'}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284c7] bg-[#0284c7]/10 px-1.5 py-0.5 rounded border border-[#0284c7]/20 font-mono">
          {locationSource.replace(/_/g, ' ')}
        </span>
      </div>

      {interactive && (
        <div className="absolute bottom-3 right-3 z-20 pointer-events-none bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#e2e8f0] text-[11px] text-[#64748b] shadow flex items-center gap-1.5 font-mono">
          <Navigation className="w-3 h-3 text-[#0284c7]" />
          <span>Click map to set coordinates</span>
        </div>
      )}
    </div>
  );
};
