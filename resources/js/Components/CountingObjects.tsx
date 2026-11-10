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
        <div className="flex min-h-28 items-center justify-center gap-6 rounded-3xl bg-white/70 px-6 py-4 shadow-inner" dir="ltr">
            {operation === '+' ? (
                <>
                    <ItemGroup count={a} kind="apple" />
                    <span className="text-5xl font-bold text-sky-700">+</span>
                    <ItemGroup count={b} kind="apple-green" offset={a} />
                </>
            ) : (
                <ItemGroup count={a} kind="apple" crossedFrom={a - b} />
            )}
        </div>
    );
}
