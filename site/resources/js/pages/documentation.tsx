// @ts-nocheck
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  FolderOpen,
  FileText,
  Globe,
  BookOpen,
  Copy,
  Settings,
  Database,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface DocCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  total_resources: number;
  active_resources: number;
}

interface DocResource {
  id: number;
  name: string;
  description: string | null;
  url: string | null;
  search_url: string | null;
  tutorial_url: string | null;
  language: string | null;
  category_id: number;
  category: DocCategory;
  tags: string[] | null;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  popularity: number;
  is_active: boolean;
  view_count: number;
  created_at: string;
}

interface Props {
  categories?: DocCategory[];
  resources?: DocResource[];
  filters?: {
    search?: string;
    category?: string;
    status?: string;
  };
  stats?: {
    total_categories: number;
    active_categories: number;
    total_resources: number;
    active_resources: number;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Documentation',
    href: '/documentation',
  },
];

export default function DocumentationFuturistic({ 
  categories = [], 
  resources = [], 
  filters = {},
  stats = {
    total_categories: 0,
    active_categories: 0,
    total_resources: 0,
    active_resources: 0
  }
}: Props) {
  const { url } = usePage();
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedCategory, setSelectedCategory] = useState(filters.category || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
  const [activeTab, setActiveTab] = useState('resources');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedStatus) params.set('status', selectedStatus);
    
    router.get(url, Object.fromEntries(params), {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const toggleResourceActive = (resource: DocResource) => {
    router.post(route('documentation.doc-resources.toggle-active', resource.id), {}, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const toggleCategoryActive = (category: DocCategory) => {
    router.post(route('documentation.doc-categories.toggle-active', category.id), {}, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const duplicateResource = (resource: DocResource) => {
    router.post(route('documentation.doc-resources.duplicate', resource.id));
  };

  const deleteResource = (resource: DocResource) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${resource.name}" ?`)) {
      router.delete(route('documentation.doc-resources.destroy', resource.id));
    }
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

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-success/20 text-success border-success/50';
      case 'intermediate': return 'bg-warning/20 text-warning border-warning/50';
      case 'advanced': return 'bg-destructive/20 text-destructive border-destructive/50';
      default: return 'bg-muted/20 text-muted-foreground border-muted/50';
    }
  };

  const mostPopularLanguage = resources.length > 0 ? 
    Object.entries(resources.reduce((acc, r) => {
      if (r.language) acc[r.language] = (acc[r.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
    : 'N/A';

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="DOCUMENTATION CONTROL" />
      
      <div className="flex h-full flex-1 flex-col gap-8 rounded-xl p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="holo-text text-5xl font-bold tracking-tight mb-2" data-text="DOCUMENTATION CONTROL">
              DOCUMENTATION CONTROL
            </h1>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-primary font-mono text-sm">DATABASE SYNCHRONIZED</span>
              </div>
              <div className="text-muted-foreground font-mono text-xs">
                STATUS: DOCUMENTATION SYSTEMS ACTIVE
              </div>
            </div>
          </div>
          <div className="glass-card p-4 text-right">
            <div className="text-2xl font-mono holo-text">
              {currentTime.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              DOCUMENTATION HUB
            </div>
          </div>
        </div>

        {/* System Status Grid */}
        <div className="data-grid">
          {/* Categories Status */}
          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="metric-label">Categories Database</div>
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Categories</span>
                <span className="metric-value text-lg">{stats.total_categories}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Active Categories</span>
                <span className="metric-value text-lg text-success">{stats.active_categories}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Coverage Rate</span>
                <span className="metric-value text-lg">{stats.total_categories > 0 ? Math.round((stats.active_categories / stats.total_categories) * 100) : 0}%</span>
              </div>
            </div>
            <div className="mt-4 progress-futuristic" style={{'--progress': `${stats.total_categories > 0 ? (stats.active_categories / stats.total_categories) * 100 : 0}%`} as React.CSSProperties}></div>
          </div>

          {/* Resources Status */}
          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="metric-label">Resources Archive</div>
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Resources</span>
                <span className="metric-value text-lg">{stats.total_resources}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Active Resources</span>
                <span className="metric-value text-lg text-success">{stats.active_resources}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Availability</span>
                <span className="metric-value text-lg">{stats.total_resources > 0 ? Math.round((stats.active_resources / stats.total_resources) * 100) : 0}%</span>
              </div>
            </div>
            <div className="mt-4 progress-futuristic" style={{'--progress': `${stats.total_resources > 0 ? (stats.active_resources / stats.total_resources) * 100 : 0}%`} as React.CSSProperties}></div>
          </div>

          {/* Languages Status */}
          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="metric-label">Language Matrix</div>
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Languages</span>
                <span className="metric-value text-lg">{new Set(resources.filter(r => r.language).map(r => r.language)).size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Most Popular</span>
                <span className="text-primary text-sm font-mono">{mostPopularLanguage}</span>
              </div>
            </div>
          </div>

          {/* Activity Status */}
          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="metric-label">Activity Monitor</div>
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Views</span>
                <span className="metric-value text-lg">{resources.reduce((sum, r) => sum + r.view_count, 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg. Popularity</span>
                <span className="metric-value text-lg">{resources.length > 0 ? Math.round(resources.reduce((sum, r) => sum + r.popularity, 0) / resources.length) : 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Control Interface */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('resources')}
                className={`px-6 py-3 rounded-lg font-mono text-sm uppercase tracking-wider transition-all ${
                  activeTab === 'resources' 
                    ? 'bg-primary/20 text-primary border border-primary/50 holo-glow' 
                    : 'bg-muted/20 text-muted-foreground hover:text-primary hover:bg-primary/10'
                }`}
              >
                <FileText className="w-4 h-4 mr-2 inline" />
                Resources Archive
              </button>
              <button 
                onClick={() => setActiveTab('categories')}
                className={`px-6 py-3 rounded-lg font-mono text-sm uppercase tracking-wider transition-all ${
                  activeTab === 'categories' 
                    ? 'bg-primary/20 text-primary border border-primary/50 holo-glow' 
                    : 'bg-muted/20 text-muted-foreground hover:text-primary hover:bg-primary/10'
                }`}
              >
                <Database className="w-4 h-4 mr-2 inline" />
                Categories Database
              </button>
            </div>
            
            <div className="flex gap-3">
              <Link href={route('documentation.doc-resources.create')}>
                <button className="px-4 py-2 bg-success/20 text-success border border-success/50 rounded-lg hover:bg-success/30 transition-all font-mono text-sm">
                  <Plus className="w-4 h-4 mr-2 inline" />
                  NEW RESOURCE
                </button>
              </Link>
              <Link href={route('documentation.doc-categories.create')}>
                <button className="px-4 py-2 bg-primary/20 text-primary border border-primary/50 rounded-lg hover:bg-primary/30 transition-all font-mono text-sm">
                  <Plus className="w-4 h-4 mr-2 inline" />
                  NEW CATEGORY
                </button>
              </Link>
            </div>
          </div>

          {/* Resources Archive Interface */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              {/* Search and Filter Controls */}
              <div className="control-panel p-4">
                <div className="flex gap-4 items-center">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="SEARCH RESOURCES DATABASE..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 font-mono bg-muted/20 border-muted/50 focus:border-primary/50"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48 bg-muted/20 border-muted/50">
                      <SelectValue placeholder="ALL CATEGORIES" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">ALL CATEGORIES</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.icon} {category.name.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-32 bg-muted/20 border-muted/50">
                      <SelectValue placeholder="STATUS" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">ALL</SelectItem>
                      <SelectItem value="active">ACTIVE</SelectItem>
                      <SelectItem value="inactive">INACTIVE</SelectItem>
                    </SelectContent>
                  </Select>
                  <button 
                    onClick={handleSearch}
                    className="px-6 py-2 bg-primary/20 text-primary border border-primary/50 rounded-lg hover:bg-primary/30 transition-all font-mono text-sm"
                  >
                    <Search className="w-4 h-4 mr-2 inline" />
                    SCAN
                  </button>
                </div>
              </div>

              {/* Resources Grid */}
              <div className="data-grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {resources.map((resource) => (
                  <div key={resource.id} className={`metric-card ${!resource.is_active ? 'opacity-50' : ''} transition-all hover:border-primary/50`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {resource.category.icon && (
                          <span className="text-lg">{resource.category.icon}</span>
                        )}
                        <div className="metric-label text-xs uppercase">{resource.category.name}</div>
                      </div>
                      <div className="flex gap-1">
                        <div className={`w-2 h-2 rounded-full ${resource.is_active ? 'bg-success animate-pulse' : 'bg-muted'}`}></div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="font-medium text-lg mb-2 truncate">{resource.name}</h3>
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge className={`text-xs ${resource.is_active ? 'bg-success/20 text-success border-success/50' : 'bg-muted/20 text-muted-foreground'}`}>
                          {resource.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                        <Badge className={`text-xs ${getDifficultyColor(resource.difficulty_level)} uppercase`}>
                          {resource.difficulty_level}
                        </Badge>
                        {resource.language && (
                          <Badge className="text-xs bg-primary/20 text-primary border-primary/50 font-mono">
                            {resource.language}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {resource.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {resource.description}
                      </p>
                    )}

                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {resource.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} className="text-xs bg-muted/20 text-muted-foreground border-muted/50">
                            {tag}
                          </Badge>
                        ))}
                        {resource.tags.length > 3 && (
                          <Badge className="text-xs bg-muted/20 text-muted-foreground border-muted/50">
                            +{resource.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mb-4 text-sm font-mono">
                      <div className="flex items-center gap-1 text-primary">
                        <Eye className="w-3 h-3" />
                        <span>{resource.view_count}</span>
                      </div>
                      <div className="flex items-center gap-1 text-warning">
                        <Zap className="w-3 h-3" />
                        <span>{resource.popularity}</span>
                      </div>
                    </div>

                    {/* External Links */}
                    <div className="flex gap-1 mb-4">
                      {resource.url && (
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" 
                           className="px-2 py-1 bg-primary/20 text-primary border border-primary/50 rounded text-xs hover:bg-primary/30 transition-all">
                          <Globe className="w-3 h-3 mr-1 inline" />
                          DOCS
                        </a>
                      )}
                      {resource.search_url && (
                        <a href={resource.search_url} target="_blank" rel="noopener noreferrer"
                           className="px-2 py-1 bg-muted/20 text-muted-foreground border border-muted/50 rounded text-xs hover:bg-muted/30 transition-all">
                          <Search className="w-3 h-3 mr-1 inline" />
                          SEARCH
                        </a>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex gap-1">
                        <Link href={route('documentation.doc-resources.edit', resource.id)}>
                          <button className="px-2 py-1 bg-warning/20 text-warning border border-warning/50 rounded text-xs hover:bg-warning/30 transition-all">
                            <Edit className="w-3 h-3" />
                          </button>
                        </Link>
                        <button
                          onClick={() => duplicateResource(resource)}
                          className="px-2 py-1 bg-primary/20 text-primary border border-primary/50 rounded text-xs hover:bg-primary/30 transition-all"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleResourceActive(resource)}
                          className="px-2 py-1 bg-muted/20 text-muted-foreground border border-muted/50 rounded text-xs hover:bg-muted/30 transition-all"
                        >
                          {resource.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => deleteResource(resource)}
                          className="px-2 py-1 bg-destructive/20 text-destructive border border-destructive/50 rounded text-xs hover:bg-destructive/30 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {resources.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium font-mono uppercase mb-2">
                    NO RESOURCES FOUND
                  </h3>
                  <p className="text-muted-foreground mb-4 font-mono text-sm">
                    INITIALIZE YOUR FIRST RESOURCE TO BEGIN DOCUMENTATION CONTROL
                  </p>
                  <Link href={route('documentation.doc-resources.create')}>
                    <button className="px-6 py-2 bg-success/20 text-success border border-success/50 rounded-lg hover:bg-success/30 transition-all font-mono text-sm">
                      <Plus className="w-4 h-4 mr-2 inline" />
                      CREATE RESOURCE
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Categories Database Interface */}
          {activeTab === 'categories' && (
            <div className="data-grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <div key={category.id} className={`metric-card ${!category.is_active ? 'opacity-50' : ''} transition-all hover:border-primary/50`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {category.icon && (
                        <div className="text-2xl">{category.icon}</div>
                      )}
                      <div>
                        <div className="metric-label text-lg uppercase">{category.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${category.is_active ? 'bg-success animate-pulse' : 'bg-muted'}`}></div>
                          <Badge className={`text-xs ${category.is_active ? 'bg-success/20 text-success border-success/50' : 'bg-muted/20 text-muted-foreground'}`}>
                            {category.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {category.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {category.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 mb-4 text-sm font-mono">
                    <div className="flex items-center gap-1 text-primary">
                      <FileText className="w-4 h-4" />
                      <span>{category.total_resources} resources</span>
                    </div>
                    <div className="flex items-center gap-1 text-success">
                      <FolderOpen className="w-4 h-4" />
                      <span>{category.active_resources} active</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-1">
                      <Link href={route('documentation.doc-categories.edit', category.id)}>
                        <button className="px-2 py-1 bg-warning/20 text-warning border border-warning/50 rounded text-xs hover:bg-warning/30 transition-all">
                          <Edit className="w-3 h-3" />
                        </button>
                      </Link>
                    </div>
                    
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleCategoryActive(category)}
                        className="px-2 py-1 bg-muted/20 text-muted-foreground border border-muted/50 rounded text-xs hover:bg-muted/30 transition-all"
                      >
                        {category.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => deleteCategory(category)}
                        disabled={category.total_resources > 0}
                        className="px-2 py-1 bg-destructive/20 text-destructive border border-destructive/50 rounded text-xs hover:bg-destructive/30 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'categories' && categories.length === 0 && (
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium font-mono uppercase mb-2">
                NO CATEGORIES FOUND
              </h3>
              <p className="text-muted-foreground mb-4 font-mono text-sm">
                INITIALIZE YOUR FIRST CATEGORY TO BEGIN DATABASE ORGANIZATION
              </p>
              <Link href={route('documentation.doc-categories.create')}>
                <button className="px-6 py-2 bg-primary/20 text-primary border border-primary/50 rounded-lg hover:bg-primary/30 transition-all font-mono text-sm">
                  <Plus className="w-4 h-4 mr-2 inline" />
                  CREATE CATEGORY
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}