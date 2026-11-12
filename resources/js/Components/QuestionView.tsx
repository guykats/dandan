import type { CompareSide, Question } from '../types';
import { ItemGroup } from './Items';

export const COMPARE_SYMBOLS = ['<', '=', '>'];

/** Text for an answer button. */
export function choiceLabel(question: Question, value: number): string {
    return question.type === 'compare' ? COMPARE_SYMBOLS[value] : String(value);
}

function Blank({ solved, value }: { solved: boolean; value: string }) {
    return (
        <span className={`inline-flex min-w-[1.2em] justify-center rounded-2xl px-2 ${solved ? 'text-emerald-500' : 'bg-amber-100 text-amber-500'}`}>
            {solved ? value : '?'}
        </span>
    );
}

const card = 'animate-pop rounded-3xl bg-white px-4 py-3 font-extrabold tracking-wide shadow-lg sm:rounded-[2rem] sm:px-10 sm:py-5 short:px-6 short:py-2';

function sideText(side: CompareSide): string {
    return side.expr ? side.expr.replace('-', '−') : String(side.value);
}

export default function QuestionView({ question, solved }: { question: Question; solved: boolean }) {
    switch (question.type) {
        case 'equation': {
            const { a, op, b, result, blank } = question.data;
            const part = (key: 'a' | 'b' | 'result', value: number) =>
                key === blank ? <Blank solved={solved} value={String(value)} /> : <span>{value}</span>;

            return (
                <div dir="ltr" className={`${card} flex items-center gap-2 text-5xl sm:gap-4 sm:text-7xl lg:gap-5 lg:text-8xl short:gap-3 short:text-5xl`}>
                    {part('a', a)}
                    <span>{op === '+' ? '+' : '−'}</span>
                    {part('b', b)}
                    <span>=</span>
                    {part('result', result)}
                </div>
            );
        }

        case 'count':
            return (
                <div className={`${card} flex flex-col items-center gap-3 sm:gap-4`}>
                    <ItemGroup count={question.data.n} kind={question.data.item} size="h-10 w-10 sm:h-16 sm:w-16 short:h-8 short:w-8" />
                    <div className="text-3xl sm:text-5xl short:text-3xl">
                        כמה יש? <Blank solved={solved} value={String(question.data.n)} />
                    </div>
                </div>
            );

        case 'compare': {
            const { left, right, objects } = question.data;
            const symbol = <Blank solved={solved} value={COMPARE_SYMBOLS[question.answer]} />;

            if (objects) {
                return (
                    <div dir="ltr" className={`${card} flex items-center gap-2 text-5xl sm:gap-6 sm:text-7xl short:text-4xl`}>
                        <div className="rounded-2xl bg-rose-50 p-1.5 sm:p-3">
                            <ItemGroup count={left.value} kind="apple" size="h-6 w-6 sm:h-12 sm:w-12 short:h-7 short:w-7" />
                        </div>
                        {symbol}
                        <div className="rounded-2xl bg-lime-50 p-1.5 sm:p-3">
                            <ItemGroup count={right.value} kind="apple-green" size="h-6 w-6 sm:h-12 sm:w-12 short:h-7 short:w-7" />
                        </div>
                    </div>
                );
            }

            return (
                <div dir="ltr" className={`${card} flex items-center gap-3 text-5xl sm:gap-5 sm:text-7xl lg:gap-6 lg:text-8xl short:text-5xl`}>
                    <span>{sideText(left)}</span>
                    {symbol}
                    <span>{sideText(right)}</span>
                </div>
            );
        }

        case 'sequence':
            return (
                <div dir="ltr" className={`${card} flex items-center gap-1 px-2 text-2xl sm:gap-2 sm:px-6 sm:text-5xl lg:gap-3 lg:px-10 lg:text-6xl short:text-3xl`}>
                    {question.data.items.map((n, i) => (
                        <span key={i} className="flex items-center gap-1 sm:gap-3">
                            {i > 0 && (
                                <svg viewBox="0 0 24 24" className="h-4 w-4 text-sky-300 sm:h-6 sm:w-6 lg:h-8 lg:w-8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                    <path d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                            {n === null ? (
                                <Blank solved={solved} value={String(question.answer)} />
                            ) : (
                                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 sm:h-20 sm:w-20 lg:h-24 lg:w-24 short:h-12 short:w-12">{n}</span>
                            )}
                        </span>
                    ))}
                </div>
            );
    }
}
