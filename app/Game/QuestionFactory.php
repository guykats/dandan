<?php

namespace App\Game;

use InvalidArgumentException;
use Random\Randomizer;

/**
 * Builds a single exercise from a spec such as ['kind' => 'add', 'mode' => 'carry'].
 *
 * Every question has the same envelope:
 *   type     'equation' | 'count' | 'compare' | 'sequence'  (how the screen draws it)
 *   skill    'count' | 'add' | 'sub' | 'missing' | 'compare' | 'sequence'  (for stats)
 *   label    short LTR text for the parent screen, e.g. "3 + ? = 10"
 *   speech   Hebrew sentence read aloud
 *   answer   the correct choice value
 *   choices  values for the answer buttons (compare uses 0 '<', 1 '=', 2 '>')
 *   data     type-specific drawing data
 *   hint     visual help: apples | tenframe | compareObjects | step | none
 */
class QuestionFactory
{
    public const COMPARE_LESS = 0;

    public const COMPARE_EQUAL = 1;

    public const COMPARE_GREATER = 2;

    private const ITEMS = [
        'apple' => 'תפוחים',
        'star' => 'כוכבים',
        'fish' => 'דגים',
        'balloon' => 'בלונים',
    ];

    public function __construct(private Randomizer $random) {}

    /**
     * @param  array<string, mixed>  $spec
     * @return array<string, mixed>
     */
    public function make(array $spec, int $choiceCount = 4): array
    {
        return match ($spec['kind']) {
            'count' => $this->count($spec, $choiceCount),
            'add' => $this->equation('+', $this->addOperands($spec), $spec, $choiceCount),
            'sub' => $this->equation('-', $this->subOperands($spec), $spec, $choiceCount),
            'missing' => $this->missing($spec, $choiceCount),
            'compare' => $this->compare($spec),
            'sequence' => $this->sequence($spec, $choiceCount),
            default => throw new InvalidArgumentException("Unknown kind: {$spec['kind']}"),
        };
    }

    // ---------------------------------------------------------------- count

    /** @param array<string, mixed> $spec */
    private function count(array $spec, int $choiceCount): array
    {
        $n = $this->int($spec['min'] ?? 1, $spec['max'] ?? 10);
        $item = $this->pick(array_keys(self::ITEMS));
        $max = max(10, (int) ($spec['max'] ?? 10));

        return [
            'type' => 'count',
            'skill' => 'count',
            'label' => "{$n} ".self::ITEMS[$item],
            'speech' => 'כמה '.self::ITEMS[$item].' יש?',
            'answer' => $n,
            'choices' => $this->numberChoices($n, [$n + 1, $n - 1, $n + 2, $n - 2], 1, $max, $choiceCount),
            'data' => ['n' => $n, 'item' => $item],
            'hint' => ['kind' => 'none'],
        ];
    }

    // ------------------------------------------------------------ equations

    /**
     * @param  array<string, mixed>  $spec
     * @return array{0: int, 1: int}
     */
    private function addOperands(array $spec): array
    {
        $mode = $spec['mode'] ?? 'basic';

        switch ($mode) {
            case 'basic':
                $sum = $this->int($spec['min'] ?? 2, $spec['max'] ?? 10);
                $a = $this->int(max(1, $sum - 10), min(10, $sum - 1));

                return [$a, $sum - $a];
            case 'ten_plus':
                $n = $this->int(1, 9);

                return $this->random->getInt(0, 1) ? [10, $n] : [$n, 10];
            case 'teen_no_carry':
                $a = $this->int(11, 18);
                $b = $this->int(1, 9 - $a % 10);

                return [$a, $b];
            case 'carry':
                do {
                    $a = $this->int(2, 9);
                    $b = $this->int(2, 9);
                } while ($a + $b <= 10);

                return [$a, $b];
            case 'doubles':
                $n = $this->int(1, 10);

                return [$n, $n];
            case 'to20':
                $sum = $this->int(2, 20);
                $a = $this->int(max(1, $sum - 10), min(10, $sum - 1));

                return $this->random->getInt(0, 1) ? [$a, $sum - $a] : [$sum - $a, $a];
        }

        throw new InvalidArgumentException("Unknown add mode: {$mode}");
    }

    /**
     * @param  array<string, mixed>  $spec
     * @return array{0: int, 1: int}
     */
    private function subOperands(array $spec): array
    {
        $mode = $spec['mode'] ?? 'basic';

        switch ($mode) {
            case 'basic':
                $a = $this->int(2, $spec['max'] ?? 10);

                return [$a, $this->int(1, $a)];
            case 'teen_no_borrow':
                $a = $this->int(11, 19);

                return [$a, $this->int(1, $a % 10)];
            case 'to_ten':
                // Either back to ten (15 - 5) or take the ten away (15 - 10).
                $a = $this->int(11, 19);

                return [$a, $this->random->getInt(0, 1) ? $a - 10 : 10];
            case 'borrow':
                $a = $this->int(11, 18);

                return [$a, $this->int($a % 10 + 1, 9)];
            case 'to20':
                $a = $this->int(2, 20);

                return [$a, $this->int(1, min(10, $a))];
        }

        throw new InvalidArgumentException("Unknown sub mode: {$mode}");
    }

