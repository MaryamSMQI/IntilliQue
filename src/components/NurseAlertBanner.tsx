import React from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle, 
  Volume2, 
  UserCheck, 
  Clock
} from 'lucide-react';
import { IncidentAlert } from '../types';

interface NurseAlertBannerProps {
  alerts: IncidentAlert[];
  onAcknowledgeAlert: (alertId: string, nurseName: string) => void;
  onResolveAlert: (alertId: string) => void;
  onSpeakPrompt: (text: string) => void;
}

export const NurseAlertBanner: React.FC<NurseAlertBannerProps> = ({
  alerts,
  onAcknowledgeAlert,
  onResolveAlert,
  onSpeakPrompt,
}) => {
  const activeAlerts = alerts.filter((a) => a.status !== 'RESOLVED');

  if (activeAlerts.length === 0) {
    return null;
  }

  // Display most urgent alert first
  const sortedAlerts = [...activeAlerts].sort((a, b) => {
    if (a.severity === 'CRITICAL_URGENT') return -1;
    if (b.severity === 'CRITICAL_URGENT') return 1;
    if (a.severity === 'NURSE_ALERT') return -1;
    if (b.severity === 'NURSE_ALERT') return 1;
    return 0;
  });

  const topAlert = sortedAlerts[0];
  const isCritical = topAlert.severity === 'CRITICAL_URGENT';
  const isAcknowledged = topAlert.status === 'ACKNOWLEDGED';

  return (
    <div
      className={`rounded-2xl border p-4 shadow-md mb-6 transition-all ${
        isCritical
          ? 'bg-rose-50/95 border-rose-300 ring-2 ring-rose-400/40 shadow-rose-200/50'
          : topAlert.severity === 'NURSE_ALERT'
          ? 'bg-orange-50/95 border-orange-300 shadow-orange-100/50'
          : 'bg-white border-blue-200'
      }`}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left icon & summary */}
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isCritical
                ? 'bg-rose-600 text-white animate-bounce shadow-sm'
                : topAlert.severity === 'NURSE_ALERT'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-blue-600 text-white'
            }`}
          >
            {isCritical ? (
              <AlertOctagon className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isCritical
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-orange-500 text-white'
                }`}
              >
                {topAlert.severity.replace('_', ' ')}
              </span>

              <span className="text-sm font-extrabold text-slate-900">
                Room {topAlert.roomNumber} &bull; {topAlert.patientName}
              </span>

              <span className="text-xs text-slate-600 font-mono font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {topAlert.timestamp}
              </span>

              {isAcknowledged && (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {topAlert.respondedBy || 'Nurse En Route'}
                </span>
              )}
            </div>

            <h4 className="text-base font-bold text-slate-900 mt-1">
              {topAlert.title}
            </h4>
            <p className="text-xs text-slate-700 mt-0.5 max-w-2xl font-medium">
              {topAlert.description}
            </p>

            {/* Tactical Advice & Suggested Audio Prompt */}
            <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center gap-2 text-xs bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-2xs">
              <div className="text-slate-800">
                <strong className="text-blue-700">Care Advice:</strong> {topAlert.recommendedAction}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-center justify-end">
          {/* Gentle Voice Prompt (Non-invasive entry prevention) */}
          {topAlert.suggestedPrompt && (
            <button
              onClick={() => onSpeakPrompt(topAlert.suggestedPrompt)}
              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
              title="Broadcast gentle voice cue into room without entering"
            >
              <Volume2 className="w-4 h-4" />
              Gentle Room Audio Cue
            </button>
          )}

          {/* Nurse En Route Dispatch */}
          {!isAcknowledged ? (
            <button
              onClick={() => onAcknowledgeAlert(topAlert.id, 'Nurse Amina Al-Zahra, RN')}
              className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all ${
                isCritical
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              I Am Intervening - En Route
            </button>
          ) : (
            <button
              onClick={() => onResolveAlert(topAlert.id)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Resolved (Safe)
            </button>
          )}

          {/* Quick Dismiss button */}
          {!isAcknowledged && (
            <button
              onClick={() => onResolveAlert(topAlert.id)}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-all"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {/* Multiple alerts note */}
      {sortedAlerts.length > 1 && (
        <div className="mt-2 text-right">
          <span className="text-[11px] text-slate-500 font-medium">
            +{sortedAlerts.length - 1} more pending alert(s) across other rooms
          </span>
        </div>
      )}
    </div>
  );
};
