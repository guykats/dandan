import type { Hint } from '../types';
import CountingObjects from './CountingObjects';
import { ItemGroup } from './Items';

/** Ten-frame: known part filled, missing part as dashed slots, unused cells faded. */
function TenFrame({ filled, total }: { filled: number; total: number }) {
    return (
        <div className="rounded-3xl bg-white/70 px-6 py-4 shadow-inner">
            <div className="grid grid-cols-5 gap-2" dir="ltr">
                {Array.from({ length: 10 }, (_, i) => {
                    const state = i < filled ? 'filled' : i < total ? 'missing' : 'unused';
                    return (
                        <div
                            key={i}
                            className={`flex h-14 w-14 items-center justify-center rounded-xl border-4 ${
                                state === 'unused' ? 'border-slate-200 bg-slate-100/60' : state === 'missing' ? 'border-dashed border-amber-400 bg-amber-50' : 'border-sky-200 bg-white'
                            }`}
                        >
                            {state === 'filled' && <span className="animate-pop block h-9 w-9 rounded-full bg-rose-500" style={{ animationDelay: `${i * 40}ms` }} />}
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
        <div className="flex items-center justify-center gap-10 rounded-3xl bg-white/70 px-6 py-4 shadow-inner" dir="ltr">
            <ItemGroup count={left} kind="apple" size="h-9 w-9" />
            <span className="h-16 w-1 rounded bg-sky-200" />
            <ItemGroup count={right} kind="apple-green" size="h-9 w-9" offset={left} />
        </div>
    );
}

function StepHint({ step }: { step: number }) {
    return (
        <div className="animate-pop rounded-3xl bg-white/80 px-8 py-3 text-3xl font-bold text-sky-800 shadow-inner">
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
