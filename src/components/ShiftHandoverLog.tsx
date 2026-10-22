import React from 'react';
import { 
  FileText, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Volume2, 
  UserCheck, 
  Clock, 
  Calendar
} from 'lucide-react';
import { PatientRoom, IncidentAlert } from '../types';

interface ShiftHandoverLogProps {
  rooms: PatientRoom[];
  alerts: IncidentAlert[];
  totalIntrusionsAvoided: number;
}

export const ShiftHandoverLog: React.FC<ShiftHandoverLogProps> = ({
  rooms,
  alerts,
  totalIntrusionsAvoided,
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleExportReport = () => {
    const reportText = `INTELLICUE - NURSING SHIFT HANDOVER REPORT
Date: ${currentDate}
Shift: Day Shift (07:00 - 15:30)
Memory Care Wing: East Corridor
Total Monitored Rooms: ${rooms.length}
Room Intrusions Prevented: ${totalIntrusionsAvoided}

RESIDENT ROUTINE SUMMARY:
${rooms
  .map(
    (r) =>
      `• Room ${r.roomNumber} - ${r.name} (${r.condition}):
   Active Routine: ${r.activeTask}
   Progress: Step ${r.currentStep}/5 (${r.taskStatus})
   Comfort Index: ${r.comfortScore}%
   Intrusions Avoided: ${r.intrusionsAvoidedToday}
   Notes: ${r.notes}`
  )
  .join('\n\n')}

INCIDENT & INTERVENTION AUDIT LOG:
${alerts
  .map(
    (a) =>
      `[${a.timestamp}] Room ${a.roomNumber} (${a.patientName}) - ${a.severity}:
   Issue: ${a.title}
   Description: ${a.description}
   Action: ${a.recommendedAction}
   Status: ${a.status} (Responded by: ${a.respondedBy || 'Pending'})`
  )
  .join('\n\n')}
`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IntelliCue_Shift_Handover_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">
              Clinical Shift Handover &amp; Comfort Audit Log
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 font-medium">
            <Calendar className="w-3.5 h-3.5" />
            {currentDate} &bull; Day Shift 07:00 - 15:30
          </p>
        </div>

        <button
          onClick={handleExportReport}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all"
        >
          <Download className="w-4 h-4" />
          Export Handover Report (.txt)
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider block">Intrusions Prevented</span>
            <span className="text-xl font-extrabold text-orange-600">{totalIntrusionsAvoided}</span>
            <span className="text-[11px] text-slate-500 block font-medium">Residents stayed in comfort zone</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider block">Audio Cues Delivered</span>
            <span className="text-xl font-extrabold text-blue-700">14 Ambient Cues</span>
            <span className="text-[11px] text-slate-500 block font-medium">78% redirected successfully</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider block">Nurse Interventions</span>
            <span className="text-xl font-extrabold text-slate-800">3 Physical Entries</span>
            <span className="text-[11px] text-slate-500 block font-medium">All safety hazards safely resolved</span>
          </div>
        </div>
      </div>

      {/* Detailed Activity Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Shift Incident &amp; Routine Verification Timeline
          </h3>
          <span className="text-[11px] text-slate-500 font-mono font-medium">
            {alerts.length} logged events
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-4 hover:bg-slate-50/60 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Room {alert.roomNumber}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {alert.patientName}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      alert.severity === 'CRITICAL_URGENT'
                        ? 'bg-rose-100 text-rose-800'
                        : alert.severity === 'NURSE_ALERT'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {alert.severity.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{alert.timestamp}</span>
                </div>
              </div>

              <div className="mt-2 text-xs text-slate-700">
                <strong className="text-slate-900">{alert.title}:</strong> {alert.description}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 mr-1 font-semibold">Directive:</span>
                  <span className="text-slate-800 font-medium">{alert.recommendedAction}</span>
                </div>
                {alert.respondedBy && (
                  <div className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Handled by {alert.respondedBy}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
