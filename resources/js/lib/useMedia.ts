import { useEffect, useState } from 'react';

/** Reactive matchMedia. */
export function useMedia(query: string): boolean {
    const get = () => typeof window !== 'undefined' && window.matchMedia(query).matches;
    const [matches, setMatches] = useState(get);

    useEffect(() => {
        const mql = window.matchMedia(query);
        const onChange = () => setMatches(mql.matches);
        onChange();
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, [query]);

    return matches;
}

/** Phone-sized screen: narrow (below Tailwind's `sm`) or a phone held sideways (very short). */
export function useCompact(): boolean {
    return useMedia('(max-width: 639px), (max-height: 500px)');
}
