import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Users, FileText, Settings, Shield, FolderOpen, Bot, Zap, Calendar, UserCog } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Control Center',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Bot Management',
        href: '/bot-management',
        icon: Bot,
    },
    {
        title: 'Studi Defense',
        href: '/studi-defense',
        icon: Shield,
    },
    {
        title: 'Task Scheduler',
        href: '/task-scheduler',
        icon: Calendar,
    },
    {
        title: 'User Management',
        href: '/members',
        icon: Users,
    },
    {
        title: 'Project Control',
        href: '/projects',
        icon: FolderOpen,
    },
    {
        title: 'Activity Logs',
        href: '/logs',
        icon: FileText,
    },
    {
        title: 'System Config',
        href: '/config',
        icon: Settings,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Bot Discord',
        href: '#',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: '#',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
