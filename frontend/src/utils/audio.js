// Web Audio API Synthesizer Engine for CareFlow Kiosk

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browser security policy)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export const playClick = () => {
  try {
    const ctx = getAudioContext();
    const time = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, time);
    osc.frequency.exponentialRampToValueAtTime(300, time + 0.05);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  } catch (e) {
    console.warn("Audio Context blocked or unsupported:", e);
  }
};

export const playSuccess = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Play an ascending medical/success chime (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const duration = 0.15;
    const spacing = 0.12;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + (idx * spacing);

      osc.type = "triangle"; // Warm, clean tone
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.0, noteTime);
      gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + duration);
    });
  } catch (e) {
    console.warn("Chime failed to play:", e);
  }
};

export const playPrintChime = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Simulate mechanical printer sound (low buzzing burst)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(85, now);
    osc.frequency.linearRampToValueAtTime(75, now + 0.6);

    gain.gain.setValueAtTime(0.04, now);
    // Add a slight volume vibration (simulating paper feeding)
    gain.gain.setValueAtTime(0.04, now + 0.1);
    gain.gain.linearRampToValueAtTime(0.02, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  } catch (e) {
    console.warn("Printer chime failed:", e);
  }
};
