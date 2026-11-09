<?php

namespace Tests\Feature;

use App\Models\KidProfile;
use App\Models\Round;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GameFlowTest extends TestCase
{
    use RefreshDatabase;

    private function startRound(): Round
    {
        $this->get('/play')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Play')
            ->has('questions', 10)
        );

        return Round::query()->latest('id')->firstOrFail();
    }

    /**
     * Answer the first $correct exercises right on the first try, the rest wrong.
     */
    private function finish(Round $round, int $correct): \Illuminate\Testing\TestResponse
    {
        $results = $round->attempts->map(fn ($a) => [
            'first_choice' => $a->position < $correct ? $a->answer : $a->answer + 1,
            'mistakes' => $a->position < $correct ? 0 : 1,
        ])->all();

        return $this->postJson("/rounds/{$round->id}/finish", ['results' => $results]);
    }

    public function test_home_page_loads(): void
    {
        $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Home')
            ->where('kid.level', 10)
            ->where('kid.stars', 0)
        );
    }

    public function test_finishing_a_round_awards_stars_judged_by_the_server(): void
    {
        $round = $this->startRound();

        $this->finish($round, 7)->assertOk()->assertJson([
            'stars' => 7,
            'total_stars' => 7,
            'level' => 10,
            'promoted' => false,
        ]);

        $this->assertSame(7, KidProfile::current()->stars);
        $this->assertSame(7, $round->fresh()->correct_first_try);
    }

    public function test_a_round_cannot_be_finished_twice(): void
    {
        $round = $this->startRound();
        $this->finish($round, 10)->assertOk();
        $this->finish($round, 10)->assertStatus(409);

        $this->assertSame(10, KidProfile::current()->stars);
    }

    public function test_results_must_match_round_size(): void
    {
        $round = $this->startRound();

        $this->postJson("/rounds/{$round->id}/finish", ['results' => [['first_choice' => 1, 'mistakes' => 0]]])
            ->assertStatus(422);
    }

    public function test_three_strong_rounds_in_a_row_promote_to_level_20(): void
    {
        $this->finish($this->startRound(), 9)->assertJson(['promoted' => false]);
        $this->finish($this->startRound(), 8)->assertJson(['promoted' => false]);
        $this->finish($this->startRound(), 10)->assertJson(['promoted' => true, 'level' => 20]);

        $this->get('/play')->assertInertia(fn (Assert $page) => $page->where('level', 20));
    }

    public function test_a_weak_round_breaks_the_promotion_streak(): void
    {
        $this->finish($this->startRound(), 9);
        $this->finish($this->startRound(), 5);
        $this->finish($this->startRound(), 10)->assertJson(['promoted' => false, 'level' => 10]);
    }

    public function test_stickers_unlock_every_twenty_stars(): void
    {
        $this->finish($this->startRound(), 10);
        $this->finish($this->startRound(), 9)->assertJson(['stickers_before' => 0, 'stickers_after' => 0]);
        $this->finish($this->startRound(), 1)->assertJson(['stickers_before' => 0, 'stickers_after' => 1]);
    }
}
