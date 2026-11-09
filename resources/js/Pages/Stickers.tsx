import { Head, usePage } from '@inertiajs/react';
import { StickerArt, STICKERS, WORLDS } from '../Components/StickerArt';
import TopBar from '../Components/TopBar';
import Star from '../Components/Star';
import { speak } from '../lib/speech';
import type { SharedProps } from '../types';

export default function Stickers({ unlocked }: { unlocked: number }) {
    const { kid, starsPerSticker } = usePage<SharedProps>().props;
    const remaining = starsPerSticker - (kid.stars % starsPerSticker);

    return (
        <div className="flex min-h-screen flex-col">
            <Head title="האוסף שלי" />
            <TopBar back>
                <h1 className="text-4xl font-extrabold">האוסף שלי</h1>
            </TopBar>

            <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
                {unlocked < STICKERS.length && (
                    <p className="flex items-center justify-center gap-2 text-2xl font-semibold">
                        עוד {remaining} <Star size={28} /> למדבקה הבאה!
                    </p>
                )}

                {WORLDS.map((world) => (
                    <section key={world.id} className={`rounded-3xl bg-gradient-to-br ${world.bg} p-5 shadow-lg`}>
                        <h2 className="mb-4 text-3xl font-bold text-white drop-shadow">{world.name}</h2>
                        <div className="grid grid-cols-4 gap-4">
                            {STICKERS.map((sticker, index) => {
                                if (sticker.world !== world.id) return null;
                                const isUnlocked = index < unlocked;

                                return (
                                    <button
                                        key={sticker.id}
                                        type="button"
                                        disabled={!isUnlocked}
                                        onClick={() => speak(sticker.name)}
                                        className={`toy-btn flex aspect-square flex-col items-center justify-center p-3 ${isUnlocked ? 'bg-white' : 'bg-white/25'}`}
                                        aria-label={isUnlocked ? sticker.name : 'מדבקה נעולה'}
                                    >
                                        <div className="h-full w-full">
                                            <StickerArt index={index} locked={!isUnlocked} />
                                        </div>
                                        {isUnlocked && <span className="text-xl font-bold">{sticker.name}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </main>
        </div>
    );
}
