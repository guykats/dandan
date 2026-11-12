import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Eagle from '../Components/Eagle';
import Star from '../Components/Star';
import TopBar from '../Components/TopBar';
import WorldScene from '../Components/WorldScene';
import { speak } from '../lib/speech';
import { useMedia } from '../lib/useMedia';
import type { JourneyStation, World } from '../types';

interface Props {
    stations: JourneyStation[];
    current: number;
    worlds: World[];
    perWorld: number;
}

// Station positions on the wide 1000 x 520 map. The path starts on the right (Hebrew reading direction).
const WIDE = { width: 1000, height: 520 };
const WIDE_POINTS: [number, number][] = [
    [900, 420],
    [770, 310],
    [640, 410],
    [520, 285],
    [395, 395],
    [270, 280],
    [150, 365],
    [95, 170],
];

// Tall 520 x 1000 map for phones held upright: the path climbs from the bottom.
const TALL = { width: 520, height: 1000 };
const TALL_POINTS: [number, number][] = [
    [380, 900],
    [145, 805],
    [375, 700],
    [145, 595],
    [375, 490],
    [145, 385],
    [375, 280],
    [260, 120],
];

/** Smooth path through the stations; vertical maps bend vertically, wide maps horizontally. */
function pathThrough(points: [number, number][], vertical = false): string {
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
        const [x0, y0] = points[i - 1];
        const [x1, y1] = points[i];
        if (vertical) {
            const my = (y0 + y1) / 2;
            d += ` C ${x0} ${my}, ${x1} ${my}, ${x1} ${y1}`;
        } else {
            const mx = (x0 + x1) / 2;
            d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
        }
    }
    return d;
}

function Lock() {
    return (
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden>
            <path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V7a3 3 0 0 0-6 0z" />
        </svg>
    );
}

function StationNode({ station, isCurrent, compact, onPlay }: { station: JourneyStation; isCurrent: boolean; compact: boolean; onPlay: () => void }) {
    const size = compact ? (station.boss ? 'h-20 w-20 text-2xl' : 'h-14 w-14 text-xl') : station.boss ? 'h-28 w-28 text-3xl' : 'h-20 w-20 text-3xl';
    const passed = station.bestStars > 0;

    const look = !station.unlocked
        ? 'bg-slate-300 text-slate-500'
        : station.boss
          ? 'bg-gradient-to-br from-amber-300 to-orange-500 text-white'
          : passed
            ? 'bg-emerald-400 text-white'
            : 'bg-white text-sky-800';

    return (
        <div className="flex flex-col items-center">
            <button
                type="button"
                onClick={onPlay}
                disabled={!station.unlocked}
                className={`toy-btn relative flex ${size} items-center justify-center rounded-full border-4 border-white font-extrabold ${look} ${isCurrent ? 'ring-4 ring-amber-300/80 sm:ring-8' : ''}`}
                aria-label={`תחנה ${station.id}: ${station.title}${station.unlocked ? '' : ' (נעולה)'}`}
                title={station.title}
            >
                {!station.unlocked ? <Lock /> : station.boss ? <span className={compact ? 'text-3xl' : 'text-5xl'}>🏆</span> : station.id}
                {isCurrent && <span className="absolute inset-0 animate-ping rounded-full bg-amber-300/40" aria-hidden />}
            </button>
            <div className="mt-1 flex gap-0.5 rounded-full bg-white/80 px-2 py-0.5" aria-hidden>
                {[0, 1, 2].map((i) => (
                    <Star key={i} size={compact ? 13 : 18} filled={i < station.bestStars} />
                ))}
            </div>
            <div className="mt-1 max-w-28 rounded-xl bg-white/85 px-2 py-0.5 text-center text-xs font-bold leading-tight text-sky-900 shadow-sm sm:max-w-36 sm:text-sm">
                {station.title}
            </div>
        </div>
    );
}

