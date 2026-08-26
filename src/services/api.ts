import { 
  GeminiVisualAnalysis, 
  VideoTemporalAnalysis, 
  AudioClaimExtraction,
  WeatherVerificationResult, 
  FloodprintVerificationResult,
  FloodReport
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  referencedLocations?: string[];
  referencedDates?: string[];
  keyPoints?: string[];
  suggestedFollowUps?: string[];
}

export interface DocumentIntelligenceResult {
  eventType: string;
  locations: { name: string; hierarchy?: string; latitude?: number; longitude?: number }[];
  datesAndTimes: string[];
  keyFindings: string[];
  infrastructureImpact: string[];
  potentialInconsistencies: string[];
  environmentalReferences: string[];
  humanSummary: string;
  confidenceScore: number;
}

/**
 * Sends messages and active evidence context to the conversational AI Assistant.
 */
export async function sendChatMessage(payload: {
  messages: { role: 'user' | 'assistant'; content: string }[];
  evidenceContext?: any;
}): Promise<{
  reply: string;
  referencedLocations: string[];
  referencedDates: string[];
  keyPoints: string[];
  suggestedFollowUps: string[];
}> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `AI Assistant request failed (${response.statusText})`);
  }

  return response.json();
}

/**
 * Sends raw document text, messy notes, or PDF dumps for structured intelligence extraction.
 */
export async function extractDocumentIntelligence(payload: {
  rawContent: string;
  metadata?: { fileName?: string; fileType?: string };
}): Promise<DocumentIntelligenceResult> {
  const response = await fetch(`${API_BASE_URL}/document/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Document intelligence extraction failed (${response.statusText})`);
  }

  return response.json();
}

/**
 * Sends evidence photo to Gemini Vision API for visual analysis.
 */
export async function analyzeVisualEvidence(payload: {
  imageUrl: string;
  location?: string;
  timestamp?: string;
}): Promise<GeminiVisualAnalysis> {
  const response = await fetch(`${API_BASE_URL}/gemini/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Visual analysis failed (${response.statusText})`);
  }

  return response.json();
}

/**
 * Sends sequential video frames to Gemini API for temporal and motion analysis.
 */
export async function analyzeVideoEvidence(payload: {
  frames: string[];
  durationSeconds?: number;
  location?: string;
  timestamp?: string;
}): Promise<VideoTemporalAnalysis> {
  const response = await fetch(`${API_BASE_URL}/gemini/analyze-video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Video analysis failed (${response.statusText})`);
  }

  return response.json();
}

/**
 * Transcribes audio / voice recordings and extracts mentioned claims.
 */
export async function analyzeAudioEvidence(payload: {
  audioContent: string;
  isTranscriptText?: boolean;
  location?: string;
  timestamp?: string;
}): Promise<AudioClaimExtraction> {
  const response = await fetch(`${API_BASE_URL}/gemini/analyze-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Audio analysis failed (${response.statusText})`);
  }

  return response.json();
}

/**
 * Queries Open-Meteo historical weather archives for the location and timestamp.
 */
export async function verifyWeatherConditions(payload: {
  latitude: number;
  longitude: number;
  timestamp: string;
  address?: string;
}): Promise<WeatherVerificationResult> {
  const response = await fetch(`${API_BASE_URL}/weather/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Weather verification failed (${response.statusText})`);
  }

  return response.json();
}

/**
 * Synthesizes all multimodal evidence into a Floodprint Verification Assessment.
 */
export async function synthesizeVerification(
  report: FloodReport
): Promise<FloodprintVerificationResult> {
  const response = await fetch(`${API_BASE_URL}/verify/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ report }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Verification synthesis failed (${response.statusText})`);
  }

  return response.json();
}