    /**
     * @param  array{0: int, 1: int}  $operands
     * @param  array<string, mixed>  $spec
     */
    private function equation(string $op, array $operands, array $spec, int $choiceCount, string $blank = 'result'): array
    {
        [$a, $b] = $operands;
        $result = $op === '+' ? $a + $b : $a - $b;
        $values = ['a' => $a, 'b' => $b, 'result' => $result];
        $answer = $values[$blank];
        $word = $op === '+' ? 'ועוד' : 'פחות';

        $speech = match ($blank) {
            'result' => "כמה זה {$a} {$word} {$b}?",
            'b' => "{$a} {$word} כמה זה {$result}?",
            'a' => "כמה {$word} {$b} זה {$result}?",
        };

        $shown = fn (string $k) => $k === $blank ? '?' : (string) $values[$k];
        $label = "{$shown('a')} {$op} {$shown('b')} = {$shown('result')}";

        $wrongOp = match ($blank) {
            'result' => $op === '+' ? abs($a - $b) : $a + $b,
            'b' => $op === '+' ? $result + $a : $a + $result,
            'a' => $op === '+' ? $result + $b : abs($result - $b),
        };

        return [
            'type' => 'equation',
            'skill' => $blank === 'result' ? ($op === '+' ? 'add' : 'sub') : 'missing',
            'label' => $label,
            'speech' => $speech,
            'answer' => $answer,
            'choices' => $this->numberChoices(
                $answer,
                // A wrong-operation result of 0 (e.g. 7 - 7 for 7 + 7) is too obviously wrong to be a useful distractor.
                array_values(array_filter([$answer + 1, $answer - 1, $wrongOp, $answer + 2, $answer - 2], fn ($n) => $n !== 0 || $answer <= 3)),
                0,
                20,
                $choiceCount,
            ),
            'data' => ['a' => $a, 'op' => $op, 'b' => $b, 'result' => $result, 'blank' => $blank],
            'hint' => $this->equationHint($op, $a, $b, $result, $blank),
        ];
    }

    private function equationHint(string $op, int $a, int $b, int $result, string $blank): array
    {
        if ($blank === 'result' && $a <= 10 && $b <= 10 && ($op === '-' || $result <= 20)) {
            return ['kind' => 'apples', 'a' => $a, 'b' => $b, 'op' => $op];
        }

        if ($op === '+' && $result <= 10) {
            // Ten-frame: the known addend is filled, the rest up to the total are empty slots.
            $known = $blank === 'a' ? $b : $a;

            return ['kind' => 'tenframe', 'filled' => $known, 'total' => $result];
        }

        return ['kind' => 'none'];
    }

    // -------------------------------------------------------------- missing

    /** @param array<string, mixed> $spec */
    private function missing(array $spec, int $choiceCount): array
    {
        $mode = $spec['mode'] ?? 'addend';

        switch ($mode) {
            case 'complement10':
                $n = $this->int(1, 9);

                return $this->random->getInt(0, 1)
                    ? $this->equation('+', [$n, 10 - $n], $spec, $choiceCount, 'b')
                    : $this->equation('+', [10 - $n, $n], $spec, $choiceCount, 'a');
            case 'addend':
                $c = $this->int(3, $spec['max'] ?? 10);
                $a = $this->int(1, $c - 1);

                return $this->equation('+', [$a, $c - $a], $spec, $choiceCount, $this->pick(['a', 'b']));
            case 'any':
                $max = (int) ($spec['max'] ?? 20);
                if ($this->random->getInt(0, 1)) {
                    $c = $this->int(3, $max);
                    $a = $this->int(1, min(10, $c - 1));

                    return $this->equation('+', [$a, $c - $a], $spec, $choiceCount, $this->pick(['a', 'b']));
                }
                $a = $this->int(3, $max);

                return $this->equation('-', [$a, $this->int(1, min(10, $a - 1))], $spec, $choiceCount, $this->pick(['a', 'b']));
        }

        throw new InvalidArgumentException("Unknown missing mode: {$mode}");
    }

    // -------------------------------------------------------------- compare

