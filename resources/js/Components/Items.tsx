import type { CountItem } from '../types';

interface ItemProps {
    kind: CountItem | 'apple-green';
    className?: string;
    delay?: number;
    crossed?: boolean;
}

/** Small countable objects, drawn in the same soft style as the stickers. */
export function Item({ kind, className = 'h-11 w-11', delay = 0, crossed = false }: ItemProps) {
    return (
        <svg viewBox="0 0 40 40" className={`animate-pop ${className}`} style={{ animationDelay: `${delay}ms` }} aria-hidden>
            <g opacity={crossed ? 0.35 : 1}>{shapes[kind]}</g>
            {crossed && (
                <g stroke="#1e293b" strokeWidth="4" strokeLinecap="round">
                    <line x1="8" y1="8" x2="32" y2="32" />
                    <line x1="32" y1="8" x2="8" y2="32" />
                </g>
            )}
        </svg>
    );
}

function apple(fill: string, shade: string) {
    return (
        <>
            <path d="M20 12 C 12 6, 3 12, 5 24 C 7 34, 15 38, 20 35 C 25 38, 33 34, 35 24 C 37 12, 28 6, 20 12 Z" fill={fill} stroke={shade} strokeWidth="1.5" />
            <ellipse cx="13" cy="19" rx="3" ry="5" fill="#fff" opacity="0.45" />
            <path d="M20 12 C 20 8, 21 5, 23 3" stroke="#78350f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M22 8 C 27 3, 32 5, 33 7 C 29 10, 25 10, 22 8 Z" fill="#22c55e" />
        </>
    );
}

const shapes: Record<ItemProps['kind'], React.ReactNode> = {
    apple: apple('#ef4444', '#b91c1c'),
    'apple-green': apple('#84cc16', '#4d7c0f'),
    star: (
        <path d="M20 3l5 10.5 11.5 1.4-8.5 7.9 2.2 11.4L20 28.6 9.8 34.2 12 22.8 3.5 14.9 15 13.5z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round" />
    ),
    fish: (
        <>
            <path d="M31 20 l8 -8 v16 z" fill="#fb923c" />
            <ellipse cx="18" cy="20" rx="15" ry="11" fill="#fdba74" stroke="#ea580c" strokeWidth="1.2" />
            <circle cx="11" cy="17" r="3" fill="#fff" />
            <circle cx="11.5" cy="17.5" r="1.8" fill="#1f2937" />
        </>
    ),
    balloon: (
        <>
            <path d="M20 31 q-2 4 1 8" stroke="#64748b" strokeWidth="1.5" fill="none" />
            <ellipse cx="20" cy="16" rx="12" ry="14" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.2" />
            <path d="M17 29 h6 l-3 3 z" fill="#0284c7" />
            <ellipse cx="15" cy="11" rx="3" ry="5" fill="#fff" opacity="0.5" />
        </>
    ),
};

/** A group of items laid out in rows of five, the way first graders count. */
export function ItemGroup({ count, kind, size = 'h-7 w-7 sm:h-11 sm:w-11 short:h-6 short:w-6', crossedFrom = Infinity, offset = 0 }: { count: number; kind: ItemProps['kind']; size?: string; crossedFrom?: number; offset?: number }) {
    return (
        <div className="grid grid-cols-5 gap-0.5 sm:gap-1" dir="ltr">
            {Array.from({ length: count }, (_, i) => (
                <Item key={i} kind={kind} className={size} crossed={i >= crossedFrom} delay={(i + offset) * 40} />
            ))}
        </div>
    );
}
