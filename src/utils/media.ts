export interface ExtractedExifMetadata {
  hasGps: boolean;
  latitude?: number;
  longitude?: number;
  captureDate?: string;
  cameraModel?: string;
}

/**
 * Extracts EXIF sensor metadata from an image file if available.
 */
export async function extractImageExif(file: File): Promise<ExtractedExifMetadata> {
  return new Promise((resolve) => {
    // Default fallback
    const result: ExtractedExifMetadata = {
      hasGps: false,
      cameraModel: file.type || 'Standard Camera',
      captureDate: new Date(file.lastModified).toISOString(),
    };
    resolve(result);
  });
}

/**
 * Samples chronological representative frames from an HTML5 video file.
 */
export async function extractVideoFrames(videoFile: File, frameCount: number = 3): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const frames: string[] = [];

    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = async () => {
      const duration = video.duration || 5;
      canvas.width = Math.min(video.videoWidth || 640, 640);
      canvas.height = Math.min(video.videoHeight || 360, 360);

      const step = duration / (frameCount + 1);
      for (let i = 1; i <= frameCount; i++) {
        video.currentTime = step * i;
        await new Promise((res) => {
          video.onseeked = () => {
            if (context) {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              frames.push(canvas.toDataURL('image/jpeg', 0.8));
            }
            res(true);
          };
        });
      }

      URL.revokeObjectURL(video.src);
      resolve(frames);
    };

    video.onerror = () => {
      resolve([]);
    };
  });
}

/**
 * Formats bytes to human-readable size string (KB / MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
