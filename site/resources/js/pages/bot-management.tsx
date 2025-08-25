// @ts-nocheck
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';
import axios from 'axios';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Control Center', href: '/control-center' },
    { title: 'Bot Management', href: '/bot-management' },
];

interface BotAdmin {
    user_id: string;
    username: string;
    added_at: string;
    status: 'active' | 'inactive';
}

interface BotModerator {
    user_id: string;
    username: string;
    added_at: string;
    status: 'active' | 'inactive';
}

export default function BotManagement() {
    const [admins, setAdmins] = useState<BotAdmin[]>([]);
    const [moderators, setModerators] = useState<BotModerator[]>([]);
    const [newAdmin, setNewAdmin] = useState({ user_id: '', username: '' });
    const [newMod, setNewMod] = useState({ user_id: '', username: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAdmins();
        fetchModerators();
    }, []);

    const fetchAdmins = async () => {
        try {
            const response = await axios.get('/api/discord/bot-admins');
            if (response.data.success) {
                setAdmins(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch admins:', error);
            setError('Failed to load administrators');
        }
    };

    const fetchModerators = async () => {
        try {
            const response = await axios.get('/api/discord/bot-moderators');
            if (response.data.success) {
                setModerators(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch moderators:', error);
            setError('Failed to load moderators');
        }
    };

    const handleAddAdmin = async () => {
        if (newAdmin.user_id && newAdmin.username) {
            setIsLoading(true);
            try {
                const response = await axios.post('/api/discord/bot-admins', {
                    user_id: newAdmin.user_id,
                    username: newAdmin.username
                });
                if (response.data.success) {
                    await fetchAdmins();
                    setNewAdmin({ user_id: '', username: '' });
                    setError('');
                }
            } catch (error) {
                setError('Failed to add administrator');
                console.error('Failed to add admin:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleAddModerator = async () => {
        if (newMod.user_id && newMod.username) {
            setIsLoading(true);
            try {
                const response = await axios.post('/api/discord/bot-moderators', {
                    user_id: newMod.user_id,
                    username: newMod.username
                });
                if (response.data.success) {
                    await fetchModerators();
                    setNewMod({ user_id: '', username: '' });
                    setError('');
                }
            } catch (error) {
                setError('Failed to add moderator');
                console.error('Failed to add moderator:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleRemoveAdmin = async (userId: string) => {
        setIsLoading(true);
        try {
            const response = await axios.delete(`/api/discord/bot-admins/${userId}`);
            if (response.data.success) {
                await fetchAdmins();
                setError('');
            }
        } catch (error) {
            setError('Failed to remove administrator');
            console.error('Failed to remove admin:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveModerator = async (userId: string) => {
        setIsLoading(true);
        try {
            const response = await axios.delete(`/api/discord/bot-moderators/${userId}`);
            if (response.data.success) {
                await fetchModerators();
                setError('');
            }
        } catch (error) {
            setError('Failed to remove moderator');
            console.error('Failed to remove moderator:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="BOT MANAGEMENT" />
            
            <div className="flex h-full flex-1 flex-col gap-8 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="holo-text text-3xl font-bold tracking-tight">
                            BOT MANAGEMENT
                        </h1>
                        <p className="text-muted-foreground font-mono mt-2 text-sm">
                            USER PERMISSIONS & ACCESS CONTROL SYSTEM
                        </p>
                    </div>
                    <div className="glass-card p-3">
                        <div className="text-sm font-mono text-success">
                            ONLINE
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="data-grid grid-cols-4">
                    <div className="metric-card">
                        <div className="metric-label">Total Admins</div>
                        <div className="metric-value">{admins.length}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Active Admins</div>
                        <div className="metric-value text-success">{admins.filter(a => a.status === 'active').length}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Total Mods</div>
                        <div className="metric-value">{moderators.length}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Active Mods</div>
                        <div className="metric-value text-success">{moderators.filter(m => m.status === 'active').length}</div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Administrators Panel */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gradient">
                                ADMINISTRATORS
                            </h2>
                            <div className="text-xs font-mono text-muted-foreground">
                                LEVEL: MAX ACCESS
                            </div>
                        </div>

                        {/* Add Admin Form */}
                        <div className="glass-card p-4 mb-6 bg-primary/5 border-primary/20">
                            <div className="metric-label mb-4">Add New Administrator</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-mono text-muted-foreground mb-2 block">USER ID</label>
                                    <input
                                        type="text"
                                        value={newAdmin.user_id}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, user_id: e.target.value })}
                                        className="w-full p-3 bg-background/50 border border-border rounded-lg font-mono text-sm"
                                        placeholder="Discord User ID"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-mono text-muted-foreground mb-2 block">USERNAME</label>
                                    <input
                                        type="text"
                                        value={newAdmin.username}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                                        className="w-full p-3 bg-background/50 border border-border rounded-lg font-mono text-sm"
                                        placeholder="Discord Username"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleAddAdmin}
                                className="cyber-button px-6 py-2 rounded-lg text-sm font-medium"
                            >
                                GRANT ADMIN ACCESS
                            </button>
                        </div>

                        {/* Admins List */}
                        <div className="space-y-3">
                            {admins.map((admin) => (
                                <div key={admin.user_id} className="flex items-center justify-between p-4 bg-secondary/20 border border-secondary/40 rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-3 h-3 rounded-full ${admin.status === 'active' ? 'bg-success animate-pulse' : 'bg-muted'}`}></div>
                                        <div>
                                            <div className="font-mono text-sm font-medium">
                                                {admin.username}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono">
                                                ID: {admin.user_id}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-xs text-muted-foreground">
                                            Added: {admin.added_at}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveAdmin(admin.user_id)}
                                            className="text-destructive hover:text-destructive/80 text-xs font-mono"
                                        >
                                            REVOKE
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Moderators Panel */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gradient">
                                MODERATORS
                            </h2>
                            <div className="text-xs font-mono text-muted-foreground">
                                LEVEL: LIMITED ACCESS
                            </div>
                        </div>

                        {/* Add Moderator Form */}
                        <div className="glass-card p-4 mb-6 bg-accent/5 border-accent/20">
                            <div className="metric-label mb-4">Add New Moderator</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-mono text-muted-foreground mb-2 block">USER ID</label>
                                    <input
                                        type="text"
                                        value={newMod.user_id}
                                        onChange={(e) => setNewMod({ ...newMod, user_id: e.target.value })}
                                        className="w-full p-3 bg-background/50 border border-border rounded-lg font-mono text-sm"
                                        placeholder="Discord User ID"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-mono text-muted-foreground mb-2 block">USERNAME</label>
                                    <input
                                        type="text"
                                        value={newMod.username}
                                        onChange={(e) => setNewMod({ ...newMod, username: e.target.value })}
                                        className="w-full p-3 bg-background/50 border border-border rounded-lg font-mono text-sm"
                                        placeholder="Discord Username"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleAddModerator}
                                className="cyber-button px-6 py-2 rounded-lg text-sm font-medium"
                            >
                                GRANT MOD ACCESS
                            </button>
                        </div>

                        {/* Moderators List */}
                        <div className="space-y-3">
                            {moderators.map((mod) => (
                                <div key={mod.user_id} className="flex items-center justify-between p-4 bg-secondary/20 border border-secondary/40 rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-3 h-3 rounded-full ${mod.status === 'active' ? 'bg-success animate-pulse' : 'bg-muted'}`}></div>
                                        <div>
                                            <div className="font-mono text-sm font-medium">
                                                {mod.username}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono">
                                                ID: {mod.user_id}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-xs text-muted-foreground">
                                            Added: {mod.added_at}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveModerator(mod.user_id)}
                                            className="text-destructive hover:text-destructive/80 text-xs font-mono"
                                        >
                                            REVOKE
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-card p-6">
                    <div className="metric-label mb-6">Bulk Operations</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button className="cyber-button px-4 py-3 rounded-lg text-sm font-medium">
                            Sync All Users
                        </button>
                        <button className="cyber-button px-4 py-3 rounded-lg text-sm font-medium">
                            Export User List
                        </button>
                        <button className="cyber-button px-4 py-3 rounded-lg text-sm font-medium">
                            Audit Permissions
                        </button>
                        <button className="cyber-button px-4 py-3 rounded-lg text-sm font-medium">
                            Backup Config
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}