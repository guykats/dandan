export type Operation = '+' | '-';

export interface Kid {
    stars: number;
    stickers: number;
}

export interface SharedProps {
    kid: Kid;
    starsPerSticker: number;
    serverVoice: string | null;
    errors: Record<string, string>;
    [key: string]: unknown;
}

export interface World {
    id: 'sea' | 'savanna' | 'jungle' | 'mountains' | 'sky';
    name: string;
}

export interface StationInfo {
    id: number;
    title: string;
    world: number;
    boss: boolean;
    visual: boolean;
}

export interface JourneyStation {
    id: number;
    world: number;
    title: string;
    boss: boolean;
    bestStars: number;
    unlocked: boolean;
}

export type CountItem = 'apple' | 'star' | 'fish' | 'balloon';

export type Hint =
    | { kind: 'none' }
    | { kind: 'apples'; a: number; b: number; op: Operation }
    | { kind: 'tenframe'; filled: number; total: number }
    | { kind: 'compareObjects'; left: number; right: number }
    | { kind: 'step'; step: number };

interface QuestionBase {
    skill: string;
    label: string;
    speech: string;
    answer: number;
    choices: number[];
    hint: Hint;
}

export interface EquationQuestion extends QuestionBase {
    type: 'equation';
    data: { a: number; op: Operation; b: number; result: number; blank: 'a' | 'b' | 'result' };
}

export interface CountQuestion extends QuestionBase {
    type: 'count';
    data: { n: number; item: CountItem };
}

export interface CompareSide {
    value: number;
    expr: string | null;
}

export interface CompareQuestion extends QuestionBase {
    type: 'compare';
    data: { left: CompareSide; right: CompareSide; objects: boolean };
}

export interface SequenceQuestion extends QuestionBase {
    type: 'sequence';
    data: { items: (number | null)[] };
}

export type Question = EquationQuestion | CountQuestion | CompareQuestion | SequenceQuestion;

export interface RoundSummary {
    correct: number;
    stars: number;
    rating: number;
    best_rating: number;
    passed: boolean;
    first_pass: boolean;
    next_station: number | null;
    world_completed: number | null;
    journey_completed: boolean;
    total_stars: number;
    stickers_before: number;
    stickers_after: number;
}
