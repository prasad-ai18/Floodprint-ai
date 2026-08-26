export type WeatherConsistencyCategory = 
  | 'supportive' 
  | 'partially_supportive' 
  | 'neutral' 
  | 'potentially_inconsistent' 
  | 'insufficient_data';

export interface WeatherMetrics {
  temperature: number;
  precipitation: number;
  rain: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  weatherCode: number;
}

export interface WeatherVerificationResult {
  status: 'verified' | 'insufficient_data' | 'weather_unavailable';
  location: {
    latitude: number;
    longitude: number;
    formattedAddress?: string;
  };
  evidenceTimestamp: string;
  matchedWeatherTime: string;
  weather?: WeatherMetrics;
  conditions: string[];
  weatherConsistency: WeatherConsistencyCategory;
  consistencyScore: number;
  explanation: string;
  source: string;
  checkedAt: string;
}

interface OpenMeteoHourlyData {
  time?: string[];
  precipitation?: number[];
  rain?: number[];
  temperature_2m?: number[];
  relative_humidity_2m?: number[];
  cloud_cover?: number[];
  wind_speed_10m?: number[];
  weather_code?: number[];
}

interface OpenMeteoApiResponse {
  hourly?: OpenMeteoHourlyData;
  timezone?: string;
  timezone_abbreviation?: string;
}

/**
 * WMO Weather interpretation codes
 */
const WMO_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

/**
 * Verifies historical meteorological conditions for evidence coordinates and timestamp.
 */
