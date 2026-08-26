// ============================================================================
// FLOODPRINT AI — GIS & INDIAN ADMINISTRATIVE GEOGRAPHY SERVICE
// ============================================================================

export interface LocationSearchResult {
  id: string;
  name: string;
  hierarchy: string;
  state?: string;
  district?: string;
  country: string;
  latitude: number;
  longitude: number;
  zoom: number;
}

export const CHITTOOR_AP_LOCATIONS = {
  chittoorDistrict: {
    id: 'in-ap-chittoor-dist',
    name: 'Chittoor District',
    hierarchy: 'District, Andhra Pradesh, India',
    district: 'Chittoor',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 13.2172,
    longitude: 79.1003,
    zoom: 11,
  },
  chittoorCity: {
    id: 'in-ap-chittoor-city',
    name: 'Chittoor City',
    hierarchy: 'City, Chittoor District, Andhra Pradesh, India',
    district: 'Chittoor',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 13.2172,
    longitude: 79.1003,
    zoom: 14,
  },
  tirupati: {
    id: 'in-ap-tirupati',
    name: 'Tirupati',
    hierarchy: 'Tirupati District, Andhra Pradesh, India',
    district: 'Tirupati',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 13.6288,
    longitude: 79.4192,
    zoom: 13,
  },
  andhraPradesh: {
    id: 'in-ap',
    name: 'Andhra Pradesh',
    hierarchy: 'State, India',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 15.9129,
    longitude: 79.7400,
    zoom: 7,
  },
  vijayawada: {
    id: 'in-ap-vijayawada',
    name: 'Vijayawada',
    hierarchy: 'NTR District, Andhra Pradesh, India',
    district: 'NTR',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 16.5062,
    longitude: 80.6480,
    zoom: 13,
  },
  visakhapatnam: {
    id: 'in-ap-visakhapatnam',
    name: 'Visakhapatnam',
    hierarchy: 'Visakhapatnam District, Andhra Pradesh, India',
    district: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 17.6868,
    longitude: 83.2185,
    zoom: 13,
  },
  india: {
    id: 'in-national',
    name: 'India',
    hierarchy: 'Republic of India',
    country: 'India',
    latitude: 20.5937,
    longitude: 78.9629,
    zoom: 5,
  },
};

