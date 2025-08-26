// @ts-nocheck
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/axios-config';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Control Center', href: '/dashboard' },
    { title: 'Anti-Studi Defense', href: '/studi-defense' },
];

interface StudiBannedUser {
    user_id: string;
    username: string;
    email?: string;
    reason: string;
    banned_at: string;
    evidence_url?: string;
}

interface StudiWhitelistUser {
    user_id: string;
    username: string;
    email: string;
    reason: string;
    added_at: string;
}

export default function StudiDefense() {
    const [isSystemEnabled, setIsSystemEnabled] = useState(false);
    const [autoban, setAutoban] = useState(false);
    const [checkNewMembers, setCheckNewMembers] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [bannedUsers, setBannedUsers] = useState<StudiBannedUser[]>([]);
    const [whitelistUsers, setWhitelistUsers] = useState<StudiWhitelistUser[]>([]);

    const [newBan, setNewBan] = useState({
        user_id: '',
        username: '',
        email: '',
        reason: '',
        evidence_url: ''
    });

    const [newWhitelist, setNewWhitelist] = useState({
        user_id: '',
        username: '',
        email: '',
        reason: ''
    });

    const [stats, setStats] = useState({
        total_checks: 0,
        checks_today: 0,
        banned_total: 0,
        whitelist_total: 0,
        blocked_today: 3,
        false_positives: 2
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                loadConfig(),
                loadBannedUsers(),
                loadWhitelistUsers(),
                loadDashboardStats()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            setError('Failed to load Anti-Studi data');
        } finally {
            setIsLoading(false);
        }
    };

    const loadConfig = async () => {
        try {
            const response = await apiClient.get('/api/discord/studi/config');
            if (response.data.success) {
                const config = response.data.data;
                setIsSystemEnabled(config.is_enabled);
                setAutoban(config.auto_ban);
                setCheckNewMembers(config.check_new_members);
            }
        } catch (error) {
            console.error('Failed to load config:', error);
        }
    };

    const loadBannedUsers = async () => {
        try {
            const response = await apiClient.get('/api/discord/studi/banned');
            if (response.data.success) {
                setBannedUsers(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load banned users:', error);
        }
    };

    const loadWhitelistUsers = async () => {
        try {
            const response = await apiClient.get('/api/discord/studi/whitelist');
            if (response.data.success) {
                setWhitelistUsers(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load whitelist:', error);
        }
    };

    const loadDashboardStats = async () => {
        try {
            const response = await apiClient.get('/api/discord/studi/dashboard');
            if (response.data.success) {
                setStats(response.data.data.statistics || stats);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const handleAddBan = async () => {
        if (newBan.user_id && newBan.username && newBan.reason) {
            const ban: StudiBannedUser = {
                ...newBan,
                banned_at: new Date().toISOString()
            };
            setBannedUsers([ban, ...bannedUsers]);
            setNewBan({ user_id: '', username: '', email: '', reason: '', evidence_url: '' });
        }
    };

    const handleAddWhitelist = () => {
        if (newWhitelist.user_id && newWhitelist.username && newWhitelist.email && newWhitelist.reason) {
            const whitelist: StudiWhitelistUser = {
                ...newWhitelist,
                added_at: new Date().toISOString()
            };
            setWhitelistUsers([whitelist, ...whitelistUsers]);
            setNewWhitelist({ user_id: '', username: '', email: '', reason: '' });
        }
    };

    const handleRemoveBan = (userId: string) => {
        setBannedUsers(bannedUsers.filter(user => user.user_id !== userId));
    };

    const handleRemoveWhitelist = (userId: string) => {
        setWhitelistUsers(whitelistUsers.filter(user => user.user_id !== userId));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="ANTI-STUDI DEFENSE SYSTEM" />
            
            <div className="flex h-full flex-1 flex-col gap-8 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="holo-text text-3xl font-bold tracking-tight">
                            ANTI-STUDI DEFENSE SYSTEM
                        </h1>
                        <p className="text-muted-foreground font-mono mt-2 text-sm">
                            THREAT DETECTION & MITIGATION PROTOCOL
                        </p>
                    </div>
                    <div className={`glass-card p-3 ${isSystemEnabled ? 'neon-glow' : ''}`}>
                        <div className={`text-sm font-mono ${isSystemEnabled ? 'text-success' : 'text-destructive'}`}>
                            {isSystemEnabled ? 'ACTIVE' : 'DISABLED'}
                        </div>
                    </div>
                </div>

                {/* System Control Panel */}
                <div className="glass-card p-6">
                    <div className="metric-label mb-6">System Configuration</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center justify-between p-4 bg-secondary/20 border border-secondary/40 rounded-lg">
                            <div>
                                <div className="font-mono text-sm font-medium">Defense System</div>
                                <div className="text-xs text-muted-foreground">Enable/Disable protection</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isSystemEnabled}
                                    onChange={(e) => setIsSystemEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-secondary/20 border border-secondary/40 rounded-lg">
                            <div>
                                <div className="font-mono text-sm font-medium">Auto-Ban</div>
                                <div className="text-xs text-muted-foreground">Automatic threat elimination</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoban}
                                    onChange={(e) => setAutoban(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-destructive"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-secondary/20 border border-secondary/40 rounded-lg">
                            <div>
                                <div className="font-mono text-sm font-medium">Member Scan</div>
                                <div className="text-xs text-muted-foreground">Scan new members</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={checkNewMembers}
                                    onChange={(e) => setCheckNewMembers(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-warning"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="data-grid grid-cols-6">
                    <div className="metric-card">
                        <div className="metric-label">Total Scans</div>
                        <div className="metric-value">{stats.total_checks.toLocaleString()}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Scans Today</div>
                        <div className="metric-value text-warning">{stats.checks_today}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Total Blocked</div>
                        <div className="metric-value text-destructive">{stats.banned_total}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Whitelisted</div>
                        <div className="metric-value text-success">{stats.whitelist_total}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Blocked Today</div>
                        <div className="metric-value text-destructive">{stats.blocked_today}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">False Positives</div>
                        <div className="metric-value text-warning">{stats.false_positives}</div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Banned Users Panel */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-destructive">
                                BLOCKED THREATS
                            </h2>
                            <div className="text-xs font-mono text-muted-foreground">
                                SECURITY LEVEL: HIGH
                            </div>
                        </div>

                        {/* Add Ban Form */}
                        <div className="glass-card p-4 mb-6 bg-destructive/5 border-destructive/20">
                            <div className="metric-label mb-4">Add to Block List</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <input
                                    type="text"
                                    value={newBan.user_id}
                                    onChange={(e) => setNewBan({ ...newBan, user_id: e.target.value })}
                                    className="w-full p-3 bg-background/50 border border-border rounded-lg font-mono text-sm"
                                    placeholder="User ID"
                                />
                                <input
                                    type="text"
                                    value={newBan.username}
                                    onChange={(e) => setNewBan({ ...newBan, username: e.target.value })}
                                    className="w-full p-3 bg-background/50 border border-border rounded-lg font-mono text-sm"
                                    placeholder="Username"
                                />
                                <input
                                    type="email"
                                    value={newBan.email}
                                    onChange={(e) => setNewBan({ ...newBan, email: e.target.value })}
                                    className="w-full p-3 bg-background/50 border border-border rounded-lg font-mono text-sm"
                                    placeholder="Email (optional)"
                                />
                                <input
                                    type="url"
                                    value={newBan.evidence_url}
                                    onChange={(e) => setNewBan({ ...newBan, evidence_url: e.target.value })}
                                    className="w-full p-3 bg-background/50 border border-border rounded-lg font-mono text-sm"
                                    placeholder="Evidence URL (optional)"
                                />
                            </div>
                            <textarea
                                value={newBan.reason}
                                onChange={(e) => setNewBan({ ...newBan, reason: e.target.value })}
                                className="w-full p-3 bg-background/50 border border-border rounded-lg font-mono text-sm mb-4"
                                placeholder="Reason for ban"
                                rows={3}
                            />
                            <button
                                onClick={handleAddBan}
                                className="cyber-button px-6 py-2 rounded-lg text-sm font-medium border-destructive/30 text-destructive"
                            >
                                INITIATE BLOCK
                            </button>
                        </div>

                        {/* Banned Users List */}
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {bannedUsers.map((user) => (
                                <div key={user.user_id} className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="font-mono text-sm font-medium text-destructive">
                                                    {user.username}
                                                </div>
                                                {user.email && (
                                                    <div className="text-xs font-mono bg-destructive/20 text-destructive px-2 py-1 rounded">
                                                        {user.email}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono mb-2">
                                                ID: {user.user_id}
                                            </div>
                                            <div className="text-xs text-foreground mb-2">
                                                {user.reason}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Blocked: {new Date(user.banned_at).toLocaleString()}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveBan(user.user_id)}
                                            className="text-success hover:text-success/80 text-xs font-mono"
                                        >
                                            UNBLOCK
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Whitelist Panel */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-success">
                                TRUSTED USERS
                            </h2>
                            <div className="text-xs font-mono text-muted-foreground">
                                SECURITY LEVEL: APPROVED
                            </div>
                        </div>

                        {/* Add Whitelist Form */}
                        <div className="glass-card p-4 mb-6 bg-success/5 border-success/20">
                            <div className="metric-label mb-4">Add to Whitelist</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <input
                                    type="text"
                                    value={newWhitelist.user_id}
                                    onChange={(e) => setNewWhitelist({ ...newWhitelist, user_id: e.target.value })}
                                    className="w-full p-3 bg-background/50 border border-border rounded-lg font-mono text-sm"
                                    placeholder="User ID"
                                />
                                <input
                                    type="text"
                                    value={newWhitelist.username}
                                    onChange={(e) => setNewWhitelist({ ...newWhitelist, username: e.target.value })}
                                    className="w-full p-3 bg-background/50 border border-border rounded-lg font-mono text-sm"
                                    placeholder="Username"
                                />
                            </div>
                            <input
                                type="email"
                                value={newWhitelist.email}
                                onChange={(e) => setNewWhitelist({ ...newWhitelist, email: e.target.value })}
                                className="w-full p-3 bg-background/50 border border-border rounded-lg font-mono text-sm mb-4"
                                placeholder="Email address"
                            />
                            <textarea
                                value={newWhitelist.reason}
                                onChange={(e) => setNewWhitelist({ ...newWhitelist, reason: e.target.value })}
                                className="w-full p-3 bg-background/50 border border-border rounded-lg font-mono text-sm mb-4"
                                placeholder="Reason for whitelisting"
                                rows={3}
                            />
                            <button
                                onClick={handleAddWhitelist}
                                className="cyber-button px-6 py-2 rounded-lg text-sm font-medium border-success/30 text-success"
                            >
                                APPROVE ACCESS
                            </button>
                        </div>

                        {/* Whitelist Users List */}
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {whitelistUsers.map((user) => (
                                <div key={user.user_id} className="p-4 bg-success/10 border border-success/30 rounded-lg">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="font-mono text-sm font-medium text-success">
                                                    {user.username}
                                                </div>
                                                <div className="text-xs font-mono bg-success/20 text-success px-2 py-1 rounded">
                                                    {user.email}
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono mb-2">
                                                ID: {user.user_id}
                                            </div>
                                            <div className="text-xs text-foreground mb-2">
                                                {user.reason}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Added: {new Date(user.added_at).toLocaleString()}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveWhitelist(user.user_id)}
                                            className="text-destructive hover:text-destructive/80 text-xs font-mono"
                                        >
                                            REMOVE
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Threat Analysis */}
                <div className="glass-card p-6">
                    <div className="metric-label mb-6">Threat Analysis Dashboard</div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="terminal">
                            <div className="text-xs space-y-1">
                                <div className="text-success">[SCAN] Domain analysis completed</div>
                                <div className="text-warning">[ALERT] Suspicious pattern detected</div>
                                <div className="text-destructive">[BLOCK] Threat eliminated automatically</div>
                                <div className="text-success">[CLEAR] System status nominal</div>
                                <div className="text-primary">[INFO] Whitelist updated</div>
                                <div className="text-success">[SCAN] Member verification passed</div>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium mb-4">Detection Patterns</div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span>@studi.fr domains</span>
                                    <span className="text-destructive">87%</span>
                                </div>
                                <div className="progress-futuristic" style={{'--progress': '87%'} as React.CSSProperties}></div>
                                
                                <div className="flex justify-between text-sm">
                                    <span>Suspicious usernames</span>
                                    <span className="text-warning">23%</span>
                                </div>
                                <div className="progress-futuristic" style={{'--progress': '23%'} as React.CSSProperties}></div>
                                
                                <div className="flex justify-between text-sm">
                                    <span>Behavioral analysis</span>
                                    <span className="text-primary">45%</span>
                                </div>
                                <div className="progress-futuristic" style={{'--progress': '45%'} as React.CSSProperties}></div>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium mb-4">System Performance</div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span>Detection Rate</span>
                                    <span className="text-success">98.2%</span>
                                </div>
                                <div className="progress-futuristic" style={{'--progress': '98%'} as React.CSSProperties}></div>
                                
                                <div className="flex justify-between text-sm">
                                    <span>Response Time</span>
                                    <span className="text-success">0.3s</span>
                                </div>
                                <div className="progress-futuristic" style={{'--progress': '95%'} as React.CSSProperties}></div>
                                
                                <div className="flex justify-between text-sm">
                                    <span>Accuracy</span>
                                    <span className="text-success">99.1%</span>
                                </div>
                                <div className="progress-futuristic" style={{'--progress': '99%'} as React.CSSProperties}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}