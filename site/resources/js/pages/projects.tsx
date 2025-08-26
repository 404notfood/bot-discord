// @ts-nocheck
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Control Center', href: '/dashboard' },
    { title: 'Project Control', href: '/projects' },
];

export default function Projects() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Project Control" />
            
            <div className="flex h-full flex-1 flex-col gap-8 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold holo-text">Project Control</h1>
                    <button className="cyber-button px-4 py-2 rounded-lg neon-glow">
                        New Project
                    </button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="glass-card rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-primary mb-4">Project Overview</h3>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="metric-card rounded-lg">
                                <div className="metric-label">Total Projects</div>
                                <div className="metric-value">--</div>
                            </div>
                            <div className="metric-card rounded-lg">
                                <div className="metric-label">Active Projects</div>
                                <div className="metric-value">--</div>
                            </div>
                            <div className="metric-card rounded-lg">
                                <div className="metric-label">Completed</div>
                                <div className="metric-value">--</div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-primary mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <button className="cyber-button w-full py-2 px-4 rounded-lg">
                                View All Projects
                            </button>
                            <button className="cyber-button w-full py-2 px-4 rounded-lg">
                                Manage Subgroups
                            </button>
                            <button className="cyber-button w-full py-2 px-4 rounded-lg">
                                Project Analytics
                            </button>
                        </div>
                    </div>
                </div>

                <div className="glass-card rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-primary mb-4">Recent Projects</h3>
                    <div className="space-y-4">
                        <div className="glass-card rounded-lg p-4 border border-border/40">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-foreground">Example Project</h4>
                                    <p className="text-sm text-muted-foreground">No projects configured yet</p>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Status: <span className="text-accent">Pending</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}