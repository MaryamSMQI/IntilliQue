import React, { useState } from 'react';
import { NurseHeader } from './components/NurseHeader';
import { LiveRoomFeed } from './components/LiveRoomFeed';
import { TaskStepTimeline } from './components/TaskStepTimeline';
import { NurseAlertBanner } from './components/NurseAlertBanner';
import { FacilityRoomGrid } from './components/FacilityRoomGrid';
import { GentleIntercomModal } from './components/GentleIntercomModal';
import { ShiftHandoverLog } from './components/ShiftHandoverLog';
import { INITIAL_ROOMS, INITIAL_NURSES, INITIAL_ALERTS } from './data/mockPatients';
import { PatientRoom, IncidentAlert, VisionAnalysisResult, InterruptionType, AlertSeverity } from './types';
import { soundService } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<'live' | 'facility' | 'alerts' | 'log'>('live');
  const [rooms, setRooms] = useState<PatientRoom[]>(INITIAL_ROOMS);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('room-104');
  const [alerts, setAlerts] = useState<IncidentAlert[]>(INITIAL_ALERTS);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [totalIntrusionsAvoided, setTotalIntrusionsAvoided] = useState<number>(34);
  const [intercomRoom, setIntercomRoom] = useState<PatientRoom | null>(null);
  const [isIntercomOpen, setIsIntercomOpen] = useState<boolean>(false);

  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  // Sound mute toggle
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundService.setMuted(nextMuted);
  };

  // When AI vision completes analysis
  const handleAnalysisComplete = (analysis: VisionAnalysisResult, snapshotUrl?: string) => {
    setRooms((prevRooms) =>
      prevRooms.map((room) => {
        if (room.id === selectedRoomId) {
          const nextStep = analysis.medicationStep || room.currentStep;
          const nextStatus =
            nextStep >= 5
              ? 'COMPLETED'
              : analysis.interruptionStatus !== 'NONE'
              ? 'INTERRUPTED'
              : 'IN_PROGRESS';

          // Update routine steps
          const updatedRoutine = room.routineSteps.map((step) => {
            if (step.stepNumber < nextStep) {
              return { ...step, status: 'completed' as const };
            }
            if (step.stepNumber === nextStep) {
              return {
                ...step,
                status: analysis.interruptionStatus !== 'NONE' ? ('interrupted' as const) : ('active' as const),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
            }
            return { ...step, status: 'pending' as const };
          });

          return {
            ...room,
            currentStep: nextStep,
            taskStatus: nextStatus,
            interruptionType: analysis.interruptionStatus,
            severity: analysis.severity,
            comfortScore: analysis.residentComfortScore,
            lastAnalysis: analysis,
            routineSteps: updatedRoutine,
          };
        }
        return room;
      })
    );

    // If an alert or interruption occurred, generate or update incident alert
    if (analysis.severity === 'CRITICAL_URGENT' || analysis.severity === 'NURSE_ALERT') {
      soundService.playNurseAlert();

      const newAlert: IncidentAlert = {
        id: `alert-${Date.now()}`,
        roomId: currentRoom.id,
        roomNumber: currentRoom.roomNumber,
        patientName: currentRoom.name,
        severity: analysis.severity,
        title: `${analysis.interruptionStatus.replace('_', ' ')} detected during ${currentRoom.activeTask}`,
        description: analysis.interruptionDetails,
        recommendedAction: analysis.nurseActionNote,
        suggestedPrompt: analysis.gentleRoomPrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'PENDING',
        snapshotUrl,
      };

      setAlerts((prev) => [newAlert, ...prev]);
    }
  };

  // Broadcast gentle voice prompt into patient room
  const handleSendVoicePrompt = async (text: string, targetRoom: PatientRoom) => {
    try {
      const res = await fetch('/api/voice/gentle-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();

      soundService.speakGentlePrompt(text, data.audioBase64);

      // Increment intrusions avoided metric
      setTotalIntrusionsAvoided((prev) => prev + 1);
      setRooms((prev) =>
        prev.map((r) =>
          r.id === targetRoom.id
            ? {
                ...r,
                intrusionsAvoidedToday: r.intrusionsAvoidedToday + 1,
                comfortScore: Math.min(100, r.comfortScore + 2),
                interruptionType: 'NONE',
                severity: 'NORMAL',
              }
            : r
        )
      );

      // Resolve pending alert if there was one
      setAlerts((prev) =>
        prev.map((a) =>
          a.roomId === targetRoom.id && a.status === 'PENDING'
            ? {
                ...a,
                status: 'RESOLVED',
                respondedBy: 'Ambient Room Prompt',
                resolvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }
            : a
        )
      );
    } catch (err) {
      console.warn('Voice prompt error, speaking locally:', err);
      soundService.speakGentlePrompt(text);
    }
  };

  // Nurse Intervention Handlers
  const handleAcknowledgeAlert = (alertId: string, nurseName: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, status: 'ACKNOWLEDGED', respondedBy: nurseName } : a
      )
    );
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'RESOLVED',
              resolvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : a
        )
    );
  };

  // Step advancement
  const handleAdvanceStep = () => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === selectedRoomId) {
          const next = Math.min(5, r.currentStep + 1);
          const isDone = next >= 5;

          if (isDone) {
            setTotalIntrusionsAvoided((c) => c + 1);
          }

          const updatedRoutine = r.routineSteps.map((step) => {
            if (step.stepNumber < next) return { ...step, status: 'completed' as const };
            if (step.stepNumber === next) {
              return {
                ...step,
                status: isDone ? ('completed' as const) : ('active' as const),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
            }
            return { ...step, status: 'pending' as const };
          });

          return {
            ...r,
            currentStep: next,
            taskStatus: isDone ? 'COMPLETED' : 'IN_PROGRESS',
            interruptionType: 'NONE',
            severity: 'NORMAL',
            comfortScore: Math.min(100, r.comfortScore + 3),
            intrusionsAvoidedToday: isDone ? r.intrusionsAvoidedToday + 1 : r.intrusionsAvoidedToday,
            routineSteps: updatedRoutine,
          };
        }
        return r;
      })
    );
  };

  // Reset routine
  const handleResetTask = () => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === selectedRoomId) {
          return {
            ...r,
            currentStep: 1,
            taskStatus: 'IN_PROGRESS',
            interruptionType: 'NONE',
            severity: 'NORMAL',
            routineSteps: r.routineSteps.map((s, idx) => ({
              ...s,
              status: idx === 0 ? 'active' : 'pending',
            })),
          };
        }
        return r;
      })
    );
  };

  // Manually trigger an interruption for clinical testing
  const handleTriggerInterruption = (type: InterruptionType, sev: AlertSeverity) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === selectedRoomId) {
          return {
            ...r,
            interruptionType: type,
            severity: sev,
            taskStatus: 'INTERRUPTED',
            comfortScore: Math.max(30, r.comfortScore - 15),
          };
        }
        return r;
      })
    );

    soundService.playNurseAlert();

    const descriptions: Record<InterruptionType, string> = {
      NONE: 'Routine normal',
      DISTRACTED: 'Resident paused with medication in hand, looking around room for >45s.',
      WANDERED_AWAY: 'Resident stood up and walked toward hallway door before taking pills.',
      DROPPED_MEDICINE: 'Pill slipped from fingers onto table rug at Step 3.',
      CONFUSION_FREEZE: 'Resident standing disoriented, unable to recall next routine step.',
      DANGEROUS_INGESTION: 'Resident reaching for incorrect substance on nightstand.',
      FALL_RISK_OR_FALL: 'EMERGENCY: Resident slumped to floor beside bed.',
    };

    const newAlert: IncidentAlert = {
      id: `alert-${Date.now()}`,
      roomId: currentRoom.id,
      roomNumber: currentRoom.roomNumber,
      patientName: currentRoom.name,
      severity: sev,
      title: `${type.replace('_', ' ')} in Room ${currentRoom.roomNumber}`,
      description: descriptions[type] || 'Interruption detected during routine.',
      recommendedAction:
        sev === 'CRITICAL_URGENT'
          ? 'CODE YELLOW: Immediate 2-nurse dispatch to assist resident.'
          : 'Deliver gentle ambient audio cue to redirect without opening door.',
      suggestedPrompt: `${currentRoom.name}, your water is right beside you on the table. Take your time.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'PENDING',
    };

    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleOpenIntercomForRoom = (room: PatientRoom) => {
    setIntercomRoom(room);
    setIsIntercomOpen(true);
  };

  const handleDispatchNurse = (room: PatientRoom) => {
    const newAlert: IncidentAlert = {
      id: `dispatch-${Date.now()}`,
      roomId: room.id,
      roomNumber: room.roomNumber,
      patientName: room.name,
      severity: 'NURSE_ALERT',
      title: `Nurse In-Person Check Requested for Room ${room.roomNumber}`,
      description: `Dispatched routine visual check for ${room.name}.`,
      recommendedAction: 'Enter room gently, announce arrival in a calm reassuring voice.',
      suggestedPrompt: `${room.name}, Nurse Amina is gently knocking to check in on you.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'ACKNOWLEDGED',
      respondedBy: 'Nurse Amina Al-Zahra, RN',
    };
    setAlerts((prev) => [newAlert, ...prev]);
    setActiveTab('alerts');
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navigation & Status Bar */}
      <NurseHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        nurses={INITIAL_NURSES}
        alerts={alerts}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        totalIntrusionsAvoided={totalIntrusionsAvoided}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* High-priority Urgent Alert Banner */}
        <NurseAlertBanner
          alerts={alerts}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onResolveAlert={handleResolveAlert}
          onSpeakPrompt={(text) => handleSendVoicePrompt(text, currentRoom)}
        />

        {/* TAB 1: Live Room Camera & AI Guardian */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            {/* Live Camera Feed & AI HUD */}
            <LiveRoomFeed
              currentRoom={currentRoom}
              onAnalysisComplete={handleAnalysisComplete}
              onSpeakPrompt={(text) => handleSendVoicePrompt(text, currentRoom)}
              onOpenIntercom={() => handleOpenIntercomForRoom(currentRoom)}
            />

            {/* Task Step Progression Timeline */}
            <TaskStepTimeline
              routineName={currentRoom.activeTask}
              steps={currentRoom.routineSteps}
              currentStep={currentRoom.currentStep}
              interruptionType={currentRoom.interruptionType}
              severity={currentRoom.severity}
              scheduledTime={currentRoom.scheduledTime}
              residentName={currentRoom.name}
              roomNumber={currentRoom.roomNumber}
              onAdvanceStep={handleAdvanceStep}
              onResetTask={handleResetTask}
              onOpenIntercom={() => handleOpenIntercomForRoom(currentRoom)}
              onTriggerInterruption={handleTriggerInterruption}
            />
          </div>
        )}

        {/* TAB 2: Facility Memory Care Wing Overview */}
        {activeTab === 'facility' && (
          <FacilityRoomGrid
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            onSelectRoom={(id) => {
              setSelectedRoomId(id);
              setActiveTab('live');
            }}
            onOpenIntercomForRoom={handleOpenIntercomForRoom}
            onDispatchNurse={handleDispatchNurse}
          />
        )}

        {/* TAB 3: Intervention Dispatch & Safety Queue */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Nurse Intervention &amp; Life-Threatening Safety Queue
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time alerts for task interruptions, falls, choking, and wanderings across all resident suites.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {alerts.filter((a) => a.status === 'PENDING').length} Pending Responses
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition-all shadow-xs ${
                    alert.severity === 'CRITICAL_URGENT'
                      ? 'bg-rose-50/90 border-rose-300 ring-1 ring-rose-300'
                      : alert.severity === 'NURSE_ALERT'
                      ? 'bg-orange-50/90 border-orange-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-white text-blue-700 border border-slate-200 shadow-2xs">
                          Room {alert.roomNumber}
                        </span>
                        <span className="text-sm font-extrabold text-slate-900">
                          {alert.patientName}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                          {alert.severity.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500 font-mono font-medium">
                          {alert.timestamp}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mt-1.5">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">{alert.description}</p>
                      <p className="text-xs text-blue-700 mt-1 font-semibold">
                        <strong>Directive:</strong> {alert.recommendedAction}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {alert.suggestedPrompt && (
                        <button
                          onClick={() => handleSendVoicePrompt(alert.suggestedPrompt, currentRoom)}
                          className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs"
                        >
                          Send Gentle Audio Cue
                        </button>
                      )}

                      {alert.status === 'PENDING' ? (
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id, 'Nurse Amina Al-Zahra, RN')}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                        >
                          En Route / Intervening
                        </button>
                      ) : alert.status === 'ACKNOWLEDGED' ? (
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                        >
                          Mark Resolved
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-700 font-bold px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Shift Handover & Clinical Audit Log */}
        {activeTab === 'log' && (
          <ShiftHandoverLog
            rooms={rooms}
            alerts={alerts}
            totalIntrusionsAvoided={totalIntrusionsAvoided}
          />
        )}
      </main>

      {/* Gentle Intercom Broadcast Modal */}
      <GentleIntercomModal
        room={intercomRoom}
        isOpen={isIntercomOpen}
        onClose={() => setIsIntercomOpen(false)}
        onSendVoicePrompt={handleSendVoicePrompt}
      />
    </div>
  );
}
