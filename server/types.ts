// ============================================================================
// SERVER TYPES — FLOODPRINT AI MULTIMODAL VERIFICATION
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

export interface AudioClaimExtraction {
  transcription: string;
  mentionedLocations: string[];
  mentionedTimes: string[];
  eventDescriptions: string[];
  confidence: number;
}

export interface MultimodalEvidenceItem {
  id: string;
  type: EvidenceType;
  url?: string;
  publicId?: string;
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  content?: string;
  capturedAt?: string;
  uploadedAt: string;
  metadata?: EvidenceMetadata;
  frames?: string[];
  transcription?: string;
  claims?: AudioClaimExtraction;
  aiObservation?: string;
}

export interface ReportLocation {
  address: string;
  latitude: number;
  longitude: number;
  locationSource: LocationSource;
  accuracyMeters?: number;
  confidence?: 'high' | 'moderate' | 'low' | 'unverified';
}

export interface TemporalAnalysis {
  claimedEventTime: string;
  mediaCaptureTime?: string;
  uploadTime: string;
  weatherObservationTime?: string;
  timeDeltaHours?: number;
  status: TimeConsistencyStatus;
  explanation: string;
}

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

export interface VideoTemporalAnalysis {
  framesAnalyzed: number;
  durationSeconds?: number;
  motionConsistency: 'consistent_fluid_motion' | 'abrupt_anomalous' | 'static';
  sceneEvolution: string;
  waterRiseObserved: boolean;
  observations: string[];
  confidence: number;
}

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

export interface VerificationSignal {
  signalKey: 'visual' | 'video' | 'audio' | 'weather' | 'location' | 'timestamp' | 'integrity';
  name: string;
  score: number;
  baseWeight: number;
  normalizedWeight: number;
  status: SignalStatus;
  reason: string;
}

export interface FloodprintVerificationResult {
  verifiedAt: string;
  confidenceScore: number;
  confidenceLevel: string;
  levelKey: 'high' | 'moderate' | 'uncertain' | 'low';
  outcome: MultimodalOutcome;
  recommendation: 'certified_credible' | 'manual_review_recommended' | 'inconclusive' | 'flagged_for_investigation';
  recommendationText: string;
  explanation: string;
  
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
  
  primaryImageUrl: string;
  primaryImagePublicId?: string;
  originalFileName?: string;
  fileType?: string;
  fileSizeBytes?: number;
  
  evidenceItems: MultimodalEvidenceItem[];
  
  aiAnalysis?: GeminiVisualAnalysis;
  videoAnalysis?: VideoTemporalAnalysis;
  audioAnalysis?: AudioClaimExtraction;
  weatherVerification?: WeatherVerificationResult;
  
  verification?: FloodprintVerificationResult;
  overallConfidenceScore?: number;
  verificationOutcome?: string;
  explanation?: string;
}
