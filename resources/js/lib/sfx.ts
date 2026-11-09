import { isMuted } from './speech';

// Tiny synthesized sound effects (no audio files needed).
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
    if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = 'sine', volume = 0.18): void {
    const ac = audio();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t = ac.currentTime + start;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + duration + 0.05);
}

export function playCorrect(): void {
    if (isMuted()) return;
    tone(660, 0, 0.18, 'triangle');
    tone(880, 0.1, 0.25, 'triangle');
}

export function playWrong(): void {
    if (isMuted()) return;
    tone(300, 0, 0.18, 'sine', 0.12);
    tone(250, 0.12, 0.22, 'sine', 0.12);
}

export function playFanfare(): void {
    if (isMuted()) return;
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle'));
}
