import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { 
  analyzeFloodImage, 
  analyzeVideoSequence, 
  analyzeAudioEvidence, 
  extractStructuredDocumentIntelligence,
  chatWithEvidenceAI,
  isGeminiConfigured 
} from './services/gemini.js';
import { crossVerifyWeather } from './services/weather.js';
import { synthesizeMultimodalVerification } from './services/verification.js';
import { FloodReport } from './types.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Increase body limit to support base64 audio/video frame sequences and documents
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      geminiConfigured: isGeminiConfigured,
      cloudinaryConfigured: Boolean(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
      openMeteo: true,
      verificationEngine: true,
      aiChatbot: true,
      documentIntelligence: true,
      multimodal: {
        image: true,
        video: true,
        audio: true,
        document: true,
        location: true,
        temporal: true,
      },
    },
  });
});

// 1. Interactive AI Evidence Assistant (Chatbot) Endpoint
app.post('/api/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messages, evidenceContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Array of chat "messages" is required.' });
      return;
    }

    const response = await chatWithEvidenceAI(messages, evidenceContext || {});
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// 2. Structured Document & Messy Evidence Extraction Endpoint
app.post('/api/document/extract', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rawContent, metadata } = req.body;

    if (!rawContent) {
      res.status(400).json({ error: 'rawContent (text or document dump) is required.' });
      return;
    }

    const extraction = await extractStructuredDocumentIntelligence(rawContent, metadata);
    res.json(extraction);
  } catch (error) {
    next(error);
  }
});

// 3. Gemini Vision Image Analysis Endpoint
app.post('/api/gemini/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageUrl, location, timestamp } = req.body;

    if (!imageUrl) {
      res.status(400).json({ error: 'imageUrl is required for visual evidence analysis.' });
      return;
    }

    const analysis = await analyzeFloodImage(imageUrl, { location, timestamp });
    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

// 4. Gemini Video Sequence Analysis Endpoint
app.post('/api/gemini/analyze-video', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { frames, durationSeconds, location, timestamp } = req.body;

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      res.status(400).json({ error: 'Array of base64 frame images is required for video analysis.' });
      return;
    }

    const analysis = await analyzeVideoSequence(frames, durationSeconds, { location, timestamp });
    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

// 5. Gemini Audio / Voice Transcription & Claim Extraction Endpoint
app.post('/api/gemini/analyze-audio', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { audioContent, isTranscriptText, location, timestamp } = req.body;

    if (!audioContent) {
      res.status(400).json({ error: 'audioContent (base64 audio or text) is required.' });
      return;
    }

    const analysis = await analyzeAudioEvidence(audioContent, Boolean(isTranscriptText), { location, timestamp });
    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

// 6. Historical Weather Verification Endpoint
app.post('/api/weather/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, timestamp, address } = req.body;

    if (latitude === undefined || longitude === undefined || !timestamp) {
      res.status(400).json({ error: 'latitude, longitude, and timestamp are required for weather verification.' });
      return;
    }

    const weather = await crossVerifyWeather(Number(latitude), Number(longitude), timestamp, address);
    res.json(weather);
  } catch (error) {
    next(error);
  }
});

// 7. Multimodal Verification Synthesis Endpoint
app.post('/api/verify/synthesize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { report } = req.body;

    if (!report) {
      res.status(400).json({ error: '"report" object is required for multimodal verification synthesis.' });
      return;
    }

    const result = synthesizeMultimodalVerification(report as FloodReport);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Centralized Error Handling Middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API Error:', err.message);
  res.status(500).json({
    error: err.message || 'An internal error occurred during verification processing.',
  });
});

app.listen(PORT, () => {
  console.log(`Floodprint AI Evidence Intelligence API Server running on port ${PORT}`);
});
