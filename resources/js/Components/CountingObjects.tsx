import type { Operation } from '../types';
import { ItemGroup } from './Items';

interface Props {
    a: number;
    b: number;
    operation: Operation;
}

/**
 * Countable apples for an exercise. Addition shows two groups;
 * subtraction shows `a` apples with the last `b` crossed out.
 */
export default function CountingObjects({ a, b, operation }: Props) {
    return (
        <div className="flex items-center justify-center gap-3 rounded-3xl bg-white/70 px-3 py-3 shadow-inner sm:min-h-28 sm:gap-6 sm:px-6 sm:py-4" dir="ltr">
            {operation === '+' ? (
                <>
                    <ItemGroup count={a} kind="apple" />
                    <span className="text-3xl font-bold text-sky-700 sm:text-5xl">+</span>
                    <ItemGroup count={b} kind="apple-green" offset={a} />
                </>
            ) : (
                <ItemGroup count={a} kind="apple" crossedFrom={a - b} />
            )}
        </div>
    );
}
