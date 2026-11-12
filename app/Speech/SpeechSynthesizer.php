<?php

namespace App\Speech;

interface SpeechSynthesizer
{
    /** Voice identifier, also used to separate cached audio per voice. */
    public function voice(): string;

    /** Returns MP3 bytes for the given Hebrew text, optionally with another voice of the same provider. */
    public function synthesize(string $text, ?string $voice = null): string;

    /** @return list<string> voices that may be requested (the voice lab in the parent area) */
    public function availableVoices(): array;
}
