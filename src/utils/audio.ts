// Audio utilities for gentle dementia patient prompts and nurse alerts

class SoundService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Soothing two-tone chime for gentle patient room guidance
  public playGentleChime(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Tone 1: E4 (329.6 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(329.63, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 1.2);

      // Tone 2: G#4 (415.3 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(415.3, now + 0.25);
      gain2.gain.setValueAtTime(0, now + 0.25);
      gain2.gain.linearRampToValueAtTime(0.16, now + 0.3);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 1.6);

      // Tone 3: B4 (493.88 Hz) warm major chord resolution
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(493.88, now + 0.5);
      gain3.gain.setValueAtTime(0, now + 0.5);
      gain3.gain.linearRampToValueAtTime(0.15, now + 0.55);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.5);
      osc3.stop(now + 2.0);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  // Nurse station alert tone (clear 3-pulse beep for urgent safety hazard)
  public playNurseAlert(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      [0, 0.22, 0.44].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now + offset); // A5 note
        gain.gain.setValueAtTime(0.25, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.16);
      });
    } catch (e) {
      console.warn('Audio alert error:', e);
    }
  }

  // Play base64 WAV from server or fallback to SpeechSynthesis
  public async speakGentlePrompt(text: string, base64Audio?: string | null): Promise<void> {
    this.playGentleChime();

    // If Gemini TTS provided audio bytes
    if (base64Audio) {
      try {
        const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
        await audio.play();
        return;
      } catch (err) {
        console.warn('Failed to play base64 audio, falling back to speech synthesis:', err);
      }
    }

    // Fallback: Web Speech API with calming pacing for dementia patients
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; // slower, easier to process for cognitive decline
      utterance.pitch = 1.0;
      utterance.volume = 0.9;

      // Select gentle voice if available
      const voices = window.speechSynthesis.getVoices();
      const warmVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Samantha') ||
            v.name.includes('Victoria') ||
            v.name.includes('Google UK English Female') ||
            v.name.includes('Karen') ||
            v.name.includes('Natural'))
      );
      if (warmVoice) {
        utterance.voice = warmVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  }
}

export const soundService = new SoundService();
