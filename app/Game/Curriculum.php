<?php

namespace App\Game;

/**
 * DanDan's journey: 5 worlds x 8 stations. Station 8 of each world is a review "challenge".
 *
 * Each station lists one or more specs; every exercise in a round picks one of them at random.
 * `visual` stations always show the counting aid (apples / ten-frame) instead of only after a mistake.
 */
class Curriculum
{
    public const STATIONS_PER_WORLD = 8;

    /** @var list<array{id: string, name: string}> */
    public const WORLDS = [
        ['id' => 'sea', 'name' => 'עולם הים'],
        ['id' => 'savanna', 'name' => 'הסוואנה'],
        ['id' => 'jungle', 'name' => 'הג׳ונגל'],
        ['id' => 'mountains', 'name' => 'ההרים'],
        ['id' => 'sky', 'name' => 'השמיים'],
    ];

    /**
     * @return list<array{id: int, world: int, title: string, boss: bool, visual: bool, specs: list<array<string, mixed>>}>
     */
    public static function stations(): array
    {
        $raw = [
            // 1. Sea: numbers up to 10
            ['ספירה עד 5', true, [['kind' => 'count', 'min' => 1, 'max' => 5]]],
            ['ספירה עד 10', true, [['kind' => 'count', 'min' => 3, 'max' => 10]]],
            ['חיבור עד 5', true, [['kind' => 'add', 'mode' => 'basic', 'max' => 5]]],
            ['חיבור עד 10', true, [['kind' => 'add', 'mode' => 'basic', 'max' => 10]]],
            ['מי יותר?', true, [['kind' => 'compare', 'mode' => 'objects', 'max' => 8]]],
            ['חיסור עד 5', true, [['kind' => 'sub', 'mode' => 'basic', 'max' => 5]]],
            ['חיסור עד 10', true, [['kind' => 'sub', 'mode' => 'basic', 'max' => 10]]],
            ['אתגר הים', true, [
                ['kind' => 'count', 'min' => 3, 'max' => 10],
                ['kind' => 'add', 'mode' => 'basic', 'max' => 10],
                ['kind' => 'sub', 'mode' => 'basic', 'max' => 10],
                ['kind' => 'compare', 'mode' => 'objects', 'max' => 8],
            ]],

            // 2. Savanna: mastering 10
            ['חיבור וחיסור עד 10', false, [['kind' => 'add', 'mode' => 'basic', 'max' => 10], ['kind' => 'sub', 'mode' => 'basic', 'max' => 10]]],
            ['סדרות של 1', false, [['kind' => 'sequence', 'steps' => [1], 'max' => 10]]],
            ['השלמה ל-10', true, [['kind' => 'missing', 'mode' => 'complement10']]],
            ['מספר חסר עד 10', true, [['kind' => 'missing', 'mode' => 'addend', 'max' => 10]]],
            ['גדול, קטן או שווה', false, [['kind' => 'compare', 'mode' => 'numbers', 'max' => 10]]],
            ['סדרות קדימה ואחורה', false, [['kind' => 'sequence', 'steps' => [1, -1], 'max' => 20]]],
            ['ספירה עד 20', false, [['kind' => 'count', 'min' => 10, 'max' => 20]]],
            ['אתגר הסוואנה', false, [
                ['kind' => 'missing', 'mode' => 'complement10'],
                ['kind' => 'missing', 'mode' => 'addend', 'max' => 10],
                ['kind' => 'compare', 'mode' => 'numbers', 'max' => 20],
                ['kind' => 'sequence', 'steps' => [1, -1], 'max' => 20],
                ['kind' => 'sub', 'mode' => 'basic', 'max' => 10],
            ]],

            // 3. Jungle: up to 20 without crossing ten
            ['עשר ועוד', false, [['kind' => 'add', 'mode' => 'ten_plus']]],
            ['חיבור עד 20', false, [['kind' => 'add', 'mode' => 'teen_no_carry']]],
            ['חיסור עד 20', false, [['kind' => 'sub', 'mode' => 'teen_no_borrow']]],
            ['חוזרים לעשר', false, [['kind' => 'sub', 'mode' => 'to_ten']]],
            ['ערבוב עד 20', false, [['kind' => 'add', 'mode' => 'teen_no_carry'], ['kind' => 'sub', 'mode' => 'teen_no_borrow']]],
            ['סדרות של 2', false, [['kind' => 'sequence', 'steps' => [2], 'max' => 20]]],
            ['גדול, קטן או שווה עד 20', false, [['kind' => 'compare', 'mode' => 'numbers', 'max' => 20]]],
            ['אתגר הג׳ונגל', false, [
                ['kind' => 'add', 'mode' => 'ten_plus'],
                ['kind' => 'add', 'mode' => 'teen_no_carry'],
                ['kind' => 'sub', 'mode' => 'teen_no_borrow'],
                ['kind' => 'sub', 'mode' => 'to_ten'],
                ['kind' => 'sequence', 'steps' => [2], 'max' => 20],
            ]],

            // 4. Mountains: crossing ten
            ['כפולות', false, [['kind' => 'add', 'mode' => 'doubles']]],
            ['חיבור מעל 10', true, [['kind' => 'add', 'mode' => 'carry']]],
            ['חיבור מעל 10 — עוד', false, [['kind' => 'add', 'mode' => 'carry']]],
            ['חיסור מעבר לעשר', false, [['kind' => 'sub', 'mode' => 'borrow']]],
            ['חיסור מעבר לעשר — עוד', false, [['kind' => 'sub', 'mode' => 'borrow']]],
            ['מספר חסר עד 20', false, [['kind' => 'missing', 'mode' => 'addend', 'max' => 20]]],
            ['תרגיל מול מספר', false, [['kind' => 'compare', 'mode' => 'expression', 'max' => 20]]],
            ['אתגר ההרים', false, [
                ['kind' => 'add', 'mode' => 'doubles'],
                ['kind' => 'add', 'mode' => 'carry'],
                ['kind' => 'sub', 'mode' => 'borrow'],
                ['kind' => 'missing', 'mode' => 'addend', 'max' => 20],
                ['kind' => 'compare', 'mode' => 'expression', 'max' => 20],
            ]],

            // 5. Sky: everything up to 20
            ['חיבור עד 20 — הכל', false, [['kind' => 'add', 'mode' => 'to20']]],
            ['חיסור עד 20 — הכל', false, [['kind' => 'sub', 'mode' => 'to20']]],
            ['סדרות קופצות', false, [['kind' => 'sequence', 'steps' => [2, -2, 5], 'max' => 20]]],
            ['מה חסר בתרגיל?', false, [['kind' => 'missing', 'mode' => 'any', 'max' => 20]]],
            ['תרגיל מול מספר — עוד', false, [['kind' => 'compare', 'mode' => 'expression', 'max' => 20]]],
            ['ערבוב גדול', false, [['kind' => 'add', 'mode' => 'to20'], ['kind' => 'sub', 'mode' => 'to20'], ['kind' => 'missing', 'mode' => 'any', 'max' => 20]]],
            ['כמעט בפסגה', false, [
                ['kind' => 'add', 'mode' => 'carry'],
                ['kind' => 'sub', 'mode' => 'borrow'],
                ['kind' => 'sequence', 'steps' => [2, -2, 5], 'max' => 20],
                ['kind' => 'compare', 'mode' => 'expression', 'max' => 20],
            ]],
            ['האתגר הגדול', false, [
                ['kind' => 'add', 'mode' => 'to20'],
                ['kind' => 'sub', 'mode' => 'to20'],
                ['kind' => 'missing', 'mode' => 'any', 'max' => 20],
                ['kind' => 'compare', 'mode' => 'expression', 'max' => 20],
                ['kind' => 'sequence', 'steps' => [2, -2, 5], 'max' => 20],
            ]],
        ];

        $stations = [];
        foreach ($raw as $i => [$title, $visual, $specs]) {
            $stations[] = [
                'id' => $i + 1,
                'world' => intdiv($i, self::STATIONS_PER_WORLD),
                'title' => $title,
                'boss' => ($i + 1) % self::STATIONS_PER_WORLD === 0,
                'visual' => $visual,
                'specs' => $specs,
            ];
        }

        return $stations;
    }

    public static function count(): int
    {
        return count(self::stations());
    }

    /** @return array{id: int, world: int, title: string, boss: bool, visual: bool, specs: list<array<string, mixed>>}|null */
    public static function find(int $id): ?array
    {
        return self::stations()[$id - 1] ?? null;
    }

    /** Stars for a round: 6 correct = 1, 8 = 2, 10 = 3 (scaled to round size). */
    public static function rating(int $correct, int $size): int
    {
        $ratio = $size > 0 ? $correct / $size : 0;

        return match (true) {
            $ratio >= 1.0 => 3,
            $ratio >= 0.8 => 2,
            $ratio >= 0.6 => 1,
            default => 0,
        };
    }
}
