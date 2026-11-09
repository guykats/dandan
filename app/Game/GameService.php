<?php

namespace App\Game;

use App\Models\KidProfile;
use App\Models\Round;
use Illuminate\Support\Facades\DB;

class GameService
{
    public function __construct(private QuestionGenerator $generator) {}

    /**
     * Create a new round with stored answers and return it with its questions.
     *
     * @return array{round: Round, questions: list<array<string, mixed>>}
     */
    public function startRound(KidProfile $profile): array
    {
        $size = (int) config('dandan.round_size');
        $questions = $this->generator->round($profile->level, $size, (int) config('dandan.choices'));

        $round = DB::transaction(function () use ($profile, $size, $questions) {
            $round = Round::create(['level' => $profile->level, 'size' => $size]);

            foreach ($questions as $i => $q) {
                $round->attempts()->create([
                    'position' => $i,
                    'operation' => $q['operation'],
                    'a' => $q['a'],
                    'b' => $q['b'],
                    'answer' => $q['answer'],
                ]);
            }

            return $round;
        });

        return ['round' => $round, 'questions' => $questions];
    }

    /**
     * Record results for a round. Correctness is judged against the stored answers,
     * never against what the client claims.
     *
     * @param  list<array{first_choice: int, mistakes: int}>  $results
     * @return array{stars: int, correct: int, total_stars: int, level: int, promoted: bool, stickers_before: int, stickers_after: int}
     */
    public function finishRound(Round $round, array $results): array
    {
        return DB::transaction(function () use ($round, $results) {
            $profile = KidProfile::current();
            $stickersBefore = $profile->stickersUnlocked();
            $correct = 0;

            foreach ($round->attempts as $attempt) {
                $result = $results[$attempt->position] ?? null;
                $firstChoice = $result['first_choice'] ?? null;
                $isCorrect = $firstChoice !== null && (int) $firstChoice === $attempt->answer;

                $attempt->update([
                    'first_choice' => $firstChoice,
                    'mistakes' => (int) ($result['mistakes'] ?? 0),
                    'correct_first_try' => $isCorrect,
                ]);

                $correct += $isCorrect ? 1 : 0;
            }

            // One star per exercise answered correctly on the first try.
            $round->update([
                'correct_first_try' => $correct,
                'stars' => $correct,
                'finished_at' => now(),
            ]);

            $profile->stars += $correct;
            $promoted = $this->shouldPromote($profile);
            if ($promoted) {
                $profile->setLevel(20);
            }
            $profile->save();

            return [
                'stars' => $correct,
                'correct' => $correct,
                'total_stars' => $profile->stars,
                'level' => $profile->level,
                'promoted' => $promoted,
                'stickers_before' => $stickersBefore,
                'stickers_after' => $profile->stickersUnlocked(),
            ];
        });
    }

    private function shouldPromote(KidProfile $profile): bool
    {
        if ($profile->level !== 10) {
            return false;
        }

        $needed = (int) config('dandan.promotion_rounds');
        $minCorrect = (int) config('dandan.promotion_min_correct');

        $recent = Round::query()
            ->finished()
            ->where('level', 10)
            ->when($profile->level_since, fn ($q, $since) => $q->where('finished_at', '>=', $since))
            ->latest('finished_at')
            ->latest('id')
            ->limit($needed)
            ->pluck('correct_first_try');

        return $recent->count() === $needed && $recent->every(fn ($c) => $c >= $minCorrect);
    }
}