export default function Journey({ stations, current, worlds, perWorld }: Props) {
    const currentWorld = stations[current - 1].world;
    const [worldIndex, setWorldIndex] = useState(currentWorld);
    const tall = useMedia('(max-width: 1024px) and (orientation: portrait)');
    const compact = useMedia('(max-width: 767px), (max-height: 500px)');
    const map = tall ? TALL : WIDE;
    const points = tall ? TALL_POINTS : WIDE_POINTS;

    const worldStations = stations.filter((s) => s.world === worldIndex);
    const worldOpen = worldStations[0]?.unlocked ?? false;
    const passedInWorld = worldStations.filter((s) => s.bestStars > 0).length;
    const starsInWorld = worldStations.reduce((sum, s) => sum + s.bestStars, 0);

    const play = (station: JourneyStation) => {
        speak(station.title);
        router.visit(`/play/${station.id}`);
    };

    return (
        <div className="flex min-h-dvh flex-col">
            <Head title="המסע של דנדן" />
            <TopBar back>
                <h1 className="hidden text-2xl font-extrabold sm:block sm:text-4xl">המסע של דנדן</h1>
            </TopBar>

            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-5">
                <nav className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0" aria-label="עולמות">
                    {worlds.map((world, i) => {
                        const open = stations[i * perWorld].unlocked;
                        const done = stations.slice(i * perWorld, (i + 1) * perWorld).every((s) => s.bestStars > 0);
                        return (
                            <button
                                key={world.id}
                                type="button"
                                onClick={() => setWorldIndex(i)}
                                className={`toy-btn flex shrink-0 items-center gap-1 px-3 py-2 text-base font-bold whitespace-nowrap sm:gap-2 sm:px-5 sm:py-3 sm:text-xl ${
                                    i === worldIndex ? 'bg-amber-400 text-sky-950' : open ? 'bg-white text-sky-800' : 'bg-white/50 text-slate-500'
                                }`}
                                aria-pressed={i === worldIndex}
                            >
                                {!open && '🔒 '}
                                {done && '✅ '}
                                {world.name}
                            </button>
                        );
                    })}
                </nav>

                <section className={`relative w-full overflow-hidden ${tall ? 'mx-auto max-w-xl' : ''} rounded-[1.75rem] border-4 border-white shadow-2xl sm:rounded-[2.5rem] sm:border-8`} style={{ aspectRatio: `${map.width} / ${map.height}` }}>
                    <WorldScene world={worlds[worldIndex].id} />

                    <svg viewBox={`0 0 ${map.width} ${map.height}`} className="absolute inset-0 h-full w-full" aria-hidden>
                        <path d={pathThrough(points, tall)} stroke="#ffffff" strokeWidth="26" fill="none" strokeLinecap="round" opacity="0.65" />
                        <path d={pathThrough(points, tall)} stroke="#fbbf24" strokeWidth="6" strokeDasharray="4 18" fill="none" strokeLinecap="round" />
                    </svg>

                    {worldStations.map((station, i) => {
                        const [x, y] = points[i];
                        const isCurrent = station.id === current && station.unlocked;
                        return (
                            <div key={station.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${(x / map.width) * 100}%`, top: `${(y / map.height) * 100}%` }}>
                                {isCurrent &&
                                    (tall ? (
                                        // On the tall map the eagle stands beside the station, on the side facing the middle.
                                        <div
                                            className={`pointer-events-none absolute top-0 ${x > map.width / 2 ? 'right-full -mr-1' : 'left-full -ml-1'}`}
                                        >
                                            <Eagle size={58} />
                                        </div>
                                    ) : (
                                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 translate-y-6">
                                            <Eagle size={compact ? 60 : 90} />
                                        </div>
                                    ))}
                                <StationNode station={station} isCurrent={isCurrent} compact={compact} onPlay={() => play(station)} />
                            </div>
                        );
                    })}

                    {!worldOpen && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30">
                            <div className="mx-4 rounded-3xl bg-white px-6 py-4 text-center shadow-xl sm:px-8 sm:py-5">
                                <div className="text-4xl sm:text-5xl">🔒</div>
                                <p className="mt-2 text-lg font-bold sm:text-2xl">צריך לעבור את האתגר של העולם הקודם</p>
                            </div>
                        </div>
                    )}

                    <div className="absolute top-3 right-3 rounded-2xl bg-white/85 px-3 py-1 text-sm font-bold shadow sm:top-4 sm:right-4 sm:px-4 sm:py-2 sm:text-lg">
                        {passedInWorld} מתוך {perWorld} תחנות · {starsInWorld} ⭐
                    </div>
                </section>
            </main>
        </div>
    );
}
