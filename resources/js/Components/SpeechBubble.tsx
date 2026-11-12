import type { ReactNode } from 'react';

export default function SpeechBubble({ children }: { children: ReactNode }) {
    return (
        <div className="relative max-w-sm rounded-3xl bg-white px-5 py-3 text-center text-xl font-semibold leading-snug shadow-lg sm:px-6 sm:py-4 sm:text-right sm:text-2xl">
            {children}
            <span className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rotate-45 bg-white sm:top-1/2 sm:-right-3 sm:left-auto sm:-translate-x-0 sm:-translate-y-1/2" aria-hidden />
        </div>
    );
}
