import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  MessageSquare,
  ShieldAlert,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { MedicationStep, InterruptionType, AlertSeverity } from '../types';

interface TaskStepTimelineProps {
  routineName: string;
  steps: MedicationStep[];
  currentStep: number;
  interruptionType: InterruptionType;
  severity: AlertSeverity;
  scheduledTime: string;
  residentName: string;
  roomNumber: string;
  onAdvanceStep: () => void;
  onResetTask: () => void;
  onOpenIntercom: () => void;
  onTriggerInterruption: (type: InterruptionType, severity: AlertSeverity) => void;
}

export const TaskStepTimeline: React.FC<TaskStepTimelineProps> = ({
  routineName,
  steps,
  currentStep,
  interruptionType,
  severity,
  scheduledTime,
  residentName,
  roomNumber,
  onAdvanceStep,
  onResetTask,
  onOpenIntercom,
  onTriggerInterruption,
}) => {
  const isInterrupted = interruptionType !== 'NONE';
  const isCompleted = currentStep >= 5;

  const getInterruptionLabel = (type: InterruptionType) => {
    switch (type) {
      case 'DISTRACTED':
        return 'Distracted / Attention Diverted';
      case 'WANDERED_AWAY':
        return 'Wandered Away from Medicine Table';
      case 'DROPPED_MEDICINE':
        return 'Pill Dropped on Floor';
      case 'CONFUSION_FREEZE':
        return 'Disorientation / Task Freeze (>60s)';
      case 'DANGEROUS_INGESTION':
        return 'Potential Incorrect Ingestion Risk';
      case 'FALL_RISK_OR_FALL':
        return 'Critical Fall Risk / Slump Detected';
      default:
        return 'No Interruption';
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Room {roomNumber}
            </span>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              {routineName}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Resident: <strong className="text-slate-800">{residentName}</strong> &bull; Scheduled Window: {scheduledTime}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Verified Ingested &amp; Complete
            </span>
          ) : isInterrupted ? (
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border shadow-2xs ${
                severity === 'CRITICAL_URGENT'
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  : 'bg-orange-50 text-orange-700 border-orange-200'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${severity === 'CRITICAL_URGENT' ? 'text-rose-600' : 'text-orange-500'}`} />
              {getInterruptionLabel(interruptionType)}
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Step {currentStep} of 5 &bull; On Track
            </span>
          )}
        </div>
      </div>

      {/* 5-Step Visual Stepper */}
      <div className="py-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {steps.map((step) => {
            const isDone = step.stepNumber < currentStep || isCompleted;
            const isCurrent = step.stepNumber === currentStep && !isCompleted;
            const isStepInterrupted = isCurrent && isInterrupted;

            return (
              <div
                key={step.stepNumber}
                className={`relative rounded-xl p-3.5 border transition-all ${
                  isStepInterrupted
                    ? 'bg-orange-50/80 border-orange-300 shadow-sm'
                    : isCurrent
                    ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-100 shadow-sm'
                    : isDone
                    ? 'bg-emerald-50/40 border-emerald-200 text-slate-700'
                    : 'bg-slate-50 border-slate-200/80 text-slate-400'
                }`}
              >
                {/* Step indicator header */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isStepInterrupted
                        ? 'bg-orange-500 text-white'
                        : isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.stepNumber}
                  </span>

                  {step.timestamp && (
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 font-semibold">
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      {step.timestamp}
                    </span>
                  )}
                </div>

                <div className="text-xs font-bold text-slate-900 mb-1">
                  {step.title}
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {step.description}
                </p>

                {/* Sub status tag */}
                <div className="mt-2.5">
                  {isStepInterrupted ? (
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-100/80 border border-orange-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 text-orange-600" /> Interrupted Here
                    </span>
                  ) : isCurrent ? (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                      Observing Live
                    </span>
                  ) : isDone ? (
                    <span className="text-[10px] font-bold text-emerald-700">
                      Verified Completed
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Upcoming</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Non-intrusive Nurse Comfort Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              Dementia Resident Comfort Protocol
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                Passive Optical AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Nurses only enter if task is blocked or safety is compromised. Keeps resident peaceful in their personal space.
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onOpenIntercom}
            className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-orange-500/20"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Gentle Voice Prompt
          </button>

          {!isCompleted && (
            <button
              onClick={onAdvanceStep}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 transition-all flex items-center gap-1 shadow-2xs"
              title="Confirm observed step progression"
            >
              Advance Step
              <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
            </button>
          )}

          {isCompleted && (
            <button
              onClick={onResetTask}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Reset Routine
            </button>
          )}
        </div>
      </div>

      {/* Interruption Trigger Check for Clinical Testing */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1 mr-1">
          <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
          Test Interruption Triggers:
        </span>

        <button
          onClick={() => onTriggerInterruption('DISTRACTED', 'ATTENTION')}
          className="px-2.5 py-1 rounded-lg bg-white hover:bg-orange-50 hover:text-orange-700 text-slate-700 border border-slate-200 text-[11px] font-semibold transition-all shadow-2xs"
        >
          Distracted / Paused
        </button>

        <button
          onClick={() => onTriggerInterruption('WANDERED_AWAY', 'NURSE_ALERT')}
          className="px-2.5 py-1 rounded-lg bg-white hover:bg-orange-50 hover:text-orange-700 text-slate-700 border border-slate-200 text-[11px] font-semibold transition-all shadow-2xs"
        >
          Wandered Away Mid-Task
        </button>

        <button
          onClick={() => onTriggerInterruption('DROPPED_MEDICINE', 'NURSE_ALERT')}
          className="px-2.5 py-1 rounded-lg bg-white hover:bg-orange-50 hover:text-orange-700 text-slate-700 border border-slate-200 text-[11px] font-semibold transition-all shadow-2xs"
        >
          Dropped Pill on Floor
        </button>

        <button
          onClick={() => onTriggerInterruption('FALL_RISK_OR_FALL', 'CRITICAL_URGENT')}
          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1"
        >
          🚨 Urgent Fall Detected
        </button>
      </div>
    </div>
  );
};
