import { readFlag, writeFlag } from './storage';

const MUTE_KEY = 'dandan.muted';

let muted = readFlag(MUTE_KEY, false);
let cachedVoice: SpeechSynthesisVoice | null | undefined;

// Server-side voice (Azure). When set, speech is played from /tts audio files.
let serverVoice: string | null = null;
let player: HTMLAudioElement | null = null;
let playToken = 0;

// A tiny silent MP3, played once inside the first tap to unlock audio on iOS / Android.
const SILENT_MP3 = '/silence.mp3';

function sharedPlayer(): HTMLAudioElement | null {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
    player ??= new Audio();
    return player;
}

/** Call once from app start: the first tap unlocks the shared audio element. */
export function installAudioUnlock(): void {
    if (typeof window === 'undefined') return;
    const unlock = () => {
        const p = sharedPlayer();
        if (p && !p.src) {
            p.src = SILENT_MP3;
            p.play().catch(() => {});
        }
        // Also wake the browser speech engine on iOS.
        if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
        window.removeEventListener('pointerdown', unlock, true);
    };
    window.addEventListener('pointerdown', unlock, true);
}

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

    const audio = sharedPlayer();
    if (!audio) {
        speakWithBrowser(text);
        return;
    }

    // Reusing one element keeps playback allowed on phones after the first tap.
    const token = ++playToken;
    audio.onerror = () => {
        // The server couldn't produce audio (not configured, quota, network): use the browser voice.
        if (token === playToken) speakWithBrowser(text);
    };
    audio.src = ttsUrl(text);
    audio.play().catch((error: unknown) => {
        // Autoplay blocked before the first tap: nothing to do, the next tap will work.
        if (error instanceof DOMException && error.name === 'NotAllowedError') return;
        if (token === playToken && !(error instanceof DOMException && error.name === 'AbortError')) speakWithBrowser(text);
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
    playToken++;
    if (player && !player.paused) player.pause();
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
