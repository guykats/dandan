import { useRef, useState } from 'react';

export interface VoiceLabProps {
    voices: string[];
    defaultVoice: string;
    defaultMode: string;
    rates: number[];
    defaultRate: number;
    defaultVocalize: boolean;
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
export default function VoiceLab({ voices, defaultVoice, defaultMode, rates, defaultRate, defaultVocalize }: VoiceLabProps) {
    const [text, setText] = useState('כמה זה 7 ועוד 5? כמעט! עוד פעם. ספירה עד 10. כל הכבוד!');
    const [voice, setVoice] = useState(defaultVoice);
    const [status, setStatus] = useState<string | null>(null);
    const [mode, setMode] = useState(defaultMode);
    const [rate, setRate] = useState(defaultRate);
    const [vocalize, setVocalize] = useState(defaultVocalize);
    const [copied, setCopied] = useState(false);
    const audio = useRef<HTMLAudioElement | null>(null);

    const play = (selectedMode: string) => {
        setMode(selectedMode);
        setCopied(false);
        audio.current?.pause();
        const url = `/tts?t=${encodeURIComponent(text.trim())}&m=${selectedMode}&v=${encodeURIComponent(voice)}&r=${rate}&w=${vocalize ? 1 : 0}`;
        const a = new Audio(url);
        audio.current = a;
        setStatus('טוען…');
        a.addEventListener('playing', () => setStatus(null));
        a.addEventListener('error', () => setStatus('לא הצלחנו להשמיע: ייתכן שהקול הזה לא קיים בעברית, או שהטקסט מכיל תווים לא נתמכים.'));
        a.play().catch(() => {});
    };

    const envLines = `${voice.endsWith('Neural') ? 'AZURE_SPEECH_VOICE' : 'GOOGLE_TTS_VOICE'}=${voice}\nTTS_NUMBERS=${mode}\nTTS_RATE=${rate}\nTTS_VOCALIZE=${vocalize ? 'true' : 'false'}`;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(envLines);
        } catch {
            // Fallback for browsers without clipboard access: copy via a temporary textarea.
            const el = document.createElement('textarea');
            el.value = envLines;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            el.remove();
        }
        setCopied(true);
    };

    return (
        <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500 select-text">
                כאן משווים קולות ודרכי קריאה של מספרים. אחרי שבוחרים, מעדכנים ב-<code dir="ltr">.env</code> בשרת את השורות שבתיבה למטה
                {' '}ומריצים <code dir="ltr">php artisan config:cache</code>.
            </p>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={160} className="rounded-xl border border-slate-300 p-3" aria-label="טקסט לבדיקה" />
            <label className="flex items-center gap-2">
                <span className="text-sm font-medium">קול:</span>
                <select value={voice} onChange={(e) => setVoice(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 sm:flex-none" dir="ltr">
                    {voices.map((v) => (
                        <option key={v} value={v}>
                            {voiceLabel(v)}
                            {v === defaultVoice ? ' (current)' : ''}
                        </option>
                    ))}
                </select>
            </label>
            <label className="flex items-center gap-2">
                <span className="text-sm font-medium">מהירות:</span>
                <select value={rate} onChange={(e) => setRate(Number(e.target.value))} className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 sm:flex-none">
                    {rates.map((r) => (
                        <option key={r} value={r}>
                            {r === 1 ? 'רגילה (1.0)' : `${r} (${Math.round((1 - r) * 100)}% לאט יותר)`}
                            {r === defaultRate ? ' · נוכחי' : ''}
                        </option>
                    ))}
                </select>
            </label>
            <label className="flex items-center gap-2">
                <input type="checkbox" checked={vocalize} onChange={(e) => setVocalize(e.target.checked)} className="h-5 w-5" />
                <span className="text-sm font-medium">ניקוד למילים (למשל "סְפִירָה", "נָכוֹן"){defaultVocalize ? ' · נוכחי: פעיל' : ' · נוכחי: כבוי'}</span>
            </label>
            <div className="flex flex-wrap gap-2">
                {MODES.map((m) => (
                    <button key={m.id} type="button" onClick={() => play(m.id)} className="rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700">
                        ▶ {m.label} ({m.example}){m.id === defaultMode ? ' · נוכחי' : ''}
                    </button>
                ))}
            </div>
            {status && <p className="text-sm text-amber-700">{status}</p>}
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">השורות להעתקה ל-.env (לפי הקול והכפתור האחרון שהשמעת):</span>
                <pre dir="ltr" className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-left text-sm text-slate-100 select-text">{envLines}</pre>
                <button type="button" onClick={copy} className="self-start rounded-xl bg-slate-200 px-4 py-2 font-semibold hover:bg-slate-300">
                    {copied ? '✓ הועתק' : 'העתקה'}
                </button>
            </div>
        </div>
    );
}
