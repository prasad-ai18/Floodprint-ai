/**
 * Video & Audio Processing Utilities for Floodprint Multimodal Evidence
 */

export interface ExtractedVideoData {
  frames: string[]; // Base64 image data URLs
  durationSeconds: number;
  width: number;
  height: number;
  aspectRatio: string;
}

/**
 * Extracts representative frames from an uploaded video file using HTML5 Video + Canvas.
 */
export async function extractVideoFrames(
  file: File,
  samplePoints: number[] = [0.15, 0.5, 0.85]
): Promise<ExtractedVideoData> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const frames: string[] = [];

    video.onloadedmetadata = async () => {
      const duration = video.duration || 1;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 360;
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(width, 1280);
      canvas.height = Math.min(height, 720);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Unable to create canvas rendering context.'));
        return;
      }

      try {
        for (const point of samplePoints) {
          const seekTime = Math.min(duration * point, duration - 0.1);
          await seekToTime(video, seekTime);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          frames.push(dataUrl);
        }

        URL.revokeObjectURL(objectUrl);
        resolve({
          frames,
          durationSeconds: Math.round(duration * 10) / 10,
          width,
          height,
          aspectRatio: `${width}:${height}`,
        });
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video for frame extraction.'));
    };
  });
}

function seekToTime(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };
    video.addEventListener('seeked', onSeeked);
    video.currentTime = time;
  });
}

/**
 * Converts a File or Blob to a Base64 string.
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Strip data:image/...;base64, header if present
        const base64Content = reader.result.split(',')[1] || reader.result;
        resolve(base64Content);
      } else {
        reject(new Error('Failed to read file as base64 string.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Audio Recording Controller using Web MediaRecorder API
 */
export class VoiceEvidenceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  public isRecording = false;

  async start(): Promise<void> {
    this.audioChunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Choose supported MIME type
    let mimeType = 'audio/webm';
    if (!MediaRecorder.isTypeSupported('audio/webm')) {
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }
    }

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(250);
    this.isRecording = true;
  }

  async stop(): Promise<{ blob: Blob; url: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recorder found.'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);

        // Stop all audio tracks
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }

        this.isRecording = false;
        resolve({ blob, url, mimeType });
      };

      this.mediaRecorder.stop();
    });
  }
}
