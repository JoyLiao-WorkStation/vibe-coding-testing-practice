import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminPage } from './AdminPage';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import userEvent from '@testing-library/user-event';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

describe('AdminPage', () => {
    const mockNavigate = vi.fn();
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    });

    describe('前端元素', () => {
        it('顯示管理後台基本介面', () => {
            vi.mocked(useAuth).mockReturnValue({
                user: { role: 'admin', username: 'Admin' },
                logout: mockLogout,
            } as any);

            render(
                <MemoryRouter>
                    <AdminPage />
                </MemoryRouter>
            );

            expect(screen.getByRole('heading', { name: /管理後台/i })).toBeInTheDocument();
            expect(screen.getByText('← 返回')).toBeInTheDocument();
            expect(screen.getByText('管理員專屬頁面')).toBeInTheDocument();
            expect(screen.getByText('只有 admin 角色可以訪問')).toBeInTheDocument();
        });

        it('根據 role 顯示管理員標籤', () => {
            vi.mocked(useAuth).mockReturnValue({
                user: { role: 'admin', username: 'Admin' },
                logout: mockLogout,
            } as any);

            render(
                <MemoryRouter>
                    <AdminPage />
                </MemoryRouter>
            );

            const roleBadge = screen.getByText('管理員');
            expect(roleBadge).toBeInTheDocument();
            expect(roleBadge).toHaveClass('role-badge', 'admin');
        });

        it('根據 role 顯示一般用戶標籤', () => {
            vi.mocked(useAuth).mockReturnValue({
                user: { role: 'user', username: 'User' },
                logout: mockLogout,
            } as any);

            render(
                <MemoryRouter>
                    <AdminPage />
                </MemoryRouter>
            );

            const roleBadge = screen.getByText('一般用戶');
            expect(roleBadge).toBeInTheDocument();
            expect(roleBadge).toHaveClass('role-badge', 'user');
        });
    });

    describe('function 邏輯', () => {
        it('點擊登出', async () => {
            vi.mocked(useAuth).mockReturnValue({
                user: { role: 'admin', username: 'Admin' },
                logout: mockLogout,
            } as any);
            const user = userEvent.setup();

            render(
                <MemoryRouter>
                    <AdminPage />
                </MemoryRouter>
            );

            const logoutButton = screen.getByRole('button', { name: '登出augfufhhfkafaaf' });
            await user.click(logoutButton);

            expect(mockLogout).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
        });
    });
});
