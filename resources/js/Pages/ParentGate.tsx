import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { SharedProps } from '../types';

const PIN_LENGTH = 4;

export default function ParentGate() {
    const { errors } = usePage<SharedProps>().props;
    const [pin, setPin] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = (value: string) => {
        setBusy(true);
        router.post(
            '/parent/unlock',
            { pin: value },
            {
                preserveScroll: true,
                onFinish: () => {
                    setBusy(false);
                    setPin('');
                },
            },
        );
    };

    const press = (digit: string) => {
        if (busy || pin.length >= PIN_LENGTH) return;
        const next = pin + digit;
        setPin(next);
        if (next.length === PIN_LENGTH) submit(next);
    };

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

    return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-slate-100 px-6">
            <Head title="אזור הורים" />
            <h1 className="text-3xl font-bold text-slate-800">אזור הורים</h1>
            <p className="text-lg text-slate-600">הקלידו את קוד ההורה</p>

            <div className="flex gap-3" dir="ltr" aria-label={`${pin.length} ספרות הוקלדו`}>
                {Array.from({ length: PIN_LENGTH }, (_, i) => (
                    <span key={i} className={`h-5 w-5 rounded-full border-2 border-slate-500 ${i < pin.length ? 'bg-slate-700' : ''}`} />
                ))}
            </div>

            {errors.pin && <p className="rounded-xl bg-rose-100 px-4 py-2 font-semibold text-rose-700" role="alert">{errors.pin}</p>}

            <div className="grid grid-cols-3 gap-3" dir="ltr">
                {keys.map((k) => (
                    <button key={k} type="button" onClick={() => press(k)} disabled={busy} className="h-16 w-16 rounded-2xl bg-white text-2xl font-bold text-slate-800 shadow hover:bg-slate-50 disabled:opacity-50">
                        {k}
                    </button>
                ))}
                <button type="button" onClick={() => setPin('')} className="h-16 w-16 rounded-2xl bg-slate-200 text-lg font-semibold text-slate-700">
                    נקה
                </button>
                <button type="button" onClick={() => press('0')} disabled={busy} className="h-16 w-16 rounded-2xl bg-white text-2xl font-bold text-slate-800 shadow hover:bg-slate-50 disabled:opacity-50">
                    0
                </button>
                <button type="button" onClick={() => setPin(pin.slice(0, -1))} className="h-16 w-16 rounded-2xl bg-slate-200 text-lg font-semibold text-slate-700" aria-label="מחיקה">
                    ⌫
                </button>
            </div>

            <Link href="/" className="text-slate-600 underline">חזרה למשחק</Link>
        </div>
    );
}
