import React from 'react';
import { 
  Heart, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Activity, 
  Eye, 
  Bell, 
  Sparkles,
  Users,
  User
} from 'lucide-react';
import { NurseStaff, IncidentAlert } from '../types';

interface NurseHeaderProps {
  activeTab: 'live' | 'facility' | 'alerts' | 'log';
  setActiveTab: (tab: 'live' | 'facility' | 'alerts' | 'log') => void;
  nurses: NurseStaff[];
  alerts: IncidentAlert[];
  isMuted: boolean;
  onToggleMute: () => void;
  totalIntrusionsAvoided: number;
}

export const NurseHeader: React.FC<NurseHeaderProps> = ({
  activeTab,
  setActiveTab,
  nurses,
  alerts,
  isMuted,
  onToggleMute,
  totalIntrusionsAvoided,
}) => {
  const pendingAlerts = alerts.filter((a) => a.status === 'PENDING');
  const criticalCount = pendingAlerts.filter((a) => a.severity === 'CRITICAL_URGENT').length;
  const nurseAlertCount = pendingAlerts.filter((a) => a.severity === 'NURSE_ALERT').length;

  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-40 shadow-xs">
      {/* Top Banner: Shift Team & Comfort Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3 border-b border-slate-100 gap-3">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-orange-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
              <Eye className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                  Intelli<span className="text-orange-500">Cue</span>
                </h1>
              </div>
              <p className="text-xs text-slate-500">
                Non-Intrusive Task Tracking &amp; Dementia Patient Comfort Station
              </p>
            </div>
          </div>

          {/* Comfort Metric: Avoided Intrusions & Nurse Team */}
          <div className="flex items-center gap-3 text-xs">
            {/* Avoided Intrusions Banner */}
            <div className="bg-orange-50/90 border border-orange-200 px-3.5 py-1.5 rounded-xl flex items-center gap-2.5 shadow-2xs">
              <div className="p-1 rounded-md bg-orange-500 text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-orange-800 block text-[10px] uppercase font-bold tracking-wider">
                  Comfort Preserved
                </span>
                <span className="text-orange-600 font-extrabold text-sm">
                  {totalIntrusionsAvoided} Room Intrusions Prevented
                </span>
              </div>
            </div>

            {/* Shift Staff Avatars */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-600 font-semibold text-xs">On Duty:</span>
              <div className="flex -space-x-1.5">
                {nurses.map((nurse) => (
                  <div
                    key={nurse.id}
                    title={`${nurse.name} (${nurse.role})`}
                    className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-700 ring-1 ring-blue-300 shadow-2xs"
                  >
                    <User className="w-3.5 h-3.5" />
                  </div>
                ))}
              </div>
              <span className="text-[11px] text-blue-700 font-semibold pl-1">3 Nurses Active</span>
            </div>

            {/* Sound Mute Toggle */}
            <button
              onClick={onToggleMute}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                isMuted
                  ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
              }`}
              title={isMuted ? 'Unmute Audio Alarms' : 'Mute Audio Alarms'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
              <span className="text-[11px] font-semibold hidden sm:inline">
                {isMuted ? 'Muted' : 'Sound On'}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between overflow-x-auto py-2">
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'live'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-4 h-4 text-blue-600" />
              Live Room Camera &amp; AI
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>

            <button
              onClick={() => setActiveTab('facility')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'facility'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 text-slate-500" />
              Memory Care Wing (4 Rooms)
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'alerts'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-4 h-4 text-orange-500" />
              Intervention Dispatch
              {pendingAlerts.length > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    criticalCount > 0
                      ? 'bg-rose-600 text-white animate-bounce'
                      : nurseAlertCount > 0
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {pendingAlerts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('log')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'log'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Heart className="w-4 h-4 text-rose-500" />
              Shift Handover Log
            </button>
          </nav>

          <div className="hidden md:flex items-center text-xs text-slate-500 gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Nurse Station East Wing &bull; Live Optical Guardian</span>
          </div>
        </div>
      </div>
    </header>
  );
};
