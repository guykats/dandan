export type Operation = '+' | '-';

export interface Kid {
    level: number;
    stars: number;
    stickers: number;
}

export interface SharedProps {
    kid: Kid;
    starsPerSticker: number;
    errors: Record<string, string>;
    [key: string]: unknown;
}

export interface Question {
    operation: Operation;
    a: number;
    b: number;
    answer: number;
    choices: number[];
}

export interface RoundSummary {
    stars: number;
    correct: number;
    total_stars: number;
    level: number;
    promoted: boolean;
    stickers_before: number;
    stickers_after: number;
}
