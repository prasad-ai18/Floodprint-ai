import ExifReader from 'exifreader';
import { EvidenceMetadata } from '../types';

/**
 * Extracts EXIF, GPS, camera metadata, and timestamps from image files.
 */
export async function extractExifMetadata(file: File): Promise<EvidenceMetadata> {
  const metadata: EvidenceMetadata = {
    hasExif: false,
    hasGps: false,
    missingMetadataWarnings: [],
  };

  // Only attempt EXIF extraction for image types
  if (!file.type.startsWith('image/')) {
    return metadata;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const tags = ExifReader.load(arrayBuffer, { expanded: true });

    // Check if EXIF group exists
    if (tags.exif) {
      metadata.hasExif = true;

      // Camera Make & Model
      if (tags.exif.Make) {
        metadata.cameraMake = String(tags.exif.Make.description || tags.exif.Make.value);
      }
      if (tags.exif.Model) {
        metadata.cameraModel = String(tags.exif.Model.description || tags.exif.Model.value);
      }
      if (tags.exif.LensModel) {
        metadata.lens = String(tags.exif.LensModel.description || tags.exif.LensModel.value);
      }
      if (tags.exif.Software) {
        metadata.software = String(tags.exif.Software.description || tags.exif.Software.value);
      }

      // Capture Date / Time Original
      const dateTime = tags.exif.DateTimeOriginal || tags.exif.DateTimeDigitized || tags.exif.DateTime;
      if (dateTime) {
        const rawDate = String(dateTime.description || dateTime.value);
        // Convert "YYYY:MM:DD HH:MM:SS" format to ISO if applicable
        const isoMatch = rawDate.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (isoMatch) {
          const [, y, m, d, hh, mm, ss] = isoMatch;
          metadata.captureDate = `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
        } else {
          metadata.captureDate = rawDate;
        }
      }
    }

    // GPS Telemetry
    if (tags.gps) {
      const lat = tags.gps.Latitude;
      const lon = tags.gps.Longitude;
      const alt = tags.gps.Altitude;

      if (typeof lat === 'number' && typeof lon === 'number') {
        metadata.hasGps = true;
        metadata.gpsLatitude = Number(lat.toFixed(6));
        metadata.gpsLongitude = Number(lon.toFixed(6));
      }

      if (typeof alt === 'number') {
        metadata.gpsAltitude = Number(alt.toFixed(1));
      }
    }

    // Identify missing metadata warnings
    if (!metadata.hasExif) {
      metadata.missingMetadataWarnings?.push('EXIF metadata is completely stripped or unavailable.');
    } else {
      if (!metadata.hasGps) {
        metadata.missingMetadataWarnings?.push('No embedded GPS coordinate tags found in image EXIF.');
      }
      if (!metadata.captureDate) {
        metadata.missingMetadataWarnings?.push('No original capture timestamp tag found in image EXIF.');
      }
    }

  } catch (err: unknown) {
    metadata.missingMetadataWarnings?.push('Unable to parse EXIF headers (file may be compressed or stripped).');
  }

  return metadata;
}
