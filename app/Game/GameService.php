<?php

namespace App\Game;

use App\Models\KidProfile;
use App\Models\Round;
use App\Models\StationProgress;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class GameService
{
    public function __construct(private QuestionGenerator $generator) {}

    /** @return Collection<int, StationProgress> keyed by station id */
    private function progress(): Collection
    {
        return StationProgress::query()->get()->keyBy('station');
    }

    /** A station is open when it is the first one or the previous one has at least one star. */
    public function isUnlocked(int $stationId, ?Collection $progress = null): bool
    {
        if ($stationId === 1) {
            return true;
        }

        $progress ??= $this->progress();

        return ($progress->get($stationId - 1)?->best_stars ?? 0) >= 1;
    }

    /**
     * Map data for the journey screen.
     *
     * @return array{stations: list<array<string, mixed>>, current: int}
     */
    public function journey(): array
    {
        $progress = $this->progress();
        $stations = [];
        $current = null;

        foreach (Curriculum::stations() as $station) {
            $best = $progress->get($station['id'])?->best_stars ?? 0;
            $unlocked = $this->isUnlocked($station['id'], $progress);

            if ($current === null && $unlocked && $best === 0) {
                $current = $station['id'];
            }

            $stations[] = [
                'id' => $station['id'],
                'world' => $station['world'],
                'title' => $station['title'],
                'boss' => $station['boss'],
                'bestStars' => $best,
                'unlocked' => $unlocked,
            ];
        }

        return ['stations' => $stations, 'current' => $current ?? Curriculum::count()];
    }

    /**
     * Create a new round with stored answers and return it with its questions.
     *
     * @return array{round: Round, questions: list<array<string, mixed>>}
     */
    public function startRound(int $stationId): array
    {
        $size = (int) config('dandan.round_size');
        $questions = $this->generator->forStation($stationId, $size, (int) config('dandan.choices'));

        $round = DB::transaction(function () use ($stationId, $size, $questions) {
            $round = Round::create(['station' => $stationId, 'size' => $size]);

            foreach ($questions as $i => $q) {
                $equation = $q['type'] === 'equation' ? $q['data'] : null;

                $round->attempts()->create([
                    'position' => $i,
                    'type' => $q['type'],
                    'skill' => $q['skill'],
                    'label' => $q['label'],
                    'operation' => $equation['op'] ?? null,
                    'a' => $equation['a'] ?? null,
                    'b' => $equation['b'] ?? null,
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
     * @return array<string, mixed>
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

            $rating = Curriculum::rating($correct, $round->size);

            // One collection star per exercise answered correctly on the first try.
            $round->update([
                'correct_first_try' => $correct,
                'stars' => $correct,
                'rating' => $rating,
                'finished_at' => now(),
            ]);

            $profile->stars += $correct;
            $profile->save();

            $progress = StationProgress::query()->firstOrNew(['station' => $round->station]);
            $firstPass = $rating >= 1 && $progress->completed_at === null;
            $progress->plays += 1;
            $progress->best_stars = max($progress->best_stars, $rating);
            if ($firstPass) {
                $progress->completed_at = now();
            }
            $progress->save();

            $station = Curriculum::find($round->station);
            $nextId = $round->station + 1;
            $hasNext = Curriculum::find($nextId) !== null;

            return [
                'correct' => $correct,
                'stars' => $correct,
                'rating' => $rating,
                'best_rating' => $progress->best_stars,
                'passed' => $rating >= 1,
                'first_pass' => $firstPass,
                'next_station' => $rating >= 1 && $hasNext ? $nextId : null,
                // Passing a world's challenge for the first time opens the next world.
                'world_completed' => $firstPass && $station['boss'] ? $station['world'] : null,
                'journey_completed' => $firstPass && ! $hasNext,
                'total_stars' => $profile->stars,
                'stickers_before' => $stickersBefore,
                'stickers_after' => $profile->stickersUnlocked(),
            ];
        });
    }

    /** Parent override: mark every station before $stationId as passed so it becomes playable. */
    public function unlockUpTo(int $stationId): void
    {
        DB::transaction(function () use ($stationId) {
            for ($id = 1; $id < $stationId; $id++) {
                $progress = StationProgress::query()->firstOrNew(['station' => $id]);
                if ($progress->best_stars < 1) {
                    $progress->best_stars = 1;
                    $progress->completed_at ??= now();
                    $progress->save();
                }
            }
        });
    }
}
