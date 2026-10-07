# Floodprint AI — Multi-Signal Disaster Evidence Verification Platform

web URL: https://floodprint-ai.vercel.app/

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-cyan.svg)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Gemini%20AI-1.5%20Flash-indigo.svg)](https://deepmind.google/technologies/gemini/)
[![Open-Meteo](https://img.shields.io/badge/Weather%20Archive-Open--Meteo-teal.svg)](https://open-meteo.com/)
[![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-orange.svg)](https://cloudinary.com/)
[![Firebase](https://img.shields.io/badge/Auth%20%26%20Database-Firestore-amber.svg)](https://firebase.google.com/)

> **"See the flood. Understand the evidence. Act faster."**  
> Floodprint is an automated disaster-evidence verification platform that combines **Gemini AI multimodal visual analysis**, **video motion dynamics**, **witness voice audio transcription**, **historical meteorological radar cross-referencing**, and **spatial/temporal telemetry** into a transparent, explainable **Floodprint Confidence Score** and audit-ready **Proof Chain**.

---

## 🌊 The Problem
During severe flood and climate disasters, emergency response coordinators, insurance adjusters, and civil protection teams face two critical challenges:
1. **Evidence Authenticity & Context**: Misleading, recycled, out-of-region, or misdated disaster imagery spreads rapidly, slowing down resource allocation.
2. **Lack of Corroborating Signals**: Photos alone lack context—without cross-referencing against verified meteorological conditions, coordinate boundaries, and visual water inundation markers, manual verification takes hours or days.

---

## ⚡ The Solution
Floodprint solves this with an end-to-end, multi-signal verification engine:
- **Multimodal Visual Evidence Analysis**: Evaluates water depth markers, surface turbulence, vehicle/infrastructure inundation, and digital manipulation indicators via Gemini AI.
- **Video Motion Dynamics**: Analyzes temporal fluid progression and motion consistency across sequential HTML5 sampled video frames.
- **Voice / Audio Witness Claims**: Ingests and transcribes voice notes via `MediaRecorder` to extract corroborating location references and flood observations.
- **EXIF Hardware Sensor Telemetry**: Extracts embedded camera GPS tags and capture dates directly via client-side sensor parser.
- **Historical Meteorological Cross-Referencing**: Queries Open-Meteo's historical archive API for precipitation, cloud cover, humidity, and wind speeds during the exact incident time window.
- **Dynamic Weight Synthesis**: Normalizes available evidence across forensic dimensions to compute a deterministic 0–100 **Floodprint Confidence Score**.
- **Interactive Spatial GIS**: Real-time Leaflet GIS mapping with dark theme overlays, coordinate pins, and location telemetry.
- **Immutable Proof Chain**: Maintains a chronological audit timeline tracking ingestion, storage vault refs, visual reasoning, weather observations, and assessment certification.

---

## 🏗️ Architecture & Verification Pipeline

```
                              [ SUBMITTED FLOOD EVIDENCE ]
                 (Photo / Video Frames / Voice Audio / Narrative)
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
      [ CLOUDINARY VAULT ]                           [ METADATA EXTRACTOR ]
   (Unaltered Media Storage)                     (EXIF GPS, Capture Time, Device)
                │                                             │
                ▼                                             ▼
    [ GEMINI 1.5 FLASH ]                           [ OPEN-METEO ARCHIVE ]
(Multimodal Vision, Video Motion,              (Historical Meteorological Radar:
 Audio Claims & Tampering Checks)              Precipitation, Cloud, Wind, Temp)
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       ▼
                   [ MULTI-SIGNAL SYNTHESIS ENGINE ]
               (Dynamic Normalized Weight Calculation)
               ├── Visual Evidence     (Base: 35%)
               ├── Historical Weather  (Base: 20%)
               ├── Video Motion        (Base: 15% if present)
               ├── Location Telemetry  (Base: 15%)
               ├── Voice Corroboration (Base: 10% if present)
               ├── Timestamp Alignment (Base: 10%)
               └── Media Integrity     (Base: 10%)
                                       │
                                       ▼
                    [ FLOODPRINT CONFIDENCE SCORE ]
                     (0–100 Explainable Assessment)
                                       │
                                       ▼
                    [ FORENSIC EVIDENCE REPORT ]
               (8-Stage Proof Chain & Transparent Audit)
```

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Leaflet / React-Leaflet, React Router v7.
- **Backend Service**: Node.js, Express, TypeScript (`NodeNext` ESM), CORS.
- **AI Engine**: Google `@google/generative-ai` SDK (`gemini-1.5-flash` with structured schema enforcement).
- **Meteorological Data**: Open-Meteo Historical Archive API (3-hour surrounding temporal window).
- **Database & Auth**: Google Cloud Firestore, Firebase Authentication.
- **Media Ingestion**: Cloudinary (encrypted media vault).

---

## 📊 Explainable Multi-Signal Engine

| Forensic Signal | Base Weight | Description |
| :--- | :---: | :--- |
| **Visual Evidence** | **35%** | Visual inundation markers, vehicle submersion, water depth indicators detected by Gemini AI. |
| **Weather Context** | **20%** | Precipitation rate, cloud cover, humidity, and wind speed during the incident window via Open-Meteo. |
| **Video Dynamics** | **15%** | Fluid surface turbulence and scene motion across extracted video frame sequences. |
| **Location Telemetry** | **15%** | Hardware EXIF GPS, browser device GPS, and coordinate bounds verification. |
| **Voice Audio Claims** | **10%** | Transcribed witness statements and extracted location/landmark claims. |
| **Timestamp Alignment** | **10%** | Temporal delta analysis between claimed occurrence, EXIF capture date, and registration time. |
| **Media Integrity** | **10%** | Compression anomalies, digital artifacts, and visual manipulation risk assessment. |

*Note: If any telemetry signal has insufficient data, its weight is automatically zeroed and remaining active weights are normalized to sum to 100%.*

---

## 🔒 Security & Privacy

1. **Zero Client-Side Secrets**: Gemini API keys and cloud credentials reside exclusively on the backend server.
2. **Strict Firestore Rules**: Read/write access is restricted to authenticated owners and verified personnel.
3. **Graceful Fallbacks**: If external meteorological services experience outages, the synthesis engine gracefully handles missing signals without crashing.
4. **Transparent Disclaimers**: Weather and AI analyses are presented as supporting forensic signals and not definitive fraud accusations.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+
- NPM

### 2. Installation
```bash
# Clone repository
git clone https://github.com/varap/Floodprint-ai.git
cd Floodprint-ai

# Install dependencies
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in `GEMINI_API_KEY`, `VITE_CLOUDINARY_CLOUD_NAME`, and Firebase credentials (or use demo mode).

### 4. Run Development Server
```bash
# Start backend API (Port 3001) and Vite frontend (Port 5173) concurrently
npm run dev
```

### 5. Production Build & Typecheck
```bash
npm run typecheck
npm run build
npm run build:server
```

---

## 👥 Hackathon Demo Path (30-Second Quick Walkthrough)

1. **Evidence Command Center**: Visit `/` to see operational metrics, live environmental radar banner, interactive GIS preview, and the recent investigations queue.
2. **Command Palette**: Press `Ctrl+K` or click the search bar to jump to cases, pages, or search records.
3. **Submit Multimodal Evidence**: Click `+ Ingest Evidence` to upload photo/video or record a live witness voice statement. Notice auto-populated EXIF tags and browser GPS.
4. **Inspect Forensic Dossier**: Open any case to view the **3-Panel Workspace**:
   - **Left**: Media Vault & EXIF Sensor Telemetry.
   - **Center**: Gemini Vision & Explanations, Temporal Clock Delta Check, and Corroboration Audit.
   - **Right**: Interactive GIS Map & Open-Meteo Historical Radar Context.
   - **Bottom**: Expandable mathematical score weight breakdown table (**Why This Score?**).
