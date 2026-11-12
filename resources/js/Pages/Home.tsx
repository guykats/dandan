import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Eagle, { type EagleMood } from '../Components/Eagle';
import SpeechBubble from '../Components/SpeechBubble';
import { STICKERS } from '../Components/StickerArt';
import TopBar from '../Components/TopBar';
import { speak } from '../lib/speech';
import { useCompact } from '../lib/useMedia';
import type { SharedProps } from '../types';

const GREETING = 'היי! אני דנדן הנשר. בוא נצא למסע ונפתור תרגילים בדרך!';

interface Props {
    current: { id: number; title: string; world: number };
}

export default function Home({ current }: Props) {
    const { kid, starsPerSticker } = usePage<SharedProps>().props;
    const [mood, setMood] = useState<EagleMood>('idle');
    const compact = useCompact();

    const allCollected = kid.stickers >= STICKERS.length;
    const towardNext = kid.stars % starsPerSticker;

    const greet = () => {
        setMood('cheer');
        speak(GREETING);
        window.setTimeout(() => setMood('idle'), 1600);
    };

    return (
        <div className="flex min-h-dvh flex-col">
            <Head title="בית" />
            <TopBar />

            <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-8 sm:gap-10 sm:px-6 sm:pb-12 short:gap-3 short:pb-4">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
                    <button type="button" onClick={greet} className="rounded-full focus-visible:outline-4 focus-visible:outline-sky-500" aria-label="דנדן מדבר">
                        <Eagle mood={mood} size={compact ? 150 : 240} />
                    </button>
                    <SpeechBubble>
                        היי! אני <b>דנדן</b> 🦅
                        <br />
                        בוא נצא למסע ונפתור תרגילים בדרך!
                    </SpeechBubble>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <Link
                        href="/journey"
                        onClick={() => speak('יוצאים למסע!')}
                        className="toy-btn animate-pop bg-amber-400 px-8 py-4 text-3xl font-extrabold text-sky-950 sm:px-16 sm:py-6 sm:text-5xl short:px-10 short:py-3 short:text-3xl"
                    >
                        🗺️ המסע של דנדן
                    </Link>
                    <Link href={`/play/${current.id}`} onClick={() => speak(current.title)} className="toy-btn bg-emerald-400 px-5 py-3 text-center text-lg font-bold text-white sm:px-8 sm:text-2xl">
                        להמשיך: תחנה {current.id} · {current.title} ▶
                    </Link>
                </div>

                <Link href="/stickers" className="toy-btn flex flex-wrap items-center justify-center gap-2 bg-white px-5 py-3 text-xl font-bold text-sky-800 sm:gap-4 sm:px-8 sm:py-4 sm:text-2xl">
                    <span>📒 האוסף שלי</span>
                    <span className="flex items-center gap-2 text-lg font-semibold text-sky-700">
                        {kid.stickers} מתוך {STICKERS.length}
                    </span>
                    {!allCollected && (
                        <span className="h-3 w-20 overflow-hidden rounded-full bg-sky-100 sm:w-32" title={`עוד ${starsPerSticker - towardNext} כוכבים למדבקה הבאה`}>
                            <span className="block h-full rounded-full bg-amber-400" style={{ width: `${(towardNext / starsPerSticker) * 100}%` }} />
                        </span>
                    )}
                </Link>
            </main>
        </div>
    );
}
