import type { ReactNode } from 'react';

export type WorldId = 'sea' | 'savanna' | 'jungle';

export const WORLDS: { id: WorldId; name: string; bg: string }[] = [
    { id: 'sea', name: 'עולם הים', bg: 'from-sky-300 to-blue-500' },
    { id: 'savanna', name: 'הסוואנה', bg: 'from-amber-200 to-orange-400' },
    { id: 'jungle', name: 'הג׳ונגל', bg: 'from-lime-300 to-emerald-600' },
];

/** Cute shared eyes: white, pupil, shine. */
function Eyes({ x1, x2, y, r = 7 }: { x1: number; x2: number; y: number; r?: number }) {
    return (
        <g>
            {[x1, x2].map((x) => (
                <g key={x}>
                    <circle cx={x} cy={y} r={r} fill="#fff" />
                    <circle cx={x + r * 0.15} cy={y + r * 0.15} r={r * 0.6} fill="#1f2937" />
                    <circle cx={x + r * 0.35} cy={y - r * 0.2} r={r * 0.22} fill="#fff" />
                </g>
            ))}
        </g>
    );
}

function Smile({ x, y, w = 10 }: { x: number; y: number; w?: number }) {
    return <path d={`M${x - w / 2} ${y} q${w / 2} ${w * 0.6} ${w} 0`} stroke="#1f2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
}

function Cheeks({ x1, x2, y }: { x1: number; x2: number; y: number }) {
    return (
        <g fill="#fda4af" opacity="0.7">
            <ellipse cx={x1} cy={y} rx="5" ry="3.5" />
            <ellipse cx={x2} cy={y} rx="5" ry="3.5" />
        </g>
    );
}

