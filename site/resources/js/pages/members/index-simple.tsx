// @ts-nocheck
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Membres', href: '/members' },
];

export default function MembersIndex() {
    const { members, stats } = usePage().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestion des Membres" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Gestion des Membres
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Gérez les utilisateurs du dashboard
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats?.total || 0}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Total
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {stats?.active || 0}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Actifs
                            </div>
                        </div>
                    </div>
                </div>

                {/* Simple table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Liste des Membres
                        </h3>
                    </div>
                    
                    <div className="p-6">
                        {members?.data?.length > 0 ? (
                            <div className="space-y-4">
                                {members.data.map((member) => (
                                    <div key={member.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white">
                                                    {member.username}
                                                </h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {member.email}
                                                </p>
                                            </div>
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                                {member.role}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                Aucun membre trouvé
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
