import { useMemo } from 'react';

const COLORS = ['#f43f5e', '#f59e0b', '#22c55e', '#0ea5e9', '#a855f7', '#facc15'];

export default function Confetti({ pieces = 60 }: { pieces?: number }) {
    const items = useMemo(
        () =>
            Array.from({ length: pieces }, (_, i) => ({
                left: Math.random() * 100,
                delay: Math.random() * 600,
                duration: 1800 + Math.random() * 1400,
                color: COLORS[i % COLORS.length],
                size: 8 + Math.random() * 8,
                round: Math.random() > 0.5,
            })),
        [pieces],
    );

    return (
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
            {items.map((p, i) => (
                <span
                    key={i}
                    className="absolute top-0 block"
                    style={{
                        left: `${p.left}%`,
                        width: p.size,
                        height: p.round ? p.size : p.size * 0.5,
                        background: p.color,
                        borderRadius: p.round ? '50%' : 2,
                        animation: `confettiFall ${p.duration}ms ease-in ${p.delay}ms forwards`,
                    }}
                />
            ))}
        </div>
    );
}
