// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AppTheme } from '../../../providers/AppTheme';
import { useSession, type SessionContextValue } from '../../../providers/SessionProvider';
import { SessionGate } from './SessionGate';

vi.mock('../../../providers/SessionProvider', /* sessionProviderMockFactory 提供认证页面可控的会话边界。 */ () => ({
  useSession: vi.fn(),
}));

// useSessionMock 是认证页面读取会话状态和操作方法的测试替身。
const useSessionMock = vi.mocked(useSession);
// signInMock 记录登录表单提交的凭据调用，不持久化测试密码。
const signInMock = vi.fn();
// initializeMock 记录首次初始化表单提交的密码调用。
const initializeMock = vi.fn();
// signOutMock 是认证页面不直接使用但上下文契约要求存在的注销替身。
const signOutMock = vi.fn();

// renderGate 将认证页面放入真实 MUI 主题，确保模板样式和表单控件走生产装配路径。
const renderGate = (): void => {
  render(
    <AppTheme>
      <SessionGate />
    </AppTheme>,
  );
};

// sessionValue 是登录分支使用的未认证会话快照及其操作替身。
const sessionValue: SessionContextValue = {
  checkingAuth: false,
  isLoggedIn: false,
  isAdmin: false,
  needsInit: false,
  signIn: signInMock,
  initialize: initializeMock,
  signOut: signOutMock,
};

describe('SessionGate Minimal 适配', /* 当前回调验证认证模板替换不改变会话行为。 */ () => {
  beforeEach(/* 当前回调重置会话状态和请求结果，避免测试之间共享敏感输入。 */ () => {
    vi.clearAllMocks();
    useSessionMock.mockReturnValue(sessionValue);
    signInMock.mockResolvedValue({ success: true, username: 'admin', is_admin: true });
    initializeMock.mockResolvedValue({ success: true, username: 'admin', is_admin: true });
    signOutMock.mockResolvedValue(undefined);
  });

  test('登录密码按 Minimal 模式切换显隐且仍提交原有 Provider 契约', /* 当前回调验证密码显隐按钮和登录请求边界。 */ async () => {
    // loginForm 是当前认证页渲染出的登录表单。
    renderGate();
    // passwordInput 是由中文标签定位的密码输入控件。
    const passwordInput = screen.getByLabelText('管理员密码') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    fireEvent.click(screen.getByRole('button', { name: '显示密码' }));
    expect(passwordInput.type).toBe('text');
    fireEvent.click(screen.getByRole('button', { name: '隐藏密码' }));
    expect(passwordInput.type).toBe('password');

    fireEvent.change(screen.getByLabelText('管理员账号'), { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'secret-password' } });
    // form 是登录按钮所属的 HTML 表单，用于触发和生产环境一致的 submit 事件。
    const form = screen.getByRole('button', { name: '立即登录' }).closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(/* signInAssertion 等待 Provider 登录替身收到表单 DTO。 */ () => {
      expect(signInMock).toHaveBeenCalledWith({ username: 'admin', password: 'secret-password' });
    });
  });

  test('首次初始化仍执行前端密码校验并阻止不一致请求', /* 当前回调验证 Minimal 标题壳不绕过初始化业务规则。 */ () => {
    useSessionMock.mockReturnValue({ ...sessionValue, needsInit: true });
    renderGate();
    fireEvent.change(screen.getByLabelText('设置管理员密码'), { target: { value: 'password-one' } });
    fireEvent.change(screen.getByLabelText('确认管理员密码'), { target: { value: 'password-two' } });
    // form 是首次初始化按钮所属的 HTML 表单。
    const form = screen.getByRole('button', { name: '设置密码并进入系统' }).closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    expect(screen.getByText('两次输入的密码不一致')).toBeTruthy();
    expect(initializeMock).not.toHaveBeenCalled();
  });
});
