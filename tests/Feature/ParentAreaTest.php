<?php

namespace Tests\Feature;

use App\Models\KidProfile;
use App\Models\Round;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ParentAreaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['dandan.parent_pin' => '4321']);
    }

    public function test_parent_screen_requires_pin(): void
    {
        $this->get('/parent')->assertOk()->assertInertia(fn (Assert $page) => $page->component('ParentGate'));
    }

    public function test_wrong_pin_is_rejected(): void
    {
        $this->post('/parent/unlock', ['pin' => '0000'])->assertSessionHasErrors('pin');
        $this->get('/parent')->assertInertia(fn (Assert $page) => $page->component('ParentGate'));
    }

    public function test_missing_server_pin_never_unlocks(): void
    {
        config(['dandan.parent_pin' => null]);

        $this->post('/parent/unlock', ['pin' => ''])->assertSessionHasErrors('pin');
        $this->get('/parent')->assertInertia(fn (Assert $page) => $page->component('ParentGate'));
    }

    public function test_pin_attempts_are_throttled(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->post('/parent/unlock', ['pin' => '0000']);
        }

        // Even the right PIN is refused while throttled.
        $this->post('/parent/unlock', ['pin' => '4321'])->assertSessionHasErrors('pin');
        $this->get('/parent')->assertInertia(fn (Assert $page) => $page->component('ParentGate'));
    }

    public function test_correct_pin_shows_dashboard(): void
    {
        $this->post('/parent/unlock', ['pin' => '4321'])->assertRedirect('/parent');

        $this->get('/parent')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Parent')
            ->where('stats.rounds', 0)
        );
    }

    public function test_actions_are_forbidden_while_locked(): void
    {
        $this->post('/parent/reset')->assertForbidden();
        $this->post('/parent/level', ['level' => 20])->assertForbidden();
    }

    public function test_parent_can_change_level_and_reset(): void
    {
        $this->post('/parent/unlock', ['pin' => '4321']);

        $this->post('/parent/level', ['level' => 20])->assertRedirect();
        $this->assertSame(20, KidProfile::current()->level);

        $this->get('/play');
        $this->assertSame(1, Round::count());

        $this->post('/parent/reset')->assertRedirect();
        $this->assertSame(0, Round::count());
        $this->assertSame(10, KidProfile::current()->level);
    }
}
