<?php

namespace App\Game;

use InvalidArgumentException;
use Random\Randomizer;

/** Generates a full round of exercises for a journey station. */
class QuestionGenerator
{
    private Randomizer $random;

    private QuestionFactory $factory;

    public function __construct(?Randomizer $random = null)
    {
        $this->random = $random ?? new Randomizer;
        $this->factory = new QuestionFactory($this->random);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function forStation(int $stationId, int $size, int $choiceCount = 4): array
    {
        $station = Curriculum::find($stationId) ?? throw new InvalidArgumentException("Unknown station: {$stationId}");
        $specs = $station['specs'];

        $questions = [];
        $seen = [];
        $guard = 0;

        while (count($questions) < $size) {
            // Rotate through the specs so mixed stations cover every skill, starting at a random offset.
            $spec = $specs[(count($questions) + $guard) % count($specs)];
            $question = $this->factory->make($spec, $choiceCount);

            // Avoid repeating the same exercise within a round (give up after many tries).
            if (isset($seen[$question['label']]) && $guard++ < 300) {
                continue;
            }

            $seen[$question['label']] = true;
            $questions[] = $question;
        }

        return $this->random->shuffleArray($questions);
    }
}
