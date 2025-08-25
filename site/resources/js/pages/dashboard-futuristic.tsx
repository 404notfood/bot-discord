// @ts-nocheck
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';
import axios from 'axios';

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
            status: 'offline',
            uptime: '--',
            servers: 0,
            users: 0,
            commands_today: 0
        },
        projects: {
            total: 0,
            active: 0,
            completed: 0
        },
        studi: {
            banned_users: 0,
            whitelist_users: 0,
            checks_today: 0
        },
        system: {
            database: 'healthy',
            api: 'healthy',
            scheduler: 'running'
        }
    })

    const [currentTime, setCurrentTime] = useState(new Date())
    const [botStatus, setBotStatus] = useState({
        running: false,
        pid: null,
        uptime: 'Not running',
        memory_usage: '0 MB',
        cpu_usage: '0%'
    })
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        fetchBotStatus()
        fetchDashboardStats()
        const statusTimer = setInterval(fetchBotStatus, 30000)
        const statsTimer = setInterval(fetchDashboardStats, 60000) // Update stats every minute
        return () => {
            clearInterval(statusTimer)
            clearInterval(statsTimer)
        }
    }, [])

    const fetchDashboardStats = async () => {
        try {
            const response = await axios.get('/api/discord/stats/dashboard')
            if (response.data.success) {
                setStats(response.data.data)
            }
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error)
        }
    }

    const fetchBotStatus = async () => {
        try {
            const response = await axios.get('/api/discord/bot-control/status')
            if (response.data.success) {
                setBotStatus(response.data.data)
            }
        } catch (error) {
            console.error('Failed to fetch bot status:', error)
        }
    }

    const startBot = async () => {
        setIsLoading(true)
        try {
            const response = await axios.post('/api/discord/bot-control/start')
            if (response.data.success) {
                await fetchBotStatus() // Refresh status
            }
        } catch (error) {
            console.error('Failed to start bot:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const stopBot = async () => {
        setIsLoading(true)
        try {
            const response = await axios.post('/api/discord/bot-control/stop')
            if (response.data.success) {
                await fetchBotStatus() // Refresh status
            }
        } catch (error) {
            console.error('Failed to stop bot:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const restartBot = async () => {
        setIsLoading(true)
        try {
            const response = await axios.post('/api/discord/bot-control/restart')
            if (response.data.success) {
                await fetchBotStatus() // Refresh status
            }
        } catch (error) {
            console.error('Failed to restart bot:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const viewLogs = async () => {
        try {
            const response = await axios.get('/api/discord/bot-control/logs')
            if (response.data.success) {
                // Open logs in a new window or modal
                const logWindow = window.open('', '_blank')
                logWindow.document.write(`<pre>${response.data.data.logs}</pre>`)
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error)
        }
    }

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
                        <h1 className="holo-text text-5xl font-bold tracking-tight mb-2" data-text="CONTROL CENTER">
                            CONTROL CENTER
                        </h1>
                        <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                                <span className="text-success font-mono text-sm">SYSTEM OPERATIONAL</span>
                            </div>
                            <div className="text-muted-foreground font-mono text-xs">
                                STATUS: ALL SYSTEMS NOMINAL
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
                <div className="glass-card p-6 scanlines">
                    <div className="metric-label mb-6">System Modules</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link href="/bot-management" className="cyber-button px-4 py-3 rounded-lg text-sm font-medium text-center neon-glow">
                            Bot Management
                        </Link>
                        <Link href="/studi-defense" className="cyber-button px-4 py-3 rounded-lg text-sm font-medium text-center neon-glow">
                            Studi Defense
                        </Link>
                        <Link href="/task-scheduler" className="cyber-button px-4 py-3 rounded-lg text-sm font-medium text-center neon-glow">
                            Task Scheduler
                        </Link>
                        <Link href="/members" className="cyber-button px-4 py-3 rounded-lg text-sm font-medium text-center neon-glow">
                            User Management
                        </Link>
                        <Link href="/projects" className="cyber-button px-4 py-3 rounded-lg text-sm font-medium text-center neon-glow">
                            Project Control
                        </Link>
                        <Link href="/logs" className="cyber-button px-4 py-3 rounded-lg text-sm font-medium text-center neon-glow">
                            Activity Logs
                        </Link>
                        <Link href="/config" className="cyber-button px-4 py-3 rounded-lg text-sm font-medium text-center neon-glow">
                            System Config
                        </Link>
                        <Link href="/settings/profile" className="cyber-button px-4 py-3 rounded-lg text-sm font-medium text-center neon-glow">
                            Profile Settings
                        </Link>
                    </div>
                </div>

                {/* Bot Control Panel */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="metric-label">Bot Control Center</div>
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${botStatus.running ? 'bg-success animate-pulse' : 'bg-destructive'}`}></div>
                            <span className={`text-sm font-mono ${botStatus.running ? 'text-success' : 'text-destructive'}`}>
                                {botStatus.running ? 'ONLINE' : 'OFFLINE'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="metric-card">
                            <div className="metric-label">Status</div>
                            <div className={`metric-value ${botStatus.running ? 'text-success' : 'text-destructive'}`}>
                                {botStatus.running ? 'Running' : 'Stopped'}
                            </div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-label">Uptime</div>
                            <div className="metric-value">{botStatus.uptime}</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-label">Memory</div>
                            <div className="metric-value">{botStatus.memory_usage}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button 
                            onClick={restartBot}
                            className="cyber-button px-4 py-3 rounded-lg text-sm font-medium"
                            disabled={isLoading}
                        >
                            {isLoading ? 'PROCESSING...' : 'RESTART BOT'}
                        </button>
                        <button 
                            onClick={botStatus.running ? stopBot : startBot}
                            className={`cyber-button px-4 py-3 rounded-lg text-sm font-medium ${
                                botStatus.running ? 'text-destructive border-destructive/30' : 'text-success border-success/30'
                            }`}
                            disabled={isLoading}
                        >
                            {isLoading ? 'PROCESSING...' : (botStatus.running ? 'STOP BOT' : 'START BOT')}
                        </button>
                        <button 
                            onClick={viewLogs}
                            className="cyber-button px-4 py-3 rounded-lg text-sm font-medium"
                        >
                            VIEW LOGS
                        </button>
                        <button className="cyber-button px-4 py-3 rounded-lg text-sm font-medium">
                            SYNC DATABASE
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