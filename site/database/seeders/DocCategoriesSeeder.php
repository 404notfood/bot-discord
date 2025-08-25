<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DocCategory;

class DocCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Frontend',
                'description' => 'Technologies pour le développement frontend',
                'icon' => '🎨',
                'sort_order' => 1,
            ],
            [
                'name' => 'Backend',
                'description' => 'Technologies pour le développement backend',
                'icon' => '⚙️',
                'sort_order' => 2,
            ],
            [
                'name' => 'Database',
                'description' => 'Systèmes de gestion de bases de données',
                'icon' => '🗄️',
                'sort_order' => 3,
            ],
            [
                'name' => 'DevOps',
                'description' => 'Outils et technologies DevOps',
                'icon' => '🚀',
                'sort_order' => 4,
            ],
            [
                'name' => 'Tools',
                'description' => 'Outils de développement',
                'icon' => '🛠️',
                'sort_order' => 5,
            ],
            [
                'name' => 'Security',
                'description' => 'Sécurité informatique',
                'icon' => '🔒',
                'sort_order' => 6,
            ],
        ];

        foreach ($categories as $category) {
            DocCategory::updateOrCreate(
                ['name' => $category['name']],
                $category
            );
        }
    }
}