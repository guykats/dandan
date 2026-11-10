<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('station_progress', function (Blueprint $table) {
            $table->unsignedTinyInteger('station')->primary();
            $table->unsignedTinyInteger('best_stars')->default(0);
            $table->unsignedInteger('plays')->default(0);
            // First time the station was passed (1+ stars).
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::table('rounds', function (Blueprint $table) {
            $table->unsignedTinyInteger('station')->default(1)->after('id')->index();
            $table->unsignedTinyInteger('rating')->nullable()->after('stars');
            $table->unsignedTinyInteger('level')->nullable()->change();
        });

        Schema::table('attempts', function (Blueprint $table) {
            $table->string('type', 12)->default('equation')->after('position');
            $table->string('skill', 12)->default('add')->after('type')->index();
            $table->string('label', 40)->nullable()->after('skill');
            $table->char('operation', 1)->nullable()->change();
            $table->unsignedTinyInteger('a')->nullable()->change();
            $table->unsignedTinyInteger('b')->nullable()->change();
        });

        // Attempts recorded before the journey were plain + / - exercises.
        DB::table('attempts')->where('operation', '-')->update(['skill' => 'sub']);

        Schema::table('kid_profiles', function (Blueprint $table) {
            $table->dropColumn(['level', 'level_since']);
        });
    }

    public function down(): void
    {
        Schema::table('kid_profiles', function (Blueprint $table) {
            $table->unsignedTinyInteger('level')->default(10);
            $table->timestamp('level_since')->nullable();
        });

        Schema::table('attempts', function (Blueprint $table) {
            $table->dropIndex(['skill']);
            $table->dropColumn(['type', 'skill', 'label']);
        });

        Schema::table('rounds', function (Blueprint $table) {
            $table->dropIndex(['station']);
            $table->dropColumn(['station', 'rating']);
        });

        Schema::dropIfExists('station_progress');
    }
};
