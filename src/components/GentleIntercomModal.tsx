import React, { useState } from 'react';
import { 
  X, 
  Volume2, 
  Sparkles, 
  Heart, 
  Send, 
  Check, 
  Play
} from 'lucide-react';
import { PatientRoom } from '../types';

interface GentleIntercomModalProps {
  room: PatientRoom | null;
  isOpen: boolean;
  onClose: () => void;
  onSendVoicePrompt: (text: string, room: PatientRoom) => void;
}

export const GentleIntercomModal: React.FC<GentleIntercomModalProps> = ({
  room,
  isOpen,
  onClose,
  onSendVoicePrompt,
}) => {
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [sentSuccess, setSentSuccess] = useState<boolean>(false);

  if (!isOpen || !room) return null;

  const presets = [
    {
      title: 'Water Reminder',
      text: `${room.name}, your cool glass of water is right next to the medicine. Take a nice sip whenever you're ready.`,
    },
    {
      title: 'Guide Back to Table',
      text: `${room.name}, let's take a seat at your comfortable table. Your morning routine is waiting for you.`,
    },
    {
      title: 'Dropped Pill Care',
      text: `${room.name} dear, please stay right in your chair. The nurse is on her way to hand you a fresh pill.`,
    },
    {
      title: 'Praise & Reassure',
      text: `Wonderful job ${room.name}! You did great. Relax and enjoy your morning.`,
    },
    {
      title: 'Gentle Orientation',
      text: `Good morning ${room.name}. Today is a peaceful day. You are safe in your room.`,
    },
  ];

  const handleSelectPreset = (text: string) => {
    setCustomPrompt(text);
  };

  const handleBroadcast = (textToSend?: string) => {
    const finalPrompt = textToSend || customPrompt || presets[0].text;
    onSendVoicePrompt(finalPrompt, room);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-2xs">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                Room {room.roomNumber} Ambient Speaker Intercom
              </h3>
              <p className="text-xs text-slate-500">
                Resident: <strong className="text-slate-800">{room.name}</strong> &bull; Non-Intrusive Guidance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Clinical rationale banner */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-orange-950">
            <Heart className="w-4 h-4 shrink-0 text-orange-500 mt-0.5" />
            <div>
              <strong className="font-bold block text-orange-900">
                Preserving Resident Comfort Zone
              </strong>
              Speaking softly through the ambient ceiling speaker redirects 74% of task hesitations without nurses opening the door and startling the resident.
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-2">
              Select Recommended Soothing Prompt:
            </label>
            <div className="space-y-1.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(p.text)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                    customPrompt === p.text
                      ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold shadow-2xs'
                      : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-900 mr-1.5">&bull; {p.title}:</span>
                    <span className="italic text-slate-600">&ldquo;{p.text}&rdquo;</span>
                  </div>
                  <Play className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                </button>
              ))}
            </div>
          </div>

          {/* Custom text area */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              Or Customize Gentle Voice Message:
            </label>
            <textarea
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={`e.g. ${room.name}, your water is right beside you...`}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            />
          </div>
        </div>

        {/* Footer controls */}
        <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3 h-3 text-orange-500" />
            Plays soothing chime + gentle voice
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>

            <button
              onClick={() => handleBroadcast()}
              disabled={sentSuccess}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all ${
                sentSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
              }`}
            >
              {sentSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Broadcasting into Room {room.roomNumber}...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Broadcast Audio Cue
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
