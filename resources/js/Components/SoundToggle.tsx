import { useState } from 'react';
import { isMuted, setMuted } from '../lib/speech';

export default function SoundToggle() {
    const [muted, setMutedState] = useState(isMuted());

    const toggle = () => {
        setMuted(!muted);
        setMutedState(!muted);
    };

    return (
        <button
            type="button"
            onClick={toggle}
            className="toy-btn flex h-11 w-11 items-center justify-center bg-white text-sky-700 sm:h-14 sm:w-14"
            aria-label={muted ? 'הפעלת קול' : 'השתקה'}
            title={muted ? 'הפעלת קול' : 'השתקה'}
        >
            <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
                {muted ? (
                    <path d="M17 9l5 6M22 9l-5 6" />
                ) : (
                    <>
                        <path d="M16.5 8.5a5 5 0 0 1 0 7" />
                        <path d="M19 6a8.5 8.5 0 0 1 0 12" />
                    </>
                )}
            </svg>
        </button>
    );
}
