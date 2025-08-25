// @ts-nocheck
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';

interface ConfigItem {
    id: number;
    key: string;
    value: string;
    description: string;
    type: string;
    category: string;
}

interface ConfigData {
    configs: {
        general: ConfigItem[];
        moderation: ConfigItem[];
        logging: ConfigItem[];
        features: ConfigItem[];
    };
    stats: {
        total_configs: number;
        categories: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Configuration', href: '/config' },
];

export default function ConfigIndex() {
    const { configs, stats } = usePage<ConfigData>().props;
    const [activeTab, setActiveTab] = useState('general');
    const [hasChanges, setHasChanges] = useState(false);

    const { data, setData, put, processing, errors, reset } = useForm({
        configs: []
    });

    const handleConfigChange = (key: string, value: string) => {
        const updatedConfigs = [...(data.configs || [])];
        const existingIndex = updatedConfigs.findIndex(c => c.key === key);
        
        if (existingIndex >= 0) {
            updatedConfigs[existingIndex] = { key, value };
        } else {
            updatedConfigs.push({ key, value });
        }
        
        setData('configs', updatedConfigs);
        setHasChanges(true);
    };

    const getCurrentValue = (configKey: string, originalValue: string) => {
        const changedConfig = data.configs?.find(c => c.key === configKey);
        return changedConfig ? changedConfig.value : originalValue;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put('/config', {
            onSuccess: () => {
                setHasChanges(false);
                reset();
            },
        });
    };

    const resetChanges = () => {
        reset();
        setHasChanges(false);
    };

    const renderConfigInput = (config: ConfigItem) => {
        const currentValue = getCurrentValue(config.key, config.value);
        
        switch (config.type) {
            case 'boolean':
                return (
                    <select
                        value={currentValue}
                        onChange={(e) => handleConfigChange(config.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                    >
                        <option value="true">Activé</option>
                        <option value="false">Désactivé</option>
                    </select>
                );
            
            case 'number':
                return (
                    <input
                        type="number"
                        value={currentValue}
                        onChange={(e) => handleConfigChange(config.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                    />
                );
            
            case 'id':
                return (
                    <input
                        type="text"
                        value={currentValue}
                        onChange={(e) => handleConfigChange(config.key, e.target.value)}
                        placeholder="ID Discord (ex: 123456789012345678)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                    />
                );
            
            default:
                return (
                    <input
                        type="text"
                        value={currentValue}
                        onChange={(e) => handleConfigChange(config.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                    />
                );
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'general':
                return '⚙️';
            case 'moderation':
                return '🛡️';
            case 'logging':
                return '📝';
            case 'features':
                return '🚀';
            default:
                return '📋';
        }
    };

    const getCategoryName = (category: string) => {
        switch (category) {
            case 'general':
                return 'Général';
            case 'moderation':
                return 'Modération';
            case 'logging':
                return 'Journalisation';
            case 'features':
                return 'Fonctionnalités';
            default:
                return category;
        }
    };

    const tabs = [
        { id: 'general', name: 'Général', icon: '⚙️', count: configs.general?.length || 0 },
        { id: 'moderation', name: 'Modération', icon: '🛡️', count: configs.moderation?.length || 0 },
        { id: 'logging', name: 'Logs', icon: '📝', count: configs.logging?.length || 0 },
        { id: 'features', name: 'Fonctionnalités', icon: '🚀', count: configs.features?.length || 0 },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuration du Bot" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Configuration du Bot
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Gérez les paramètres de votre bot Discord
                        </p>
                    </div>
                    
                    {hasChanges && (
                        <div className="flex space-x-2">
                            <button
                                onClick={resetChanges}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={processing}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? 'Sauvegarde...' : 'Sauvegarder'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.total_configs}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Configurations
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {stats.categories}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Catégories
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {data.configs?.length || 0}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Modifications
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="text-center">
                            <div className={`text-2xl font-bold ${hasChanges ? 'text-orange-600' : 'text-gray-600'}`}>
                                {hasChanges ? '⚠️' : '✅'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {hasChanges ? 'Non sauvé' : 'Sauvegardé'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.name}
                                    {tab.count > 0 && (
                                        <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Config Content */}
                    <div className="p-6">
                        {configs[activeTab]?.length > 0 ? (
                            <div className="space-y-6">
                                {configs[activeTab].map((config) => (
                                    <div key={config.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                            <div className="lg:col-span-1">
                                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                                                    {config.key}
                                                </label>
                                                {config.description && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {config.description}
                                                    </p>
                                                )}
                                                <div className="mt-1">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        config.type === 'boolean' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                                        config.type === 'number' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                                                        config.type === 'id' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                                                        'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                                    }`}>
                                                        {config.type}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="lg:col-span-2">
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex-1">
                                                        {renderConfigInput(config)}
                                                    </div>
                                                    {getCurrentValue(config.key, config.value) !== config.value && (
                                                        <div className="text-orange-500">
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                {errors[`configs.${config.key}`] && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                        {errors[`configs.${config.key}`]}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">{getCategoryIcon(activeTab)}</div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    Aucune configuration {getCategoryName(activeTab).toLowerCase()}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Il n'y a pas encore de configurations dans cette catégorie.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
