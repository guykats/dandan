<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Single-row table: the app serves exactly one child.
        Schema::create('kid_profiles', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('level')->default(10);
            $table->unsignedInteger('stars')->default(0);
            // When the current level was set; promotion only counts rounds after this.
            $table->timestamp('level_since')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kid_profiles');
    }
};
