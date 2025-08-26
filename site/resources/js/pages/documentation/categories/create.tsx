import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

export default function CreateCategory() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    description: '',
    icon: '',
    sort_order: '',
    is_active: true,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('documentation.doc-categories.store'));
  };

  return (
    <AppLayout>
      <Head title="Nouvelle catégorie - Documentation" />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* En-tête avec navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={route('documentation.doc-categories.index')}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Nouvelle catégorie
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Créez une nouvelle catégorie pour organiser vos ressources
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de la catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la catégorie *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Ex: Frontend, Backend, Mobile..."
                    className={errors.name ? 'border-red-500' : ''}
                    required
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">{errors.name}</p>
                  )}
                </div>

                {/* Icône */}
                <div className="space-y-2">
                  <Label htmlFor="icon">Icône (emoji)</Label>
                  <Input
                    id="icon"
                    type="text"
                    value={data.icon}
                    onChange={(e) => setData('icon', e.target.value)}
                    placeholder="Ex: 🌐, 🖥️, 📱..."
                    maxLength={10}
                    className={errors.icon ? 'border-red-500' : ''}
                  />
                  {errors.icon && (
                    <p className="text-red-500 text-sm">{errors.icon}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Utilisez un emoji pour représenter cette catégorie
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Description de cette catégorie..."
                  rows={3}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    errors.description ? 'border-red-500' : ''
                  }`}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ordre de tri */}
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Ordre de tri</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={data.sort_order}
                    onChange={(e) => setData('sort_order', e.target.value)}
                    placeholder="Ex: 10, 20, 30... (optionnel)"
                    min="0"
                    max="999"
                    className={errors.sort_order ? 'border-red-500' : ''}
                  />
                  {errors.sort_order && (
                    <p className="text-red-500 text-sm">{errors.sort_order}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Laissez vide pour placer automatiquement à la fin
                  </p>
                </div>

                {/* Statut */}
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={data.is_active}
                      onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                    />
                    <Label htmlFor="is_active" className="text-sm">
                      Catégorie active
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Les catégories inactives ne sont pas visibles dans le bot
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Link href={route('documentation.doc-categories.index')}>
                  <Button type="button" variant="outline">
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                </Link>
                <Button type="submit" disabled={processing}>
                  <Save className="w-4 h-4 mr-2" />
                  {processing ? 'Création...' : 'Créer la catégorie'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Aperçu */}
        {(data.name || data.description || data.icon) && (
          <Card>
            <CardHeader>
              <CardTitle>Aperçu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  {data.icon && (
                    <div className="text-2xl">{data.icon}</div>
                  )}
                  <div>
                    <h3 className="font-medium text-lg">
                      {data.name || 'Nom de la catégorie'}
                    </h3>
                    {data.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {data.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}