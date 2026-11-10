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

const card = 'animate-pop rounded-[2rem] bg-white px-10 py-5 font-extrabold tracking-wide shadow-lg';

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
                <div dir="ltr" className={`${card} flex items-center gap-5 text-8xl`}>
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
                <div className={`${card} flex flex-col items-center gap-4`}>
                    <ItemGroup count={question.data.n} kind={question.data.item} size="h-16 w-16" />
                    <div className="text-5xl">
                        כמה יש? <Blank solved={solved} value={String(question.data.n)} />
                    </div>
                </div>
            );

        case 'compare': {
            const { left, right, objects } = question.data;
            const symbol = <Blank solved={solved} value={COMPARE_SYMBOLS[question.answer]} />;

            if (objects) {
                return (
                    <div dir="ltr" className={`${card} flex items-center gap-6 text-7xl`}>
                        <div className="rounded-2xl bg-rose-50 p-3">
                            <ItemGroup count={left.value} kind="apple" size="h-12 w-12" />
                        </div>
                        {symbol}
                        <div className="rounded-2xl bg-lime-50 p-3">
                            <ItemGroup count={right.value} kind="apple-green" size="h-12 w-12" />
                        </div>
                    </div>
                );
            }

            return (
                <div dir="ltr" className={`${card} flex items-center gap-6 text-8xl`}>
                    <span>{sideText(left)}</span>
                    {symbol}
                    <span>{sideText(right)}</span>
                </div>
            );
        }

        case 'sequence':
            return (
                <div dir="ltr" className={`${card} flex items-center gap-3 text-6xl`}>
                    {question.data.items.map((n, i) => (
                        <span key={i} className="flex items-center gap-3">
                            {i > 0 && (
                                <svg viewBox="0 0 24 24" className="h-8 w-8 text-sky-300" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                    <path d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                            {n === null ? (
                                <Blank solved={solved} value={String(question.answer)} />
                            ) : (
                                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-sky-100">{n}</span>
                            )}
                        </span>
                    ))}
                </div>
            );
    }
}
