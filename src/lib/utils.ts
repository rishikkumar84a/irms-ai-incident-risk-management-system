import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';

    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatDate(date);
}

export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        // Incident statuses
        NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        IN_REVIEW: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        // Risk statuses
        OPEN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        MONITORING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        MITIGATED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        // Task statuses
        TODO: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        DONE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
        LOW: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
        CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
}

export function getRoleColor(role: string): string {
    const colors: Record<string, string> = {
        ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        EMPLOYEE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
}

export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}

export function slugify(str: string): string {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatEnumValue(value: string): string {
    return value.split('_').map(capitalize).join(' ');
}
