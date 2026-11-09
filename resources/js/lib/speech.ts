import { readFlag, writeFlag } from './storage';
import type { Operation } from '../types';

const MUTE_KEY = 'dandan.muted';

let muted = readFlag(MUTE_KEY, false);
let cachedVoice: SpeechSynthesisVoice | null | undefined;

export function isSpeechSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isMuted(): boolean {
    return muted;
}

export function setMuted(value: boolean): void {
    muted = value;
    writeFlag(MUTE_KEY, value);
    if (value && isSpeechSupported()) {
        window.speechSynthesis.cancel();
    }
}

/** Find an installed Hebrew voice. Voices load asynchronously in some browsers. */
export function hebrewVoice(): SpeechSynthesisVoice | null {
    if (!isSpeechSupported()) return null;
    if (cachedVoice) return cachedVoice;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    cachedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('he') || v.lang.toLowerCase().startsWith('iw')) ?? null;
    return cachedVoice;
}

export function onVoicesReady(callback: () => void): () => void {
    if (!isSpeechSupported()) return () => {};
    const handler = () => {
        cachedVoice = undefined;
        callback();
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handler);
}

export function speak(text: string, options: { force?: boolean } = {}): void {
    if (!isSpeechSupported() || (muted && !options.force)) return;

    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'he-IL';
    const voice = hebrewVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    synth.speak(utterance);
}

export function stopSpeaking(): void {
    if (isSpeechSupported()) window.speechSynthesis.cancel();
}

export function questionText(a: number, operation: Operation, b: number): string {
    return `כמה זה ${a} ${operation === '+' ? 'ועוד' : 'פחות'} ${b}?`;
}

function pick<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

export const phrases = {
    correct: () => pick(['כל הכבוד!', 'מעולה!', 'יפה מאוד!', 'נכון!', 'אלוף!', 'וואו, נכון!']),
    tryAgain: () => pick(['כמעט! נסה שוב', 'לא נורא, נסה עוד פעם', 'בוא נספור יחד ונסה שוב']),
};
