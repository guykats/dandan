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

// Resolves the sentence that is playing right now (when it ends, fails or is stopped).
let finishCurrent: (() => void) | null = null;
// Chain of the current and queued sentences.
let busy: Promise<void> = Promise.resolve();

// Longest a sentence may hold the queue, in case an "ended" event never arrives
// (some browsers never fire it for their built-in voices). Scales with the sentence length.
function maxSentenceMs(text: string): number {
    return Math.min(9000, 2000 + text.length * 120);
}

function speakWithBrowser(text: string, done: () => void): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        done();
        return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'he-IL';
    const voice = hebrewVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = done;
    utterance.onerror = done;
    synth.speak(utterance);
}

/** Play one sentence; the promise resolves when it has finished (or was stopped). */
function play(text: string, token: number): Promise<void> {
    return new Promise<void>((resolve) => {
        let settled = false;
        const done = () => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timer);
            if (finishCurrent === done) finishCurrent = null;
            resolve();
        };
        const timer = window.setTimeout(done, maxSentenceMs(text));
        finishCurrent = done;

        const audio = serverVoice ? sharedPlayer() : null;
        if (!audio) {
            speakWithBrowser(text, done);
            return;
        }

        // Reusing one element keeps playback allowed on phones after the first tap.
        audio.onended = done;
        audio.onerror = () => {
            // The server couldn't produce audio (not configured, quota, network): use the browser voice.
            if (token === playToken) speakWithBrowser(text, done);
            else done();
        };
        audio.src = ttsUrl(text);
        audio.play().catch((error: unknown) => {
            const name = error instanceof DOMException ? error.name : '';
            // Autoplay blocked before the first tap, or replaced by a newer sentence: just move on.
            if (name === 'NotAllowedError' || name === 'AbortError' || token !== playToken) {
                done();
                return;
            }
            speakWithBrowser(text, done);
        });
    });
}

/**
 * Speak a sentence. By default it interrupts whatever is playing;
 * with `queue: true` it waits for the current sentence to finish first
 * (used when moving to the next exercise or screen, so nothing gets cut off).
 */
export function speak(text: string, options: { force?: boolean; queue?: boolean } = {}): Promise<void> {
    if (muted && !options.force) return Promise.resolve();

    if (options.queue) {
        const token = playToken;
        busy = busy.then(() => (token === playToken ? play(text, token) : undefined));
        return busy;
    }

    stopSpeaking();
    const token = playToken;
    busy = play(text, token);
    return busy;
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
    finishCurrent?.();
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
