import type { World } from '../types';

/** Decorative background for each journey world (viewBox 1000 x 520). */
export default function WorldScene({ world }: { world: World['id'] }) {
    return (
        <svg viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
            {scenes[world]}
        </svg>
    );
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity="0.9">
            <ellipse cx="0" cy="0" rx="46" ry="22" />
            <ellipse cx="-34" cy="8" rx="30" ry="16" />
            <ellipse cx="36" cy="8" rx="32" ry="17" />
        </g>
    );
}

const scenes: Record<World['id'], React.ReactNode> = {
    sea: (
        <>
            <defs>
                <linearGradient id="sea-bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7dd3fc" />
                    <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>
            </defs>
            <rect width="1000" height="520" fill="url(#sea-bg)" />
            {[60, 140, 220].map((y, i) => (
                <path key={y} d={`M0 ${y} q50 -18 100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0`} stroke="#bae6fd" strokeWidth="4" fill="none" opacity={0.5 - i * 0.12} />
            ))}
            <path d="M0 470 q120 -40 250 -10 t260 0 t250 -20 t240 10 v70 h-1000z" fill="#fcd34d" opacity="0.85" />
            {[[120, 300], [880, 240], [520, 120], [300, 180], [760, 420]].map(([x, y]) => (
                <g key={`${x}-${y}`} fill="none" stroke="#e0f2fe" strokeWidth="2" opacity="0.7">
                    <circle cx={x} cy={y} r="8" />
                    <circle cx={x + 14} cy={y - 18} r="5" />
                    <circle cx={x + 4} cy={y - 32} r="3" />
                </g>
            ))}
            <path d="M60 520 q10 -60 -10 -110 M80 520 q20 -50 0 -90" stroke="#16a34a" strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M940 520 q-12 -70 10 -120 M915 520 q-10 -40 6 -80" stroke="#16a34a" strokeWidth="8" fill="none" strokeLinecap="round" />
        </>
    ),
    savanna: (
        <>
            <defs>
                <linearGradient id="savanna-bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
            </defs>
            <rect width="1000" height="520" fill="url(#savanna-bg)" />
            <circle cx="160" cy="90" r="56" fill="#fef3c7" opacity="0.9" />
            <path d="M0 330 q200 -60 420 -10 t580 -20 v220 h-1000z" fill="#d97706" opacity="0.35" />
            <path d="M0 400 q250 -40 500 0 t500 -10 v130 h-1000z" fill="#b45309" opacity="0.3" />
            {[[820, 270, 1], [90, 330, 0.8]].map(([x, y, s]) => (
                <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
                    <rect x="-7" y="0" width="14" height="110" fill="#78350f" />
                    <ellipse cx="0" cy="-6" rx="95" ry="26" fill="#65a30d" />
                    <ellipse cx="-30" cy="-26" rx="50" ry="16" fill="#84cc16" />
                </g>
            ))}
            {[[300, 470], [620, 455], [930, 480]].map(([x, y]) => (
                <path key={x} d={`M${x} ${y} l-10 -30 M${x} ${y} l0 -36 M${x} ${y} l10 -30`} stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
            ))}
        </>
    ),
    jungle: (
        <>
            <defs>
                <linearGradient id="jungle-bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#86efac" />
                    <stop offset="100%" stopColor="#15803d" />
                </linearGradient>
            </defs>
            <rect width="1000" height="520" fill="url(#jungle-bg)" />
            {[[-20, 40, 0], [1020, 60, 180], [-30, 420, 10], [1030, 440, 170]].map(([x, y, r]) => (
                <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${r})`}>
                    <ellipse cx="80" cy="0" rx="90" ry="28" fill="#166534" />
                    <ellipse cx="70" cy="40" rx="70" ry="22" fill="#15803d" transform="rotate(20 70 40)" />
                    <ellipse cx="60" cy="-40" rx="70" ry="22" fill="#16a34a" transform="rotate(-20 60 -40)" />
                </g>
            ))}
            {[200, 480, 760].map((x) => (
                <path key={x} d={`M${x} 0 q20 60 -6 120 q-20 50 10 90`} stroke="#4d7c0f" strokeWidth="6" fill="none" strokeLinecap="round" />
            ))}
            {[[350, 90], [640, 60], [880, 300], [120, 260]].map(([x, y]) => (
                <g key={x} transform={`translate(${x} ${y})`}>
                    {[0, 72, 144, 216, 288].map((r) => (
                        <ellipse key={r} cx="0" cy="-9" rx="6" ry="10" fill="#f472b6" transform={`rotate(${r})`} />
                    ))}
                    <circle r="5" fill="#fde047" />
                </g>
            ))}
        </>
    ),
    mountains: (
        <>
            <defs>
                <linearGradient id="mountain-bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c7d2fe" />
                    <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
            </defs>
            <rect width="1000" height="520" fill="url(#mountain-bg)" />
            <Cloud x={220} y={70} s={0.8} />
            <Cloud x={780} y={50} />
            <path d="M-40 520 L180 160 L400 520 Z" fill="#818cf8" />
            <path d="M180 160 L230 240 L200 230 L180 260 L160 230 L130 240 Z" fill="#fff" />
            <path d="M260 520 L560 110 L860 520 Z" fill="#6366f1" />
            <path d="M560 110 L625 200 L590 190 L560 225 L530 190 L495 200 Z" fill="#fff" />
            <path d="M640 520 L900 200 L1100 520 Z" fill="#4f46e5" />
            <path d="M900 200 L950 262 L922 255 L900 280 L878 255 L850 262 Z" fill="#fff" />
            <path d="M0 470 q250 -40 500 -10 t500 0 v60 h-1000z" fill="#a5b4fc" />
        </>
    ),
    sky: (
        <>
            <defs>
                <linearGradient id="sky-bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#e0f2fe" />
                </linearGradient>
            </defs>
            <rect width="1000" height="520" fill="url(#sky-bg)" />
            {['#f43f5e', '#f59e0b', '#facc15', '#22c55e', '#3b82f6', '#a855f7'].map((c, i) => (
                <path key={c} d={`M${120 + i * 14} 520 A ${380 - i * 14} ${380 - i * 14} 0 0 1 ${880 - i * 14} 520`} stroke={c} strokeWidth="14" fill="none" opacity="0.35" />
            ))}
            <circle cx="880" cy="80" r="50" fill="#fde047" />
            <Cloud x={150} y={110} />
            <Cloud x={520} y={70} s={0.7} />
            <Cloud x={760} y={250} s={0.9} />
            <Cloud x={300} y={430} s={1.2} />
            <Cloud x={880} y={460} s={1} />
        </>
    ),
};
