import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { SharedProps } from '../types';
import ParentCorner from './ParentCorner';
import SoundToggle from './SoundToggle';
import Star from './Star';

export default function TopBar({ back = false, children }: { back?: boolean; children?: ReactNode }) {
    const { kid } = usePage<SharedProps>().props;

    return (
        <header className="flex items-center justify-between gap-2 px-3 pt-3 sm:gap-4 sm:px-6 sm:pt-5">
            <div className="flex items-center gap-2 sm:gap-3">
                {back && (
                    <Link href="/" className="toy-btn flex h-11 w-11 items-center justify-center bg-white text-sky-700 sm:h-14 sm:w-14" aria-label="חזרה הביתה" title="הביתה">
                        <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-8 sm:w-8" fill="currentColor" aria-hidden>
                            <path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z" />
                        </svg>
                    </Link>
                )}
                <div className="flex h-11 items-center gap-1.5 rounded-3xl bg-white/80 px-3 text-xl font-bold shadow sm:h-14 sm:gap-2 sm:px-4 sm:text-2xl">
                    <Star size={26} />
                    <span>{kid.stars}</span>
                </div>
            </div>
            {children}
            <div className="flex items-center gap-2 sm:gap-3">
                <SoundToggle />
                <ParentCorner />
            </div>
        </header>
    );
}
