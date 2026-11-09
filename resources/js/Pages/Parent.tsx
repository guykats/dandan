import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { hebrewVoice, isSpeechSupported, onVoicesReady, speak } from '../lib/speech';

interface OperationStats {
    total: number;
    correct: number;
}

interface RecentRound {
    id: number;
    level: number;
    size: number;
    correct: number;
    finishedAt: string;
}

interface Props {
    profile: { level: number; stars: number; stickers: number };
    stats: {
        rounds: number;
        byOperation: Partial<Record<'+' | '-', OperationStats>>;
        toughest: { label: string; seen: number; mistakes: number }[];
        recentRounds: RecentRound[];
    };
    unlockMinutes: number;
}

function percent(s?: OperationStats): string {
    if (!s || s.total === 0) return '—';
    return `${Math.round((s.correct / s.total) * 100)}%`;
}

function Tile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">{label}</div>
            <div className="mt-1 text-4xl font-bold text-slate-900">{value}</div>
            {sub && <div className="mt-1 text-sm text-slate-500">{sub}</div>}
        </div>
    );
}

const dateFormat = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });

function RecentRoundsChart({ rounds }: { rounds: RecentRound[] }) {
    const [hover, setHover] = useState<number | null>(null);

    if (rounds.length === 0) {
        return <p className="py-8 text-center text-slate-500">עוד לא שוחקו סבבים.</p>;
    }

    const height = 160;

    return (
        <div className="relative">
            <div className="flex items-end gap-1.5 border-b border-slate-300" style={{ height }} dir="ltr">
                {rounds.map((r, i) => (
                    <div
                        key={r.id}
                        className="relative flex h-full w-full max-w-12 flex-1 items-end"
                        onMouseEnter={() => setHover(i)}
                        onMouseLeave={() => setHover(null)}
                    >
                        <div
                            className={`w-full rounded-t ${hover === i ? 'bg-sky-700' : 'bg-sky-500'}`}
                            style={{ height: `${Math.max(2, (r.correct / r.size) * 100)}%` }}
                        />
                        {hover === i && (
                            <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow" dir="rtl">
                                <div className="font-semibold">{r.correct} מתוך {r.size} בניסיון ראשון</div>
                                <div className="text-slate-300">{dateFormat.format(new Date(r.finishedAt))} · עד {r.level}</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-500" dir="ltr">
                <span>ישן</span>
                <span>חדש</span>
            </div>
        </div>
    );
}

function VoiceCheck() {
    const [voiceName, setVoiceName] = useState<string | null | undefined>(undefined);

    useEffect(() => {
        const update = () => setVoiceName(hebrewVoice()?.name ?? null);
        update();
        return onVoicesReady(update);
    }, []);

    if (!isSpeechSupported()) {
        return <p className="text-rose-700">הדפדפן הזה לא תומך בהקראה.</p>;
    }

    return (
        <div className="flex flex-wrap items-center gap-4">
            {voiceName ? (
                <p className="text-emerald-700">✓ נמצא קול עברי: {voiceName}</p>
            ) : (
                <p className="text-amber-700">
                    ⚠ לא נמצא קול עברי במחשב הזה. ב-Windows: הגדרות ← זמן ושפה ← שפה ← הוספת עברית, כולל "המרת טקסט לדיבור".
                </p>
            )}
            <button type="button" onClick={() => speak('כמה זה שלוש ועוד ארבע?', { force: true })} className="rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700">
                בדיקת קול
            </button>
        </div>
    );
}

export default function Parent({ profile, stats, unlockMinutes }: Props) {
    const [confirmReset, setConfirmReset] = useState(false);
    const plus = stats.byOperation['+'];
    const minus = stats.byOperation['-'];

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            <Head title="אזור הורים" />
            <div className="mx-auto max-w-5xl px-6 py-8">
                <header className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold">אזור הורים</h1>
                    <div className="flex items-center gap-3">
                        <Link href="/" className="rounded-xl bg-white px-4 py-2 font-semibold shadow-sm hover:bg-slate-50">חזרה למשחק</Link>
                        <button type="button" onClick={() => router.post('/parent/lock')} className="rounded-xl bg-slate-800 px-4 py-2 font-semibold text-white hover:bg-slate-700">
                            נעילה
                        </button>
                    </div>
                </header>
                <p className="mb-6 text-sm text-slate-500">המסך ננעל אוטומטית אחרי {unlockMinutes} דקות.</p>

                <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Tile label="סבבים שהושלמו" value={stats.rounds} />
                    <Tile label="הצלחה בחיבור" value={percent(plus)} sub={plus ? `${plus.correct} מתוך ${plus.total} בניסיון ראשון` : undefined} />
                    <Tile label="הצלחה בחיסור" value={percent(minus)} sub={minus ? `${minus.correct} מתוך ${minus.total} בניסיון ראשון` : undefined} />
                    <Tile label="כוכבים ומדבקות" value={profile.stars} sub={`${profile.stickers} מדבקות נפתחו`} />
                </section>

                <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
                    <h2 className="mb-1 text-lg font-semibold">תשובות נכונות בניסיון ראשון — 15 הסבבים האחרונים</h2>
                    <p className="mb-4 text-sm text-slate-500">מעבר עם העכבר על עמודה מציג פרטים.</p>
                    <RecentRoundsChart rounds={stats.recentRounds} />
                </section>

                <div className="mb-6 grid gap-6 md:grid-cols-2">
                    <section className="rounded-2xl bg-white p-5 shadow-sm">
                        <h2 className="mb-3 text-lg font-semibold">תרגילים שחוזרים כטעות</h2>
                        {stats.toughest.length === 0 ? (
                            <p className="text-slate-500">אין עדיין טעויות חוזרות.</p>
                        ) : (
                            <table className="w-full text-right">
                                <thead className="text-sm text-slate-500">
                                    <tr>
                                        <th className="pb-2 font-medium">תרגיל</th>
                                        <th className="pb-2 font-medium">הופיע</th>
                                        <th className="pb-2 font-medium">טעויות</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.toughest.map((t) => (
                                        <tr key={t.label} className="border-t border-slate-100">
                                            <td className="py-2 text-lg font-semibold" dir="ltr" style={{ textAlign: 'right' }}>{t.label}</td>
                                            <td className="py-2">{t.seen}</td>
                                            <td className="py-2">{t.mistakes}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </section>

                    <section className="flex flex-col gap-5 rounded-2xl bg-white p-5 shadow-sm">
                        <div>
                            <h2 className="mb-2 text-lg font-semibold">רמת קושי</h2>
                            <p className="mb-3 text-sm text-slate-500">
                                המשחק עולה לבד לרמת 20 אחרי 3 סבבים ברצף עם 8 תשובות נכונות ומעלה. אפשר גם לשנות ידנית.
                            </p>
                            <div className="flex gap-2">
                                {[10, 20].map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => router.post('/parent/level', { level }, { preserveScroll: true })}
                                        className={`rounded-xl px-5 py-2 font-semibold ${profile.level === level ? 'bg-sky-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
                                        aria-pressed={profile.level === level}
                                    >
                                        עד {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h2 className="mb-2 text-lg font-semibold">הקראה</h2>
                            <VoiceCheck />
                        </div>

                        <div>
                            <h2 className="mb-2 text-lg font-semibold">איפוס</h2>
                            {confirmReset ? (
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-rose-700">כל הכוכבים, המדבקות וההיסטוריה יימחקו. בטוחים?</span>
                                    <button
                                        type="button"
                                        onClick={() => router.post('/parent/reset', {}, { preserveScroll: true, onFinish: () => setConfirmReset(false) })}
                                        className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700"
                                    >
                                        כן, לאפס
                                    </button>
                                    <button type="button" onClick={() => setConfirmReset(false)} className="rounded-xl bg-slate-100 px-4 py-2 font-semibold hover:bg-slate-200">
                                        ביטול
                                    </button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => setConfirmReset(true)} className="rounded-xl bg-slate-100 px-4 py-2 font-semibold text-rose-700 hover:bg-rose-50">
                                    איפוס התקדמות
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
