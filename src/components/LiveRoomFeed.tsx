import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  RefreshCw, 
  Volume2, 
  AlertTriangle, 
  CheckCircle2, 
  Scan, 
  Activity,
  Sparkles,
  ShieldAlert,
  Sliders,
  Check
} from 'lucide-react';
import { PatientRoom, VisionAnalysisResult } from '../types';

interface LiveRoomFeedProps {
  currentRoom: PatientRoom;
  onAnalysisComplete: (result: VisionAnalysisResult, snapshotUrl?: string) => void;
  onSpeakPrompt: (text: string) => void;
  onOpenIntercom: () => void;
}

export const LiveRoomFeed: React.FC<LiveRoomFeedProps> = ({
  currentRoom,
  onAnalysisComplete,
  onSpeakPrompt,
  onOpenIntercom,
}) => {
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState<boolean>(true);
  const [privacyMode, setPrivacyMode] = useState<'clear' | 'blur' | 'silhouette'>('clear');
  const [lastAnalysis, setLastAnalysis] = useState<VisionAnalysisResult | null>(
    currentRoom.lastAnalysis || null
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const autoScanIntervalRef = useRef<number | null>(null);

  // Initialize webcam
  const startWebcam = useCallback(async () => {
    try {
      setWebcamError(null);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsWebcamActive(true);
    } catch (err: any) {
      console.warn('Webcam access error:', err);
      setWebcamError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera permissions in your browser bar.'
          : 'Could not access laptop webcam. Please ensure no other application is using it.'
      );
      setIsWebcamActive(false);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  }, []);

  // Start webcam on mount
  useEffect(() => {
    startWebcam();
    return () => {
      stopWebcam();
    };
  }, [startWebcam, stopWebcam]);

  // Capture current webcam frame
  const captureFrameBase64 = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current || !isWebcamActive) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, [isWebcamActive]);

  // Analyze frame with Gemini 3.8 Flash
  const handleAnalyzeFrame = useCallback(async () => {
    const frameBase64 = captureFrameBase64();
    if (!frameBase64) {
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/vision/analyze-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: frameBase64,
          patientInfo: {
            name: currentRoom.name,
            room: currentRoom.roomNumber,
            scheduledTask: currentRoom.activeTask,
          },
          previousStep: currentRoom.currentStep,
        }),
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        const result: VisionAnalysisResult = {
          ...data.analysis,
          snapshotUrl: frameBase64,
        };
        setLastAnalysis(result);
        onAnalysisComplete(result, frameBase64);
      }
    } catch (err) {
      console.error('Analysis request error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [captureFrameBase64, currentRoom, onAnalysisComplete]);

  // Handle auto-scan periodic monitoring
  useEffect(() => {
    if (autoScanEnabled && isWebcamActive) {
      handleAnalyzeFrame();
      autoScanIntervalRef.current = window.setInterval(() => {
        handleAnalyzeFrame();
      }, 6500);
    } else {
      if (autoScanIntervalRef.current) {
        clearInterval(autoScanIntervalRef.current);
        autoScanIntervalRef.current = null;
      }
    }

    return () => {
      if (autoScanIntervalRef.current) {
        clearInterval(autoScanIntervalRef.current);
      }
    };
  }, [autoScanEnabled, isWebcamActive, handleAnalyzeFrame]);

  const getFilterClass = () => {
    switch (privacyMode) {
      case 'blur':
        return 'blur-md';
      case 'silhouette':
        return 'grayscale contrast-150 brightness-90';
      default:
        return '';
    }
  };

  const isInterrupted = (lastAnalysis?.interruptionStatus || currentRoom.interruptionType) !== 'NONE';
  const isCritical = (lastAnalysis?.severity || currentRoom.severity) === 'CRITICAL_URGENT';
  const isAlert = (lastAnalysis?.severity || currentRoom.severity) === 'NURSE_ALERT';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs mb-6">
      {/* Top Bar */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Room {currentRoom.roomNumber} Optical Feed</span>
              <span className="text-slate-500 font-normal">({currentRoom.name})</span>
            </h2>
          </div>
          <span className="bg-blue-50 text-blue-700 text-[11px] font-mono px-2.5 py-0.5 rounded-md border border-blue-200 font-semibold">
            {currentRoom.activeTask}
          </span>
        </div>

        {/* Video Mode & Auto-scan controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Privacy mode selector */}
          <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200 shadow-2xs">
            <button
              onClick={() => setPrivacyMode('clear')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                privacyMode === 'clear'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Standard camera feed"
            >
              Clear Feed
            </button>
            <button
              onClick={() => setPrivacyMode('blur')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                privacyMode === 'blur'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Dignity Blur protects resident privacy while tracking movement"
            >
              Dignity Blur
            </button>
            <button
              onClick={() => setPrivacyMode('silhouette')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                privacyMode === 'silhouette'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Silhouette outline filter"
            >
              Silhouette
            </button>
          </div>

          {/* Auto Scan Toggle */}
          <button
            onClick={() => setAutoScanEnabled(!autoScanEnabled)}
            className={`px-3 py-1.5 rounded-lg border font-semibold text-xs flex items-center gap-1.5 transition-all ${
              autoScanEnabled
                ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${autoScanEnabled ? 'animate-spin' : 'text-orange-500'}`} />
            {autoScanEnabled ? 'Auto-Scan Active (6s)' : 'Enable Continuous Scan'}
          </button>
        </div>
      </div>

      {/* Main Video Viewport & AI HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left: Webcam Stream (8 cols) */}
        <div className="lg:col-span-8 relative bg-slate-900 min-h-[380px] sm:min-h-[460px] flex items-center justify-center overflow-hidden">
          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Real Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover max-h-[500px] transition-all duration-300 ${getFilterClass()}`}
          />

          {/* Fallback if camera is off or denied */}
          {!isWebcamActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/95 z-10 text-white">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 mb-3 border border-blue-500/30">
                <Camera className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Laptop Webcam Guardian Active
              </h3>
              <p className="text-xs text-slate-400 max-w-md mb-4">
                {webcamError ||
                  'Place laptop facing medicine table or demonstrate taking water/pills in front of your camera.'}
              </p>
              <button
                onClick={startWebcam}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Initialize Laptop Camera
              </button>
            </div>
          )}

          {/* Top Overlays on Video */}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-2 pointer-events-none">
            {/* Live Camera Tag */}
            <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-md border border-slate-700/80 text-[11px] font-mono text-slate-200 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>LIVE ROOM WEBCAM</span>
            </div>

            {/* Comfort meter */}
            <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-md border border-slate-700/80 text-xs flex items-center gap-2 shadow-sm">
              <span className="text-slate-400 text-[11px]">Resident Comfort:</span>
              <span className="text-orange-400 font-extrabold font-mono">
                {lastAnalysis?.residentComfortScore || currentRoom.comfortScore}%
              </span>
            </div>
          </div>

          {/* Bottom HUD: Live Detection Banner */}
          <div className="absolute bottom-3 inset-x-3 bg-white/95 backdrop-blur-md rounded-xl p-3.5 border border-slate-200 text-xs text-slate-900 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0 border border-blue-100">
                <Scan className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <span>{lastAnalysis?.activityDetected || 'Monitoring resident & task table...'}</span>
                  {lastAnalysis?.confidenceScore && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold">
                      {lastAnalysis.confidenceScore}% conf
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span className="font-medium">Items Detected:</span>
                  <div className="flex flex-wrap gap-1">
                    {(lastAnalysis?.detectedItems || ['Resident', 'Pill Organizer', 'Table']).map((item, i) => (
                      <span
                        key={i}
                        className="bg-slate-100 px-1.5 py-0.2 rounded text-[10px] text-slate-700 border border-slate-200 font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right: AI Clinical Decision & Care Directives (4 cols) */}
        <div className="lg:col-span-4 p-5 flex flex-col justify-between bg-white border-t lg:border-t-0 lg:border-l border-slate-200">
          <div>
            {/* Task Progress & Interruption State */}
            <div className="space-y-3">
              {/* Step Status */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                  Observed Milestone Step
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-extrabold text-blue-700">
                    Step {lastAnalysis?.medicationStep || currentRoom.currentStep} of 5
                  </span>
                  <span className="text-xs text-slate-700 font-medium">
                    {lastAnalysis?.stepDescription || 'Approached med container'}
                  </span>
                </div>
              </div>

              {/* Interruption Status Box */}
              <div
                className={`rounded-xl p-3 border transition-all ${
                  !isInterrupted
                    ? 'bg-emerald-50 border-emerald-200'
                    : isCritical
                    ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-400'
                    : 'bg-orange-50 border-orange-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 ${
                      !isInterrupted
                        ? 'text-emerald-800'
                        : isCritical
                        ? 'text-rose-800'
                        : 'text-orange-800'
                    }`}
                  >
                    {!isInterrupted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                    )}
                    Interruption Status
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      !isInterrupted
                        ? 'bg-emerald-100 text-emerald-800'
                        : isCritical
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {lastAnalysis?.interruptionStatus || currentRoom.interruptionType}
                  </span>
                </div>
                <p
                  className={`text-xs mt-1.5 leading-relaxed font-medium ${
                    !isInterrupted
                      ? 'text-emerald-900'
                      : isCritical
                      ? 'text-rose-900'
                      : 'text-orange-900'
                  }`}
                >
                  {lastAnalysis?.interruptionDetails ||
                    'Routine progressing normally. Resident unbothered in room.'}
                </p>
              </div>

              {/* Nurse Action Recommendation */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                  Non-Intrusive Care Directive
                </span>
                <p className="text-xs text-slate-800 font-semibold mt-1 leading-relaxed">
                  {lastAnalysis?.nurseActionNote ||
                    'Monitor passively. Avoid room barging to maintain resident comfort.'}
                </p>
              </div>

              {/* Ambient Room Prompt Cue */}
              {lastAnalysis?.gentleRoomPrompt && (
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3">
                  <span className="text-[10px] text-blue-700 block uppercase font-bold flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-orange-500" />
                    Ambient Room Voice Cue
                  </span>
                  <p className="text-xs text-slate-800 italic mt-1 leading-relaxed">
                    &ldquo;{lastAnalysis.gentleRoomPrompt}&rdquo;
                  </p>
                  <button
                    onClick={() => onSpeakPrompt(lastAnalysis.gentleRoomPrompt)}
                    className="mt-2.5 w-full py-2 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-orange-500/20"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Speak Prompt into Room
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Intercom / Call Button */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={onOpenIntercom}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              Open Room Intercom Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
