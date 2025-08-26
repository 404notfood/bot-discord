// @ts-nocheck
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Control Center', href: '/dashboard' },
    { title: 'Activity Logs', href: '/logs' },
];

export default function Logs() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity Logs" />
            
            <div className="flex h-full flex-1 flex-col gap-8 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold holo-text">Activity Logs</h1>
                    <div className="flex gap-2">
                        <button className="cyber-button px-4 py-2 rounded-lg">
                            Filter
                        </button>
                        <button className="cyber-button px-4 py-2 rounded-lg neon-glow">
                            Export
                        </button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                    <div className="glass-card rounded-lg p-4">
                        <div className="metric-label">Total Logs</div>
                        <div className="metric-value">--</div>
                    </div>
                    <div className="glass-card rounded-lg p-4">
                        <div className="metric-label">Today</div>
                        <div className="metric-value">--</div>
                    </div>
                    <div className="glass-card rounded-lg p-4">
                        <div className="metric-label">This Week</div>
                        <div className="metric-value">--</div>
                    </div>
                    <div className="glass-card rounded-lg p-4">
                        <div className="metric-label">Errors</div>
                        <div className="metric-value text-destructive">--</div>
                    </div>
                </div>

                <div className="glass-card rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-primary mb-4">Recent Activity</h3>
                    
                    <div className="terminal rounded-lg p-4 mb-4">
                        <div className="text-green-400 mb-2">[System] Activity monitoring active...</div>
                        <div className="text-yellow-400">[INFO] No recent logs to display</div>
                        <div className="text-blue-400">[DEBUG] Log system initialized</div>
                        <div className="text-green-400 animate-pulse">█</div>
                    </div>

                    <div className="space-y-3">
                        <div className="glass-card rounded-lg p-4 border border-border/40">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                        <span className="font-mono text-sm text-muted-foreground">System Status</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">Monitoring system active</p>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Just now
                                </div>
                            </div>
                        </div>

                        <div className="glass-card rounded-lg p-4 border border-border/40">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                        <span className="font-mono text-sm text-muted-foreground">Bot Control</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">Dashboard accessed</p>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    2 min ago
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}