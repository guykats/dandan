import { readFlag, writeFlag } from './storage';

const MUTE_KEY = 'dandan.muted';

let muted = readFlag(MUTE_KEY, false);
let cachedVoice: SpeechSynthesisVoice | null | undefined;

// Server-side voice (Azure). When set, speech is played from /tts audio files.
let serverVoice: string | null = null;
let currentAudio: HTMLAudioElement | null = null;

export function configureServerVoice(voice: string | null | undefined): void {
    serverVoice = voice ?? null;
}

export function getServerVoice(): string | null {
    return serverVoice;
}

export function isSpeechSupported(): boolean {
    return serverVoice !== null || (typeof window !== 'undefined' && 'speechSynthesis' in window);
}

export function isMuted(): boolean {
    return muted;
}

export function setMuted(value: boolean): void {
    muted = value;
    writeFlag(MUTE_KEY, value);
    if (value) stopSpeaking();
}

/** Find an installed Hebrew browser voice. Voices load asynchronously in some browsers. */
export function hebrewVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    if (cachedVoice) return cachedVoice;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    cachedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('he') || v.lang.toLowerCase().startsWith('iw')) ?? null;
    return cachedVoice;
}

export function onVoicesReady(callback: () => void): () => void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return () => {};
    const handler = () => {
        cachedVoice = undefined;
        callback();
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handler);
}

function ttsUrl(text: string): string {
    return `/tts?t=${encodeURIComponent(text)}`;
}

function speakWithBrowser(text: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

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

export function speak(text: string, options: { force?: boolean } = {}): void {
    if (muted && !options.force) return;
    stopSpeaking();

    if (!serverVoice) {
        speakWithBrowser(text);
        return;
    }

    const audio = new Audio(ttsUrl(text));
    currentAudio = audio;

    // If the server can't produce audio (not configured, quota, network), fall back to the browser voice.
    audio.addEventListener('error', () => {
        if (currentAudio === audio) speakWithBrowser(text);
    });

    audio.play().catch((error: unknown) => {
        // Autoplay blocked before the first click: nothing to do, the next click will work.
        if (error instanceof DOMException && error.name === 'NotAllowedError') return;
        if (currentAudio === audio) speakWithBrowser(text);
    });
}

/** Warm the server cache and the browser cache for upcoming sentences. */
export function prefetchSpeech(texts: string[]): void {
    if (!serverVoice) return;
    for (const text of texts) {
        void fetch(ttsUrl(text)).catch(() => {});
    }
}

export function stopSpeaking(): void {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}

function pick<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

export const PHRASES = {
    correct: ['כל הכבוד!', 'מעולה!', 'יפה מאוד!', 'נכון!', 'אלוף!', 'וואו, נכון!'],
    tryAgain: ['כמעט! נסה שוב', 'לא נורא, נסה עוד פעם', 'בוא נספור יחד ונסה שוב'],
};

export const phrases = {
    correct: () => pick(PHRASES.correct),
    tryAgain: () => pick(PHRASES.tryAgain),
};
