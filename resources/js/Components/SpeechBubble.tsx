import type { ReactNode } from 'react';

export default function SpeechBubble({ children }: { children: ReactNode }) {
    return (
        <div className="relative max-w-sm rounded-3xl bg-white px-6 py-4 text-2xl font-semibold leading-snug shadow-lg">
            {children}
            <span className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rotate-45 bg-white" aria-hidden />
        </div>
    );
}