    /** @param array<string, mixed> $spec */
    private function compare(array $spec): array
    {
        $mode = $spec['mode'] ?? 'numbers';
        $max = (int) ($spec['max'] ?? 10);

        $left = $this->int(1, $max);
        // About one in four comparisons is "equal", so '=' is a real option.
        $right = $this->random->getInt(1, 4) === 1 ? $left : $this->otherThan($left, 1, $max);
        if ($mode === 'expression' && $right !== $left) {
            // Keep the number close to the expression's value so it has to be worked out.
            do {
                $right = max(1, min($max, $left + $this->int(-3, 3)));
            } while ($right === $left);
        }

        $leftSide = ['value' => $left, 'expr' => null];
        $rightSide = ['value' => $right, 'expr' => null];
        $speechLeft = (string) $left;

        if ($mode === 'expression') {
            $leftSide['expr'] = $this->expressionFor($left);
            $speechLeft = str_replace(['+', '-'], ['ועוד', 'פחות'], $leftSide['expr']);
        }

        $answer = $left <=> $right;
        $answer = match ($answer) {
            -1 => self::COMPARE_LESS,
            0 => self::COMPARE_EQUAL,
            1 => self::COMPARE_GREATER,
        };

        $leftLabel = $leftSide['expr'] ?? (string) $left;

        return [
            'type' => 'compare',
            'skill' => 'compare',
            'label' => "{$leftLabel} ? {$right}",
            'speech' => $mode === 'objects'
                ? 'באיזה צד יש יותר? בחרו את הסימן הנכון'
                : "איזה סימן מתאים בין {$speechLeft} לבין {$right}?",
            'answer' => $answer,
            'choices' => [self::COMPARE_LESS, self::COMPARE_EQUAL, self::COMPARE_GREATER],
            'data' => ['left' => $leftSide, 'right' => $rightSide, 'objects' => $mode === 'objects'],
            'hint' => $max <= 10 && $mode !== 'objects'
                ? ['kind' => 'compareObjects', 'left' => $left, 'right' => $right]
                : ['kind' => 'none'],
        ];
    }

    /** An addition or subtraction (operands up to 10) whose value is $value. */
    private function expressionFor(int $value): string
    {
        if ($value >= 2 && $this->random->getInt(0, 1)) {
            $a = $this->int(max(1, $value - 10), min(10, $value - 1));

            return "{$a} + ".($value - $a);
        }

        $b = $this->int(1, min(10, 20 - $value));

        return ($value + $b)." - {$b}";
    }

    // ------------------------------------------------------------- sequence

    /** @param array<string, mixed> $spec */
    private function sequence(array $spec, int $choiceCount): array
    {
        $steps = $spec['steps'] ?? [1];
        $max = (int) ($spec['max'] ?? 20);
        $length = 5;

        $step = (int) $this->pick($steps);
        $span = abs($step) * ($length - 1);
        $start = $step > 0 ? $this->int(0, $max - $span) : $this->int($span, $max);

        $items = [];
        for ($i = 0; $i < $length; $i++) {
            $items[] = $start + $i * $step;
        }

        $blankIndex = $this->int(1, $length - 1);
        $answer = $items[$blankIndex];
        $shown = $items;
        $shown[$blankIndex] = null;

        $spoken = implode(', ', array_map(fn ($n) => $n === null ? 'משהו' : (string) $n, $shown));
        $label = implode(', ', array_map(fn ($n) => $n === null ? '?' : (string) $n, $shown));

        return [
            'type' => 'sequence',
            'skill' => 'sequence',
            'label' => $label,
            'speech' => "איזה מספר חסר? {$spoken}",
            'answer' => $answer,
            'choices' => $this->numberChoices($answer, [$answer + 1, $answer - 1, $answer + $step * 2, $answer - $step * 2, $answer + 2], 0, max($max, 20), $choiceCount),
            'data' => ['items' => $shown],
            'hint' => ['kind' => 'step', 'step' => $step],
        ];
    }

    // -------------------------------------------------------------- helpers

    /**
     * Correct answer plus plausible distractors, topped up with random numbers in range, shuffled.
     *
     * @param  list<int>  $candidates
     * @return list<int>
     */
    private function numberChoices(int $answer, array $candidates, int $min, int $max, int $count): array
    {
        $candidates = array_values(array_unique(array_filter(
            $candidates,
            fn (int $n) => $n !== $answer && $n >= $min && $n <= $max,
        )));
        $candidates = $this->random->shuffleArray($candidates);

        $choices = [$answer, ...array_slice($candidates, 0, $count - 1)];

        while (count($choices) < $count) {
            $n = $this->int($min, $max);
            if (! in_array($n, $choices, true)) {
                $choices[] = $n;
            }
        }

        return $this->random->shuffleArray($choices);
    }

    private function int(int $min, int $max): int
    {
        return $this->random->getInt($min, max($min, $max));
    }

    private function otherThan(int $n, int $min, int $max): int
    {
        do {
            $m = $this->int($min, $max);
        } while ($m === $n && $max > $min);

        return $m;
    }

    /**
     * @template T
     *
     * @param  list<T>  $items
     * @return T
     */
    private function pick(array $items): mixed
    {
        return $items[$this->random->getInt(0, count($items) - 1)];
    }
}
