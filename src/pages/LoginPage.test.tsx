import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import userEvent from '@testing-library/user-event';

// 模擬 react-router-dom
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

// 模擬 useAuth
vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

describe('LoginPage', () => {
    const mockNavigate = vi.fn();
    const mockLogin = vi.fn();
    const mockClearAuthExpiredMessage = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useAuth).mockReturnValue({
            login: mockLogin,
            isAuthenticated: false,
            authExpiredMessage: '',
            clearAuthExpiredMessage: mockClearAuthExpiredMessage,
        } as any);
    });

    describe('前端元素', () => {
        it('顯示登入表單元件', () => {
            render(
                <MemoryRouter>
                    <LoginPage />
                </MemoryRouter>
            );
            
            expect(screen.getByRole('heading', { name: /歡迎回來/i })).toBeInTheDocument();
            expect(screen.getByLabelText(/電子郵件/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/密碼/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /登入/i })).toBeInTheDocument();
        });
    });

    describe('function 邏輯', () => {
        it('Email 格式驗證失敗', async () => {
            const user = userEvent.setup();
            render(
                <MemoryRouter>
                    <LoginPage />
                </MemoryRouter>
            );

            const emailInput = screen.getByLabelText(/電子郵件/i);
            const passwordInput = screen.getByLabelText(/密碼/i);
            const submitButton = screen.getByRole('button', { name: /登入/i });

            await user.type(emailInput, 'invalid-email');
            await user.type(passwordInput, 'Valid1234');
            await user.click(submitButton);

            expect(screen.getByText('請輸入有效的 Email 格式')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('密碼長度驗證失敗', async () => {
            const user = userEvent.setup();
            render(
                <MemoryRouter>
                    <LoginPage />
                </MemoryRouter>
            );

            const emailInput = screen.getByLabelText(/電子郵件/i);
            const passwordInput = screen.getByLabelText(/密碼/i);
            const submitButton = screen.getByRole('button', { name: /登入/i });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'A1b');
            await user.click(submitButton);

            expect(screen.getByText('密碼必須至少 8 個字元')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('密碼未包含英數驗證失敗', async () => {
            const user = userEvent.setup();
            render(
                <MemoryRouter>
                    <LoginPage />
                </MemoryRouter>
            );

            const emailInput = screen.getByLabelText(/電子郵件/i);
            const passwordInput = screen.getByLabelText(/密碼/i);
            const submitButton = screen.getByRole('button', { name: /登入/i });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, '12345678');
            await user.click(submitButton);

            expect(screen.getByText('密碼必須包含英文字母和數字')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });
    });

    describe('Mock API', () => {
        it('API 登入失敗顯示錯誤訊息', async () => {
            const user = userEvent.setup();
            mockLogin.mockRejectedValue({
                response: { data: { message: '帳號或密碼錯誤' } },
            });

            render(
                <MemoryRouter>
                    <LoginPage />
                </MemoryRouter>
            );

            const emailInput = screen.getByLabelText(/電子郵件/i);
            const passwordInput = screen.getByLabelText(/密碼/i);
            const submitButton = screen.getByRole('button', { name: /登入/i });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'Valid1234');
            await user.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/帳號或密碼錯誤/)).toBeInTheDocument();
            });
        });

        it('登入成功後導向 Dashboard', async () => {
            const user = userEvent.setup();
            let resolveLogin: (value?: unknown) => void;
            mockLogin.mockReturnValue(new Promise(resolve => {
                resolveLogin = resolve;
            }));

            render(
                <MemoryRouter>
                    <LoginPage />
                </MemoryRouter>
            );

            const emailInput = screen.getByLabelText(/電子郵件/i);
            const passwordInput = screen.getByLabelText(/密碼/i);
            const submitButton = screen.getByRole('button', { name: /登入/i });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'Valid1234');
            await user.click(submitButton);

            // 檢查按鈕狀態顯示 "登入中..."
            expect(screen.getByRole('button')).toHaveTextContent(/登入中/i);

            // 解決 login promise
            resolveLogin!();

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
            });
        });
    });

    describe('驗證權限', () => {
        it('已登入狀態下自動導向', () => {
            vi.mocked(useAuth).mockReturnValue({
                login: mockLogin,
                isAuthenticated: true,
                authExpiredMessage: '',
                clearAuthExpiredMessage: mockClearAuthExpiredMessage,
            } as any);

            render(
                <MemoryRouter>
                    <LoginPage />
                </MemoryRouter>
            );

            expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
        });

        it('顯示 Auth Expired 訊息', () => {
            vi.mocked(useAuth).mockReturnValue({
                login: mockLogin,
                isAuthenticated: false,
                authExpiredMessage: '您的登入已過期',
                clearAuthExpiredMessage: mockClearAuthExpiredMessage,
            } as any);

            render(
                <MemoryRouter>
                    <LoginPage />
                </MemoryRouter>
            );

            expect(screen.getByText(/您的登入已過期/)).toBeInTheDocument();
            expect(mockClearAuthExpiredMessage).toHaveBeenCalled();
        });
    });
});
