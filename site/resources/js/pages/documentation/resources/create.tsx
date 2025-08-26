import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, X, Plus, Trash2, Globe, Search, BookOpen } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface DocCategory {
  id: number;
  name: string;
  icon: string | null;
}

interface Props {
  categories: DocCategory[];
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Documentation',
    href: '/documentation',
  },
  {
    title: 'New Resource',
    href: '/documentation/resources/create',
  },
];

export default function CreateResource({ categories }: Props) {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    description: '',
    url: '',
    search_url: '',
    tutorial_url: '',
    language: '',
    category_id: '',
    tags: [] as string[],
    difficulty_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    popularity: 0,
    is_active: true,
  });

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      setData('tags', updatedTags);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    setData('tags', updatedTags);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('documentation.doc-resources.store'));
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="NEW RESOURCE - DOCUMENTATION CONTROL" />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* En-tête avec navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={route('documentation.index')}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Nouvelle ressource
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Ajoutez une nouvelle ressource de documentation
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={submit} className="space-y-6">
          {/* Informations principales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations principales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la ressource *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Ex: MDN Web Docs, React Documentation..."
                    className={errors.name ? 'border-red-500' : ''}
                    required
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">{errors.name}</p>
                  )}
                </div>

                {/* Catégorie */}
                <div className="space-y-2">
                  <Label htmlFor="category_id">Catégorie *</Label>
                  <Select value={data.category_id} onValueChange={(value) => setData('category_id', value)}>
                    <SelectTrigger className={errors.category_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.icon && <span className="mr-2">{category.icon}</span>}
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && (
                    <p className="text-red-500 text-sm">{errors.category_id}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Description de cette ressource..."
                  rows={4}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    errors.description ? 'border-red-500' : ''
                  }`}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Langage */}
                <div className="space-y-2">
                  <Label htmlFor="language">Langage de programmation</Label>
                  <Input
                    id="language"
                    type="text"
                    value={data.language}
                    onChange={(e) => setData('language', e.target.value)}
                    placeholder="Ex: JavaScript, Python, PHP..."
                    className={errors.language ? 'border-red-500' : ''}
                  />
                  {errors.language && (
                    <p className="text-red-500 text-sm">{errors.language}</p>
                  )}
                </div>

                {/* Niveau de difficulté */}
                <div className="space-y-2">
                  <Label htmlFor="difficulty_level">Niveau de difficulté</Label>
                  <Select 
                    value={data.difficulty_level} 
                    onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setData('difficulty_level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Débutant</SelectItem>
                      <SelectItem value="intermediate">Intermédiaire</SelectItem>
                      <SelectItem value="advanced">Avancé</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.difficulty_level && (
                    <p className="text-red-500 text-sm">{errors.difficulty_level}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Liens externes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* URL principale */}
              <div className="space-y-2">
                <Label htmlFor="url">URL de la documentation</Label>
                <Input
                  id="url"
                  type="url"
                  value={data.url}
                  onChange={(e) => setData('url', e.target.value)}
                  placeholder="https://..."
                  className={errors.url ? 'border-red-500' : ''}
                />
                {errors.url && (
                  <p className="text-red-500 text-sm">{errors.url}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* URL de recherche */}
                <div className="space-y-2">
                  <Label htmlFor="search_url">URL de recherche</Label>
                  <Input
                    id="search_url"
                    type="url"
                    value={data.search_url}
                    onChange={(e) => setData('search_url', e.target.value)}
                    placeholder="https://..."
                    className={errors.search_url ? 'border-red-500' : ''}
                  />
                  {errors.search_url && (
                    <p className="text-red-500 text-sm">{errors.search_url}</p>
                  )}
                </div>

                {/* URL de tutoriels */}
                <div className="space-y-2">
                  <Label htmlFor="tutorial_url">URL des tutoriels</Label>
                  <Input
                    id="tutorial_url"
                    type="url"
                    value={data.tutorial_url}
                    onChange={(e) => setData('tutorial_url', e.target.value)}
                    placeholder="https://..."
                    className={errors.tutorial_url ? 'border-red-500' : ''}
                  />
                  {errors.tutorial_url && (
                    <p className="text-red-500 text-sm">{errors.tutorial_url}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags et métadonnées */}
          <Card>
            <CardHeader>
              <CardTitle>Tags et métadonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Ajouter un tag..."
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Popularité */}
                <div className="space-y-2">
                  <Label htmlFor="popularity">Score de popularité</Label>
                  <Input
                    id="popularity"
                    type="number"
                    value={data.popularity}
                    onChange={(e) => setData('popularity', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    max="9999"
                    className={errors.popularity ? 'border-red-500' : ''}
                  />
                  {errors.popularity && (
                    <p className="text-red-500 text-sm">{errors.popularity}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Plus le score est élevé, plus la ressource sera mise en avant
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
                      Ressource active
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Les ressources inactives ne sont pas visibles dans le bot
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Link href={route('documentation.index')}>
              <Button type="button" variant="outline">
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={processing}>
              <Save className="w-4 h-4 mr-2" />
              {processing ? 'Création...' : 'Créer la ressource'}
            </Button>
          </div>
        </form>

        {/* Aperçu */}
        {(data.name || data.description) && (
          <Card>
            <CardHeader>
              <CardTitle>Aperçu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-lg">
                      {data.name || 'Nom de la ressource'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="default">Active</Badge>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {data.difficulty_level}
                      </Badge>
                      {data.language && (
                        <Badge variant="outline">{data.language}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {data.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {data.description}
                  </p>
                )}
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  {data.url && (
                    <Button size="sm" variant="outline" disabled>
                      <Globe className="w-3 h-3 mr-1" />
                      Documentation
                    </Button>
                  )}
                  {data.search_url && (
                    <Button size="sm" variant="outline" disabled>
                      <Search className="w-3 h-3 mr-1" />
                      Recherche
                    </Button>
                  )}
                  {data.tutorial_url && (
                    <Button size="sm" variant="outline" disabled>
                      <BookOpen className="w-3 h-3 mr-1" />
                      Tutoriels
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}