import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Confetti from '../Components/Confetti';
import Eagle, { type EagleMood } from '../Components/Eagle';
import HintView, { hintSpeech } from '../Components/Hints';
import QuestionView, { choiceLabel } from '../Components/QuestionView';
import SoundToggle from '../Components/SoundToggle';
import Star from '../Components/Star';
import { StickerArt, STICKERS } from '../Components/StickerArt';
import { postJson } from '../lib/http';
import { playCorrect, playFanfare, playWrong } from '../lib/sfx';
import { useCompact, useMedia } from '../lib/useMedia';
import { PHRASES, phrases, prefetchSpeech, speak, stopSpeaking } from '../lib/speech';
import type { Question, RoundSummary, StationInfo, World } from '../types';

interface Props {
    roundId: number;
    station: StationInfo;
    worlds: World[];
    questions: Question[];
}

interface Result {
    first_choice: number;
    mistakes: number;
}

const NEXT_DELAY_MS = 1400;

export default function Play({ roundId, station, worlds, questions }: Props) {
    const [index, setIndex] = useState(0);
    const [results, setResults] = useState<Result[]>([]);
    const [wrongPicks, setWrongPicks] = useState<number[]>([]);
    const [solved, setSolved] = useState(false);
    const [mood, setMood] = useState<EagleMood>('think');
    const [shaking, setShaking] = useState<number | null>(null);
    const [summary, setSummary] = useState<RoundSummary | null>(null);
    const [saveFailed, setSaveFailed] = useState(false);
    const firstChoice = useRef<number | null>(null);
    const compact = useCompact();
    // The eagle stands beside the exercise only on wide screens; elsewhere it sits above it.
    const wide = useMedia('(min-width: 1024px)');

    const question = questions[index];
    const roundStars = results.filter((r, i) => r.first_choice === questions[i].answer).length;
    const showHint = question.hint.kind !== 'none' && (station.visual || wrongPicks.length > 0);

    // The repeat button interrupts whatever is playing.
    const readQuestion = useCallback(() => {
        if (question) void speak(question.speech);
    }, [question]);

    useEffect(() => {
        // Wait for the previous sentence (praise, station name) to finish instead of cutting it off.
        if (!summary && question) void speak(question.speech, { queue: true });
    }, [question, summary]);

    useEffect(() => () => stopSpeaking(), []);

    // Fetch this round's sentences ahead of time so each one plays without a delay.
    useEffect(() => {
        prefetchSpeech([...questions.map((q) => q.speech), ...PHRASES.correct, ...PHRASES.tryAgain]);
    }, [questions]);

    const finishRound = async (all: Result[]) => {
        try {
            const data = await postJson<RoundSummary>(`/rounds/${roundId}/finish`, { results: all });
            setSummary(data);
            setMood('cheer');
            if (data.passed) playFanfare();
            void speak(summarySpeech(data, worlds), { queue: true });
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
            speak([phrases.tryAgain(), hintSpeech(question.hint)].filter(Boolean).join('. '));
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
        return <Summary summary={summary} station={station} worlds={worlds} />;
    }

    const isCompare = question.type === 'compare';

    return (
        <div className="flex min-h-dvh flex-col">
            <Head title={station.title} />

            <header className="flex flex-wrap items-center justify-between gap-2 px-3 pt-3 sm:gap-4 sm:px-6 sm:pt-5 lg:flex-nowrap short:pt-2">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <Link href="/journey" className="toy-btn flex h-11 w-11 shrink-0 items-center justify-center bg-white text-sky-700 sm:h-14 sm:w-14" aria-label="חזרה למפה" title="למפה">
                        <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden>
                            <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
                            <path d="M9 4v14M15 6v14" />
                        </svg>
                    </Link>
                    <div className="min-w-0 rounded-3xl bg-white/80 px-3 py-1.5 shadow sm:px-4 sm:py-2">
                        <div className="hidden text-xs font-semibold text-sky-600 sm:block">{worlds[station.world].name} · תחנה {station.id}</div>
                        <div className="truncate text-base font-bold sm:text-xl">{station.boss ? '🏆 ' : ''}{station.title}</div>
                    </div>
                </div>

                <ol className="order-last flex w-full items-center justify-center gap-1 sm:gap-2 lg:order-none lg:w-auto" aria-label={`תרגיל ${index + 1} מתוך ${questions.length}`}>
                    {questions.map((_, i) => {
                        const done = i < results.length;
                        const star = done && results[i].first_choice === questions[i].answer;
                        return (
                            <li key={i} className={`flex h-7 w-7 items-center justify-center rounded-full sm:h-9 sm:w-9 ${i === index ? 'bg-white ring-4 ring-amber-400' : 'bg-white/60'}`}>
                                {done ? <Star size={compact ? 20 : 26} filled={star} /> : <span className="text-xs font-bold text-sky-700 sm:text-sm">{i + 1}</span>}
                            </li>
                        );
                    })}
                </ol>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <div className="flex h-11 items-center gap-1.5 rounded-3xl bg-white/80 px-3 text-xl font-bold shadow sm:h-14 sm:gap-2 sm:px-4 sm:text-2xl">
                        <Star size={compact ? 24 : 30} />
                        <span>{roundStars}</span>
                    </div>
                    <SoundToggle />
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-3 pt-3 pb-6 sm:gap-7 sm:px-6 sm:pb-10 short:gap-2 short:pt-1 short:pb-3">
                <div className="flex w-full flex-col items-center justify-center gap-2 lg:flex-row lg:gap-8 short:flex-row short:gap-6">
                    <Eagle mood={mood} size={compact ? 80 : wide ? 160 : 110} className="shrink-0" />

                    <div className="flex flex-col items-center gap-5 short:gap-2">
                        <div key={index} className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5 short:gap-3">
                            <QuestionView question={question} solved={solved} />
                            <button type="button" onClick={readQuestion} className="toy-btn flex h-12 w-12 shrink-0 items-center justify-center bg-sky-500 text-white sm:h-16 sm:w-16 short:h-11 short:w-11" aria-label="להשמיע שוב" title="להשמיע שוב">
                                <svg viewBox="0 0 24 24" className="h-7 w-7 sm:h-9 sm:w-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                    <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
                                    <path d="M16.5 8.5a5 5 0 0 1 0 7" />
                                </svg>
                            </button>
                        </div>

                        {showHint && <HintView key={`hint-${index}`} hint={question.hint} />}
                    </div>
                </div>

                <div className={`grid w-full gap-3 sm:gap-5 ${isCompare ? 'max-w-2xl grid-cols-3' : 'max-w-3xl grid-cols-2 sm:grid-cols-4'}`} dir="ltr">
                    {question.choices.map((choice) => {
                        const wrong = wrongPicks.includes(choice);
                        const right = solved && choice === question.answer;
                        return (
                            <button
                                key={`${index}-${choice}`}
                                type="button"
                                disabled={wrong || solved}
                                onClick={() => choose(choice)}
                                className={`toy-btn h-20 text-5xl font-extrabold transition-colors sm:h-32 sm:text-7xl short:h-16 short:text-4xl ${
                                    right ? 'bg-emerald-400 text-white' : wrong ? 'bg-slate-200 text-slate-400 opacity-60' : 'bg-white text-sky-900 hover:bg-amber-50'
                                } ${shaking === choice ? 'animate-shake' : ''}`}
                            >
                                {choiceLabel(question, choice)}
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

function summarySpeech(data: RoundSummary, worlds: World[]): string {
    if (data.journey_completed) return 'וואו! סיימת את כל המסע של דנדן! אתה אלוף החשבון!';
    if (!data.passed) {
        const answers = data.correct === 1 ? 'תשובה נכונה אחת' : `${data.correct} תשובות נכונות`;
        return `אספת ${answers}. כמעט! עוד ניסיון ונפתח את התחנה הבאה.`;
    }

    // "כוכב" is masculine, so its number is spelled here rather than left to the speech engine.
    const stars = ['', 'כוכב אחד', 'שני כוכבים', 'שלושה כוכבים'][data.rating];
    const lines = [`כל הכבוד! קיבלת ${stars} בתחנה.`];
    if (data.world_completed !== null && worlds[data.world_completed + 1]) {
        lines.push(`פתחת עולם חדש: ${worlds[data.world_completed + 1].name}!`);
    } else if (data.first_pass && data.next_station) {
        lines.push('נפתחה תחנה חדשה במפה!');
    }
    if (data.stickers_after > data.stickers_before) lines.push('וקיבלת מדבקה חדשה!');
    return lines.join(' ');
}

function Summary({ summary, station, worlds }: { summary: RoundSummary; station: StationInfo; worlds: World[] }) {
    const compact = useCompact();
    const newSticker = summary.stickers_after > summary.stickers_before && summary.stickers_after <= STICKERS.length;
    const stickerIndex = summary.stickers_after - 1;
    const unlockedWorld = summary.world_completed !== null ? worlds[summary.world_completed + 1] : undefined;

    const title = summary.journey_completed
        ? 'סיימת את כל המסע!'
        : !summary.passed
          ? 'כמעט!'
          : summary.rating === 3
            ? 'מושלם!'
            : 'כל הכבוד!';

    return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 py-6 sm:gap-7 sm:px-6 sm:py-10">
            <Head title={title} />
            {summary.passed && <Confetti pieces={summary.world_completed !== null ? 120 : 60} />}

            <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-8">
                <Eagle mood={summary.passed ? 'cheer' : 'encourage'} size={compact ? 120 : 210} />
                <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-[2rem] bg-white px-5 py-5 text-center shadow-xl sm:w-auto sm:max-w-none sm:gap-4 sm:px-10 sm:py-8">
                    <div className="text-base font-semibold text-sky-600 sm:text-lg">תחנה {station.id} · {station.title}</div>
                    <h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>

                    <div className="flex items-end gap-2" aria-label={`${summary.rating} כוכבים מתוך 3`}>
                        {[0, 1, 2].map((i) => (
                            <span key={i} className="animate-pop" style={{ animationDelay: `${300 + i * 250}ms` }}>
                                <Star size={(i === 1 ? 92 : 72) * (compact ? 0.7 : 1)} filled={i < summary.rating} />
                            </span>
                        ))}
                    </div>

                    <p className="text-xl font-semibold sm:text-2xl">
                        {summary.correct} מתוך 10 נכון בניסיון הראשון
                    </p>
                    {!summary.passed && <p className="text-lg text-sky-700 sm:text-xl">צריך 6 תשובות נכונות כדי לעבור לתחנה הבאה</p>}
                    {summary.passed && summary.best_rating > summary.rating && (
                        <p className="text-lg text-sky-600">השיא שלך בתחנה הזאת: {summary.best_rating} כוכבים</p>
                    )}
                </div>
            </div>

            {unlockedWorld && (
                <div className="animate-pop rounded-3xl bg-gradient-to-br from-amber-300 to-rose-300 px-6 py-4 text-center shadow-lg sm:px-10 sm:py-5" style={{ animationDelay: '900ms' }}>
                    <p className="text-2xl font-bold">🎉 נפתח עולם חדש!</p>
                    <p className="text-3xl font-extrabold sm:text-4xl">{unlockedWorld.name}</p>
                </div>
            )}

            {newSticker && (
                <div className="animate-pop flex items-center gap-4 rounded-3xl bg-gradient-to-br from-amber-200 to-pink-200 px-5 py-4 shadow-lg sm:gap-5 sm:px-8 sm:py-5" style={{ animationDelay: '1100ms' }}>
                    <div className="h-20 w-20 rounded-2xl bg-white p-2 sm:h-28 sm:w-28">
                        <StickerArt index={stickerIndex} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">מדבקה חדשה!</p>
                        <p className="text-3xl font-extrabold">{STICKERS[stickerIndex].name}</p>
                    </div>
                </div>
            )}

            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center sm:gap-5">
                {summary.next_station && (
                    <button type="button" onClick={() => router.visit(`/play/${summary.next_station}`)} className="toy-btn bg-amber-400 px-6 py-4 text-3xl font-extrabold text-sky-950 sm:px-12 sm:py-5 sm:text-4xl">
                        לתחנה הבאה ▶
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => router.visit(`/play/${station.id}`)}
                    className={`toy-btn px-6 py-3 text-2xl font-bold sm:px-8 sm:py-5 sm:text-3xl ${summary.passed ? 'bg-white text-sky-800' : 'bg-amber-400 text-sky-950'}`}
                >
                    🔁 {summary.passed ? 'לשפר את התוצאה' : 'לנסות שוב'}
                </button>
                <Link href="/journey" className="toy-btn bg-white px-6 py-3 text-center text-2xl font-bold text-sky-800 sm:px-8 sm:py-5 sm:text-3xl">🗺️ למפה</Link>
            </div>
        </div>
    );
}
