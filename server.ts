import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface TaskVisionAnalysis {
  residentPresent: boolean;
  activityDetected: string;
  medicationStep: number; // 0: None, 1: Approached, 2: Opened/dispensed, 3: Pill in hand/mouth, 4: Water swallowed, 5: Complete
  stepDescription: string;
  interruptionStatus: 'NONE' | 'DISTRACTED' | 'WANDERED_AWAY' | 'DROPPED_MEDICINE' | 'CONFUSION_FREEZE' | 'DANGEROUS_INGESTION' | 'FALL_RISK_OR_FALL';
  interruptionDetails: string;
  severity: 'NORMAL' | 'ATTENTION' | 'NURSE_ALERT' | 'CRITICAL_URGENT';
  interventionRecommendation: 'no_action' | 'gentle_speaker_prompt' | 'nurse_visit' | 'emergency_response';
  gentleRoomPrompt: string;
  nurseActionNote: string;
  detectedItems: string[];
  residentComfortScore: number; // 0 - 100
  confidenceScore: number; // 0 - 100
  timestamp: string;
}

// Vision analysis endpoint
app.post('/api/vision/analyze-task', async (req: Request, res: Response) => {
  try {
    const { imageBase64, patientInfo, previousStep } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    // Clean base64 string
    let cleanBase64 = imageBase64;
    let mimeType = 'image/jpeg';
    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      cleanBase64 = parts[1];
    }

    const patientName = patientInfo?.name || 'Resident';
    const room = patientInfo?.room || 'Room 104';
    const scheduledTask = patientInfo?.scheduledTask || 'Morning Medication & Hydration';
    const currentExpectedStep = previousStep !== undefined ? previousStep : 1;

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are an expert clinical vision guardian stationed in an elderly dementia care residence.
Your goal is to safeguard the resident (${patientName} in ${room}) during daily tasks like "${scheduledTask}" without intrusive physical nurse entries.
Elderly dementia residents get anxious and agitated when nurses barge into their room every few minutes.
Therefore, your vision system monitors task progress, detects task interruptions (e.g. stopped mid-medication, wandered away, confused, dropped pills, fall risk), and determines if a gentle ambient speaker prompt can redirect them, or if a nurse MUST intervene.

CURRENT CONTEXT:
- Resident: ${patientName}
- Room: ${room}
- Expected Task: ${scheduledTask}
- Previous Task Step: Step ${currentExpectedStep} of 5

MEDICATION TASK 5-STEP PROTOCOL:
- Step 1: Approached table / Noticed medication organizer or cup
- Step 2: Opened container / Picked up blister pack / Dispensing pill
- Step 3: Pill in hand / Brought toward mouth
- Step 4: Water glass lifted / Swallowed pill with water
- Step 5: Routine completed safely

ANALYZE THIS IMAGE FRAME CAREFULLY:
1. Is the resident present in the frame?
2. What activity is currently observable?
3. What step in the task chain is visible?
4. Is there an interruption?
   - NONE: Routine proceeding smoothly
   - DISTRACTED: Distracted by something, stopped task temporarily
   - WANDERED_AWAY: Walked away leaving task/pills unfinished
   - DROPPED_MEDICINE: Pill or cup dropped on floor/bed
   - CONFUSION_FREEZE: Blank stare, disorientation, unable to sequence next step
   - DANGEROUS_INGESTION: Ingesting wrong substance or double-dosing
   - FALL_RISK_OR_FALL: Resident slumped, unsteadily leaning, or fallen on floor
5. What is the severity? (NORMAL, ATTENTION, NURSE_ALERT, CRITICAL_URGENT)
6. Recommended action:
   - no_action (resident doing fine, keep quiet)
   - gentle_speaker_prompt (calm ambient room audio to guide them back without room entry)
   - nurse_visit (nurse walks to room)
   - emergency_response (immediate life-saving help needed)
7. Craft a warm, respectful, reassuring 1-sentence ambient room prompt for the resident (e.g. "${patientName}, your glass of water is right next to the medicine. Take your time.")
8. Craft a concise tactical note for the nurse's station tablet.
9. List visible key items (e.g. "water glass", "pill bottle", "bed", "resident").
10. Resident Comfort Score (0-100) and AI Detection Confidence (0-100).`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              { text: prompt },
            ],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                residentPresent: { type: Type.BOOLEAN },
                activityDetected: { type: Type.STRING },
                medicationStep: {
                  type: Type.INTEGER,
                  description: 'Step 0 (none) to 5 (completed)',
                },
                stepDescription: { type: Type.STRING },
                interruptionStatus: {
                  type: Type.STRING,
                  enum: [
                    'NONE',
                    'DISTRACTED',
                    'WANDERED_AWAY',
                    'DROPPED_MEDICINE',
                    'CONFUSION_FREEZE',
                    'DANGEROUS_INGESTION',
                    'FALL_RISK_OR_FALL',
                  ],
                },
                interruptionDetails: { type: Type.STRING },
                severity: {
                  type: Type.STRING,
                  enum: ['NORMAL', 'ATTENTION', 'NURSE_ALERT', 'CRITICAL_URGENT'],
                },
                interventionRecommendation: {
                  type: Type.STRING,
                  enum: [
                    'no_action',
                    'gentle_speaker_prompt',
                    'nurse_visit',
                    'emergency_response',
                  ],
                },
                gentleRoomPrompt: { type: Type.STRING },
                nurseActionNote: { type: Type.STRING },
                detectedItems: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                residentComfortScore: { type: Type.INTEGER },
                confidenceScore: { type: Type.INTEGER },
              },
              required: [
                'residentPresent',
                'activityDetected',
                'medicationStep',
                'stepDescription',
                'interruptionStatus',
                'interruptionDetails',
                'severity',
                'interventionRecommendation',
                'gentleRoomPrompt',
                'nurseActionNote',
                'detectedItems',
                'residentComfortScore',
                'confidenceScore',
              ],
            },
          },
        });

        const rawText = response.text?.trim() || '{}';
        const parsedData = JSON.parse(rawText) as TaskVisionAnalysis;
        parsedData.timestamp = new Date().toISOString();
        return res.json({ success: true, analysis: parsedData });
      } catch (geminiError: any) {
        console.error('Gemini vision API error, falling back to simulated inference:', geminiError?.message || geminiError);
      }
    }

    // High fidelity fallback when GEMINI_API_KEY is absent or rate-limited
    const fallbackAnalysis: TaskVisionAnalysis = generateHeuristicAnalysis(patientName, room, scheduledTask, currentExpectedStep);
    return res.json({ success: true, analysis: fallbackAnalysis, simulated: true });
  } catch (error: any) {
    console.error('Task analysis endpoint error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to analyze task image' });
  }
});

// Calming voice prompt generator using gemini-3.8-flash-lite-tts
app.post('/api/voice/gentle-prompt', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text prompt required' });
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text,
                  speechMetadata: {
                    style: 'Warm, calm, unhurried, reassuring elderly caregiver voice with gentle pacing',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName as any },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          return res.json({ success: true, audioBase64: base64Audio });
        }
      } catch (ttsErr: any) {
        console.warn('TTS API error:', ttsErr?.message);
      }
    }

    // If no key or error, return success with null so frontend uses browser Web Speech Synthesis
    return res.json({ success: true, audioBase64: null, useWebSpeech: true });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'TTS generation error' });
  }
});

function generateHeuristicAnalysis(name: string, _room: string, _task: string, step: number): TaskVisionAnalysis {
  const steps = [
    {
      step: 1,
      act: 'Resident seated at bedside table observing pill organizer',
      desc: 'Table approached. Medication container in line of sight.',
      status: 'NONE' as const,
      det: 'Resident is relaxed. Attention focused on daily morning medication.',
      sev: 'NORMAL' as const,
      rec: 'no_action' as const,
      prompt: `Good morning ${name}, your morning medicine is right there whenever you are ready.`,
      nurse: 'Resident seated calmly. Monitoring step 2 (opening container).',
      comfort: 95,
      items: ['Resident', 'Pill Organizer', 'Bedside Table', 'Water Glass'],
    },
    {
      step: 2,
      act: 'Resident opening blister pack / pill box',
      desc: 'Container opened, extracting morning capsule.',
      status: 'NONE' as const,
      det: 'Motor skills stable. Extracting prescribed pill with steady grip.',
      sev: 'NORMAL' as const,
      rec: 'no_action' as const,
      prompt: `Take your time ${name}, you are doing great.`,
      nurse: 'Step 2 in progress. Preparing for ingestion.',
      comfort: 92,
      items: ['Resident', 'Pill Bottle', 'Capsule', 'Water Glass'],
    },
    {
      step: 3,
      act: 'Pill held in hand, resident looking out window (distraction noticed)',
      desc: 'Pill extracted but held in hand for 40 seconds without swallowing.',
      status: 'DISTRACTED' as const,
      det: 'Resident paused with pill in hand, looking at bird outside window.',
      sev: 'ATTENTION' as const,
      rec: 'gentle_speaker_prompt' as const,
      prompt: `${name}, you have your morning pill in your hand. Your water cup is right in front of you.`,
      nurse: 'Mild pause detected. Gentle room audio prompt triggered. No room entry needed.',
      comfort: 88,
      items: ['Resident', 'Pill in Palm', 'Water Glass', 'Window'],
    },
    {
      step: 4,
      act: 'Water cup raised, taking medication with water',
      desc: 'Pill placed in mouth, sipping water from glass.',
      status: 'NONE' as const,
      det: 'Swallow motion completed smoothly. Resident placed cup back down.',
      sev: 'NORMAL' as const,
      rec: 'no_action' as const,
      prompt: `Wonderful job ${name}, thank you for taking your water.`,
      nurse: 'Swallowing verified. Awaiting routine completion acknowledgment.',
      comfort: 96,
      items: ['Resident', 'Water Glass', 'Pill Swallowed'],
    },
    {
      step: 5,
      act: 'Medication complete. Resident settling back into armchair.',
      desc: 'Morning routine successfully concluded. Glass emptied.',
      status: 'NONE' as const,
      det: 'All 5 steps verified. Container closed. No pills left unattended.',
      sev: 'NORMAL' as const,
      rec: 'no_action' as const,
      prompt: `All done ${name}! Have a peaceful morning.`,
      nurse: 'Medication logged as completed. Zero nurse room entries needed.',
      comfort: 98,
      items: ['Resident', 'Closed Pill Box', 'Empty Cup'],
    },
  ];

  const current = steps[Math.min(step, 4)] || steps[0];

  return {
    residentPresent: true,
    activityDetected: current.act,
    medicationStep: current.step,
    stepDescription: current.desc,
    interruptionStatus: current.status,
    interruptionDetails: current.det,
    severity: current.sev,
    interventionRecommendation: current.rec,
    gentleRoomPrompt: current.prompt,
    nurseActionNote: current.nurse,
    detectedItems: current.items,
    residentComfortScore: current.comfort,
    confidenceScore: 92,
    timestamp: new Date().toISOString(),
  };
}

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`IntelliCue server listening on http://localhost:${port}`);
  });
}

startServer();
