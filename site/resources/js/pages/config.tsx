// @ts-nocheck
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Control Center', href: '/dashboard' },
    { title: 'System Config', href: '/config' },
];

export default function Config() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="System Config" />
            
            <div className="flex h-full flex-1 flex-col gap-8 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold holo-text">System Configuration</h1>
                    <button className="cyber-button px-4 py-2 rounded-lg neon-glow">
                        Save Changes
                    </button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="glass-card rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-primary mb-4">Bot Configuration</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Bot Token</label>
                                <input 
                                    type="password" 
                                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="••••••••••••••••••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Application ID</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Enter Application ID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Guild ID</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Enter Guild ID"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-primary mb-4">API Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">API Secret Key</label>
                                <input 
                                    type="password" 
                                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="••••••••••••••••••••••••"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">Auto Restart Bot</span>
                                <button className="cyber-button px-3 py-1 rounded text-xs">
                                    Disabled
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">Rate Limiting</span>
                                <button className="cyber-button px-3 py-1 rounded text-xs">
                                    Enabled
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-card rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-primary mb-4">System Status</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="glass-card rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">Database</span>
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    <span className="text-sm text-green-400">Healthy</span>
                                </span>
                            </div>
                        </div>
                        <div className="glass-card rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">API Server</span>
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    <span className="text-sm text-green-400">Online</span>
                                </span>
                            </div>
                        </div>
                        <div className="glass-card rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">Task Scheduler</span>
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                    <span className="text-sm text-yellow-400">Limited</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-card rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-primary mb-4">Danger Zone</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                            <div>
                                <h4 className="font-medium text-destructive">Reset Configuration</h4>
                                <p className="text-sm text-muted-foreground">Reset all settings to default values</p>
                            </div>
                            <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90">
                                Reset
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                            <div>
                                <h4 className="font-medium text-destructive">Clear All Data</h4>
                                <p className="text-sm text-muted-foreground">Permanently delete all bot data</p>
                            </div>
                            <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90">
                                Clear Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}