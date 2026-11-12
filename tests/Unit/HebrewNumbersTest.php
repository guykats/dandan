<?php

namespace Tests\Unit;

use App\Speech\HebrewNumbers;
use PHPUnit\Framework\TestCase;

class HebrewNumbersTest extends TestCase
{
    public function test_spells_numbers_in_a_question(): void
    {
        $this->assertSame('כמה זה שֶׁבַע ועוד חָמֵשׁ?', HebrewNumbers::spell('כמה זה 7 ועוד 5?', 'nikud'));
    }

    public function test_spells_teens_and_twenty(): void
    {
        $this->assertSame('שְׁלוֹשׁ עֶשְׂרֵה פחות שְׁמוֹנֶה זה חָמֵשׁ', HebrewNumbers::spell('13 פחות 8 זה 5', 'nikud'));
        $this->assertSame('עֶשְׂרִים', HebrewNumbers::spell('20', 'nikud'));
    }

    public function test_keeps_hebrew_prefix_attached(): void
    {
        $this->assertSame('השלמה לעֶשֶׂר', HebrewNumbers::spell('השלמה ל-10', 'nikud'));
    }

    public function test_sequences_and_zero(): void
    {
        $this->assertSame('איזה מספר חסר? אֶפֶס, שְׁתַּיִם, משהו, שֵׁשׁ', HebrewNumbers::spell('איזה מספר חסר? 0, 2, משהו, 6', 'nikud'));
    }

    public function test_every_number_up_to_twenty_has_a_word(): void
    {
        for ($n = 0; $n <= 20; $n++) {
            $this->assertNotNull(HebrewNumbers::word($n), "missing {$n}");
            $this->assertDoesNotMatchRegularExpression('/\d/', HebrewNumbers::spell((string) $n));
        }
        $this->assertSame('שְׁלוֹשִׁים וְאַחַת', HebrewNumbers::word(31));
    }

    public function test_words_mode_has_no_vowel_marks(): void
    {
        $this->assertSame('כמה זה שבע ועוד חמש?', HebrewNumbers::spell('כמה זה 7 ועוד 5?'));
        $this->assertSame('השלמה לעשר', HebrewNumbers::spell('השלמה ל-10', 'words'));
        $this->assertSame('שלוש עשרה', HebrewNumbers::spell('13'));
    }

    public function test_digits_mode_leaves_text_unchanged(): void
    {
        $this->assertSame('כמה זה 7 ועוד 5?', HebrewNumbers::spell('כמה זה 7 ועוד 5?', 'digits'));
    }
}
