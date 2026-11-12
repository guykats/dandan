<?php

namespace App\Speech;

/**
 * Spells out numbers as vocalized Hebrew words before text is sent to a speech engine.
 *
 * Engines read bare digits inconsistently (masculine vs. feminine forms, wrong stress).
 * Plain counting and arithmetic in Hebrew use the feminine forms, so that is what we emit;
 * sentences that count a masculine noun (e.g. "כוכבים") should spell the number themselves.
 */
class HebrewNumbers
{
    /** @var array<int, string> */
    private const WORDS = [
        0 => 'אֶפֶס',
        1 => 'אַחַת',
        2 => 'שְׁתַּיִם',
        3 => 'שָׁלוֹשׁ',
        4 => 'אַרְבַּע',
        5 => 'חָמֵשׁ',
        6 => 'שֵׁשׁ',
        7 => 'שֶׁבַע',
        8 => 'שְׁמוֹנֶה',
        9 => 'תֵּשַׁע',
        10 => 'עֶשֶׂר',
        11 => 'אַחַת עֶשְׂרֵה',
        12 => 'שְׁתֵּים עֶשְׂרֵה',
        13 => 'שְׁלוֹשׁ עֶשְׂרֵה',
        14 => 'אַרְבַּע עֶשְׂרֵה',
        15 => 'חֲמֵשׁ עֶשְׂרֵה',
        16 => 'שֵׁשׁ עֶשְׂרֵה',
        17 => 'שְׁבַע עֶשְׂרֵה',
        18 => 'שְׁמוֹנֶה עֶשְׂרֵה',
        19 => 'תְּשַׁע עֶשְׂרֵה',
        20 => 'עֶשְׂרִים',
    ];

    private const TENS = [2 => 'עֶשְׂרִים', 3 => 'שְׁלוֹשִׁים', 4 => 'אַרְבָּעִים', 5 => 'חֲמִשִּׁים', 6 => 'שִׁשִּׁים', 7 => 'שִׁבְעִים', 8 => 'שְׁמוֹנִים', 9 => 'תִּשְׁעִים'];

    public static function word(int $n): ?string
    {
        if (isset(self::WORDS[$n])) {
            return self::WORDS[$n];
        }

        if ($n > 20 && $n < 100) {
            $tens = self::TENS[intdiv($n, 10)];
            $units = $n % 10;

            return $units === 0 ? $tens : $tens.' וְ'.self::WORDS[$units];
        }

        return null;
    }

    /** Replace every number in the text with its Hebrew word, including prefixed forms like "ל-10". */
    public static function spell(string $text): string
    {
        return preg_replace_callback(
            '/(?:(?<prefix>[בהוכלמש])-)?(?<n>\d+)/u',
            function (array $m) {
                $word = self::word((int) $m['n']);

                return $word === null ? $m[0] : ($m['prefix'] ?? '').$word;
            },
            $text,
        );
    }
}
