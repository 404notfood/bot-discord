// @ts-nocheck
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';

interface DashboardStats {
    bot: {
        status: 'online' | 'offline'
        uptime: string
        servers: number
        users: number
        commands_today: number
    }
    projects: {
        total: number
        active: number
        completed: number
    }
    studi: {
        banned_users: number
        whitelist_users: number
        checks_today: number
    }
    system: {
        database: 'healthy' | 'warning' | 'error'
        api: 'healthy' | 'warning' | 'error'
        scheduler: 'running' | 'stopped'
    }
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Control Center',
        href: '/dashboard',
    },
];

export default function DashboardFuturistic() {
    const [stats, setStats] = useState<DashboardStats>({
        bot: {
            status: 'online',
            uptime: '2d 14h 32m',
            servers: 3,
            users: 247,
            commands_today: 156
        },
        projects: {
            total: 8,
            active: 5,
            completed: 3
        },
        studi: {
            banned_users: 12,
            whitelist_users: 45,
            checks_today: 89
        },
        system: {
            database: 'healthy',
            api: 'healthy',
            scheduler: 'running'
        }
    })

    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online':
            case 'healthy':
            case 'running':
                return 'text-success'
            case 'warning':
                return 'text-warning'
            case 'offline':
            case 'error':
            case 'stopped':
                return 'text-destructive'
            default:
                return 'text-muted-foreground'
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="CONTROL CENTER" />
            
            <div className="flex h-full flex-1 flex-col gap-8 rounded-xl p-6">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="holo-text text-4xl font-bold tracking-tight">
                            CONTROL CENTER
                        </h1>
                        <p className="text-muted-foreground font-mono mt-2 text-sm">
                            SYSTEM OPERATIONAL STATUS: ALL SYSTEMS NOMINAL
                        </p>
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
                            {currentTime.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                            })}
                        </div>
                    </div>
                </div>

                {/* System Status Grid */}
                <div className="data-grid">
                    {/* Bot Status */}
                    <div className="metric-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="metric-label">Discord Bot Status</div>
                            <div className={`font-mono text-sm ${getStatusColor(stats.bot.status)}`}>
                                {stats.bot.status.toUpperCase()}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm">Uptime</span>
                                <span className="font-mono text-primary">{stats.bot.uptime}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Servers</span>
                                <span className="metric-value text-lg">{stats.bot.servers}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Total Users</span>
                                <span className="metric-value text-lg">{stats.bot.users.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Commands Today</span>
                                <span className="metric-value text-lg">{stats.bot.commands_today}</span>
                            </div>
                        </div>
                        <div className="mt-4 progress-futuristic" style={{'--progress': '85%'} as React.CSSProperties}></div>
                    </div>

                    {/* Projects Overview */}
                    <div className="metric-card">
                        <div className="metric-label mb-4">Project Management</div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="metric-value">{stats.projects.total}</div>
                                <div className="metric-label">Total</div>
                            </div>
                            <div>
                                <div className="metric-value text-warning">{stats.projects.active}</div>
                                <div className="metric-label">Active</div>
                            </div>
                            <div>
                                <div className="metric-value text-success">{stats.projects.completed}</div>
                                <div className="metric-label">Complete</div>
                            </div>
                        </div>
                        <div className="mt-4 progress-futuristic" style={{'--progress': '62%'} as React.CSSProperties}></div>
                    </div>

                    {/* Anti-Studi System */}
                    <div className="metric-card">
                        <div className="metric-label mb-4">Anti-Studi Defense</div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm">Blocked Today</span>
                                <span className="metric-value text-lg text-destructive">{stats.studi.banned_users}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Whitelisted</span>
                                <span className="metric-value text-lg text-success">{stats.studi.whitelist_users}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Scans Today</span>
                                <span className="font-mono text-primary">{stats.studi.checks_today}</span>
                            </div>
                        </div>
                        <div className="mt-4 progress-futuristic" style={{'--progress': '94%'} as React.CSSProperties}></div>
                    </div>

                    {/* System Health */}
                    <div className="metric-card">
                        <div className="metric-label mb-4">System Health</div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Database</span>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${stats.system.database === 'healthy' ? 'bg-success animate-pulse' : 'bg-destructive'}`}></div>
                                    <span className={`text-xs font-mono ${getStatusColor(stats.system.database)}`}>
                                        {stats.system.database.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">API Gateway</span>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${stats.system.api === 'healthy' ? 'bg-success animate-pulse' : 'bg-destructive'}`}></div>
                                    <span className={`text-xs font-mono ${getStatusColor(stats.system.api)}`}>
                                        {stats.system.api.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Task Scheduler</span>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${stats.system.scheduler === 'running' ? 'bg-success animate-pulse' : 'bg-destructive'}`}></div>
                                    <span className={`text-xs font-mono ${getStatusColor(stats.system.scheduler)}`}>
                                        {stats.system.scheduler.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Navigation */}
                <div className="glass-card p-6">
                    <div className="metric-label mb-6">System Modules</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link href="/members" className="cyber-button px-4 py-3 rounded-lg text-sm font-medium text-center">
                            User Management
                        </Link>
                        <Link href="/projects" className="cyber-button px-4 py-3 rounded-lg text-sm font-medium text-center">
                            Project Control
                        </Link>
                        <Link href="/logs" className="cyber-button px-4 py-3 rounded-lg text-sm font-medium text-center">
                            Activity Logs
                        </Link>
                        <Link href="/config" className="cyber-button px-4 py-3 rounded-lg text-sm font-medium text-center">
                            System Config
                        </Link>
                    </div>
                </div>

                {/* Advanced Control Panel */}
                <div className="glass-card p-6">
                    <div className="metric-label mb-6">Advanced Operations</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button className="cyber-button px-4 py-3 rounded-lg text-sm font-medium">
                            Run Diagnostics
                        </button>
                        <button className="cyber-button px-4 py-3 rounded-lg text-sm font-medium">
                            Sync Database
                        </button>
                        <button className="cyber-button px-4 py-3 rounded-lg text-sm font-medium">
                            Bot Restart
                        </button>
                        <button className="cyber-button px-4 py-3 rounded-lg text-sm font-medium">
                            Export Logs
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* System Activity Terminal */}
                    <div className="glass-card p-6">
                        <div className="metric-label mb-6">System Activity Log</div>
                        <div className="terminal">
                            <div className="space-y-1 text-xs">
                                <div>[{currentTime.toLocaleTimeString()}] SYSTEM: All services operational</div>
                                <div>[{new Date(Date.now() - 60000).toLocaleTimeString()}] DISCORD: Bot connected successfully</div>
                                <div>[{new Date(Date.now() - 120000).toLocaleTimeString()}] DATABASE: Sync completed - 247 users</div>
                                <div>[{new Date(Date.now() - 180000).toLocaleTimeString()}] STUDI: Blocked suspicious user attempt</div>
                                <div>[{new Date(Date.now() - 240000).toLocaleTimeString()}] API: Health check passed</div>
                                <div>[{new Date(Date.now() - 300000).toLocaleTimeString()}] SCHEDULER: Task queue processed</div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="glass-card p-6">
                        <div className="metric-label mb-6">Performance Metrics</div>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>CPU Usage</span>
                                    <span className="font-mono">23%</span>
                                </div>
                                <div className="progress-futuristic" style={{'--progress': '23%'} as React.CSSProperties}></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Memory Usage</span>
                                    <span className="font-mono">67%</span>
                                </div>
                                <div className="progress-futuristic" style={{'--progress': '67%'} as React.CSSProperties}></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Database Load</span>
                                    <span className="font-mono">12%</span>
                                </div>
                                <div className="progress-futuristic" style={{'--progress': '12%'} as React.CSSProperties}></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Network I/O</span>
                                    <span className="font-mono">45%</span>
                                </div>
                                <div className="progress-futuristic" style={{'--progress': '45%'} as React.CSSProperties}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}