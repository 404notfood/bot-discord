<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Add is_active column to studi_whitelist if it doesn't exist
        if (Schema::hasTable('studi_whitelist') && !Schema::hasColumn('studi_whitelist', 'is_active')) {
            Schema::table('studi_whitelist', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('reason');
                $table->timestamp('updated_at')->nullable()->after('is_active');
            });
        }

        // Add is_active column to studi_offenders if it doesn't exist
        if (Schema::hasTable('studi_offenders') && !Schema::hasColumn('studi_offenders', 'is_active')) {
            Schema::table('studi_offenders', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('created_at');
                $table->timestamp('updated_at')->nullable()->after('is_active');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('studi_whitelist', 'is_active')) {
            Schema::table('studi_whitelist', function (Blueprint $table) {
                $table->dropColumn('is_active');
                $table->dropColumn('updated_at');
            });
        }

        if (Schema::hasColumn('studi_offenders', 'is_active')) {
            Schema::table('studi_offenders', function (Blueprint $table) {
                $table->dropColumn('is_active');
                $table->dropColumn('updated_at');
            });
        }
    }
};