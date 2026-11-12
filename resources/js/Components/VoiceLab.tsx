import { useRef, useState } from 'react';

export interface VoiceLabProps {
    voices: string[];
    defaultVoice: string;
    defaultMode: string;
}

const MODES: { id: string; label: string; example: string }[] = [
    { id: 'words', label: 'מילים בלי ניקוד', example: 'שבע' },
    { id: 'nikud', label: 'מילים עם ניקוד', example: 'שֶׁבַע' },
    { id: 'digits', label: 'ספרות', example: '7' },
];

function voiceLabel(voice: string): string {
    return voice.replace('he-IL-', '').replace('Neural', '');
}

/** Lets the parent compare voices and number-reading modes before choosing the .env settings. */
export default function VoiceLab({ voices, defaultVoice, defaultMode }: VoiceLabProps) {
    const [text, setText] = useState('כמה זה 7 ועוד 5? 13 פחות 8 זה 5. השלמה ל-10.');
    const [voice, setVoice] = useState(defaultVoice);
    const [status, setStatus] = useState<string | null>(null);
    const audio = useRef<HTMLAudioElement | null>(null);

    const play = (mode: string) => {
        audio.current?.pause();
        const url = `/tts?t=${encodeURIComponent(text.trim())}&m=${mode}&v=${encodeURIComponent(voice)}`;
        const a = new Audio(url);
        audio.current = a;
        setStatus('טוען…');
        a.addEventListener('playing', () => setStatus(null));
        a.addEventListener('error', () => setStatus('לא הצלחנו להשמיע: ייתכן שהקול הזה לא קיים בעברית, או שהטקסט מכיל תווים לא נתמכים.'));
        a.play().catch(() => {});
    };

    return (
        <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500">
                כאן משווים קולות ודרכי קריאה של מספרים. אחרי שבוחרים, מעדכנים ב-<code dir="ltr">.env</code> בשרת את <code dir="ltr">GOOGLE_TTS_VOICE</code> ו-<code dir="ltr">TTS_NUMBERS</code>
                {' '}ומריצים <code dir="ltr">php artisan config:cache</code>.
            </p>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={160} className="rounded-xl border border-slate-300 p-3" aria-label="טקסט לבדיקה" />
            <label className="flex items-center gap-2">
                <span className="text-sm font-medium">קול:</span>
                <select value={voice} onChange={(e) => setVoice(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2" dir="ltr">
                    {voices.map((v) => (
                        <option key={v} value={v}>
                            {voiceLabel(v)}
                            {v === defaultVoice ? ' (current)' : ''}
                        </option>
                    ))}
                </select>
            </label>
            <div className="flex flex-wrap gap-2">
                {MODES.map((m) => (
                    <button key={m.id} type="button" onClick={() => play(m.id)} className="rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700">
                        ▶ {m.label} ({m.example}){m.id === defaultMode ? ' · נוכחי' : ''}
                    </button>
                ))}
            </div>
            {status && <p className="text-sm text-amber-700">{status}</p>}
            <p className="text-xs text-slate-500" dir="ltr">
                .env → GOOGLE_TTS_VOICE={voice} · TTS_NUMBERS=…
            </p>
        </div>
    );
}
