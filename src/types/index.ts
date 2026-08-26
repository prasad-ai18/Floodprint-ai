// ============================================================================
// FLOODPRINT AI — MULTIMODAL TYPES & SCHEMAS
// ============================================================================

export type EvidenceType = 'image' | 'video' | 'audio' | 'text';

export type LocationSource = 
  | 'exif_gps' 
  | 'device_gps' 
  | 'map_selected' 
  | 'audio_text_extracted' 
  | 'ai_inferred' 
  | 'manual';

export type VerificationStatus = 
  | 'submitted' 
  | 'analyzing' 
  | 'ai_analyzed' 
  | 'weather_verified' 
  | 'verified' 
  | 'partially_verified' 
  | 'inconsistent' 
  | 'insufficient_evidence' 
  | 'pending_verification' 
  | 'analysis_failed';

export type MultimodalOutcome = 
  | 'verified' 
  | 'partially_verified' 
  | 'inconsistent' 
  | 'insufficient_evidence';

export type SignalStatus = 
  | 'supportive' 
  | 'partially_supportive' 
  | 'neutral' 
  | 'potentially_inconsistent' 
  | 'insufficient_data';

export type TimeConsistencyStatus = 
  | 'consistent' 
  | 'minor_discrepancy' 
  | 'time_inconsistency_detected' 
  | 'unverifiable';

// EXIF & File Metadata
export interface EvidenceMetadata {
  cameraMake?: string;
  cameraModel?: string;
  lens?: string;
  software?: string;
  captureDate?: string;
  hasGps?: boolean;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: number;
  hasExif?: boolean;
  durationSeconds?: number;
  videoResolution?: string;
  frameRate?: number;
  sampleRate?: number;
  extractedText?: string;
  missingMetadataWarnings?: string[];
}

// Extracted Audio Claims
export interface AudioClaimExtraction {
  transcription: string;
  mentionedLocations: string[];
  mentionedTimes: string[];
  eventDescriptions: string[];
  confidence: number;
}

// Individual Evidence Item
export interface MultimodalEvidenceItem {
  id: string;
  type: EvidenceType;
  url?: string;
  publicId?: string;
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  content?: string; // Narrative text or audio transcript
  capturedAt?: string;
  uploadedAt: string;
  metadata?: EvidenceMetadata;
  frames?: string[]; // Representative sampled video frames (base64 or URLs)
  transcription?: string;
  claims?: AudioClaimExtraction;
  aiObservation?: string;
}

// Location Telemetry
export interface ReportLocation {
  address: string;
  latitude: number;
  longitude: number;
  locationSource: LocationSource;
  accuracyMeters?: number;
  confidence?: 'high' | 'moderate' | 'low' | 'unverified';
}

// Temporal Telemetry & Delta Analysis
export interface TemporalAnalysis {
  claimedEventTime: string;
  mediaCaptureTime?: string;
  uploadTime: string;
  weatherObservationTime?: string;
  timeDeltaHours?: number;
  status: TimeConsistencyStatus;
  explanation: string;
}

// Visual Evidence Details
export interface FloodEvidenceAnalysis {
  detected: boolean;
  waterDepthEstimate?: string;
  surfaceTurbulence?: 'calm' | 'moderate_flow' | 'rapid_turbulent_surge';
  infrastructureImpact?: string[];
  observations: string[];
  detectedText?: string[];
}

export interface ImageIntegrityAnalysis {
  manipulationRisk: 'low' | 'moderate' | 'high';
  compressionConsistency: 'consistent' | 'suspicious';
  metadataAvailability: 'intact' | 'partially_present' | 'stripped_or_missing';
  notes: string;
}

export interface VisualEnvironmentContext {
  apparentWeather: string;
  lightingCondition: string;
  terrainType: string;
  consistency: 'consistent' | 'partially_consistent' | 'inconsistent';
}

export interface GeminiVisualAnalysis {
  analyzedAt: string;
  modelUsed: string;
  visualSummary: string;
  floodEvidence: FloodEvidenceAnalysis;
  environment: VisualEnvironmentContext;
  imageIntegrity: ImageIntegrityAnalysis;
  limitations: string[];
  overallVisualConfidence: number;
}

