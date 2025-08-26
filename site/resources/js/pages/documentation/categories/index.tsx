import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  FolderOpen,
  FileText
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface DocCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  total_resources: number;
  active_resources: number;
  created_at: string;
  updated_at: string;
}

interface Props {
  categories: DocCategory[];
}

export default function CategoriesIndex({ categories }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState(categories);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(term.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(term.toLowerCase()))
    );
    setFilteredCategories(filtered);
  };

  const toggleActive = (category: DocCategory) => {
    router.post(route('documentation.doc-categories.toggle-active', category.id), {}, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const deleteCategory = (category: DocCategory) => {
    if (category.total_resources > 0) {
      alert('Impossible de supprimer une catégorie qui contient des ressources.');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
      router.delete(route('documentation.doc-categories.destroy', category.id));
    }
  };

  const moveCategory = (categoryId: number, direction: 'up' | 'down') => {
    const currentIndex = filteredCategories.findIndex(c => c.id === categoryId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === filteredCategories.length - 1)
    ) {
      return;
    }

    const newOrder = [...filteredCategories];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Échanger les positions
    [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];
    
    // Mettre à jour les sort_order
    const reorderData = newOrder.map((category, index) => ({
      id: category.id,
      sort_order: (index + 1) * 10
    }));

    router.post(route('documentation.doc-categories.reorder'), {
      categories: reorderData
    }, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: () => {
        setFilteredCategories(newOrder);
      }
    });
  };

  return (
    <AppLayout>
      <Head title="Gestion des catégories - Documentation" />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Catégories de Documentation
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gérez les catégories pour organiser vos ressources de documentation
            </p>
          </div>
          <Link href={route('documentation.doc-categories.create')}>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle catégorie
            </Button>
          </Link>
        </div>

        {/* Barre de recherche et statistiques */}
        <div className="flex justify-between items-center">
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher une catégorie..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Total: {categories.length}</span>
            <span>Actives: {categories.filter(c => c.is_active).length}</span>
            <span>Resources: {categories.reduce((sum, c) => sum + c.total_resources, 0)}</span>
          </div>
        </div>

        {/* Liste des catégories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCategories.map((category, index) => (
            <Card key={category.id} className={`${!category.is_active ? 'opacity-60' : ''} transition-all hover:shadow-lg`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {category.icon && (
                      <div className="text-2xl">{category.icon}</div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={category.is_active ? 'default' : 'secondary'}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Ordre: {category.sort_order}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveCategory(category.id, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveCategory(category.id, 'down')}
                      disabled={index === filteredCategories.length - 1}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {category.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {category.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1 text-blue-600">
                    <FileText className="w-4 h-4" />
                    <span>{category.total_resources} ressources</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <FolderOpen className="w-4 h-4" />
                    <span>{category.active_resources} actives</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-1">
                    <Link href={route('documentation.doc-categories.show', category.id)}>
                      <Button size="sm" variant="outline">
                        Voir
                      </Button>
                    </Link>
                    <Link href={route('documentation.doc-categories.edit', category.id)}>
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive(category)}
                    >
                      {category.is_active ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteCategory(category)}
                      disabled={category.total_resources > 0}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Aucune catégorie trouvée
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm ? 'Aucun résultat pour votre recherche.' : 'Commencez par créer votre première catégorie.'}
            </p>
            {!searchTerm && (
              <Link href={route('documentation.doc-categories.create')}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une catégorie
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}