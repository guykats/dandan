<?php

namespace Tests\Unit;

use App\Speech\HebrewNumbers;
use PHPUnit\Framework\TestCase;

class HebrewNumbersTest extends TestCase
{
    public function test_spells_numbers_in_a_question(): void
    {
        $this->assertSame('כמה זה שֶׁבַע ועוד חָמֵשׁ?', HebrewNumbers::spell('כמה זה 7 ועוד 5?'));
    }

    public function test_spells_teens_and_twenty(): void
    {
        $this->assertSame('שְׁלוֹשׁ עֶשְׂרֵה פחות שְׁמוֹנֶה זה חָמֵשׁ', HebrewNumbers::spell('13 פחות 8 זה 5'));
        $this->assertSame('עֶשְׂרִים', HebrewNumbers::spell('20'));
    }

    public function test_keeps_hebrew_prefix_attached(): void
    {
        $this->assertSame('השלמה לעֶשֶׂר', HebrewNumbers::spell('השלמה ל-10'));
    }

    public function test_sequences_and_zero(): void
    {
        $this->assertSame('איזה מספר חסר? אֶפֶס, שְׁתַּיִם, משהו, שֵׁשׁ', HebrewNumbers::spell('איזה מספר חסר? 0, 2, משהו, 6'));
    }

    public function test_every_number_up_to_twenty_has_a_word(): void
    {
        for ($n = 0; $n <= 20; $n++) {
            $this->assertNotNull(HebrewNumbers::word($n), "missing {$n}");
            $this->assertDoesNotMatchRegularExpression('/\d/', HebrewNumbers::spell((string) $n));
        }
        $this->assertSame('שְׁלוֹשִׁים וְאַחַת', HebrewNumbers::word(31));
    }
}
