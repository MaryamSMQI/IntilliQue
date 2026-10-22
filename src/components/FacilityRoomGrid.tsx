import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Eye, 
  MessageSquare, 
  Heart,
  UserCheck,
  User
} from 'lucide-react';
import { PatientRoom } from '../types';

interface FacilityRoomGridProps {
  rooms: PatientRoom[];
  selectedRoomId: string;
  onSelectRoom: (roomId: string) => void;
  onOpenIntercomForRoom: (room: PatientRoom) => void;
  onDispatchNurse: (room: PatientRoom) => void;
}

export const FacilityRoomGrid: React.FC<FacilityRoomGridProps> = ({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onOpenIntercomForRoom,
  onDispatchNurse,
}) => {
  return (
    <div className="space-y-4">
      {/* Unit Summary Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Memory Care Wing: East Corridor (4 Monitored Suites)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Optical monitoring active. Nurses alerted immediately on task interruption or fall risk.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Active Routines</span>
            <span className="text-blue-700 font-extrabold text-sm">3 Scheduled Meds</span>
          </div>
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Wing Comfort Index</span>
            <span className="text-emerald-600 font-extrabold text-sm">91% Average Calm</span>
          </div>
        </div>
      </div>

      {/* Grid of Resident Rooms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {rooms.map((room) => {
          const isSelected = room.id === selectedRoomId;
          const isInterrupted = room.interruptionType !== 'NONE';
          const isCompleted = room.taskStatus === 'COMPLETED';
          const isCritical = room.severity === 'CRITICAL_URGENT';

          return (
            <div
              key={room.id}
              className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between shadow-xs ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-100 shadow-md'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              {/* Room Card Top */}
              <div>
                {/* Header badge & Room number */}
                <div className="p-3.5 pb-2.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-white text-blue-700 border border-slate-200 shadow-2xs">
                      Room {room.roomNumber}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCritical
                          ? 'bg-rose-500 animate-ping'
                          : isInterrupted
                          ? 'bg-orange-500'
                          : isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-blue-500 animate-pulse'
                      }`}
                    ></span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isCritical
                        ? 'bg-rose-100 text-rose-800'
                        : isInterrupted
                        ? 'bg-orange-100 text-orange-800'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isCompleted
                      ? 'Completed'
                      : isInterrupted
                      ? room.interruptionType.replace('_', ' ')
                      : 'In Progress'}
                  </span>
                </div>

                {/* Resident Profile Info */}
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-100 via-indigo-50 to-orange-50 border-2 border-white flex items-center justify-center text-blue-700 shadow-2xs shrink-0 ring-1 ring-slate-200/80">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {room.name}
                      </h3>
                      <p className="text-xs text-slate-500">{room.condition}</p>
                      <span className="text-[10px] text-slate-400">Age: {room.age}</span>
                    </div>
                  </div>

                  {/* Active Routine & Step */}
                  <div className="mt-3.5 bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-semibold">Scheduled Task:</span>
                      <span className="font-mono text-blue-700 font-bold">{room.scheduledTime}</span>
                    </div>
                    <div className="font-bold text-slate-800 line-clamp-1">
                      {room.activeTask}
                    </div>

                    {/* Step progress mini bar */}
                    <div className="mt-2.5">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-medium">
                        <span>Milestone:</span>
                        <span className="font-mono text-slate-900 font-bold">
                          Step {room.currentStep} of 5
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <div
                            key={s}
                            className={`flex-1 border-r border-white last:border-none ${
                              s <= room.currentStep
                                ? isInterrupted && s === room.currentStep
                                  ? 'bg-orange-500'
                                  : 'bg-emerald-500'
                                : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Avoided Intrusions & Comfort Metric */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-600 text-[11px] flex items-center gap-1 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                      Intrusions Avoided:
                    </span>
                    <span className="font-extrabold text-orange-600">
                      {room.intrusionsAvoidedToday} today
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-slate-600 text-[11px] flex items-center gap-1 font-medium">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      Comfort Index:
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {room.comfortScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Controls */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center gap-1.5">
                <button
                  onClick={() => onSelectRoom(room.id)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {isSelected ? 'Monitoring Live' : 'View Feed'}
                </button>

                <button
                  onClick={() => onOpenIntercomForRoom(room)}
                  className="p-1.5 rounded-xl bg-white hover:bg-orange-50 hover:text-orange-600 text-slate-600 border border-slate-200 shadow-2xs transition-all"
                  title="Send Gentle Room Voice Prompt"
                >
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                </button>

                <button
                  onClick={() => onDispatchNurse(room)}
                  className="p-1.5 rounded-xl bg-white hover:bg-blue-50 hover:text-blue-600 text-slate-600 border border-slate-200 shadow-2xs transition-all"
                  title="Dispatch Nurse Visit"
                >
                  <UserCheck className="w-4 h-4 text-blue-600" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
