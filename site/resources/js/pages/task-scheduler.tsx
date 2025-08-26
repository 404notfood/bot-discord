// @ts-nocheck
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/axios-config';

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
    const [tasks, setTasks] = useState<ScheduledTask[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [config, setConfig] = useState({
        max_concurrent_tasks: 5,
        task_timeout: 300,
        retry_attempts: 3
    });
    const [logs, setLogs] = useState<any[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTask, setNewTask] = useState({
        name: '',
        description: '',
        interval: '',
        enabled: true
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                loadTasks(),
                loadConfig(),
                loadLogs()
            ]);
        } catch (error) {
            console.error('Failed to load scheduler data:', error);
            setError('Failed to load scheduler data');
        } finally {
            setIsLoading(false);
        }
    };

    const loadTasks = async () => {
        try {
            const response = await apiClient.get('/api/discord/scheduler');
            if (response.data.success) {
                setTasks(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    };

    const loadConfig = async () => {
        try {
            const response = await apiClient.get('/api/discord/scheduler/config');
            if (response.data.success) {
                setConfig(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load config:', error);
        }
    };

    const loadLogs = async () => {
        try {
            const response = await apiClient.get('/api/discord/scheduler/logs');
            if (response.data.success) {
                setLogs(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load logs:', error);
        }
    };

    const toggleTask = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        try {
            const response = await apiClient.put(`/api/discord/scheduler/${taskId}/toggle`, {
                enabled: !task.enabled
            });
            
            if (response.data.success) {
                setTasks(tasks.map(t => 
                    t.id === taskId 
                        ? { ...t, enabled: !t.enabled }
                        : t
                ));
            }
        } catch (error) {
            console.error('Failed to toggle task:', error);
        }
    };

    const executeTask = async (taskId: string) => {
        try {
            const response = await apiClient.post(`/api/discord/scheduler/${taskId}/execute`);
            
            if (response.data.success) {
                setTasks(tasks.map(task => 
                    task.id === taskId 
                        ? { 
                            ...task, 
                            last_run: new Date().toISOString(),
                            status: 'running'
                        }
                        : task
                ));
                
                await loadLogs();
            }
        } catch (error) {
            console.error('Failed to execute task:', error);
        }
    };

    const updateConfiguration = async () => {
        try {
            const response = await apiClient.put('/api/discord/scheduler/config', config);
            if (response.data.success) {
                console.log('Configuration updated successfully');
            }
        } catch (error) {
            console.error('Failed to update configuration:', error);
        }
    };

    const performSystemOperation = async (action: string) => {
        try {
            const response = await apiClient.post('/api/discord/scheduler/system-operation', {
                action: action
            });
            
            if (response.data.success) {
                await loadLogs();
                if (action === 'pause_all' || action === 'resume_all') {
                    await loadTasks();
                }
            }
        } catch (error) {
            console.error('Failed to perform system operation:', error);
        }
    };

    const createTask = async () => {
        if (!newTask.name || !newTask.description || !newTask.interval) {
            setError('Tous les champs sont requis');
            return;
        }

        try {
            const response = await apiClient.post('/api/discord/scheduler', newTask);
            
            if (response.data.success) {
                await loadTasks();
                setNewTask({ name: '', description: '', interval: '', enabled: true });
                setShowAddForm(false);
                setError('');
            }
        } catch (error) {
            console.error('Failed to create task:', error);
            setError('Erreur lors de la création de la tâche');
        }
    };

    const deleteTask = async (taskId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
            return;
        }

        try {
            const response = await apiClient.delete(`/api/discord/scheduler/${taskId}`);
            
            if (response.data.success) {
                await loadTasks();
            }
        } catch (error) {
            console.error('Failed to delete task:', error);
            setError('Erreur lors de la suppression de la tâche');
        }
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

                {/* Add Task Form */}
                {showAddForm && (
                    <div className="glass-card p-6 border-primary/30 bg-primary/5">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gradient">
                                CREATE NEW TASK
                            </h2>
                            <button 
                                onClick={() => setShowAddForm(false)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="text-xs font-mono text-muted-foreground mb-2 block">TASK NAME</label>
                                <input
                                    type="text"
                                    value={newTask.name}
                                    onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                                    className="w-full p-3 bg-background/50 border border-border rounded-lg font-mono text-sm"
                                    placeholder="e.g., BACKUP_LOGS"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-mono text-muted-foreground mb-2 block">INTERVAL</label>
                                <input
                                    type="text"
                                    value={newTask.interval}
                                    onChange={(e) => setNewTask({...newTask, interval: e.target.value})}
                                    className="w-full p-3 bg-background/50 border border-border rounded-lg font-mono text-sm"
                                    placeholder="e.g., Every 30 minutes"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="text-xs font-mono text-muted-foreground mb-2 block">DESCRIPTION</label>
                            <textarea
                                value={newTask.description}
                                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                                className="w-full p-3 bg-background/50 border border-border rounded-lg font-mono text-sm h-20"
                                placeholder="Describe what this task does..."
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={newTask.enabled}
                                    onChange={(e) => setNewTask({...newTask, enabled: e.target.checked})}
                                    className="w-4 h-4"
                                />
                                <label className="text-sm font-mono">Enable immediately</label>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="px-6 py-2 border border-border rounded-lg text-sm font-mono hover:bg-secondary/20"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={createTask}
                                    className="cyber-button px-6 py-2 rounded-lg text-sm font-medium"
                                >
                                    CREATE TASK
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="glass-card p-4 border-destructive/30 bg-destructive/5">
                        <div className="text-destructive font-mono text-sm">
                            ⚠️ {error}
                        </div>
                    </div>
                )}

                {/* Task List */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gradient">
                            SCHEDULED TASKS
                        </h2>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="cyber-button px-4 py-2 rounded-lg text-xs font-medium"
                            >
                                + NEW TASK
                            </button>
                            <div className="text-xs font-mono text-muted-foreground">
                                EXECUTION QUEUE
                            </div>
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

                                        <button
                                            onClick={() => deleteTask(task.id)}
                                            className="text-destructive hover:text-destructive/80 px-2 py-1 text-xs font-mono"
                                            title="Delete Task"
                                        >
                                            DELETE
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
                                    value={config.max_concurrent_tasks}
                                    onChange={(e) => setConfig({...config, max_concurrent_tasks: parseInt(e.target.value)})}
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
                                    value={config.task_timeout}
                                    onChange={(e) => setConfig({...config, task_timeout: parseInt(e.target.value)})}
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
                                    value={config.retry_attempts}
                                    onChange={(e) => setConfig({...config, retry_attempts: parseInt(e.target.value)})}
                                    className="w-20 p-2 bg-background/50 border border-border rounded font-mono text-sm text-center"
                                />
                            </div>
                        </div>
                        
                        <button 
                            onClick={updateConfiguration}
                            className="cyber-button px-6 py-3 rounded-lg text-sm font-medium w-full mt-6"
                        >
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
                                {logs.map((log, index) => (
                                    <div key={index} className={`${
                                        log.level === 'success' ? 'text-success' :
                                        log.level === 'warning' ? 'text-warning' :
                                        log.level === 'info' ? 'text-primary' :
                                        'text-destructive'
                                    }`}>
                                        [{log.timestamp}] {log.task}: {log.message}
                                    </div>
                                ))}
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
                        <button 
                            onClick={() => performSystemOperation('pause_all')}
                            className="cyber-button px-4 py-3 rounded-lg text-sm font-medium"
                        >
                            Pause All Tasks
                        </button>
                        <button 
                            onClick={() => performSystemOperation('resume_all')}
                            className="cyber-button px-4 py-3 rounded-lg text-sm font-medium"
                        >
                            Resume All Tasks
                        </button>
                        <button 
                            onClick={() => performSystemOperation('restart')}
                            className="cyber-button px-4 py-3 rounded-lg text-sm font-medium"
                        >
                            System Restart
                        </button>
                        <button 
                            onClick={() => performSystemOperation('cleanup')}
                            className="cyber-button px-4 py-3 rounded-lg text-sm font-medium"
                        >
                            Force Cleanup
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}