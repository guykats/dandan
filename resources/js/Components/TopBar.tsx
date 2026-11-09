import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { SharedProps } from '../types';
import ParentCorner from './ParentCorner';
import SoundToggle from './SoundToggle';
import Star from './Star';

export default function TopBar({ back = false, children }: { back?: boolean; children?: ReactNode }) {
    const { kid } = usePage<SharedProps>().props;

    return (
        <header className="flex items-center justify-between gap-4 px-6 pt-5">
            <div className="flex items-center gap-3">
                {back && (
                    <Link href="/" className="toy-btn flex h-14 w-14 items-center justify-center bg-white text-sky-700" aria-label="חזרה הביתה" title="הביתה">
                        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden>
                            <path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z" />
                        </svg>
                    </Link>
                )}
                <div className="flex h-14 items-center gap-2 rounded-3xl bg-white/80 px-4 text-2xl font-bold shadow">
                    <Star size={32} />
                    <span>{kid.stars}</span>
                </div>
            </div>
            {children}
            <div className="flex items-center gap-3">
                <SoundToggle />
                <ParentCorner />
            </div>
        </header>
    );
}
