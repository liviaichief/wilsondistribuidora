
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';
import { account, databases } from '../../lib/appwrite';

// Mock Appwrite
vi.mock('../../lib/appwrite', () => ({
    account: {
        get: vi.fn(),
        createEmailPasswordSession: vi.fn(),
        deleteSession: vi.fn(),
    },
    databases: {
        getDocument: vi.fn(),
        createDocument: vi.fn(),
        updateDocument: vi.fn(),
    },
    client: {
        config: { endpoint: 'test', project: 'test' }
    },
    DATABASE_ID: 'db',
    COLLECTIONS: { PROFILES: 'profiles' }
}));

const TestComponent = () => {
    const { user, isAdmin, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return (
        <div>
            <div data-testid="user-email">{user ? user.email : 'guest'}</div>
            <div data-testid="is-admin">{isAdmin ? 'yes' : 'no'}</div>
        </div>
    );
};

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show guest state if no session exists', async () => {
        account.get.mockRejectedValue(new Error('No session'));

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());
        expect(screen.getByTestId('user-email')).toHaveTextContent('guest');
        expect(screen.getByTestId('is-admin')).toHaveTextContent('no');
    });

    it('should identify admin users correctly', async () => {
        const mockUser = { $id: '123', email: 'admin@test.com', name: 'Admin' };
        const mockProfile = { role: 'admin' };

        account.get.mockResolvedValue(mockUser);
        databases.getDocument.mockResolvedValue(mockProfile);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => expect(screen.getByTestId('user-email')).toHaveTextContent('admin@test.com'));
        expect(screen.getByTestId('is-admin')).toHaveTextContent('yes');
    });
});
