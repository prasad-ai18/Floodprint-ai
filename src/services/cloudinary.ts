export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  originalFilename: string;
}

export const isCloudinaryConfigured = Boolean(
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME &&
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name' &&
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET &&
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET !== 'your_unsigned_upload_preset_name'
);

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * Validates file format and size before upload.
 */
export function validateEvidenceFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported file format (${file.type || 'unknown'}). Please upload a JPG, PNG, or WEBP image.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMB} MB). Maximum allowed size is 15 MB.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'The selected file is empty (0 bytes).' };
  }

  return { valid: true };
}

/**
 * Uploads an image file to Cloudinary using an unsigned upload preset.
 * Secrets (API Secret) remain strictly protected on the backend.
 */
export async function uploadImageToCloudinary(
  file: File,
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult> {
  const validation = validateEvidenceFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'floodprint_evidence';

  // Demo fallback if Cloudinary is in template placeholder mode
  if (!isCloudinaryConfigured) {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        if (onProgress) onProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          const mockPublicId = `demo_flood_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const objectUrl = URL.createObjectURL(file);
          resolve({
            url: objectUrl,
            secureUrl: objectUrl,
            publicId: mockPublicId,
            format: file.type.replace('image/', ''),
            width: 1920,
            height: 1080,
            bytes: file.size,
            originalFilename: file.name,
          });
        }
      }, 100);
    });
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'floodprint_evidence');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    xhr.open('POST', endpoint);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            url: response.url,
            secureUrl: response.secure_url,
            publicId: response.public_id,
            format: response.format,
            width: response.width,
            height: response.height,
            bytes: response.bytes,
            originalFilename: file.name,
          });
        } catch {
          reject(new Error('Failed to parse Cloudinary response.'));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.error?.message || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred during evidence upload. Check your internet connection.'));
    };

    xhr.send(formData);
  });
}
