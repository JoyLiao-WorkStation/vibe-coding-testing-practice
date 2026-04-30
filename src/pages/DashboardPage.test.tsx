import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardPage } from './DashboardPage';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productApi } from '../api/productApi';
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

vi.mock('../api/productApi', () => ({
    productApi: {
        getProducts: vi.fn(),
    },
}));

describe('DashboardPage', () => {
    const mockNavigate = vi.fn();
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useAuth).mockReturnValue({
            user: { role: 'user', username: 'TestUser' },
            logout: mockLogout,
        } as any);
    });

    describe('前端元素', () => {
        it('顯示儀表板基本元件', async () => {
            vi.mocked(productApi.getProducts).mockResolvedValue([]);
            render(
                <MemoryRouter>
                    <DashboardPage />
                </MemoryRouter>
            );
            
            expect(screen.getByRole('heading', { name: '儀表板' })).toBeInTheDocument();
            expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '登出' })).toBeInTheDocument();
            await waitFor(() => expect(screen.queryByText(/載入商品中/i)).not.toBeInTheDocument());
        });

        it('正確顯示使用者名稱與字母頭像', async () => {
            vi.mocked(productApi.getProducts).mockResolvedValue([]);
            render(
                <MemoryRouter>
                    <DashboardPage />
                </MemoryRouter>
            );

            expect(screen.getByText('Welcome, TestUser 👋')).toBeInTheDocument();
            const avatar = screen.getByText('T');
            expect(avatar).toBeInTheDocument();
            expect(avatar).toHaveClass('avatar');
            await waitFor(() => expect(screen.queryByText(/載入商品中/i)).not.toBeInTheDocument());
        });

        it('管理員顯示管理後台連結', async () => {
            vi.mocked(useAuth).mockReturnValue({
                user: { role: 'admin', username: 'AdminUser' },
                logout: mockLogout,
            } as any);
            vi.mocked(productApi.getProducts).mockResolvedValue([]);

            render(
                <MemoryRouter>
                    <DashboardPage />
                </MemoryRouter>
            );

            expect(screen.getByRole('link', { name: /管理後台/i })).toBeInTheDocument();
            await waitFor(() => expect(screen.queryByText(/載入商品中/i)).not.toBeInTheDocument());
        });

        it('一般用戶不顯示管理後台連結', async () => {
            vi.mocked(productApi.getProducts).mockResolvedValue([]);
            
            render(
                <MemoryRouter>
                    <DashboardPage />
                </MemoryRouter>
            );

            expect(screen.queryByRole('link', { name: /管理後台/i })).not.toBeInTheDocument();
            await waitFor(() => expect(screen.queryByText(/載入商品中/i)).not.toBeInTheDocument());
        });
    });

    describe('Mock API', () => {
        it('載入中狀態顯示', () => {
            vi.mocked(productApi.getProducts).mockReturnValue(new Promise(() => {}));
            
            render(
                <MemoryRouter>
                    <DashboardPage />
                </MemoryRouter>
            );

            expect(screen.getByText('載入商品中...')).toBeInTheDocument();
        });

        it('成功載入商品列表', async () => {
            const mockProducts = [
                { id: '1', name: 'Product A', description: 'Desc A', price: 100 },
                { id: '2', name: 'Product B', description: 'Desc B', price: 200 },
            ];
            vi.mocked(productApi.getProducts).mockResolvedValue(mockProducts);

            render(
                <MemoryRouter>
                    <DashboardPage />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Product A')).toBeInTheDocument();
            });
            expect(screen.getByText('Desc A')).toBeInTheDocument();
            expect(screen.getByText('NT$ 100')).toBeInTheDocument();
            
            expect(screen.getByText('Product B')).toBeInTheDocument();
            expect(screen.getByText('Desc B')).toBeInTheDocument();
            expect(screen.getByText('NT$ 200')).toBeInTheDocument();
        });

        it('載入商品失敗顯示錯誤訊息', async () => {
            vi.mocked(productApi.getProducts).mockRejectedValue({
                response: { data: { message: '伺服器錯誤' } },
            });

            render(
                <MemoryRouter>
                    <DashboardPage />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('伺服器錯誤')).toBeInTheDocument();
            });
            expect(screen.queryByText('Product A')).not.toBeInTheDocument();
        });

        it('載入商品 401 錯誤處理', async () => {
            vi.mocked(productApi.getProducts).mockRejectedValue({
                response: { status: 401, data: { message: 'Unauthorized' } },
            });

            render(
                <MemoryRouter>
                    <DashboardPage />
                </MemoryRouter>
            );

            await waitFor(() => {
                // 等待載入狀態消失
                expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
            });
            // 不應顯示錯誤訊息 (因交給 interceptor 處理)
            expect(screen.queryByText('Unauthorized')).not.toBeInTheDocument();
        });
    });

    describe('function 邏輯', () => {
        it('點擊登出', async () => {
            vi.mocked(productApi.getProducts).mockResolvedValue([]);
            const user = userEvent.setup();

            render(
                <MemoryRouter>
                    <DashboardPage />
                </MemoryRouter>
            );

            const logoutButton = screen.getByRole('button', { name: '登出' });
            await user.click(logoutButton);

            expect(mockLogout).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
        });
    });
});