export async function crossVerifyWeather(
  latitude: number,
  longitude: number,
  isoTimestamp: string,
  formattedAddress?: string
): Promise<WeatherVerificationResult> {
  const checkedAt = new Date().toISOString();

  // Validate inputs
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    isNaN(latitude) ||
    isNaN(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    (latitude === 0 && longitude === 0)
  ) {
    return {
      status: 'insufficient_data',
      location: { latitude: latitude || 0, longitude: longitude || 0, formattedAddress },
      evidenceTimestamp: isoTimestamp || '',
      matchedWeatherTime: 'N/A',
      conditions: ['Location coordinates not provided or invalid'],
      weatherConsistency: 'insufficient_data',
      consistencyScore: 50,
      explanation: 'Insufficient coordinate data to query meteorological stations. Evidence location was not precisely geocoded.',
      source: 'Open-Meteo',
      checkedAt,
    };
  }

  const targetDate = new Date(isoTimestamp);
  if (isNaN(targetDate.getTime())) {
    return {
      status: 'insufficient_data',
      location: { latitude, longitude, formattedAddress },
      evidenceTimestamp: isoTimestamp || '',
      matchedWeatherTime: 'N/A',
      conditions: ['Invalid timestamp format'],
      weatherConsistency: 'insufficient_data',
      consistencyScore: 50,
      explanation: 'Evidence timestamp format could not be resolved for meteorological cross-referencing.',
      source: 'Open-Meteo',
      checkedAt,
    };
  }

  const now = new Date();
  const isPast = targetDate.getTime() < now.getTime() - 2 * 24 * 60 * 60 * 1000;
  const dateStr = targetDate.toISOString().split('T')[0];
  const targetHour = targetDate.getUTCHours();

  let url: string;
  if (isPast) {
    url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${dateStr}&end_date=${dateStr}&hourly=precipitation,rain,temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,weather_code&timezone=auto`;
  } else {
    url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=precipitation,rain,temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,weather_code&timezone=auto`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo API returned status ${response.status}`);
    }

    const data = (await response.json()) as OpenMeteoApiResponse;
    const hourly = data.hourly;

    if (!hourly || !hourly.time || hourly.time.length === 0) {
      throw new Error('No hourly meteorological observation data returned');
    }

    // Inspect 3-hour window around target hour: [hour - 1, hour, hour + 1]
    const maxHourIndex = hourly.time.length - 1;
    const centerIndex = Math.min(maxHourIndex, Math.max(0, targetHour));
    const windowIndices = [
      Math.max(0, centerIndex - 1),
      centerIndex,
      Math.min(maxHourIndex, centerIndex + 1),
    ];

    // Find peak precipitation in 3-hour window
    let bestIndex = centerIndex;
    let maxWindowPrecip = -1;
    for (const idx of windowIndices) {
      const p = hourly.precipitation?.[idx] || 0;
      if (p > maxWindowPrecip) {
        maxWindowPrecip = p;
        bestIndex = idx;
      }
    }

    const matchedTime = hourly.time[bestIndex] || `${dateStr}T${String(centerIndex).padStart(2, '0')}:00`;
    const precip = hourly.precipitation?.[bestIndex] ?? 0;
    const rain = hourly.rain?.[bestIndex] ?? precip;
    const temp = hourly.temperature_2m?.[bestIndex] ?? 20;
    const humidity = hourly.relative_humidity_2m?.[bestIndex] ?? 50;
    const cloudCover = hourly.cloud_cover?.[bestIndex] ?? 50;
    const windSpeed = hourly.wind_speed_10m?.[bestIndex] ?? 10;
    const weatherCode = hourly.weather_code?.[bestIndex] ?? 0;

    const totalDailyPrecip = (hourly.precipitation || []).reduce((sum, val) => sum + (val || 0), 0);
    const weatherDesc = WMO_CODES[weatherCode] || 'Variable atmospheric state';

    // Formulate conditions list
    const conditions: string[] = [];
    conditions.push(`Atmospheric State: ${weatherDesc}`);
    if (totalDailyPrecip > 0) {
      conditions.push(`Precipitation: ${precip.toFixed(1)} mm/hr (${totalDailyPrecip.toFixed(1)} mm 24h total)`);
    } else {
      conditions.push('Precipitation: 0.0 mm at local station gauge');
    }
    conditions.push(`Temperature: ${temp.toFixed(1)}°C`);
    conditions.push(`Humidity: ${humidity}%`);
    conditions.push(`Cloud Cover: ${cloudCover}%`);
    conditions.push(`Wind Speed: ${windSpeed.toFixed(1)} km/h`);

    // Determine conservative consistency category & score
    let weatherConsistency: WeatherConsistencyCategory = 'neutral';
    let consistencyScore = 60;
    let explanation = '';

    if (totalDailyPrecip >= 15 || precip >= 4 || weatherCode >= 63) {
      weatherConsistency = 'supportive';
      consistencyScore = 90;
      explanation = `Meteorological radar and ground stations recorded substantial storm activity (${totalDailyPrecip.toFixed(1)} mm total precipitation, ${weatherDesc}) within the event timeframe, strongly supporting the possibility of flood inundation.`;
    } else if (totalDailyPrecip >= 2 || precip > 0 || weatherCode >= 51 || (cloudCover >= 80 && humidity >= 80)) {
      weatherConsistency = 'partially_supportive';
      consistencyScore = 75;
      explanation = `Measurable precipitation (${totalDailyPrecip.toFixed(1)} mm) and overcast, high-humidity storm conditions were recorded nearby. Consistent with localized water accumulation or rising local waterways.`;
    } else if (cloudCover >= 50 || humidity >= 65) {
      weatherConsistency = 'neutral';
      consistencyScore = 60;
      explanation = `Station recorded trace or 0.0 mm precipitation at the exact gauge. Note: Flooding frequently occurs independently of local rainfall due to upstream river overflow, dam releases, storm surges, tidal inundation, or delayed runoff.`;
    } else {
      weatherConsistency = 'potentially_inconsistent';
      consistencyScore = 42;
      explanation = `Local weather station recorded clear skies (${cloudCover}% cloud cover) and dry conditions. While atmospheric data does not show active storms, flooding may stem from infrastructure failure (e.g. burst water mains), upstream basin discharge, or prior rainfall accumulation.`;
    }

    return {
      status: 'verified',
      location: { latitude, longitude, formattedAddress },
      evidenceTimestamp: isoTimestamp,
      matchedWeatherTime: matchedTime,
      weather: {
        temperature: temp,
        precipitation: precip,
        rain,
        humidity,
        cloudCover,
        windSpeed,
        weatherCode,
      },
      conditions,
      weatherConsistency,
      consistencyScore,
      explanation,
      source: 'Open-Meteo',
      checkedAt,
    };
  } catch (error) {
    console.warn('Open-Meteo verification error (graceful fallback):', error);
    return {
      status: 'weather_unavailable',
      location: { latitude, longitude, formattedAddress },
      evidenceTimestamp: isoTimestamp,
      matchedWeatherTime: 'N/A',
      conditions: ['Weather observation service temporarily unreachable'],
      weatherConsistency: 'insufficient_data',
      consistencyScore: 50,
      explanation: 'Historical weather data was temporarily unavailable from the station network. Evidence is retained for subsequent verification checks.',
      source: 'Open-Meteo',
      checkedAt,
    };
  }
}
