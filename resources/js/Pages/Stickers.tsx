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
        <div className="flex min-h-dvh flex-col">
            <Head title="האוסף שלי" />
            <TopBar back>
                <h1 className="hidden text-2xl font-extrabold sm:block sm:text-4xl">האוסף שלי</h1>
            </TopBar>

            <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-5 sm:gap-6 sm:px-6 sm:py-8">
                <h1 className="text-center text-2xl font-extrabold sm:hidden">האוסף שלי</h1>
                {unlocked < STICKERS.length && (
                    <p className="flex items-center justify-center gap-2 text-xl font-semibold sm:text-2xl">
                        עוד {remaining} <Star size={28} /> למדבקה הבאה!
                    </p>
                )}

                {WORLDS.map((world) => (
                    <section key={world.id} className={`rounded-3xl bg-gradient-to-br ${world.bg} p-3 shadow-lg sm:p-5`}>
                        <h2 className="mb-3 text-2xl font-bold text-white drop-shadow sm:mb-4 sm:text-3xl">{world.name}</h2>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
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
                                        {isUnlocked && <span className="text-base font-bold sm:text-xl">{sticker.name}</span>}
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
