import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Eagle, { type EagleMood } from '../Components/Eagle';
import SpeechBubble from '../Components/SpeechBubble';
import { STICKERS } from '../Components/StickerArt';
import TopBar from '../Components/TopBar';
import { speak } from '../lib/speech';
import type { SharedProps } from '../types';

const GREETING = 'היי! אני דנדן הנשר. בוא נפתור תרגילים ונאסוף כוכבים!';

export default function Home() {
    const { kid, starsPerSticker } = usePage<SharedProps>().props;
    const [mood, setMood] = useState<EagleMood>('idle');

    const allCollected = kid.stickers >= STICKERS.length;
    const towardNext = kid.stars % starsPerSticker;

    const greet = () => {
        setMood('cheer');
        speak(GREETING);
        window.setTimeout(() => setMood('idle'), 1600);
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Head title="בית" />
            <TopBar />

            <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 pb-12">
                <div className="flex items-center gap-8">
                    <button type="button" onClick={greet} className="rounded-full focus-visible:outline-4 focus-visible:outline-sky-500" aria-label="דנדן מדבר">
                        <Eagle mood={mood} size={240} />
                    </button>
                    <SpeechBubble>
                        היי! אני <b>דנדן</b> 🦅
                        <br />
                        בוא נפתור תרגילים ונאסוף כוכבים!
                    </SpeechBubble>
                </div>

                <Link
                    href="/play"
                    onClick={() => speak('יוצאים לדרך!')}
                    className="toy-btn animate-pop bg-amber-400 px-16 py-6 text-5xl font-extrabold text-sky-950"
                >
                    בוא נשחק! ▶
                </Link>

                <Link href="/stickers" className="toy-btn flex items-center gap-4 bg-white px-8 py-4 text-2xl font-bold text-sky-800">
                    <span>📒 האוסף שלי</span>
                    <span className="flex items-center gap-2 text-lg font-semibold text-sky-700">
                        {kid.stickers} / {STICKERS.length}
                    </span>
                    {!allCollected && (
                        <span className="h-3 w-32 overflow-hidden rounded-full bg-sky-100" title={`עוד ${starsPerSticker - towardNext} כוכבים למדבקה הבאה`}>
                            <span className="block h-full rounded-full bg-amber-400" style={{ width: `${(towardNext / starsPerSticker) * 100}%` }} />
                        </span>
                    )}
                </Link>
            </main>
        </div>
    );
}
