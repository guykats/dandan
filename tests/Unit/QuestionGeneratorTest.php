<?php

namespace Tests\Unit;

use App\Game\QuestionGenerator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Random\Engine\Mt19937;
use Random\Randomizer;

class QuestionGeneratorTest extends TestCase
{
    public static function levels(): array
    {
        return ['level 10' => [10], 'level 20' => [20]];
    }

    #[DataProvider('levels')]
    public function test_questions_stay_within_level_rules(int $level): void
    {
        for ($seed = 1; $seed <= 200; $seed++) {
            $generator = new QuestionGenerator(new Randomizer(new Mt19937($seed)));

            foreach ($generator->round($level, 10) as $q) {
                $expected = $q['operation'] === '+' ? $q['a'] + $q['b'] : $q['a'] - $q['b'];
                $this->assertSame($expected, $q['answer']);
                $this->assertGreaterThanOrEqual(0, $q['answer']);
                $this->assertLessThanOrEqual($level, $q['answer']);
                $this->assertGreaterThanOrEqual(1, $q['b']);

                if ($q['operation'] === '+') {
                    $this->assertLessThanOrEqual(10, $q['a']);
                    $this->assertLessThanOrEqual(10, $q['b']);
                    if ($level === 20) {
                        $this->assertGreaterThan(10, $q['answer']);
                    }
                } else {
                    $this->assertLessThanOrEqual($level, $q['a']);
                    if ($level === 20) {
                        $this->assertGreaterThan(10, $q['a']);
                        $this->assertLessThanOrEqual(10, $q['b']);
                    }
                }
            }
        }
    }

    #[DataProvider('levels')]
    public function test_choices_are_distinct_in_range_and_include_answer(int $level): void
    {
        for ($seed = 1; $seed <= 200; $seed++) {
            $generator = new QuestionGenerator(new Randomizer(new Mt19937($seed)));

            foreach ($generator->round($level, 10, 4) as $q) {
                $this->assertCount(4, $q['choices']);
                $this->assertCount(4, array_unique($q['choices']));
                $this->assertContains($q['answer'], $q['choices']);
                foreach ($q['choices'] as $c) {
                    $this->assertGreaterThanOrEqual(0, $c);
                    $this->assertLessThanOrEqual($level, $c);
                }
            }
        }
    }

    public function test_round_has_no_repeated_exercises(): void
    {
        for ($seed = 1; $seed <= 100; $seed++) {
            $generator = new QuestionGenerator(new Randomizer(new Mt19937($seed)));
            $keys = array_map(fn ($q) => $q['a'].$q['operation'].$q['b'], $generator->round(10, 10));

            $this->assertCount(10, array_unique($keys));
        }
    }

    public function test_rejects_unknown_level(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        (new QuestionGenerator)->round(30, 10);
    }
}
