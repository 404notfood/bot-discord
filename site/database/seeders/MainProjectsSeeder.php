<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MainProject;
use App\Models\DashboardMember;
use App\Models\ProjectGroupMember;

class MainProjectsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Créer quelques projets d'exemple
        $projects = [
            [
                'name' => 'Bot Discord v2.0',
                'description' => 'Mise à jour majeure du bot Discord avec de nouvelles fonctionnalités',
                'status' => 'in_progress',
                'owner_id' => '123456789', // ID Discord fictif
                'start_date' => '2025-01-01',
                'due_date' => '2025-06-30',
                'progress_percentage' => 75,
                'members_count' => 3
            ],
            [
                'name' => 'Dashboard Web',
                'description' => 'Interface web pour administrer le bot Discord',
                'status' => 'in_progress',
                'owner_id' => '987654321', // ID Discord fictif
                'start_date' => '2025-01-15',
                'due_date' => '2025-03-15',
                'progress_percentage' => 60,
                'members_count' => 2
            ],
            [
                'name' => 'Documentation API',
                'description' => 'Documentation complète de l\'API du bot',
                'status' => 'planning',
                'owner_id' => '123456789',
                'start_date' => '2025-02-01',
                'due_date' => '2025-04-01',
                'progress_percentage' => 10,
                'members_count' => 1
            ],
            [
                'name' => 'Tests Automatisés',
                'description' => 'Suite de tests pour assurer la qualité du code',
                'status' => 'completed',
                'owner_id' => '987654321',
                'start_date' => '2024-10-01',
                'due_date' => '2024-12-31',
                'progress_percentage' => 100,
                'members_count' => 2
            ]
        ];

        foreach ($projects as $projectData) {
            MainProject::create($projectData);
        }

        // Si des membres existent, créer quelques associations
        $members = DashboardMember::limit(3)->get();
        $projects = MainProject::all();

        if ($members->count() > 0 && $projects->count() > 0) {
            // Associer quelques membres aux projets
            foreach ($projects->take(2) as $project) {
                foreach ($members->take(2) as $index => $member) {
                    ProjectGroupMember::create([
                        'project_id' => $project->id,
                        'member_id' => $member->id,
                        'role' => $index === 0 ? 'admin' : 'member',
                        'joined_at' => now()->subDays(rand(1, 30)),
                        'is_active' => true
                    ]);
                }
            }
        }
    }
}
