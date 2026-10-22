export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'INTERRUPTED' | 'ABANDONED' | 'URGENT_ALERT';

export type InterruptionType =
  | 'NONE'
  | 'DISTRACTED'
  | 'WANDERED_AWAY'
  | 'DROPPED_MEDICINE'
  | 'CONFUSION_FREEZE'
  | 'DANGEROUS_INGESTION'
  | 'FALL_RISK_OR_FALL';

export type AlertSeverity = 'NORMAL' | 'ATTENTION' | 'NURSE_ALERT' | 'CRITICAL_URGENT';

export interface MedicationStep {
  stepNumber: number;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'interrupted';
  timestamp?: string;
}

export interface PatientRoom {
  id: string;
  roomNumber: string;
  name: string;
  age: number;
  condition: string;
  avatarUrl: string;
  activeTask: string;
  scheduledTime: string;
  taskStatus: TaskStatus;
  currentStep: number;
  interruptionType: InterruptionType;
  severity: AlertSeverity;
  comfortScore: number; // 0-100: high means calm and unbothered
  intrusionsAvoidedToday: number;
  lastAnalysis?: VisionAnalysisResult;
  assignedNurse: string;
  privacyMode: 'clear' | 'blur' | 'silhouette';
  notes: string;
  routineSteps: MedicationStep[];
}

export interface VisionAnalysisResult {
  residentPresent: boolean;
  activityDetected: string;
  medicationStep: number;
  stepDescription: string;
  interruptionStatus: InterruptionType;
  interruptionDetails: string;
  severity: AlertSeverity;
  interventionRecommendation: 'no_action' | 'gentle_speaker_prompt' | 'nurse_visit' | 'emergency_response';
  gentleRoomPrompt: string;
  nurseActionNote: string;
  detectedItems: string[];
  residentComfortScore: number;
  confidenceScore: number;
  timestamp: string;
  snapshotUrl?: string;
}

export interface IncidentAlert {
  id: string;
  roomId: string;
  roomNumber: string;
  patientName: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  recommendedAction: string;
  suggestedPrompt: string;
  timestamp: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';
  respondedBy?: string;
  resolvedAt?: string;
  snapshotUrl?: string;
}

export interface NurseStaff {
  id: string;
  name: string;
  role: string;
  shift: string;
  avatar: string;
  status: 'available' | 'in_room' | 'on_break';
}
