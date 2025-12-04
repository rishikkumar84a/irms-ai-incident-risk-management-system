import {
    cn,
    formatDate,
    formatDateTime,
    formatRelativeTime,
    getStatusColor,
    getSeverityColor,
    getRoleColor,
    truncate,
    slugify,
    capitalize,
    formatEnumValue,
} from './utils';

describe('Utils', () => {
    describe('cn', () => {
        it('should merge class names correctly', () => {
            expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
        });

        it('should handle conditional classes', () => {
            expect(cn('bg-red-500', false && 'text-white', 'p-4')).toBe('bg-red-500 p-4');
        });

        it('should merge tailwind classes correctly', () => {
            expect(cn('p-4', 'p-8')).toBe('p-8');
        });
    });

    describe('formatDate', () => {
        it('should format date correctly', () => {
            const date = new Date('2023-01-01T00:00:00.000Z');
            expect(formatDate(date)).toBe('Jan 1, 2023');
        });

        it('should return N/A for null/undefined', () => {
            expect(formatDate(null)).toBe('N/A');
            expect(formatDate(undefined)).toBe('N/A');
        });
    });

    describe('formatDateTime', () => {
        it('should format date time correctly', () => {
            // Mocking locale to ensure consistent output across environments
            const date = new Date('2023-01-01T12:30:00.000Z');
            // Note: Output depends on local timezone, so we check for parts
            const formatted = formatDateTime(date);
            expect(formatted).toContain('2023');
            expect(formatted).toContain('Jan');
        });

        it('should return N/A for null/undefined', () => {
            expect(formatDateTime(null)).toBe('N/A');
        });
    });

    describe('formatRelativeTime', () => {
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2023-01-01T12:00:00.000Z'));
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        it('should return "Just now" for less than 1 minute', () => {
            const date = new Date('2023-01-01T11:59:30.000Z');
            expect(formatRelativeTime(date)).toBe('Just now');
        });

        it('should return minutes ago', () => {
            const date = new Date('2023-01-01T11:50:00.000Z');
            expect(formatRelativeTime(date)).toBe('10m ago');
        });

        it('should return hours ago', () => {
            const date = new Date('2023-01-01T10:00:00.000Z');
            expect(formatRelativeTime(date)).toBe('2h ago');
        });

        it('should return days ago', () => {
            const date = new Date('2022-12-30T12:00:00.000Z');
            expect(formatRelativeTime(date)).toBe('2d ago');
        });

        it('should return formatted date for more than 7 days', () => {
            const date = new Date('2022-12-01T12:00:00.000Z');
            expect(formatRelativeTime(date)).toBe('Dec 1, 2022');
        });
    });

    describe('getStatusColor', () => {
        it('should return correct color for NEW', () => {
            expect(getStatusColor('NEW')).toContain('bg-blue-100');
        });

        it('should return default color for unknown status', () => {
            expect(getStatusColor('UNKNOWN')).toContain('bg-gray-100');
        });
    });

    describe('getSeverityColor', () => {
        it('should return correct color for HIGH', () => {
            expect(getSeverityColor('HIGH')).toContain('bg-orange-100');
        });
    });

    describe('getRoleColor', () => {
        it('should return correct color for ADMIN', () => {
            expect(getRoleColor('ADMIN')).toContain('bg-purple-100');
        });
    });

    describe('truncate', () => {
        it('should truncate string longer than length', () => {
            expect(truncate('Hello World', 5)).toBe('Hello...');
        });

        it('should not truncate string shorter than length', () => {
            expect(truncate('Hello', 10)).toBe('Hello');
        });
    });

    describe('slugify', () => {
        it('should slugify string correctly', () => {
            expect(slugify('Hello World')).toBe('hello-world');
        });

        it('should handle special characters', () => {
            expect(slugify('Hello & World!')).toBe('hello-world');
        });
    });

    describe('capitalize', () => {
        it('should capitalize first letter', () => {
            expect(capitalize('hello')).toBe('Hello');
        });

        it('should lowercase rest of string', () => {
            expect(capitalize('HELLO')).toBe('Hello');
        });
    });

    describe('formatEnumValue', () => {
        it('should format enum value correctly', () => {
            expect(formatEnumValue('IN_PROGRESS')).toBe('In Progress');
        });
    });
});
