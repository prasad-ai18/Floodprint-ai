import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';
import { LocationSource } from '../../types';

interface EvidenceMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  locationSource?: LocationSource;
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: string;
}

export const EvidenceMap: React.FC<EvidenceMapProps> = ({
  latitude,
  longitude,
  address,
  locationSource = 'manual',
  interactive = false,
  onLocationSelect,
  height = '320px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const hasValidCoords = 
    typeof latitude === 'number' && 
    typeof longitude === 'number' && 
    !isNaN(latitude) && 
    !isNaN(longitude) && 
    !(latitude === 0 && longitude === 0);

  const centerLat = hasValidCoords ? latitude : 29.7604;
  const centerLng = hasValidCoords ? longitude : -95.3698;
  const zoomLevel = hasValidCoords ? 14 : 4;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy previous map instance if it exists
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

    // Dark-themed OpenStreetMap tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &bull; &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Custom Glowing SVG Marker
    const customIcon = L.divIcon({
      className: 'custom-flood-pin',
      html: `
        <div style="
          background: radial-gradient(circle, #06b6d4 0%, #0284c7 100%);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 3px solid #ffffff;
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.8), 0 4px 6px rgba(0,0,0,0.4);
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
          <div style="font-size: 11px; font-weight: bold; color: #38bdf8; text-transform: uppercase; margin-bottom: 2px;">
            Evidence Location
          </div>
          <div style="font-size: 12px; font-weight: 600; color: #f8fafc;">
            ${address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
          </div>
          <div style="font-size: 10px; color: #94a3b8; font-family: monospace; margin-top: 2px;">
            ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${locationSource})
          </div>
        </div>
      `;
      marker.bindPopup(popupContent);

      // Add a subtle flood radius zone
      const circle = L.circle([latitude, longitude], {
        color: '#06b6d4',
        fillColor: '#0284c7',
        fillOpacity: 0.15,
        radius: 350,
      }).addTo(map);
      circleRef.current = circle;
    }

    // Interactive Click-To-Pick Location Handler
    if (interactive && onLocationSelect) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        onLocationSelect(Number(lat.toFixed(6)), Number(lng.toFixed(6)));

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        }

        if (circleRef.current) {
          circleRef.current.setLatLng([lat, lng]);
        } else {
          circleRef.current = L.circle([lat, lng], {
            color: '#06b6d4',
            fillColor: '#0284c7',
            fillOpacity: 0.15,
            radius: 350,
          }).addTo(map);
        }
      });
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [latitude, longitude, interactive, address, locationSource]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-10" />

      {/* Overlay Badge */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-2 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-lg">
        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-mono text-slate-200">
          {hasValidCoords 
            ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            : 'Click map to place coordinates'}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
          {locationSource.replace(/_/g, ' ')}
        </span>
      </div>

      {interactive && (
        <div className="absolute bottom-3 right-3 z-20 pointer-events-none bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] text-slate-300 shadow flex items-center gap-1.5">
          <Navigation className="w-3 h-3 text-cyan-400" />
          <span>Click map to reposition pin</span>
        </div>
      )}
    </div>
  );
};
