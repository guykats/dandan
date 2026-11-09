import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Confetti from '../Components/Confetti';
import CountingObjects from '../Components/CountingObjects';
import Eagle, { type EagleMood } from '../Components/Eagle';
import SoundToggle from '../Components/SoundToggle';
import Star from '../Components/Star';
import { StickerArt, STICKERS } from '../Components/StickerArt';
import { postJson } from '../lib/http';
import { playCorrect, playFanfare, playWrong } from '../lib/sfx';
import { phrases, questionText, speak, stopSpeaking } from '../lib/speech';
import type { Question, RoundSummary } from '../types';

interface Props {
    roundId: number;
    level: number;
    questions: Question[];
}

interface Result {
    first_choice: number;
    mistakes: number;
}

const NEXT_DELAY_MS = 1400;

export default function Play({ roundId, level, questions }: Props) {
    const [index, setIndex] = useState(0);
    const [results, setResults] = useState<Result[]>([]);
    const [wrongPicks, setWrongPicks] = useState<number[]>([]);
    const [solved, setSolved] = useState(false);
    const [mood, setMood] = useState<EagleMood>('think');
    const [shaking, setShaking] = useState<number | null>(null);
    const [summary, setSummary] = useState<RoundSummary | null>(null);
    const [saveFailed, setSaveFailed] = useState(false);
    const firstChoice = useRef<number | null>(null);

    const question = questions[index];
    const roundStars = results.filter((r, i) => r.first_choice === questions[i].answer).length;
    // Level 10 always shows the apples; level 20 shows them as a hint after a mistake.
    const showObjects = level === 10 || wrongPicks.length > 0;

    const readQuestion = useCallback(() => {
        if (question) speak(questionText(question.a, question.operation, question.b));
    }, [question]);

    useEffect(() => {
        if (!summary) readQuestion();
    }, [readQuestion, summary]);

    useEffect(() => () => stopSpeaking(), []);

    const finishRound = async (all: Result[]) => {
        try {
            const data = await postJson<RoundSummary>(`/rounds/${roundId}/finish`, { results: all });
            setSummary(data);
            setMood('cheer');
            playFanfare();
            const lines = [`סיימת! אספת ${data.stars} כוכבים.`];
            if (data.stickers_after > data.stickers_before) lines.push('וקיבלת מדבקה חדשה!');
            if (data.promoted) lines.push('עלית שלב! עכשיו תרגילים עד עשרים.');
            speak(lines.join(' '));
        } catch {
            setSaveFailed(true);
        }
    };

    const choose = (value: number) => {
        if (solved || wrongPicks.includes(value)) return;

        if (firstChoice.current === null) firstChoice.current = value;

        if (value !== question.answer) {
            setWrongPicks((w) => [...w, value]);
            setShaking(value);
            setMood('encourage');
            playWrong();
            speak(phrases.tryAgain());
            window.setTimeout(() => setShaking(null), 450);
            return;
        }

        setSolved(true);
        setMood('cheer');
        playCorrect();
        speak(phrases.correct());

        const result: Result = { first_choice: firstChoice.current, mistakes: wrongPicks.length };
        const all = [...results, result];
        setResults(all);

        window.setTimeout(() => {
            if (index + 1 >= questions.length) {
                void finishRound(all);
                return;
            }
            firstChoice.current = null;
            setWrongPicks([]);
            setSolved(false);
            setMood('think');
            setIndex(index + 1);
        }, NEXT_DELAY_MS);
    };

    if (summary) {
        return <Summary summary={summary} />;
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Head title="משחק" />

            <header className="flex items-center justify-between gap-4 px-6 pt-5">
                <Link href="/" className="toy-btn flex h-14 w-14 items-center justify-center bg-white text-sky-700" aria-label="חזרה הביתה" title="הביתה">
                    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden>
                        <path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z" />
                    </svg>
                </Link>

                <ol className="flex items-center gap-2" aria-label={`תרגיל ${index + 1} מתוך ${questions.length}`}>
                    {questions.map((_, i) => {
                        const done = i < results.length;
                        const star = done && results[i].first_choice === questions[i].answer;
                        return (
                            <li key={i} className={`flex h-9 w-9 items-center justify-center rounded-full ${i === index ? 'bg-white ring-4 ring-amber-400' : 'bg-white/60'}`}>
                                {done ? <Star size={26} filled={star} /> : <span className="text-sm font-bold text-sky-700">{i + 1}</span>}
                            </li>
                        );
                    })}
                </ol>

                <div className="flex items-center gap-3">
                    <div className="flex h-14 items-center gap-2 rounded-3xl bg-white/80 px-4 text-2xl font-bold shadow">
                        <Star size={30} />
                        <span>{roundStars}</span>
                    </div>
                    <SoundToggle />
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-8 px-6 pb-10">
                <div className="flex w-full items-center justify-center gap-8">
                    <Eagle mood={mood} size={170} />

                    <div className="flex flex-col items-center gap-5">
                        <div className="flex items-center gap-5">
                            <div key={index} dir="ltr" className="animate-pop rounded-[2rem] bg-white px-10 py-5 text-8xl font-extrabold tracking-wide shadow-lg">
                                {question.a} {question.operation === '+' ? '+' : '−'} {question.b} ={' '}
                                <span className={solved ? 'text-emerald-500' : 'text-amber-500'}>{solved ? question.answer : '?'}</span>
                            </div>
                            <button type="button" onClick={readQuestion} className="toy-btn flex h-16 w-16 items-center justify-center bg-sky-500 text-white" aria-label="להשמיע שוב" title="להשמיע שוב">
                                <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                    <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
                                    <path d="M16.5 8.5a5 5 0 0 1 0 7" />
                                </svg>
                            </button>
                        </div>

                        {showObjects && <CountingObjects key={`${index}-${level}`} a={question.a} b={question.b} operation={question.operation} />}
                    </div>
                </div>

                <div className="grid w-full max-w-3xl grid-cols-4 gap-5" dir="ltr">
                    {question.choices.map((choice) => {
                        const wrong = wrongPicks.includes(choice);
                        const right = solved && choice === question.answer;
                        return (
                            <button
                                key={`${index}-${choice}`}
                                type="button"
                                disabled={wrong || solved}
                                onClick={() => choose(choice)}
                                className={`toy-btn h-32 text-7xl font-extrabold transition-colors ${
                                    right ? 'bg-emerald-400 text-white' : wrong ? 'bg-slate-200 text-slate-400 opacity-60' : 'bg-white text-sky-900 hover:bg-amber-50'
                                } ${shaking === choice ? 'animate-shake' : ''}`}
                            >
                                {choice}
                            </button>
                        );
                    })}
                </div>

                {saveFailed && (
                    <div className="flex items-center gap-4 rounded-2xl bg-rose-100 px-6 py-3 text-xl font-semibold text-rose-800">
                        לא הצלחנו לשמור את הסבב.
                        <button type="button" className="toy-btn bg-white px-4 py-2 text-lg" onClick={() => { setSaveFailed(false); void finishRound(results); }}>
                            לנסות שוב
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

function Summary({ summary }: { summary: RoundSummary }) {
    const newSticker = summary.stickers_after > summary.stickers_before && summary.stickers_after <= STICKERS.length;
    const stickerIndex = summary.stickers_after - 1;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-10">
            <Head title="כל הכבוד!" />
            {summary.stars >= 7 && <Confetti />}

            <div className="flex items-center gap-8">
                <Eagle mood="cheer" size={210} />
                <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-white px-10 py-8 shadow-xl">
                    <h1 className="text-5xl font-extrabold">{summary.stars >= 7 ? 'כל הכבוד!' : 'יופי של עבודה!'}</h1>
                    <div className="flex flex-wrap justify-center gap-1" dir="ltr" aria-label={`${summary.stars} כוכבים מתוך 10`}>
                        {Array.from({ length: 10 }, (_, i) => (
                            <span key={i} className="animate-pop" style={{ animationDelay: `${i * 90}ms` }}>
                                <Star size={44} filled={i < summary.stars} />
                            </span>
                        ))}
                    </div>
                    <p className="text-2xl font-semibold">אספת {summary.stars} כוכבים בסבב הזה</p>
                    {summary.promoted && <p className="rounded-2xl bg-amber-100 px-5 py-2 text-2xl font-bold text-amber-800">🎉 עלית שלב! עכשיו תרגילים עד 20</p>}
                </div>
            </div>

            {newSticker && (
                <div className="animate-pop flex items-center gap-5 rounded-3xl bg-gradient-to-br from-amber-200 to-pink-200 px-8 py-5 shadow-lg" style={{ animationDelay: '900ms' }}>
                    <div className="h-28 w-28 rounded-2xl bg-white p-2">
                        <StickerArt index={stickerIndex} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">מדבקה חדשה!</p>
                        <p className="text-3xl font-extrabold">{STICKERS[stickerIndex].name}</p>
                    </div>
                </div>
            )}

            <div className="flex gap-5">
                <button type="button" onClick={() => router.visit('/play')} className="toy-btn bg-amber-400 px-12 py-5 text-4xl font-extrabold text-sky-950">
                    עוד סבב! ▶
                </button>
                <Link href="/stickers" className="toy-btn bg-white px-8 py-5 text-3xl font-bold text-sky-800">📒 האוסף</Link>
                <Link href="/" className="toy-btn bg-white px-8 py-5 text-3xl font-bold text-sky-800">🏠 הביתה</Link>
            </div>
        </div>
    );
}
