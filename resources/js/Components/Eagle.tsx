export type EagleMood = 'idle' | 'cheer' | 'think' | 'encourage';

interface Props {
    mood?: EagleMood;
    size?: number;
    className?: string;
}

/**
 * DanDan the eagle: an original, soft cartoon character drawn in SVG.
 * Moods change the eyes, beak and wing motion.
 */
export default function Eagle({ mood = 'idle', size = 200, className = '' }: Props) {
    const cheering = mood === 'cheer';
    const thinking = mood === 'think';

    const wingStyle = (side: 'left' | 'right') =>
        cheering
            ? {
                  transformBox: 'fill-box' as const,
                  transformOrigin: side === 'left' ? 'right top' : 'left top',
                  animation: `${side === 'left' ? 'flapLeft' : 'flapRight'} 350ms ease-in-out infinite`,
              }
            : undefined;

    return (
        <svg
            viewBox="0 0 200 230"
            width={size}
            height={size * 1.15}
            className={`${mood === 'idle' ? 'animate-float' : ''} ${className}`}
            role="img"
            aria-label="דנדן הנשר"
        >
            <defs>
                <radialGradient id="eagle-body" cx="45%" cy="35%" r="70%">
                    <stop offset="0%" stopColor="#b8763a" />
                    <stop offset="100%" stopColor="#6b3e16" />
                </radialGradient>
                <radialGradient id="eagle-wing" cx="40%" cy="30%" r="80%">
                    <stop offset="0%" stopColor="#9a5d27" />
                    <stop offset="100%" stopColor="#5a3211" />
                </radialGradient>
                <radialGradient id="eagle-head" cx="40%" cy="30%" r="75%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="85%" stopColor="#f1f5f9" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                </radialGradient>
                <linearGradient id="eagle-beak" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fde047" />
                    <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
            </defs>

            {/* Shadow */}
            <ellipse cx="100" cy="222" rx="48" ry="6" fill="#0c4a6e" opacity="0.15" />

            {/* Wings */}
            <g style={wingStyle('left')}>
                <path d="M58 118 C 22 120, 10 160, 22 190 C 34 178, 44 176, 58 182 Z" fill="url(#eagle-wing)" />
                <path d="M24 186 l-6 14 l12 -8 M34 182 l-2 15 l9 -11" fill="#5a3211" />
            </g>
            <g style={wingStyle('right')}>
                <path d="M142 118 C 178 120, 190 160, 178 190 C 166 178, 156 176, 142 182 Z" fill="url(#eagle-wing)" />
                <path d="M176 186 l6 14 l-12 -8 M166 182 l2 15 l-9 -11" fill="#5a3211" />
            </g>

            {/* Body */}
            <ellipse cx="100" cy="155" rx="52" ry="58" fill="url(#eagle-body)" />
            <ellipse cx="100" cy="168" rx="30" ry="36" fill="#d29a5e" opacity="0.55" />
            <path d="M86 160 q6 6 12 0 M102 172 q6 6 12 0 M88 184 q6 6 12 0" stroke="#a86b33" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* Feet */}
            <g fill="#f59e0b">
                <ellipse cx="82" cy="212" rx="12" ry="6" />
                <ellipse cx="118" cy="212" rx="12" ry="6" />
            </g>

            {/* Head */}
            <g transform={thinking ? 'rotate(-8 100 82)' : undefined}>
                <path d="M88 38 l6 -16 l6 14 l6 -14 l4 16" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="100" cy="82" r="50" fill="url(#eagle-head)" />

                {/* Cheeks */}
                <ellipse cx="66" cy="98" rx="9" ry="6" fill="#fda4af" opacity="0.6" />
                <ellipse cx="134" cy="98" rx="9" ry="6" fill="#fda4af" opacity="0.6" />

                {/* Eyes */}
                {cheering ? (
                    <g stroke="#1f2937" strokeWidth="5" fill="none" strokeLinecap="round">
                        <path d="M68 78 q12 -14 24 0" />
                        <path d="M108 78 q12 -14 24 0" />
                    </g>
                ) : (
                    <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'blink 4s infinite' }}>
                        <ellipse cx="80" cy="76" rx="15" ry="17" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5" />
                        <ellipse cx="120" cy="76" rx="15" ry="17" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5" />
                        <circle cx={thinking ? 84 : 82} cy={thinking ? 70 : 79} r="9" fill="#1f2937" />
                        <circle cx={thinking ? 124 : 122} cy={thinking ? 70 : 79} r="9" fill="#1f2937" />
                        <circle cx={thinking ? 87 : 85} cy={thinking ? 67 : 76} r="3.2" fill="#fff" />
                        <circle cx={thinking ? 127 : 125} cy={thinking ? 67 : 76} r="3.2" fill="#fff" />
                    </g>
                )}

                {/* Brows */}
                <g stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" fill="none">
                    <path d={mood === 'encourage' ? 'M68 56 q10 -4 20 2' : 'M68 54 q10 -6 20 0'} />
                    <path d={mood === 'encourage' ? 'M112 58 q10 -6 20 -2' : 'M112 54 q10 -6 20 0'} />
                </g>

                {/* Beak */}
                <path
                    d="M86 94 Q100 86 114 94 Q113 108 104 116 Q100 120 97 114 Q90 106 86 94 Z"
                    fill="url(#eagle-beak)"
                    stroke="#d97706"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
                {(cheering || mood === 'encourage') && (
                    <path d="M92 104 Q100 112 108 104" stroke="#b45309" strokeWidth="2.5" fill="#fb923c" strokeLinecap="round" />
                )}
            </g>
        </svg>
    );
}
