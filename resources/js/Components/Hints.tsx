import type { Hint } from '../types';
import CountingObjects from './CountingObjects';
import { ItemGroup } from './Items';

/** Ten-frame: known part filled, missing part as dashed slots, unused cells faded. */
function TenFrame({ filled, total }: { filled: number; total: number }) {
    return (
        <div className="rounded-3xl bg-white/70 px-3 py-3 shadow-inner sm:px-6 sm:py-4 short:py-2">
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2" dir="ltr">
                {Array.from({ length: 10 }, (_, i) => {
                    const state = i < filled ? 'filled' : i < total ? 'missing' : 'unused';
                    return (
                        <div
                            key={i}
                            className={`flex h-10 w-10 items-center justify-center rounded-xl border-4 sm:h-14 sm:w-14 short:h-8 short:w-8 short:border-2 ${
                                state === 'unused' ? 'border-slate-200 bg-slate-100/60' : state === 'missing' ? 'border-dashed border-amber-400 bg-amber-50' : 'border-sky-200 bg-white'
                            }`}
                        >
                            {state === 'filled' && <span className="animate-pop block h-6 w-6 rounded-full bg-rose-500 sm:h-9 sm:w-9 short:h-5 short:w-5" style={{ animationDelay: `${i * 40}ms` }} />}
                            {state === 'missing' && <span className="text-2xl font-bold text-amber-400">?</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function CompareObjects({ left, right }: { left: number; right: number }) {
    return (
        <div className="flex items-center justify-center gap-4 rounded-3xl bg-white/70 px-3 py-3 shadow-inner sm:gap-10 sm:px-6 sm:py-4" dir="ltr">
            <ItemGroup count={left} kind="apple" size="h-6 w-6 sm:h-9 sm:w-9" />
            <span className="h-16 w-1 rounded bg-sky-200" />
            <ItemGroup count={right} kind="apple-green" size="h-6 w-6 sm:h-9 sm:w-9" offset={left} />
        </div>
    );
}

function StepHint({ step }: { step: number }) {
    return (
        <div className="animate-pop rounded-3xl bg-white/80 px-5 py-2 text-xl font-bold text-sky-800 shadow-inner sm:px-8 sm:py-3 sm:text-3xl">
            כל פעם {step > 0 ? 'מוסיפים' : 'מורידים'} <span dir="ltr" className="text-amber-500">{Math.abs(step)}</span>
        </div>
    );
}

export function hintSpeech(hint: Hint): string | null {
    if (hint.kind === 'step') {
        return `שימו לב: כל פעם ${hint.step > 0 ? 'מוסיפים' : 'מורידים'} ${Math.abs(hint.step)}`;
    }
    return null;
}

export default function HintView({ hint }: { hint: Hint }) {
    switch (hint.kind) {
        case 'apples':
            return <CountingObjects a={hint.a} b={hint.b} operation={hint.op} />;
        case 'tenframe':
            return <TenFrame filled={hint.filled} total={hint.total} />;
        case 'compareObjects':
            return <CompareObjects left={hint.left} right={hint.right} />;
        case 'step':
            return <StepHint step={hint.step} />;
        default:
            return null;
    }
}
