<?php

namespace Tests\Unit;

use App\Speech\HebrewLexicon;
use App\Speech\HebrewNumbers;
use PHPUnit\Framework\TestCase;

class HebrewLexiconTest extends TestCase
{
    public function test_vocalizes_known_words_and_keeps_punctuation(): void
    {
        $this->assertSame('כִּמְעַט! עוֹד פַּעַם', HebrewLexicon::vocalize('כמעט! עוד פעם'));
        $this->assertSame('כָּל הַכָּבוֹד!', HebrewLexicon::vocalize('כל הכבוד!'));
    }

    public function test_only_whole_words_are_replaced(): void
    {
        // "כל" must not change inside "כלב"; unknown words stay as written.
        $this->assertSame('כלב גדולים', HebrewLexicon::vocalize('כלב גדולים'));
    }

    public function test_handles_geresh_words(): void
    {
        $this->assertSame('אֶתְגַּר הַגּ׳וּנְגֶּל', HebrewLexicon::vocalize('אתגר הג׳ונגל'));
    }

    public function test_combines_with_number_spelling(): void
    {
        $text = HebrewNumbers::spell(HebrewLexicon::vocalize('כמה זה 7 ועוד 5?'), 'words');
        $this->assertSame('כַּמָּה זֶה שבע וְעוֹד חמש?', $text);

        $this->assertSame('הַשְׁלָמָה לעשר', HebrewNumbers::spell(HebrewLexicon::vocalize('השלמה ל-10'), 'words'));
    }
}