// Video Frame Analysis
export interface VideoTemporalAnalysis {
  framesAnalyzed: number;
  durationSeconds?: number;
  motionConsistency: 'consistent_fluid_motion' | 'abrupt_anomalous' | 'static';
  sceneEvolution: string;
  waterRiseObserved: boolean;
  observations: string[];
  confidence: number;
}

// Historical Weather Verification
export interface HistoricalWeatherObservation {
  temperature: number;
  precipitation: number;
  rain: number;
  cloudCover: number;
  windSpeed: number;
  humidity: number;
  weatherCode: number;
  conditionDescription: string;
  rawTime: string;
}

export interface WeatherVerificationResult {
  verifiedAt: string;
  status: 'verified' | 'insufficient_data' | 'failed';
  weatherConsistency: SignalStatus;
  consistencyScore: number;
  weather?: HistoricalWeatherObservation;
  matchedWeatherTime?: string;
  explanation: string;
  source: string;
}

// Multi-Signal Evidence Signal
export interface VerificationSignal {
  signalKey: 'visual' | 'video' | 'audio' | 'weather' | 'location' | 'timestamp' | 'integrity';
  name: string;
  score: number; // 0 - 100
  baseWeight: number; // e.g. 0.35
  normalizedWeight: number; // dynamically normalized
  status: SignalStatus;
  reason: string;
}

// Multimodal Forensic Verification Assessment
export interface FloodprintVerificationResult {
  verifiedAt: string;
  confidenceScore: number; // 0 - 100
  confidenceLevel: string; // 'High Consistency' | 'Moderate Consistency' | 'Uncertain' | 'Low Consistency'
  levelKey: 'high' | 'moderate' | 'uncertain' | 'low';
  outcome: MultimodalOutcome;
  recommendation: 'certified_credible' | 'manual_review_recommended' | 'inconclusive' | 'flagged_for_investigation';
  recommendationText: string;
  explanation: string;
  
  // Specific Multimodal Audit Dimensions
  supportingEvidence: string[];
  contradictingEvidence: string[];
  missingEvidence: string[];
  
  locationCheck: {
    status: 'matched' | 'approximate' | 'unverifiable' | 'discrepant';
    source: LocationSource;
    details: string;
    matchScore: number;
  };
  
  timeCheck: {
    status: TimeConsistencyStatus;
    details: string;
    deltaHours?: number;
    matchScore: number;
  };
  
  weatherCheck: {
    status: SignalStatus;
    details: string;
    condition: string;
    precipitationMm: number;
    matchScore: number;
  };
  
  mediaCheck: {
    status: 'verified_intact' | 'minor_anomalies' | 'metadata_stripped' | 'suspicious';
    itemsAnalyzed: number;
    imageIntegrity: string;
    videoConsistency?: string;
    audioCorroboration?: string;
  };
  
  aiFindings: string[];
  limitations: string[];
  
  signals: {
    visual: VerificationSignal;
    video?: VerificationSignal;
    audio?: VerificationSignal;
    weather: VerificationSignal;
    location: VerificationSignal;
    timestamp: VerificationSignal;
    integrity: VerificationSignal;
  };
  
  warnings: string[];
}

// Primary Flood Report Document
export interface FloodReport {
  id: string;
  userId: string;
  userEmail?: string;
  createdAt: string;
  updatedAt: string;
  evidenceTimestamp: string;
  status: VerificationStatus;
  title: string;
  description?: string;
  location: ReportLocation;
  temporalAnalysis?: TemporalAnalysis;
  
  // Primary Media Reference (backward compatibility)
  primaryImageUrl: string;
  primaryImagePublicId?: string;
  originalFileName?: string;
  fileType?: string;
  fileSizeBytes?: number;
  
  // Multimodal Evidence Collection (Images, Videos, Audio, Text)
  evidenceItems: MultimodalEvidenceItem[];
  
  // Legacy / Direct Analyses
  aiAnalysis?: GeminiVisualAnalysis;
  videoAnalysis?: VideoTemporalAnalysis;
  audioAnalysis?: AudioClaimExtraction;
  weatherVerification?: WeatherVerificationResult;
  
  // Synthesized Verification
  verification?: FloodprintVerificationResult;
  overallConfidenceScore?: number;
  verificationOutcome?: string;
  explanation?: string;
}

// User Profile
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role?: 'citizen' | 'responder' | 'verifier' | 'admin';
  createdAt: string;
}
