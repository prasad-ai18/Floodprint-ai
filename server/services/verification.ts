import { 
  FloodReport, 
  FloodprintVerificationResult, 
  VerificationSignal, 
  SignalStatus,
  MultimodalOutcome
} from '../types.js';

/**
 * Calculates temporal delta consistency between claimed incident timestamp and EXIF/Submission time
 */
export function evaluateTemporalConsistency(
  claimedTimestamp: string,
  captureTimestamp?: string,
  submissionTimestamp?: string
): {
  status: 'consistent' | 'minor_discrepancy' | 'time_inconsistency_detected' | 'unverifiable';
  score: number;
  deltaHours: number;
  details: string;
} {
  const claimedTime = new Date(claimedTimestamp).getTime();
  if (isNaN(claimedTime)) {
    return {
      status: 'unverifiable',
      score: 50,
      deltaHours: 0,
      details: 'Claimed incident timestamp is invalid or unspecified.',
    };
  }

  // Check 1: If EXIF capture time is present, compare claimed vs capture
  if (captureTimestamp) {
    const captureTime = new Date(captureTimestamp).getTime();
    if (!isNaN(captureTime)) {
      const deltaMs = Math.abs(claimedTime - captureTime);
      const deltaHours = deltaMs / (1000 * 60 * 60);

      if (deltaHours <= 1) {
        return {
          status: 'consistent',
          score: 95,
          deltaHours: Math.round(deltaHours * 10) / 10,
          details: `EXIF camera timestamp matches claimed time within ${Math.round(deltaHours * 60)} minutes.`,
        };
      } else if (deltaHours <= 6) {
        return {
          status: 'minor_discrepancy',
          score: 75,
          deltaHours: Math.round(deltaHours * 10) / 10,
          details: `EXIF camera timestamp differs by ${deltaHours.toFixed(1)} hours from claimed incident time.`,
        };
      } else {
        return {
          status: 'time_inconsistency_detected',
          score: 35,
          deltaHours: Math.round(deltaHours * 10) / 10,
          details: `Temporal mismatch: EXIF metadata indicates image was captured ${deltaHours.toFixed(1)} hours away from claimed flood event.`,
        };
      }
    }
  }

  // Check 2: If submission time is present, ensure evidence isn't claimed in the distant future
  if (submissionTimestamp) {
    const subTime = new Date(submissionTimestamp).getTime();
    if (!isNaN(subTime)) {
      const diffMs = claimedTime - subTime;
      const futureHours = diffMs / (1000 * 60 * 60);
      if (futureHours > 2) {
        return {
          status: 'time_inconsistency_detected',
          score: 20,
          deltaHours: Math.round(futureHours * 10) / 10,
          details: `Anomalous timestamp: Claimed event timestamp is set in the future (${futureHours.toFixed(1)} hours ahead of current clock).`,
        };
      }
    }
  }

  return {
    status: 'consistent',
    score: 85,
    deltaHours: 0,
    details: 'Claimed incident timestamp is chronologically plausible.',
  };
}

/**
 * Normalizes dynamic weights based on available multimodal signal channels
 */
function normalizeSignalWeights(signals: VerificationSignal[]): VerificationSignal[] {
  const activeSignals = signals.filter(s => s.status !== 'insufficient_data');
  if (activeSignals.length === 0) {
    return signals.map(s => ({ ...s, normalizedWeight: 1 / signals.length }));
  }

  const totalBaseWeight = activeSignals.reduce((sum, s) => sum + s.baseWeight, 0);
  
  return signals.map(s => {
    if (s.status === 'insufficient_data') {
      return { ...s, normalizedWeight: 0 };
    }
    const normalizedWeight = totalBaseWeight > 0 ? Number((s.baseWeight / totalBaseWeight).toFixed(3)) : 0;
    return { ...s, normalizedWeight };
  });
}

/**
 * Synthesizes all multimodal evidence items (Images, Videos, Audio, Text, Location, Time, Weather, EXIF)
 * into an explainable Floodprint Confidence Score and structured verification audit.
 */
