<?php

namespace App\Speech;

interface SpeechSynthesizer
{
    /** Voice identifier, also used to separate cached audio per voice. */
    public function voice(): string;

    /** Returns MP3 bytes for the given Hebrew text. */
    public function synthesize(string $text): string;
}
