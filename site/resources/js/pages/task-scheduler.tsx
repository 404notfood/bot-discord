// @ts-nocheck
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Control Center', href: '/dashboard' },
    { title: 'Task Scheduler', href: '/task-scheduler' },
];

interface ScheduledTask {
    id: string;
    name: string;
    description: string;
    interval: string;
    enabled: boolean;
    last_run: string;
    next_run: string;
    status: 'running' | 'idle' | 'error';
}

export default function TaskScheduler() {
    const [tasks, setTasks] = useState<ScheduledTask[]>([
        {
            id: 'database_sync',
            name: 'Database Synchronization',
            description: 'Synchronizes user data between bot and website',
            interval: '5 minutes',
            enabled: true,
            last_run: '2024-03-15T14:25:00Z',
            next_run: '2024-03-15T14:30:00Z',
            status: 'running'
        },
        {
            id: 'studi_check',
            name: 'Anti-Studi Verification',
            description: 'Checks new members against Studi database',
            interval: '1 minute',
            enabled: true,
            last_run: '2024-03-15T14:29:00Z',
            next_run: '2024-03-15T14:30:00Z',
            status: 'running'
        },
        {
            id: 'cleanup_logs',
            name: 'Log Cleanup',
            description: 'Removes old logs older than 30 days',
            interval: '1 day',
            enabled: true,
            last_run: '2024-03-14T00:00:00Z',
            next_run: '2024-03-16T00:00:00Z',
            status: 'idle'
        },
        {
            id: 'backup_database',
            name: 'Database Backup',
            description: 'Creates automated database backups',
            interval: '6 hours',
            enabled: false,
            last_run: '2024-03-15T08:00:00Z',
            next_run: 'Disabled',
            status: 'idle'
        },
        {
            id: 'update_stats',
            name: 'Statistics Update',
            description: 'Updates bot and server statistics',
            interval: '15 minutes',
            enabled: true,
            last_run: '2024-03-15T14:15:00Z',
            next_run: '2024-03-15T14:30:00Z',
            status: 'running'
        }
    ]);

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const toggleTask = (taskId: string) => {
        setTasks(tasks.map(task => 
            task.id === taskId 
                ? { ...task, enabled: !task.enabled }
                : task
        ));
    };

    const executeTask = (taskId: string) => {
        setTasks(tasks.map(task => 
            task.id === taskId 
                ? { 
                    ...task, 
                    last_run: new Date().toISOString(),
                    status: 'running'
                }
                : task
        ));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running':
                return 'text-success';
            case 'error':
                return 'text-destructive';
            case 'idle':
                return 'text-muted-foreground';
            default:
                return 'text-muted-foreground';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'running':
                return 'bg-success/10 border-success/30';
            case 'error':
                return 'bg-destructive/10 border-destructive/30';
            case 'idle':
                return 'bg-secondary/10 border-secondary/30';
            default:
                return 'bg-secondary/10 border-secondary/30';
        }
    };

    const activeTasksCount = tasks.filter(task => task.enabled).length;
    const runningTasksCount = tasks.filter(task => task.status === 'running').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="TASK SCHEDULER" />
            
            <div className="flex h-full flex-1 flex-col gap-8 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="holo-text text-3xl font-bold tracking-tight">
                            TASK SCHEDULER
                        </h1>
                        <p className="text-muted-foreground font-mono mt-2 text-sm">
                            AUTOMATED TASK EXECUTION SYSTEM
                        </p>
                    </div>
                    <div className="glass-card p-4 text-right">
                        <div className="text-lg font-mono holo-text">
                            {currentTime.toLocaleTimeString('en-US', { 
                                hour12: false,
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            })}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">
                            System Time
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="data-grid grid-cols-4">
                    <div className="metric-card">
                        <div className="metric-label">Total Tasks</div>
                        <div className="metric-value">{tasks.length}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Active Tasks</div>
                        <div className="metric-value text-success">{activeTasksCount}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Running Now</div>
                        <div className="metric-value text-warning">{runningTasksCount}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">System Load</div>
                        <div className="metric-value text-primary">23%</div>
                    </div>
                </div>

                {/* Task List */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gradient">
                            SCHEDULED TASKS
                        </h2>
                        <div className="text-xs font-mono text-muted-foreground">
                            EXECUTION QUEUE
                        </div>
                    </div>

                    <div className="space-y-4">
                        {tasks.map((task) => (
                            <div key={task.id} className={`glass-card p-6 ${getStatusBg(task.status)}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${
                                                    task.status === 'running' ? 'bg-success animate-pulse' : 
                                                    task.status === 'error' ? 'bg-destructive' : 'bg-muted'
                                                }`}></div>
                                                <h3 className="font-mono font-medium text-lg">
                                                    {task.name}
                                                </h3>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-xs font-mono uppercase ${getStatusColor(task.status)}`}>
                                                {task.status}
                                            </div>
                                        </div>
                                        
                                        <p className="text-muted-foreground text-sm mb-4">
                                            {task.description}
                                        </p>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Interval</div>
                                                <div className="font-mono">{task.interval}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Last Run</div>
                                                <div className="font-mono">
                                                    {new Date(task.last_run).toLocaleString()}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Next Run</div>
                                                <div className="font-mono">
                                                    {task.next_run === 'Disabled' ? 'Disabled' : new Date(task.next_run).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 ml-6">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={task.enabled}
                                                onChange={() => toggleTask(task.id)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                        
                                        <button
                                            onClick={() => executeTask(task.id)}
                                            className="cyber-button px-4 py-2 rounded-lg text-xs font-medium"
                                            disabled={!task.enabled}
                                        >
                                            EXECUTE NOW
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Configuration */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Scheduler Configuration */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold text-gradient mb-6">
                            SCHEDULER CONFIG
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-secondary/20 border border-secondary/40 rounded-lg">
                                <div>
                                    <div className="font-mono text-sm font-medium">Max Concurrent Tasks</div>
                                    <div className="text-xs text-muted-foreground">Maximum parallel executions</div>
                                </div>
                                <input
                                    type="number"
                                    defaultValue={5}
                                    className="w-20 p-2 bg-background/50 border border-border rounded font-mono text-sm text-center"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-secondary/20 border border-secondary/40 rounded-lg">
                                <div>
                                    <div className="font-mono text-sm font-medium">Task Timeout</div>
                                    <div className="text-xs text-muted-foreground">Maximum execution time (seconds)</div>
                                </div>
                                <input
                                    type="number"
                                    defaultValue={300}
                                    className="w-20 p-2 bg-background/50 border border-border rounded font-mono text-sm text-center"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-secondary/20 border border-secondary/40 rounded-lg">
                                <div>
                                    <div className="font-mono text-sm font-medium">Retry Attempts</div>
                                    <div className="text-xs text-muted-foreground">Failed task retry count</div>
                                </div>
                                <input
                                    type="number"
                                    defaultValue={3}
                                    className="w-20 p-2 bg-background/50 border border-border rounded font-mono text-sm text-center"
                                />
                            </div>
                        </div>
                        
                        <button className="cyber-button px-6 py-3 rounded-lg text-sm font-medium w-full mt-6">
                            UPDATE CONFIGURATION
                        </button>
                    </div>

                    {/* Execution Log */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold text-gradient mb-6">
                            EXECUTION LOG
                        </h3>
                        <div className="terminal">
                            <div className="space-y-1 text-xs">
                                <div className="text-success">[{currentTime.toLocaleTimeString()}] DATABASE_SYNC: Execution completed successfully</div>
                                <div className="text-success">[{new Date(Date.now() - 30000).toLocaleTimeString()}] STUDI_CHECK: 15 users verified</div>
                                <div className="text-warning">[{new Date(Date.now() - 60000).toLocaleTimeString()}] UPDATE_STATS: Performance degraded, retry scheduled</div>
                                <div className="text-success">[{new Date(Date.now() - 120000).toLocaleTimeString()}] DATABASE_SYNC: 247 records synchronized</div>
                                <div className="text-primary">[{new Date(Date.now() - 180000).toLocaleTimeString()}] CLEANUP_LOGS: Purged 1,247 old entries</div>
                                <div className="text-success">[{new Date(Date.now() - 240000).toLocaleTimeString()}] STUDI_CHECK: All checks passed</div>
                                <div className="text-success">[{new Date(Date.now() - 300000).toLocaleTimeString()}] UPDATE_STATS: Statistics refreshed</div>
                                <div className="text-success">[{new Date(Date.now() - 360000).toLocaleTimeString()}] DATABASE_SYNC: Incremental sync completed</div>
                            </div>
                        </div>
                        
                        <div className="mt-4 flex gap-2">
                            <button className="cyber-button px-4 py-2 rounded-lg text-xs font-medium">
                                CLEAR LOG
                            </button>
                            <button className="cyber-button px-4 py-2 rounded-lg text-xs font-medium">
                                EXPORT LOG
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-card p-6">
                    <div className="metric-label mb-6">System Operations</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button className="cyber-button px-4 py-3 rounded-lg text-sm font-medium">
                            Pause All Tasks
                        </button>
                        <button className="cyber-button px-4 py-3 rounded-lg text-sm font-medium">
                            Resume All Tasks
                        </button>
                        <button className="cyber-button px-4 py-3 rounded-lg text-sm font-medium">
                            System Restart
                        </button>
                        <button className="cyber-button px-4 py-3 rounded-lg text-sm font-medium">
                            Force Cleanup
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}