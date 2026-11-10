import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Eagle from '../Components/Eagle';
import Star from '../Components/Star';
import TopBar from '../Components/TopBar';
import WorldScene from '../Components/WorldScene';
import { speak } from '../lib/speech';
import type { JourneyStation, World } from '../types';

interface Props {
    stations: JourneyStation[];
    current: number;
    worlds: World[];
    perWorld: number;
}

// Station positions on the 1000 x 520 map. The path starts on the right (Hebrew reading direction).
const POINTS: [number, number][] = [
    [900, 420],
    [770, 310],
    [640, 410],
    [520, 285],
    [395, 395],
    [270, 280],
    [150, 365],
    [95, 170],
];

function pathThrough(points: [number, number][]): string {
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
        const [x0, y0] = points[i - 1];
        const [x1, y1] = points[i];
        const mx = (x0 + x1) / 2;
        d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
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

function StationNode({ station, isCurrent, onPlay }: { station: JourneyStation; isCurrent: boolean; onPlay: () => void }) {
    const size = station.boss ? 'h-28 w-28' : 'h-20 w-20';
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
                className={`toy-btn relative flex ${size} items-center justify-center rounded-full border-4 border-white text-3xl font-extrabold ${look} ${isCurrent ? 'ring-8 ring-amber-300/80' : ''}`}
                aria-label={`תחנה ${station.id}: ${station.title}${station.unlocked ? '' : ' (נעולה)'}`}
                title={station.title}
            >
                {!station.unlocked ? <Lock /> : station.boss ? <span className="text-5xl">🏆</span> : station.id}
                {isCurrent && <span className="absolute inset-0 animate-ping rounded-full bg-amber-300/40" aria-hidden />}
            </button>
            <div className="mt-1 flex gap-0.5 rounded-full bg-white/80 px-2 py-0.5" aria-hidden>
                {[0, 1, 2].map((i) => (
                    <Star key={i} size={18} filled={i < station.bestStars} />
                ))}
            </div>
            <div className="mt-1 max-w-36 rounded-xl bg-white/85 px-2 py-0.5 text-center text-sm font-bold leading-tight text-sky-900 shadow-sm">
                {station.title}
            </div>
        </div>
    );
}

export default function Journey({ stations, current, worlds, perWorld }: Props) {
    const currentWorld = stations[current - 1].world;
    const [worldIndex, setWorldIndex] = useState(currentWorld);

    const worldStations = stations.filter((s) => s.world === worldIndex);
    const worldOpen = worldStations[0]?.unlocked ?? false;
    const passedInWorld = worldStations.filter((s) => s.bestStars > 0).length;
    const starsInWorld = worldStations.reduce((sum, s) => sum + s.bestStars, 0);

    const play = (station: JourneyStation) => {
        speak(station.title);
        router.visit(`/play/${station.id}`);
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Head title="המסע של דנדן" />
            <TopBar back>
                <h1 className="text-4xl font-extrabold">המסע של דנדן</h1>
            </TopBar>

            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-6 py-5">
                <nav className="flex flex-wrap justify-center gap-3" aria-label="עולמות">
                    {worlds.map((world, i) => {
                        const open = stations[i * perWorld].unlocked;
                        const done = stations.slice(i * perWorld, (i + 1) * perWorld).every((s) => s.bestStars > 0);
                        return (
                            <button
                                key={world.id}
                                type="button"
                                onClick={() => setWorldIndex(i)}
                                className={`toy-btn flex items-center gap-2 px-5 py-3 text-xl font-bold ${
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

                <section className="relative w-full overflow-hidden rounded-[2.5rem] border-8 border-white shadow-2xl" style={{ aspectRatio: '1000 / 520' }}>
                    <WorldScene world={worlds[worldIndex].id} />

                    <svg viewBox="0 0 1000 520" className="absolute inset-0 h-full w-full" aria-hidden>
                        <path d={pathThrough(POINTS)} stroke="#ffffff" strokeWidth="26" fill="none" strokeLinecap="round" opacity="0.65" />
                        <path d={pathThrough(POINTS)} stroke="#fbbf24" strokeWidth="6" strokeDasharray="4 18" fill="none" strokeLinecap="round" />
                    </svg>

                    {worldStations.map((station, i) => {
                        const [x, y] = POINTS[i];
                        const isCurrent = station.id === current && station.unlocked;
                        return (
                            <div key={station.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${(x / 1000) * 100}%`, top: `${(y / 520) * 100}%` }}>
                                {isCurrent && (
                                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 translate-y-6">
                                        <Eagle size={90} />
                                    </div>
                                )}
                                <StationNode station={station} isCurrent={isCurrent} onPlay={() => play(station)} />
                            </div>
                        );
                    })}

                    {!worldOpen && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30">
                            <div className="rounded-3xl bg-white px-8 py-5 text-center shadow-xl">
                                <div className="text-5xl">🔒</div>
                                <p className="mt-2 text-2xl font-bold">צריך לעבור את האתגר של העולם הקודם</p>
                            </div>
                        </div>
                    )}

                    <div className="absolute top-4 right-4 rounded-2xl bg-white/85 px-4 py-2 text-lg font-bold shadow">
                        {passedInWorld} מתוך {perWorld} תחנות · {starsInWorld} ⭐
                    </div>
                </section>
            </main>
        </div>
    );
}
