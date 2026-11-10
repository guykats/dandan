<?php

namespace Tests\Unit;

use App\Game\Curriculum;
use App\Game\QuestionFactory;
use App\Game\QuestionGenerator;
use PHPUnit\Framework\TestCase;
use Random\Engine\Mt19937;
use Random\Randomizer;

class QuestionGeneratorTest extends TestCase
{
    public function test_curriculum_has_five_worlds_of_eight_stations_with_a_challenge_at_the_end(): void
    {
        $stations = Curriculum::stations();

        $this->assertCount(40, $stations);
        foreach ($stations as $i => $s) {
            $this->assertSame($i + 1, $s['id']);
            $this->assertSame(intdiv($i, 8), $s['world']);
            $this->assertSame(($i + 1) % 8 === 0, $s['boss']);
        }
    }

    public function test_every_station_produces_valid_unique_rounds(): void
    {
        foreach (Curriculum::stations() as $station) {
            for ($seed = 1; $seed <= 40; $seed++) {
                $generator = new QuestionGenerator(new Randomizer(new Mt19937($seed * 1000 + $station['id'])));
                $round = $generator->forStation($station['id'], 10);

                $this->assertCount(10, $round, "station {$station['id']}");
                $this->assertCount(10, array_unique(array_column($round, 'label')), "station {$station['id']} repeats an exercise");

                foreach ($round as $q) {
                    $this->assertQuestionIsValid($q, "station {$station['id']}: {$q['label']}");
                }
            }
        }
    }

    private function assertQuestionIsValid(array $q, string $context): void
    {
        $this->assertContains($q['answer'], $q['choices'], $context);
        $this->assertSame(count($q['choices']), count(array_unique($q['choices'])), $context);
        $this->assertNotEmpty($q['speech'], $context);

        switch ($q['type']) {
            case 'equation':
                $d = $q['data'];
                $this->assertSame($d['op'] === '+' ? $d['a'] + $d['b'] : $d['a'] - $d['b'], $d['result'], $context);
                $this->assertSame($d[$d['blank']], $q['answer'], $context);
                $this->assertGreaterThanOrEqual(0, $d['result'], $context);
                $this->assertLessThanOrEqual(20, max($d['a'], $d['b'], $d['result']), $context);
                $this->assertCount(4, $q['choices'], $context);
                foreach ($q['choices'] as $c) {
                    $this->assertGreaterThanOrEqual(0, $c, $context);
                    $this->assertLessThanOrEqual(20, $c, $context);
                }
                break;
            case 'count':
                $this->assertSame($q['data']['n'], $q['answer'], $context);
                break;
            case 'compare':
                $left = $q['data']['left']['value'];
                $right = $q['data']['right']['value'];
                $expected = [-1 => QuestionFactory::COMPARE_LESS, 0 => QuestionFactory::COMPARE_EQUAL, 1 => QuestionFactory::COMPARE_GREATER][$left <=> $right];
                $this->assertSame($expected, $q['answer'], $context);
                if ($q['data']['left']['expr'] !== null) {
                    // The expression must actually evaluate to the left value.
                    preg_match('/^(\d+) ([+-]) (\d+)$/', $q['data']['left']['expr'], $m);
                    $this->assertSame($left, $m[2] === '+' ? (int) $m[1] + (int) $m[3] : (int) $m[1] - (int) $m[3], $context);
                }
                break;
            case 'sequence':
                $items = $q['data']['items'];
                $blank = array_search(null, $items, true);
                $this->assertNotFalse($blank, $context);
                $items[$blank] = $q['answer'];
                $step = $items[1] - $items[0];
                $this->assertNotSame(0, $step, $context);
                for ($i = 1; $i < count($items); $i++) {
                    $this->assertSame($step, $items[$i] - $items[$i - 1], $context);
                }
                $this->assertGreaterThanOrEqual(0, min($items), $context);
                break;
            default:
                $this->fail("Unknown type {$q['type']}");
        }
    }

    public function test_rating_thresholds(): void
    {
        $this->assertSame(0, Curriculum::rating(5, 10));
        $this->assertSame(1, Curriculum::rating(6, 10));
        $this->assertSame(1, Curriculum::rating(7, 10));
        $this->assertSame(2, Curriculum::rating(8, 10));
        $this->assertSame(2, Curriculum::rating(9, 10));
        $this->assertSame(3, Curriculum::rating(10, 10));
    }

    public function test_rejects_unknown_station(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        (new QuestionGenerator)->forStation(99, 10);
    }
}