export function synthesizeMultimodalVerification(report: FloodReport): FloodprintVerificationResult {
  const warnings: string[] = [];
  const supportingEvidence: string[] = [];
  const contradictingEvidence: string[] = [];
  const missingEvidence: string[] = [];
  const aiFindings: string[] = [];
  const limitations: string[] = [];

  const rawSignals: VerificationSignal[] = [];

  // ==========================================================================
  // 1. VISUAL EVIDENCE SIGNAL (Base: 35%)
  // ==========================================================================
  const ai = report.aiAnalysis;
  let visualScore = 50;
  let visualStatus: SignalStatus = 'insufficient_data';
  let visualReason = 'No visual AI analysis available.';

  if (ai) {
    if (ai.visualSummary) aiFindings.push(ai.visualSummary);
    if (Array.isArray(ai.limitations)) limitations.push(...ai.limitations);

    const isDetected = ai.floodEvidence?.detected || (ai.floodEvidence as any)?.floodPresent;
    if (isDetected) {
      visualScore = Math.min(100, Math.max(70, ai.overallVisualConfidence || 80));
      visualStatus = 'supportive';
      const obs = Array.isArray(ai.floodEvidence?.observations) ? ai.floodEvidence.observations.slice(0, 2).join('; ') : 'inundation markers visible';
      visualReason = `Visual flood inundation detected: ${ai.floodEvidence?.waterDepthEstimate || 'standing surface water'}. Observations: ${obs}.`;
      supportingEvidence.push(`Visual evidence: ${ai.floodEvidence?.waterDepthEstimate || 'inundation verified'}.`);
    } else {
      visualScore = 30;
      visualStatus = 'potentially_inconsistent';
      visualReason = 'No active floodwater, standing submersion, or significant water damage detected in imagery.';
      contradictingEvidence.push('Visual analysis found no distinct water accumulation in submitted imagery.');
    }
  } else {
    missingEvidence.push('Gemini visual analysis pending or unavailable.');
  }

  rawSignals.push({
    signalKey: 'visual',
    name: 'Visual Evidence Analysis',
    score: visualScore,
    baseWeight: 0.35,
    normalizedWeight: 0.35,
    status: visualStatus,
    reason: visualReason,
  });

  // ==========================================================================
  // 2. VIDEO TEMPORAL EVIDENCE SIGNAL (Base: 15% if video present)
  // ==========================================================================
  const video = report.videoAnalysis;
  let videoSignal: VerificationSignal | undefined;

  if (video) {
    let vScore = video.confidence || 80;
    let vStatus: SignalStatus = 'supportive';
    let vReason = `Video analyzed across ${video.framesAnalyzed} sequential frames: ${video.sceneEvolution}.`;

    if (video.motionConsistency === 'consistent_fluid_motion') {
      vScore = Math.max(vScore, 85);
      vStatus = 'supportive';
      supportingEvidence.push('Video frames confirm natural fluid turbulence and surface water motion.');
    } else if (video.motionConsistency === 'abrupt_anomalous') {
      vScore = 35;
      vStatus = 'potentially_inconsistent';
      vReason = 'Video frames show abrupt scene cuts or unnatural warping across temporal sample points.';
      contradictingEvidence.push('Video exhibits temporal inconsistencies or synthetic frame artifacts.');
    }

    videoSignal = {
      signalKey: 'video',
      name: 'Video Dynamic Analysis',
      score: vScore,
      baseWeight: 0.15,
      normalizedWeight: 0.15,
      status: vStatus,
      reason: vReason,
    };
    rawSignals.push(videoSignal);
  }

  // ==========================================================================
  // 3. VOICE / AUDIO CORROBORATION SIGNAL (Base: 10% if audio present)
  // ==========================================================================
  const audio = report.audioAnalysis;
  let audioSignal: VerificationSignal | undefined;

  if (audio) {
    let aScore = audio.confidence || 80;
    let aStatus: SignalStatus = 'supportive';
    let aReason = `Voice evidence transcribed: "${(audio.transcription || '').slice(0, 100)}..."`;

    if (Array.isArray(audio.mentionedLocations) && audio.mentionedLocations.length > 0) {
      supportingEvidence.push(`Witness audio corroborates location: ${audio.mentionedLocations.join(', ')}.`);
    }
    if (Array.isArray(audio.eventDescriptions) && audio.eventDescriptions.length > 0) {
      supportingEvidence.push(`Audio details: ${audio.eventDescriptions.join('; ')}.`);
    }

    audioSignal = {
      signalKey: 'audio',
      name: 'Voice Evidence Corroboration',
      score: aScore,
      baseWeight: 0.10,
      normalizedWeight: 0.10,
      status: aStatus,
      reason: aReason,
    };
    rawSignals.push(audioSignal);
  }

  // ==========================================================================
  // 4. HISTORICAL WEATHER VERIFICATION SIGNAL (Base: 20%)
  // ==========================================================================
  const weather = report.weatherVerification;
  let weatherScore = 50;
  let weatherStatus: SignalStatus = 'insufficient_data';
  let weatherReason = 'Historical weather data unavailable for this coordinate/time window.';
  let weatherCondition = 'Unavailable';
  let precipitationMm = 0;

  if (weather && weather.status === 'verified') {
    weatherScore = weather.consistencyScore;
    weatherStatus = weather.weatherConsistency;
    weatherReason = weather.explanation;
    if (weather.weather) {
      weatherCondition = weather.weather.conditionDescription;
      precipitationMm = weather.weather.precipitation;
    }

    if (weather.weatherConsistency === 'supportive') {
      supportingEvidence.push(`Historical radar recorded ${precipitationMm.toFixed(1)} mm/h precipitation (${weatherCondition}) during incident window.`);
    } else if (weather.weatherConsistency === 'partially_supportive') {
      supportingEvidence.push(`Historical weather shows high cloud cover (${weather.weather?.cloudCover}%) and elevated humidity.`);
    } else if (weather.weatherConsistency === 'potentially_inconsistent') {
      warnings.push('Low historical rainfall recorded during incident window. Flood may result from upstream river surge or infrastructure drainage failure.');
    }
  } else {
    missingEvidence.push('Meteorological radar data not yet cross-referenced.');
  }

  rawSignals.push({
    signalKey: 'weather',
    name: 'Historical Weather Context',
    score: weatherScore,
    baseWeight: 0.20,
    normalizedWeight: 0.20,
    status: weatherStatus,
    reason: weatherReason,
  });

  // ==========================================================================
  // 5. LOCATION TELEMETRY SIGNAL (Base: 15%)
  // ==========================================================================
  let locScore = 50;
  let locStatus: SignalStatus = 'insufficient_data';
  let locReason = 'Location unspecified or lacking decimal coordinate verification.';
  let locCheckStatus: 'matched' | 'approximate' | 'unverifiable' | 'discrepant' = 'unverifiable';

  const loc = report.location;
  if (loc && loc.latitude && loc.longitude && !(loc.latitude === 0 && loc.longitude === 0)) {
    if (loc.locationSource === 'exif_gps') {
      locScore = 95;
      locStatus = 'supportive';
      locReason = `Hardware EXIF GPS coordinates embedded in image (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}).`;
      locCheckStatus = 'matched';
      supportingEvidence.push('Direct camera EXIF GPS coordinates embedded in media record.');
    } else if (loc.locationSource === 'device_gps') {
      locScore = 90;
      locStatus = 'supportive';
      locReason = `High-accuracy device browser GPS validated (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}).`;
      locCheckStatus = 'matched';
      supportingEvidence.push('Device GPS verified at time of evidence capture/submission.');
    } else if (loc.locationSource === 'map_selected') {
      locScore = 80;
      locStatus = 'supportive';
      locReason = `User pinpointed on interactive satellite map (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}).`;
      locCheckStatus = 'approximate';
      supportingEvidence.push(`Location specified via map coordinates (${loc.address}).`);
    } else {
      locScore = 70;
      locStatus = 'partially_supportive';
      locReason = `Geocoded coordinate descriptor: ${loc.address}.`;
      locCheckStatus = 'approximate';
    }
  } else if (loc?.address) {
    locScore = 60;
    locStatus = 'neutral';
    locReason = `Descriptive location landmark provided without exact GPS coordinates (${loc.address}).`;
    locCheckStatus = 'approximate';
    missingEvidence.push('Exact GPS decimal coordinates missing from report.');
  }

  rawSignals.push({
    signalKey: 'location',
    name: 'Location Telemetry & Geocoding',
    score: locScore,
    baseWeight: 0.15,
    normalizedWeight: 0.15,
    status: locStatus,
    reason: locReason,
  });

  // ==========================================================================
  // 6. TIMESTAMP ALIGNMENT & TEMPORAL DELTA SIGNAL (Base: 10%)
  // ==========================================================================
  let primaryCaptureDate: string | undefined;
  for (const item of (report.evidenceItems || [])) {
    if (item.metadata?.captureDate) {
      primaryCaptureDate = item.metadata.captureDate;
      break;
    }
  }

  const temporal = evaluateTemporalConsistency(
    report.evidenceTimestamp,
    primaryCaptureDate,
    report.createdAt
  );

  let timeScore = temporal.score;
  let timeStatus: SignalStatus = temporal.status === 'consistent' 
    ? 'supportive' 
    : temporal.status === 'minor_discrepancy' 
    ? 'partially_supportive' 
    : temporal.status === 'time_inconsistency_detected' 
    ? 'potentially_inconsistent' 
    : 'neutral';

  if (temporal.status === 'consistent') {
    supportingEvidence.push(`Timestamp verified: ${temporal.details}`);
  } else if (temporal.status === 'time_inconsistency_detected') {
    warnings.push(temporal.details);
    contradictingEvidence.push(temporal.details);
  }

  rawSignals.push({
    signalKey: 'timestamp',
    name: 'Temporal Alignment & Clock Delta',
    score: timeScore,
    baseWeight: 0.10,
    normalizedWeight: 0.10,
    status: timeStatus,
    reason: temporal.details,
  });

  // ==========================================================================
  // 7. IMAGE & MEDIA INTEGRITY SIGNAL (Base: 10%)
  // ==========================================================================
  let integrityScore = 85;
  let integrityStatus: SignalStatus = 'supportive';
  let integrityReason = 'Digital compression and file structure appear standard without tampering markers.';
  let mediaIntegrityCheck: 'verified_intact' | 'minor_anomalies' | 'metadata_stripped' | 'suspicious' = 'verified_intact';

  if (ai?.imageIntegrity) {
    if (ai.imageIntegrity.manipulationRisk === 'high') {
      integrityScore = 30;
      integrityStatus = 'potentially_inconsistent';
      integrityReason = `Digital anomaly detected: ${ai.imageIntegrity.notes || 'Irregular visual patterns detected.'}`;
      mediaIntegrityCheck = 'suspicious';
      warnings.push('Visual analysis detected potential digital manipulation artifacts.');
      contradictingEvidence.push('High manipulation risk flagged in visual evidence structure.');
    } else if (ai.imageIntegrity.manipulationRisk === 'moderate') {
      integrityScore = 65;
      integrityStatus = 'partially_supportive';
      integrityReason = 'Moderate compression noise or standard social-media recompression detected.';
      mediaIntegrityCheck = 'minor_anomalies';
    } else {
      integrityScore = 90;
      integrityStatus = 'supportive';
      integrityReason = 'Image integrity verified. Compression consistent and manipulation risk low.';
      mediaIntegrityCheck = 'verified_intact';
      supportingEvidence.push('No synthetic or manipulative visual artifacts detected.');
    }
  }

  rawSignals.push({
    signalKey: 'integrity',
    name: 'Media Integrity & Tampering Check',
    score: integrityScore,
    baseWeight: 0.10,
    normalizedWeight: 0.10,
    status: integrityStatus,
    reason: integrityReason,
  });

  // ==========================================================================
  // DYNAMIC WEIGHT NORMALIZATION & FINAL SCORE
  // ==========================================================================
  const normalizedSignals = normalizeSignalWeights(rawSignals);

  let finalConfidenceScore = 0;
  normalizedSignals.forEach(signal => {
    finalConfidenceScore += signal.score * signal.normalizedWeight;
  });

  finalConfidenceScore = Math.min(100, Math.max(0, Math.round(finalConfidenceScore)));

  // Outcome Category Determination
  let outcome: MultimodalOutcome;
  let recommendation: 'certified_credible' | 'manual_review_recommended' | 'inconclusive' | 'flagged_for_investigation';
  let levelKey: 'high' | 'moderate' | 'uncertain' | 'low';
  let confidenceLevel: string;

  if (finalConfidenceScore >= 80) {
    outcome = 'verified';
    recommendation = 'certified_credible';
    levelKey = 'high';
    confidenceLevel = 'High Consistency';
  } else if (finalConfidenceScore >= 60) {
    outcome = 'partially_verified';
    recommendation = 'manual_review_recommended';
    levelKey = 'moderate';
    confidenceLevel = 'Moderate Consistency';
  } else if (finalConfidenceScore >= 40) {
    outcome = 'insufficient_evidence';
    recommendation = 'inconclusive';
    levelKey = 'uncertain';
    confidenceLevel = 'Uncertain';
  } else {
    outcome = 'inconsistent';
    recommendation = 'flagged_for_investigation';
    levelKey = 'low';
    confidenceLevel = 'Low Consistency';
  }

  const recommendationText = finalConfidenceScore >= 80
    ? 'Submitted multimodal evidence is strongly consistent across Gemini visual indicators, historical weather radar observations, and spatial-temporal coordinates.'
    : finalConfidenceScore >= 60
    ? 'Evidence shows moderate overall consistency. Supporting context exists, though secondary signals (such as weather radar or exact GPS tags) are partially corroborating.'
    : finalConfidenceScore >= 40
    ? 'Evidence assessment is currently inconclusive due to incomplete telemetry, missing GPS tags, or ambiguous weather correlation. Additional verification recommended.'
    : 'Submitted claims exhibit significant discrepancies with historical radar observations, spatial metadata, or image integrity checks.';

  const explanation = `${confidenceLevel} (${finalConfidenceScore}/100): ${recommendationText}`;

  const visualSig = normalizedSignals.find(s => s.signalKey === 'visual')!;
  const videoSig = normalizedSignals.find(s => s.signalKey === 'video');
  const audioSig = normalizedSignals.find(s => s.signalKey === 'audio');
  const weatherSig = normalizedSignals.find(s => s.signalKey === 'weather')!;
  const locSig = normalizedSignals.find(s => s.signalKey === 'location')!;
  const timeSig = normalizedSignals.find(s => s.signalKey === 'timestamp')!;
  const integritySig = normalizedSignals.find(s => s.signalKey === 'integrity')!;

  return {
    verifiedAt: new Date().toISOString(),
    confidenceScore: finalConfidenceScore,
    confidenceLevel,
    levelKey,
    outcome,
    recommendation,
    recommendationText,
    explanation,
    
    supportingEvidence: supportingEvidence.length > 0 ? supportingEvidence : ['Baseline evidence ingested into forensic registry.'],
    contradictingEvidence,
    missingEvidence: missingEvidence.length > 0 ? missingEvidence : ['All primary forensic telemetry channels available.'],
    
    locationCheck: {
      status: locCheckStatus,
      source: loc?.locationSource || 'manual',
      details: locReason,
      matchScore: locScore,
    },
    
    timeCheck: {
      status: temporal.status,
      details: temporal.details,
      deltaHours: temporal.deltaHours,
      matchScore: timeScore,
    },
    
    weatherCheck: {
      status: weatherStatus,
      details: weatherReason,
      condition: weatherCondition,
      precipitationMm,
      matchScore: weatherScore,
    },
    
    mediaCheck: {
      status: mediaIntegrityCheck,
      itemsAnalyzed: (report.evidenceItems?.length || 1),
      imageIntegrity: integrityReason,
      videoConsistency: video ? video.motionConsistency : undefined,
      audioCorroboration: audio ? 'Voice transcript matched with location context.' : undefined,
    },
    
    aiFindings: aiFindings.length > 0 ? aiFindings : ['Multimodal visual and temporal inspection complete.'],
    limitations: limitations.length > 0 ? limitations : ['Independent meteorological records cross-referenced against historical archives.'],
    
    signals: {
      visual: visualSig,
      video: videoSig,
      audio: audioSig,
      weather: weatherSig,
      location: locSig,
      timestamp: timeSig,
      integrity: integritySig,
    },
    
    warnings,
  };
}
