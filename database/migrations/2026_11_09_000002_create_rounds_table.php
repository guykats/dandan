<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rounds', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('level');
            $table->unsignedTinyInteger('size');
            // Filled in when the round is finished; unfinished rounds are ignored in stats.
            $table->unsignedTinyInteger('correct_first_try')->nullable();
            $table->unsignedTinyInteger('stars')->nullable();
            $table->timestamp('finished_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('round_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('position');
            $table->char('operation', 1); // '+' or '-'
            $table->unsignedTinyInteger('a');
            $table->unsignedTinyInteger('b');
            $table->unsignedTinyInteger('answer');
            $table->unsignedTinyInteger('first_choice')->nullable();
            $table->unsignedTinyInteger('mistakes')->nullable();
            $table->boolean('correct_first_try')->nullable();
            $table->timestamps();

            $table->unique(['round_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attempts');
        Schema::dropIfExists('rounds');
    }
};
