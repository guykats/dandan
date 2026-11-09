<?php

namespace App\Game;

use InvalidArgumentException;
use Random\Randomizer;

/**
 * Generates first-grade addition/subtraction exercises.
 *
 * Level 10: sums up to 10, subtraction from numbers up to 10.
 * Level 20: sums between 11 and 20, subtraction from 11-20 (subtracting at most 10).
 */
class QuestionGenerator
{
    private Randomizer $random;

    public function __construct(?Randomizer $random = null)
    {
        $this->random = $random ?? new Randomizer;
    }

    /**
     * @return list<array{operation: string, a: int, b: int, answer: int, choices: list<int>}>
     */
    public function round(int $level, int $size, int $choiceCount = 4): array
    {
        if (! in_array($level, [10, 20], true)) {
            throw new InvalidArgumentException("Unsupported level: {$level}");
        }

        $questions = [];
        $seen = [];
        $guard = 0;

        while (count($questions) < $size) {
            // Alternate-ish mix: roughly half addition, half subtraction.
            $operation = $this->random->getInt(0, 1) === 0 ? '+' : '-';
            $question = $operation === '+' ? $this->addition($level) : $this->subtraction($level);
            $key = "{$question['a']}{$operation}{$question['b']}";

            // Avoid repeating the same exercise within a round (give up after many tries).
            if (isset($seen[$key]) && $guard++ < 200) {
                continue;
            }

            $seen[$key] = true;
            $question['choices'] = $this->choices($question, $level, $choiceCount);
            $questions[] = $question;
        }

        return $questions;
    }

    /**
     * @return array{operation: string, a: int, b: int, answer: int}
     */
    private function addition(int $level): array
    {
        if ($level === 10) {
            $sum = $this->random->getInt(2, 10);
        } else {
            $sum = $this->random->getInt(11, 20);
        }

        // Keep both addends at most 10 so the visual objects stay countable.
        $a = $this->random->getInt(max(1, $sum - 10), min(10, $sum - 1));

        return ['operation' => '+', 'a' => $a, 'b' => $sum - $a, 'answer' => $sum];
    }

    /**
     * @return array{operation: string, a: int, b: int, answer: int}
     */
    private function subtraction(int $level): array
    {
        if ($level === 10) {
            $a = $this->random->getInt(2, 10);
            $b = $this->random->getInt(1, $a);
        } else {
            $a = $this->random->getInt(11, 20);
            $b = $this->random->getInt(1, 10);
        }

        return ['operation' => '-', 'a' => $a, 'b' => $b, 'answer' => $a - $b];
    }

    /**
     * Correct answer plus plausible distractors (off-by-one, wrong operation), shuffled.
     *
     * @param  array{operation: string, a: int, b: int, answer: int}  $question
     * @return list<int>
     */
    private function choices(array $question, int $level, int $count): array
    {
        $answer = $question['answer'];
        $wrongOperation = $question['operation'] === '+'
            ? abs($question['a'] - $question['b'])
            : $question['a'] + $question['b'];

        $candidates = [$answer + 1, $answer - 1, $wrongOperation, $answer + 2, $answer - 2];
        $candidates = array_values(array_unique(array_filter(
            $candidates,
            fn (int $n) => $n !== $answer && $n >= 0 && $n <= $level,
        )));
        $candidates = $this->random->shuffleArray($candidates);

        $choices = [$answer, ...array_slice($candidates, 0, $count - 1)];

        // Top up with random numbers in range if the smart distractors ran out.
        while (count($choices) < $count) {
            $n = $this->random->getInt(0, $level);
            if (! in_array($n, $choices, true)) {
                $choices[] = $n;
            }
        }

        return $this->random->shuffleArray($choices);
    }
}
