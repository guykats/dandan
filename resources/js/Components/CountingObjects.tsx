import type { Operation } from '../types';

function Apple({ color, crossed = false, delay = 0 }: { color: 'red' | 'green'; crossed?: boolean; delay?: number }) {
    const fill = color === 'red' ? '#ef4444' : '#84cc16';
    const shade = color === 'red' ? '#b91c1c' : '#4d7c0f';

    return (
        <svg viewBox="0 0 40 40" className="h-11 w-11 animate-pop" style={{ animationDelay: `${delay}ms` }} aria-hidden>
            <g opacity={crossed ? 0.35 : 1}>
                <path d="M20 12 C 12 6, 3 12, 5 24 C 7 34, 15 38, 20 35 C 25 38, 33 34, 35 24 C 37 12, 28 6, 20 12 Z" fill={fill} stroke={shade} strokeWidth="1.5" />
                <ellipse cx="13" cy="19" rx="3" ry="5" fill="#fff" opacity="0.45" />
                <path d="M20 12 C 20 8, 21 5, 23 3" stroke="#78350f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M22 8 C 27 3, 32 5, 33 7 C 29 10, 25 10, 22 8 Z" fill="#22c55e" />
            </g>
            {crossed && (
                <g stroke="#1e293b" strokeWidth="4" strokeLinecap="round">
                    <line x1="8" y1="8" x2="32" y2="32" />
                    <line x1="32" y1="8" x2="8" y2="32" />
                </g>
            )}
        </svg>
    );
}

function Group({ count, color, crossedFrom = Infinity, offset = 0 }: { count: number; color: 'red' | 'green'; crossedFrom?: number; offset?: number }) {
    return (
        <div className="grid grid-cols-5 gap-1" dir="ltr">
            {Array.from({ length: count }, (_, i) => (
                <Apple key={i} color={color} crossed={i >= crossedFrom} delay={(i + offset) * 40} />
            ))}
        </div>
    );
}

interface Props {
    a: number;
    b: number;
    operation: Operation;
}

/**
 * Countable apples for an exercise. Addition shows two groups;
 * subtraction shows `a` apples with the last `b` crossed out.
 */
export default function CountingObjects({ a, b, operation }: Props) {
    return (
        <div className="flex min-h-28 items-center justify-center gap-6 rounded-3xl bg-white/70 px-6 py-4 shadow-inner" dir="ltr">
            {operation === '+' ? (
                <>
                    <Group count={a} color="red" />
                    <span className="text-5xl font-bold text-sky-700">+</span>
                    <Group count={b} color="green" offset={a} />
                </>
            ) : (
                <Group count={a} color="red" crossedFrom={a - b} />
            )}
        </div>
    );
}
