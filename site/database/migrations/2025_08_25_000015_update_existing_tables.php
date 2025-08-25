<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Mettre à jour la table bot_admins pour correspondre au schéma
        Schema::table('bot_admins', function (Blueprint $table) {
            if (!Schema::hasColumn('bot_admins', 'added_by')) {
                $table->string('added_by', 50)->after('username')->comment('Discord User ID qui a ajouté');
            }
            if (!Schema::hasColumn('bot_admins', 'added_at')) {
                $table->timestamp('added_at')->after('added_by')->useCurrent();
            }
        });

        // Mettre à jour la table dashboard_members
        Schema::table('dashboard_members', function (Blueprint $table) {
            if (!Schema::hasColumn('dashboard_members', 'last_seen_at')) {
                $table->timestamp('last_seen_at')->nullable()->after('is_active');
            }
            if (!Schema::hasColumn('dashboard_members', 'permissions')) {
                $table->json('permissions')->nullable()->after('last_seen_at')->comment('Permissions spécifiques');
            }
        });

        // Mettre à jour la table moderation_logs
        Schema::table('moderation_logs', function (Blueprint $table) {
            // Modifier l'enum action_type pour inclure les nouvelles valeurs
            DB::statement("ALTER TABLE moderation_logs MODIFY COLUMN action_type ENUM('warn','kick','ban','unban','mute','unmute','timeout','message_delete') NOT NULL");
        });

        // Mettre à jour la table main_projects
        Schema::table('main_projects', function (Blueprint $table) {
            if (!Schema::hasColumn('main_projects', 'channel_id')) {
                $table->string('channel_id', 50)->nullable()->after('leader_username')->comment('Canal Discord du projet');
            }
            if (!Schema::hasColumn('main_projects', 'role_id')) {
                $table->string('role_id', 50)->nullable()->after('channel_id')->comment('Rôle Discord du projet');
            }
            if (!Schema::hasColumn('main_projects', 'max_members')) {
                $table->integer('max_members')->nullable()->default(10)->after('role_id');
            }
            if (!Schema::hasColumn('main_projects', 'technologies')) {
                $table->json('technologies')->nullable()->after('max_members')->comment('Technologies utilisées');
            }
            if (!Schema::hasColumn('main_projects', 'start_date')) {
                $table->date('start_date')->nullable()->after('technologies');
            }
            if (!Schema::hasColumn('main_projects', 'end_date')) {
                $table->date('end_date')->nullable()->after('start_date');
            }
        });

        // Mettre à jour la table project_subgroups
        Schema::table('project_subgroups', function (Blueprint $table) {
            if (!Schema::hasColumn('project_subgroups', 'channel_id')) {
                $table->string('channel_id', 50)->nullable()->after('leader_username');
            }
            if (!Schema::hasColumn('project_subgroups', 'role_id')) {
                $table->string('role_id', 50)->nullable()->after('channel_id');
            }
            if (!Schema::hasColumn('project_subgroups', 'max_members')) {
                $table->integer('max_members')->nullable()->default(5)->after('role_id');
            }
        });

        // Mettre à jour la table doc_resources
        Schema::table('doc_resources', function (Blueprint $table) {
            if (!Schema::hasColumn('doc_resources', 'tags')) {
                $table->json('tags')->nullable()->after('tutorial_url');
            }
            if (!Schema::hasColumn('doc_resources', 'difficulty_level')) {
                $table->enum('difficulty_level', ['beginner', 'intermediate', 'advanced'])->default('beginner')->after('tags');
            }
            if (!Schema::hasColumn('doc_resources', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('difficulty_level');
            }
            if (!Schema::hasColumn('doc_resources', 'view_count')) {
                $table->integer('view_count')->default(0)->after('is_active');
            }
        });
    }

    public function down(): void
    {
        Schema::table('doc_resources', function (Blueprint $table) {
            $table->dropColumn(['tags', 'difficulty_level', 'is_active', 'view_count']);
        });

        Schema::table('project_subgroups', function (Blueprint $table) {
            $table->dropColumn(['channel_id', 'role_id', 'max_members']);
        });

        Schema::table('main_projects', function (Blueprint $table) {
            $table->dropColumn(['channel_id', 'role_id', 'max_members', 'technologies', 'start_date', 'end_date']);
        });

        Schema::table('dashboard_members', function (Blueprint $table) {
            $table->dropColumn(['last_seen_at', 'permissions']);
        });

        Schema::table('bot_admins', function (Blueprint $table) {
            $table->dropColumn(['added_by', 'added_at']);
        });
    }
};