// Built-in offline Indian Geographic & Administrative Registry
const PREDEFINED_INDIA_LOCATIONS: LocationSearchResult[] = [
  CHITTOOR_AP_LOCATIONS.india,
  CHITTOOR_AP_LOCATIONS.andhraPradesh,
  CHITTOOR_AP_LOCATIONS.chittoorDistrict,
  CHITTOOR_AP_LOCATIONS.chittoorCity,
  CHITTOOR_AP_LOCATIONS.tirupati,
  CHITTOOR_AP_LOCATIONS.vijayawada,
  CHITTOOR_AP_LOCATIONS.visakhapatnam,
  {
    id: 'in-ap-madanapalle',
    name: 'Madanapalle',
    hierarchy: 'Annamayya / Chittoor, Andhra Pradesh, India',
    district: 'Annamayya',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 13.5560,
    longitude: 78.5030,
    zoom: 13,
  },
  {
    id: 'in-ap-palamaner',
    name: 'Palamaner',
    hierarchy: 'Mandal, Chittoor District, Andhra Pradesh, India',
    district: 'Chittoor',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 13.2000,
    longitude: 78.7500,
    zoom: 13,
  },
  {
    id: 'in-ap-kuppam',
    name: 'Kuppam',
    hierarchy: 'Chittoor District, Andhra Pradesh, India',
    district: 'Chittoor',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 12.7500,
    longitude: 78.3667,
    zoom: 13,
  },
  {
    id: 'in-ap-srikalahasti',
    name: 'Srikalahasti',
    hierarchy: 'Tirupati / Chittoor, Andhra Pradesh, India',
    district: 'Tirupati',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 13.7500,
    longitude: 79.7000,
    zoom: 13,
  },
  {
    id: 'in-ap-nagari',
    name: 'Nagari',
    hierarchy: 'Chittoor District, Andhra Pradesh, India',
    district: 'Chittoor',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 13.3300,
    longitude: 79.5800,
    zoom: 13,
  },
  {
    id: 'in-ap-puttur',
    name: 'Puttur',
    hierarchy: 'Chittoor / Tirupati, Andhra Pradesh, India',
    district: 'Tirupati',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 13.4414,
    longitude: 79.5539,
    zoom: 13,
  },
  {
    id: 'in-ap-punganur',
    name: 'Punganur',
    hierarchy: 'Chittoor District, Andhra Pradesh, India',
    district: 'Chittoor',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 13.3667,
    longitude: 78.5833,
    zoom: 13,
  },
  {
    id: 'in-ap-guntur',
    name: 'Guntur',
    hierarchy: 'Guntur District, Andhra Pradesh, India',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 16.3067,
    longitude: 80.4365,
    zoom: 13,
  },
  {
    id: 'in-ap-nellore',
    name: 'Nellore',
    hierarchy: 'SPSR Nellore District, Andhra Pradesh, India',
    district: 'SPSR Nellore',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 14.4426,
    longitude: 79.9865,
    zoom: 13,
  },
  {
    id: 'in-ap-kurnool',
    name: 'Kurnool',
    hierarchy: 'Kurnool District, Andhra Pradesh, India',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 15.8281,
    longitude: 78.0373,
    zoom: 13,
  },
  {
    id: 'in-ap-kadapa',
    name: 'Kadapa (YSR)',
    hierarchy: 'YSR District, Andhra Pradesh, India',
    district: 'YSR',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 14.4673,
    longitude: 78.8242,
    zoom: 13,
  },
  {
    id: 'in-ap-anantapur',
    name: 'Anantapur',
    hierarchy: 'Ananthapuramu District, Andhra Pradesh, India',
    district: 'Ananthapuramu',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 14.6819,
    longitude: 77.6006,
    zoom: 13,
  },
  {
    id: 'in-ap-rajahmundry',
    name: 'Rajahmundry',
    hierarchy: 'East Godavari, Andhra Pradesh, India',
    district: 'East Godavari',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 17.0005,
    longitude: 81.8040,
    zoom: 13,
  },
  {
    id: 'in-ap-kakinada',
    name: 'Kakinada',
    hierarchy: 'Kakinada District, Andhra Pradesh, India',
    district: 'Kakinada',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 16.9891,
    longitude: 82.2475,
    zoom: 13,
  },
  {
    id: 'in-ts-hyderabad',
    name: 'Hyderabad',
    hierarchy: 'Telangana, India',
    state: 'Telangana',
    country: 'India',
    latitude: 17.3850,
    longitude: 78.4867,
    zoom: 12,
  },
  {
    id: 'in-ka-bengaluru',
    name: 'Bengaluru',
    hierarchy: 'Karnataka, India',
    state: 'Karnataka',
    country: 'India',
    latitude: 12.9716,
    longitude: 77.5946,
    zoom: 12,
  },
  {
    id: 'in-tn-chennai',
    name: 'Chennai',
    hierarchy: 'Tamil Nadu, India',
    state: 'Tamil Nadu',
    country: 'India',
    latitude: 13.0827,
    longitude: 80.2707,
    zoom: 12,
  },
  {
    id: 'in-dl-delhi',
    name: 'New Delhi',
    hierarchy: 'National Capital Territory, India',
    state: 'Delhi',
    country: 'India',
    latitude: 28.6139,
    longitude: 77.2090,
    zoom: 12,
  },
  {
    id: 'in-mh-mumbai',
    name: 'Mumbai',
    hierarchy: 'Maharashtra, India',
    state: 'Maharashtra',
    country: 'India',
    latitude: 19.0760,
    longitude: 72.8777,
    zoom: 12,
  },
];

export const DEFAULT_MAP_LOCATION = {
  name: 'Chittoor, Andhra Pradesh, India',
  latitude: 13.2172,
  longitude: 79.1003,
  zoom: 12,
};

/**
 * Searches local Indian registry and falls back to Nominatim OSM API for full coverage.
 */
export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Check if user input is raw coordinate string: e.g. "13.2172, 79.1003" or "13.2172,79.1003"
  const coordMatch = trimmed.match(/^([-+]?\d+(\.\d+)?)\s*,\s*([-+]?\d+(\.\d+)?)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[3]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return [
        {
          id: `coord-${lat}-${lng}`,
          name: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          hierarchy: 'Custom GIS Point',
          country: 'India',
          latitude: lat,
          longitude: lng,
          zoom: 14,
        },
      ];
    }
  }

  const qLower = trimmed.toLowerCase();

  // 1. Check local instant database first
  const localMatches = PREDEFINED_INDIA_LOCATIONS.filter(loc => 
    loc.name.toLowerCase().includes(qLower) ||
    loc.hierarchy.toLowerCase().includes(qLower) ||
    (loc.district && loc.district.toLowerCase().includes(qLower)) ||
    (loc.state && loc.state.toLowerCase().includes(qLower))
  );

  if (localMatches.length > 0) {
    return localMatches;
  }

  // 2. Fallback to OpenStreetMap Nominatim for exact mandal, street, or village
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&countrycodes=in&limit=5`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any, idx: number) => ({
          id: `osm-${item.place_id || idx}`,
          name: item.display_name.split(',')[0],
          hierarchy: item.display_name,
          country: 'India',
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          zoom: item.type === 'administrative' ? 12 : 14,
        }));
      }
    }
  } catch {
    // Graceful network fallback
  }

  return [];
}

/**
 * Reverse geocodes coordinates to administrative address.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const distToChittoor = Math.hypot(lat - 13.2172, lng - 79.1003);
  if (distToChittoor < 0.15) {
    return 'Chittoor, Andhra Pradesh, India';
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    }
  } catch {
    // Fallback
  }

  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
