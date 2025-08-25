// @ts-nocheck
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';

interface Member {
    id: number;
    username: string;
    email: string;
    role: string;
    is_active: boolean;
    last_login: string | null;
    created_at: string;
    updated_at: string;
}

interface ModerationLog {
    id: number;
    action_type: string;
    target: string;
    reason: string | null;
    created_at: string;
}

interface MemberShowData {
    member: Member;
    moderation_logs: ModerationLog[];
}

export default function MemberShow() {
    const { member, moderation_logs } = usePage<MemberShowData>().props;
    const [isEditing, setIsEditing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Membres', href: '/members' },
        { title: member.username, href: `/members/${member.id}` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        role: member.role,
        is_active: member.is_active,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/members/${member.id}`, {
            onSuccess: () => {
                setIsEditing(false);
            },
        });
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            case 'editor': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'viewer': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Membre - ${member.username}`} />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {member.username}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Détails du membre
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <Link
                            href="/members"
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            Retour à la liste
                        </Link>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                        >
                            {isEditing ? 'Annuler' : 'Modifier'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Member Info */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                                Informations du membre
                            </h3>
                            
                            {isEditing ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Nom d'utilisateur
                                        </label>
                                        <input
                                            type="text"
                                            value={member.username}
                                            disabled
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={member.email}
                                            disabled
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Rôle
                                        </label>
                                        <select
                                            value={data.role}
                                            onChange={(e) => setData('role', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                                        >
                                            <option value="viewer">Viewer</option>
                                            <option value="editor">Editor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        {errors.role && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role}</p>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded dark:border-gray-600"
                                        />
                                        <label htmlFor="is_active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                            Compte actif
                                        </label>
                                        {errors.is_active && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.is_active}</p>
                                        )}
                                    </div>
                                    
                                    <div className="flex space-x-2 pt-4">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {processing ? 'Sauvegarde...' : 'Sauvegarder'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Nom d'utilisateur
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {member.username}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Email
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {member.email}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Rôle
                                        </label>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getRoleColor(member.role)}`}>
                                            {member.role}
                                        </span>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Statut
                                        </label>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                                            member.is_active 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                        }`}>
                                            {member.is_active ? 'Actif' : 'Inactif'}
                                        </span>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Dernière connexion
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {member.last_login ? new Date(member.last_login).toLocaleString('fr-FR') : 'Jamais'}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Créé le
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {new Date(member.created_at).toLocaleString('fr-FR')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Moderation Logs */}
                    <div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Actions de modération
                            </h3>
                            
                            {moderation_logs.length > 0 ? (
                                <div className="space-y-3">
                                    {moderation_logs.map((log) => (
                                        <div key={log.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {log.action_type}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {log.created_at}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                                Cible: {log.target}
                                            </p>
                                            {log.reason && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Raison: {log.reason}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Aucune action de modération enregistrée.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
