import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import type { ComponentType } from 'react';
import { configureServerVoice, installAudioUnlock } from './lib/speech';

createInertiaApp({
    title: (title) => (title ? `${title} · דנדן` : 'דנדן'),
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true }) as Record<
            string,
            { default: ComponentType }
        >;
        return pages[`./Pages/${name}.tsx`];
    },
    setup({ el, App, props }) {
        configureServerVoice(props.initialPage.props.serverVoice as string | null | undefined);
        installAudioUnlock();
        createRoot(el).render(<App {...props} />);
    },
    progress: { color: '#f59e0b' },
});
