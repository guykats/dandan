import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';

const HOLD_MS = 1500;

/** Small gear that opens the parent area only after a long press, so the child won't wander in. */
export default function ParentCorner() {
    const [progress, setProgress] = useState(0);
    const frame = useRef<number | null>(null);
    const startedAt = useRef(0);

    const stop = () => {
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        frame.current = null;
        setProgress(0);
    };

    const tick = () => {
        const p = Math.min(1, (performance.now() - startedAt.current) / HOLD_MS);
        setProgress(p);
        if (p >= 1) {
            stop();
            router.visit('/parent');
            return;
        }
        frame.current = requestAnimationFrame(tick);
    };

    const start = () => {
        startedAt.current = performance.now();
        frame.current = requestAnimationFrame(tick);
    };

    const circumference = 2 * Math.PI * 18;

    return (
        <button
            type="button"
            onPointerDown={start}
            onPointerUp={stop}
            onPointerLeave={stop}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/50 text-sky-800/60 hover:bg-white/80"
            aria-label="אזור הורים (לחיצה ארוכה)"
            title="אזור הורים — לחיצה ארוכה"
        >
            <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden>
                <circle cx="22" cy="22" r="18" fill="none" stroke="#0ea5e9" strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} strokeLinecap="round" />
            </svg>
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
            </svg>
        </button>
    );
}