export const STICKERS: { id: string; name: string; world: WorldId; art: ReactNode }[] = [
    // Sea
    {
        id: 'fish', name: 'דג', world: 'sea',
        art: (
            <g>
                <path d="M78 50 l16 -14 v28 z" fill="#fb923c" />
                <ellipse cx="48" cy="50" rx="32" ry="22" fill="#fdba74" />
                <path d="M40 30 q10 -12 22 0" fill="#fb923c" />
                <path d="M52 40 v20 M60 42 v16" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" />
                <Eyes x1={30} x2={30.01} y={45} r={8} />
                <Smile x={28} y={58} w={8} />
            </g>
        ),
    },
    {
        id: 'octopus', name: 'תמנון', world: 'sea',
        art: (
            <g>
                {[22, 36, 50, 64, 78].map((x, i) => (
                    <path key={x} d={`M${x} 56 q${i % 2 ? 6 : -6} 14 0 26`} stroke="#c084fc" strokeWidth="9" fill="none" strokeLinecap="round" />
                ))}
                <ellipse cx="50" cy="42" rx="30" ry="28" fill="#d8b4fe" />
                <Eyes x1={40} x2={60} y={40} />
                <Cheeks x1={30} x2={70} y={52} />
                <Smile x={50} y={54} />
            </g>
        ),
    },
    {
        id: 'turtle', name: 'צב', world: 'sea',
        art: (
            <g>
                <ellipse cx="22" cy="72" rx="9" ry="6" fill="#86efac" />
                <ellipse cx="74" cy="72" rx="9" ry="6" fill="#86efac" />
                <circle cx="82" cy="46" r="13" fill="#86efac" />
                <path d="M16 64 a34 30 0 0 1 64 0 z" fill="#15803d" />
                <path d="M30 62 l8 -16 h18 l8 16 M38 46 l10 -12 l10 12" stroke="#4ade80" strokeWidth="3" fill="none" />
                <Eyes x1={80} x2={88} y={43} r={4.5} />
                <Smile x={85} y={51} w={6} />
            </g>
        ),
    },
    {
        id: 'whale', name: 'לווייתן', world: 'sea',
        art: (
            <g>
                <path d="M50 18 q-4 -10 -10 -8 M50 18 q4 -10 10 -8" stroke="#7dd3fc" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M84 52 l12 -14 l-2 22 z" fill="#3b82f6" />
                <path d="M10 52 C10 28, 40 22, 62 28 C 80 34, 90 44, 86 60 C 80 76, 20 80, 10 52 Z" fill="#60a5fa" />
                <path d="M14 58 C 30 72, 70 72, 84 60" fill="#dbeafe" />
                <Eyes x1={28} x2={44} y={44} r={6} />
                <Cheeks x1={22} x2={50} y={54} />
            </g>
        ),
    },
    // Savanna
    {
        id: 'giraffe', name: 'ג׳ירפה', world: 'savanna',
        art: (
            <g>
                <rect x="42" y="40" width="16" height="52" rx="7" fill="#fcd34d" />
                <circle cx="48" cy="58" r="3.5" fill="#d97706" /><circle cx="54" cy="74" r="3" fill="#d97706" />
                <path d="M40 14 v-8 M60 14 v-8" stroke="#b45309" strokeWidth="4" strokeLinecap="round" />
                <ellipse cx="50" cy="28" rx="20" ry="18" fill="#fcd34d" />
                <ellipse cx="50" cy="38" rx="13" ry="8" fill="#fde68a" />
                <circle cx="62" cy="20" r="3" fill="#d97706" />
                <Eyes x1={42} x2={58} y={24} r={5.5} />
                <Smile x={50} y={39} w={7} />
            </g>
        ),
    },
    {
        id: 'elephant', name: 'פיל', world: 'savanna',
        art: (
            <g>
                <ellipse cx="22" cy="44" rx="16" ry="20" fill="#94a3b8" />
                <ellipse cx="78" cy="44" rx="16" ry="20" fill="#94a3b8" />
                <ellipse cx="22" cy="44" rx="9" ry="13" fill="#fbcfe8" />
                <ellipse cx="78" cy="44" rx="9" ry="13" fill="#fbcfe8" />
                <circle cx="50" cy="46" r="28" fill="#cbd5e1" />
                <path d="M50 56 q-2 24 12 28" stroke="#cbd5e1" strokeWidth="11" fill="none" strokeLinecap="round" />
                <Eyes x1={40} x2={60} y={40} r={6} />
                <Cheeks x1={34} x2={66} y={54} />
            </g>
        ),
    },
    {
        id: 'zebra', name: 'זברה', world: 'savanna',
        art: (
            <g>
                <path d="M34 18 l-6 -12 l12 6 M66 18 l6 -12 l-12 6" fill="#f8fafc" stroke="#1f2937" strokeWidth="2" />
                <ellipse cx="50" cy="44" rx="26" ry="30" fill="#f8fafc" stroke="#1f2937" strokeWidth="2" />
                <path d="M30 30 h12 M28 42 h10 M62 42 h10 M58 30 h12 M46 18 v10 M54 18 v10" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
                <ellipse cx="50" cy="64" rx="16" ry="11" fill="#e2e8f0" stroke="#1f2937" strokeWidth="2" />
                <circle cx="44" cy="63" r="2" fill="#1f2937" /><circle cx="56" cy="63" r="2" fill="#1f2937" />
                <Eyes x1={40} x2={60} y={42} r={6} />
            </g>
        ),
    },
    {
        id: 'hippo', name: 'היפופוטם', world: 'savanna',
        art: (
            <g>
                <circle cx="30" cy="20" r="7" fill="#a78bfa" /><circle cx="70" cy="20" r="7" fill="#a78bfa" />
                <ellipse cx="50" cy="38" rx="28" ry="22" fill="#c4b5fd" />
                <ellipse cx="50" cy="64" rx="34" ry="22" fill="#ddd6fe" />
                <circle cx="38" cy="58" r="3" fill="#7c3aed" /><circle cx="62" cy="58" r="3" fill="#7c3aed" />
                <path d="M34 72 q16 10 32 0" stroke="#1f2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <Eyes x1={40} x2={60} y={34} r={6} />
            </g>
        ),
    },
    // Jungle
    {
        id: 'monkey', name: 'קוף', world: 'jungle',
        art: (
            <g>
                <circle cx="20" cy="44" r="11" fill="#a16207" /><circle cx="80" cy="44" r="11" fill="#a16207" />
                <circle cx="20" cy="44" r="6" fill="#fde68a" /><circle cx="80" cy="44" r="6" fill="#fde68a" />
                <circle cx="50" cy="46" r="30" fill="#a16207" />
                <path d="M30 50 C 30 30, 46 30, 50 40 C 54 30, 70 30, 70 50 C 70 70, 30 70, 30 50 Z" fill="#fde68a" />
                <Eyes x1={42} x2={58} y={44} r={6} />
                <Smile x={50} y={58} w={12} />
            </g>
        ),
    },
    {
        id: 'parrot', name: 'תוכי', world: 'jungle',
        art: (
            <g>
                <path d="M40 74 l-6 20 M50 76 l0 20 M60 74 l6 20" stroke="#2563eb" strokeWidth="7" strokeLinecap="round" />
                <ellipse cx="50" cy="56" rx="22" ry="26" fill="#ef4444" />
                <path d="M30 56 q-8 18 8 26 l6 -22 z" fill="#facc15" />
                <path d="M70 56 q8 18 -8 26 l-6 -22 z" fill="#22c55e" />
                <circle cx="50" cy="32" r="20" fill="#ef4444" />
                <path d="M44 38 q6 -6 12 0 q-2 12 -6 14 q-4 -2 -6 -14 z" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
                <Eyes x1={42} x2={58} y={28} r={5.5} />
            </g>
        ),
    },
    {
        id: 'frog', name: 'צפרדע', world: 'jungle',
        art: (
            <g>
                <circle cx="34" cy="30" r="13" fill="#4ade80" /><circle cx="66" cy="30" r="13" fill="#4ade80" />
                <ellipse cx="50" cy="56" rx="34" ry="26" fill="#4ade80" />
                <ellipse cx="50" cy="66" rx="22" ry="12" fill="#bbf7d0" />
                <Eyes x1={34} x2={66} y={30} r={8} />
                <path d="M34 54 q16 12 32 0" stroke="#166534" strokeWidth="3" fill="none" strokeLinecap="round" />
                <Cheeks x1={24} x2={76} y={52} />
            </g>
        ),
    },
    {
        id: 'butterfly', name: 'פרפר', world: 'jungle',
        art: (
            <g>
                <path d="M46 30 q-8 -16 -14 -18 M54 30 q8 -16 14 -18" stroke="#1f2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <ellipse cx="28" cy="40" rx="22" ry="18" fill="#f472b6" />
                <ellipse cx="72" cy="40" rx="22" ry="18" fill="#f472b6" />
                <ellipse cx="32" cy="70" rx="16" ry="13" fill="#38bdf8" />
                <ellipse cx="68" cy="70" rx="16" ry="13" fill="#38bdf8" />
                <circle cx="26" cy="40" r="7" fill="#fde047" /><circle cx="74" cy="40" r="7" fill="#fde047" />
                <rect x="44" y="30" width="12" height="52" rx="6" fill="#7c3aed" />
                <Eyes x1={47} x2={53} y={36} r={3.5} />
            </g>
        ),
    },
];

export function StickerArt({ index, locked = false }: { index: number; locked?: boolean }) {
    const sticker = STICKERS[index];

    return (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
            {locked ? (
                <g>
                    <circle cx="50" cy="50" r="40" fill="#ffffff" opacity="0.35" />
                    <text x="50" y="66" textAnchor="middle" fontSize="48" fontWeight="700" fill="#ffffff">?</text>
                </g>
            ) : (
                sticker.art
            )}
        </svg>
    );
}
