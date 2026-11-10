<?php

namespace Tests\Feature;

use App\Models\KidProfile;
use App\Models\Round;
use App\Models\StationProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GameFlowTest extends TestCase
{
    use RefreshDatabase;

    private function startRound(int $station = 1): Round
    {
        $this->get("/play/{$station}")->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Play')
            ->where('station.id', $station)
            ->has('questions', 10)
        );

        return Round::query()->latest('id')->firstOrFail();
    }

    /** Answer the first $correct exercises right on the first try, the rest wrong. */
    private function finish(Round $round, int $correct): TestResponse
    {
        $results = $round->attempts->map(fn ($a) => [
            'first_choice' => $a->position < $correct ? $a->answer : $a->answer + 1,
            'mistakes' => $a->position < $correct ? 0 : 1,
        ])->all();

        return $this->postJson("/rounds/{$round->id}/finish", ['results' => $results]);
    }

    public function test_home_and_journey_start_at_station_one(): void
    {
        $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Home')
            ->where('current.id', 1)
            ->where('kid.stars', 0)
        );

        $this->get('/journey')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Journey')
            ->has('stations', 40)
            ->has('worlds', 5)
            ->where('current', 1)
            ->where('stations.0.unlocked', true)
            ->where('stations.1.unlocked', false)
        );
    }

    public function test_locked_station_redirects_to_journey(): void
    {
        $this->get('/play/2')->assertRedirect('/journey');
        $this->get('/play/99')->assertRedirect('/journey');
        $this->assertSame(0, Round::count());
    }

    public function test_play_without_station_continues_the_journey(): void
    {
        $this->get('/play')->assertRedirect('/play/1');
    }

    public function test_passing_a_station_rates_it_and_unlocks_the_next(): void
    {
        $this->finish($this->startRound(1), 8)->assertOk()->assertJson([
            'correct' => 8,
            'stars' => 8,
            'rating' => 2,
            'passed' => true,
            'first_pass' => true,
            'next_station' => 2,
            'world_completed' => null,
        ]);

        $this->assertSame(8, KidProfile::current()->stars);
        $this->get('/play/2')->assertOk();
        $this->get('/journey')->assertInertia(fn (Assert $page) => $page->where('current', 2)->where('stations.0.bestStars', 2));
    }

    public function test_failing_a_station_keeps_the_next_one_locked(): void
    {
        $this->finish($this->startRound(1), 5)->assertJson(['rating' => 0, 'passed' => false, 'next_station' => null]);

        $this->get('/play/2')->assertRedirect('/journey');
    }

    public function test_replaying_keeps_the_best_rating(): void
    {
        $this->finish($this->startRound(1), 10)->assertJson(['rating' => 3, 'best_rating' => 3]);
        $this->finish($this->startRound(1), 6)->assertJson(['rating' => 1, 'best_rating' => 3, 'first_pass' => false]);

        $this->assertSame(3, StationProgress::find(1)->best_stars);
        $this->assertSame(2, StationProgress::find(1)->plays);
    }

    public function test_passing_a_world_challenge_completes_the_world(): void
    {
        for ($s = 1; $s <= 7; $s++) {
            StationProgress::create(['station' => $s, 'best_stars' => 1, 'completed_at' => now()]);
        }

        $this->finish($this->startRound(8), 9)->assertJson(['world_completed' => 0, 'next_station' => 9]);
    }

    public function test_finishing_the_last_station_completes_the_journey(): void
    {
        for ($s = 1; $s <= 39; $s++) {
            StationProgress::create(['station' => $s, 'best_stars' => 1, 'completed_at' => now()]);
        }

        $this->finish($this->startRound(40), 10)->assertJson(['journey_completed' => true, 'world_completed' => 4, 'next_station' => null]);
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

    public function test_stickers_unlock_every_twenty_stars(): void
    {
        $this->finish($this->startRound(), 10);
        $this->finish($this->startRound(), 9)->assertJson(['stickers_before' => 0, 'stickers_after' => 0]);
        $this->finish($this->startRound(), 1)->assertJson(['stickers_before' => 0, 'stickers_after' => 1]);
    }
}
