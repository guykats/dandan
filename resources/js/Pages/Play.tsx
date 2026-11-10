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
import { phrases, speak, stopSpeaking } from '../lib/speech';
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

    const question = questions[index];
    const roundStars = results.filter((r, i) => r.first_choice === questions[i].answer).length;
    const showHint = question.hint.kind !== 'none' && (station.visual || wrongPicks.length > 0);

    const readQuestion = useCallback(() => {
        if (question) speak(question.speech);
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
            if (data.passed) playFanfare();
            speak(summarySpeech(data, worlds));
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
        <div className="flex min-h-screen flex-col">
            <Head title={station.title} />

            <header className="flex items-center justify-between gap-4 px-6 pt-5">
                <div className="flex items-center gap-3">
                    <Link href="/journey" className="toy-btn flex h-14 w-14 items-center justify-center bg-white text-sky-700" aria-label="חזרה למפה" title="למפה">
                        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden>
                            <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
                            <path d="M9 4v14M15 6v14" />
                        </svg>
                    </Link>
                    <div className="rounded-3xl bg-white/80 px-4 py-2 shadow">
                        <div className="text-xs font-semibold text-sky-600">{worlds[station.world].name} · תחנה {station.id}</div>
                        <div className="text-xl font-bold">{station.boss ? '🏆 ' : ''}{station.title}</div>
                    </div>
                </div>

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

            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-7 px-6 pb-10">
                <div className="flex w-full items-center justify-center gap-8">
                    <Eagle mood={mood} size={160} />

                    <div className="flex flex-col items-center gap-5">
                        <div key={index} className="flex items-center gap-5">
                            <QuestionView question={question} solved={solved} />
                            <button type="button" onClick={readQuestion} className="toy-btn flex h-16 w-16 shrink-0 items-center justify-center bg-sky-500 text-white" aria-label="להשמיע שוב" title="להשמיע שוב">
                                <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                    <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
                                    <path d="M16.5 8.5a5 5 0 0 1 0 7" />
                                </svg>
                            </button>
                        </div>

                        {showHint && <HintView key={`hint-${index}`} hint={question.hint} />}
                    </div>
                </div>

                <div className={`grid w-full gap-5 ${isCompare ? 'max-w-2xl grid-cols-3' : 'max-w-3xl grid-cols-4'}`} dir="ltr">
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
    if (!data.passed) return `אספת ${data.correct} תשובות נכונות. כמעט! עוד ניסיון ונפתח את התחנה הבאה.`;

    const lines = [`כל הכבוד! קיבלת ${data.rating} ${data.rating === 1 ? 'כוכב' : 'כוכבים'} בתחנה.`];
    if (data.world_completed !== null && worlds[data.world_completed + 1]) {
        lines.push(`פתחת עולם חדש: ${worlds[data.world_completed + 1].name}!`);
    } else if (data.first_pass && data.next_station) {
        lines.push('נפתחה תחנה חדשה במפה!');
    }
    if (data.stickers_after > data.stickers_before) lines.push('וקיבלת מדבקה חדשה!');
    return lines.join(' ');
}

function Summary({ summary, station, worlds }: { summary: RoundSummary; station: StationInfo; worlds: World[] }) {
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
        <div className="flex min-h-screen flex-col items-center justify-center gap-7 px-6 py-10">
            <Head title={title} />
            {summary.passed && <Confetti pieces={summary.world_completed !== null ? 120 : 60} />}

            <div className="flex items-center gap-8">
                <Eagle mood={summary.passed ? 'cheer' : 'encourage'} size={210} />
                <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-white px-10 py-8 shadow-xl">
                    <div className="text-lg font-semibold text-sky-600">תחנה {station.id} · {station.title}</div>
                    <h1 className="text-5xl font-extrabold">{title}</h1>

                    <div className="flex items-end gap-2" aria-label={`${summary.rating} כוכבים מתוך 3`}>
                        {[0, 1, 2].map((i) => (
                            <span key={i} className="animate-pop" style={{ animationDelay: `${300 + i * 250}ms` }}>
                                <Star size={i === 1 ? 92 : 72} filled={i < summary.rating} />
                            </span>
                        ))}
                    </div>

                    <p className="text-2xl font-semibold">
                        {summary.correct} מתוך 10 נכון בניסיון הראשון
                    </p>
                    {!summary.passed && <p className="text-xl text-sky-700">צריך 6 תשובות נכונות כדי לעבור לתחנה הבאה</p>}
                    {summary.passed && summary.best_rating > summary.rating && (
                        <p className="text-lg text-sky-600">השיא שלך בתחנה הזאת: {summary.best_rating} כוכבים</p>
                    )}
                </div>
            </div>

            {unlockedWorld && (
                <div className="animate-pop rounded-3xl bg-gradient-to-br from-amber-300 to-rose-300 px-10 py-5 text-center shadow-lg" style={{ animationDelay: '900ms' }}>
                    <p className="text-2xl font-bold">🎉 נפתח עולם חדש!</p>
                    <p className="text-4xl font-extrabold">{unlockedWorld.name}</p>
                </div>
            )}

            {newSticker && (
                <div className="animate-pop flex items-center gap-5 rounded-3xl bg-gradient-to-br from-amber-200 to-pink-200 px-8 py-5 shadow-lg" style={{ animationDelay: '1100ms' }}>
                    <div className="h-28 w-28 rounded-2xl bg-white p-2">
                        <StickerArt index={stickerIndex} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">מדבקה חדשה!</p>
                        <p className="text-3xl font-extrabold">{STICKERS[stickerIndex].name}</p>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap justify-center gap-5">
                {summary.next_station && (
                    <button type="button" onClick={() => router.visit(`/play/${summary.next_station}`)} className="toy-btn bg-amber-400 px-12 py-5 text-4xl font-extrabold text-sky-950">
                        לתחנה הבאה ▶
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => router.visit(`/play/${station.id}`)}
                    className={`toy-btn px-8 py-5 text-3xl font-bold ${summary.passed ? 'bg-white text-sky-800' : 'bg-amber-400 text-sky-950'}`}
                >
                    🔁 {summary.passed ? 'לשפר את התוצאה' : 'לנסות שוב'}
                </button>
                <Link href="/journey" className="toy-btn bg-white px-8 py-5 text-3xl font-bold text-sky-800">🗺️ למפה</Link>
            </div>
        </div>
    );
}
