import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { LogOut, Search, Book, MessageCircle, User, Menu, X, Settings, Lock } from 'lucide-react';
import api from '../lib/api';
import ParticleBackground from './ParticleBackground';

const Layout: React.FC = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('새 비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            await api.post('/auth/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            alert('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
            handleLogout();
        } catch (error: any) {
            alert(error.response?.data?.message || '비밀번호 변경에 실패했습니다.');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNavClick = (path: string) => {
        // 페이지 전환 시 파티클 원상복귀
        window.dispatchEvent(new CustomEvent('cardAttract', {
            detail: { x: 0, y: 0, left: 0, top: 0, width: 0, height: 0, cardId: '', active: false }
        }));
        navigate(path);
    };

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const navLinks = [
        { path: '/', icon: Search, label: '검색' },
        { path: '/qna', icon: MessageCircle, label: 'Q&A' },
        { path: '/manuals', icon: Book, label: '매뉴얼' },
        ...(user?.role === 'admin' ? [{ path: '/admin', icon: Settings, label: 'Admin' }] : [])
    ];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
            {/* 파티클 배경 */}
            <ParticleBackground />

            {/* 네비게이션 바 */}
            <nav style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', height: '64px' }}>
                        {/* 로고 */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Link
                                to="/"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                            >
                                <span style={{ fontSize: '18px', fontWeight: '600', color: '#FFB800' }}>
                                    HR System
                                </span>
                            </Link>
                        </div>

                        {/* 데스크톱 네비게이션 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="hidden md:flex">
                            {navLinks.map((link) => {
                                const Icon = link.icon;
                                const active = isActive(link.path);
                                return (
                                    <a
                                        key={link.path}
                                        onClick={() => handleNavClick(link.path)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            textDecoration: 'none',
                                            color: active ? '#FFB800' : '#999',
                                            backgroundColor: active ? 'rgba(255, 184, 0, 0.1)' : 'transparent',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Icon style={{ width: '16px', height: '16px' }} />
                                        <span>{link.label}</span>
                                    </a>
                                );
                            })}
                        </div>

                        {/* 사용자 정보 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="hidden md:flex">
                            {user ? (
                                <>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: '#2a2a2a'
                                    }}>
                                        <span style={{ fontSize: '14px', color: '#e5e5e5' }}>
                                            {user.full_name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setShowPasswordModal(true)}
                                        style={{
                                            padding: '6px',
                                            borderRadius: '6px',
                                            color: '#999',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        title="비밀번호 변경"
                                    >
                                        <Lock style={{ width: '18px', height: '18px' }} />
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        style={{
                                            padding: '6px',
                                            borderRadius: '6px',
                                            color: '#999',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        title="로그아웃"
                                    >
                                        <LogOut style={{ width: '18px', height: '18px' }} />
                                    </button>
                                </>
                            ) : (
                                <Link
                                    to="/login"
                                    style={{ color: '#999', fontSize: '14px', textDecoration: 'none' }}
                                >
                                    로그인
                                </Link>
                            )}
                        </div>

                        {/* 모바일 메뉴 버튼 */}
                        <div style={{ display: 'flex', alignItems: 'center' }} className="md:hidden">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                style={{
                                    padding: '6px',
                                    color: '#FFB800',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {mobileMenuOpen ? (
                                    <X style={{ width: '24px', height: '24px' }} />
                                ) : (
                                    <Menu style={{ width: '24px', height: '24px' }} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 모바일 메뉴 */}
                {mobileMenuOpen && (
                    <div style={{ borderTop: '1px solid #2a2a2a', backgroundColor: '#1a1a1a' }} className="md:hidden">
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {navLinks.map((link) => {
                                const Icon = link.icon;
                                const active = isActive(link.path);
                                return (
                                    <a
                                        key={link.path}
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            handleNavClick(link.path);
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px 16px',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            textDecoration: 'none',
                                            color: active ? '#FFB800' : '#999',
                                            backgroundColor: active ? 'rgba(255, 184, 0, 0.1)' : 'transparent',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Icon style={{ width: '18px', height: '18px' }} />
                                        <span>{link.label}</span>
                                    </a>
                                );
                            })}

                            {user && (
                                <div style={{ paddingTop: '16px', borderTop: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px', color: '#e5e5e5' }}>
                                        <User style={{ width: '16px', height: '16px', color: '#999' }} />
                                        <span>{user.full_name}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px 16px',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            color: '#999',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <LogOut style={{ width: '18px', height: '18px' }} />
                                        <span>로그아웃</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* 메인 컨텐츠 */}
            <main>
                <Outlet />
            </main>

            {/* 푸터 */}
            <footer style={{ borderTop: '1px solid #2a2a2a', backgroundColor: '#1a1a1a', marginTop: 'auto' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            © 2025 HR System
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#666' }}>
                            <span style={{ color: '#FFB800' }}>v2.0.1</span>
                            <span>|</span>
                            <span>Status: Online</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="terminal-card" style={{ width: '400px', padding: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#CC8800', marginBottom: '20px' }}>비밀번호 변경</h3>
                        <form onSubmit={handleChangePassword}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', color: '#999', marginBottom: '8px', fontSize: '14px' }}>현재 비밀번호</label>
                                <input
                                    type="password"
                                    className="terminal-input"
                                    style={{ width: '100%' }}
                                    required
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', color: '#999', marginBottom: '8px', fontSize: '14px' }}>새 비밀번호</label>
                                <input
                                    type="password"
                                    className="terminal-input"
                                    style={{ width: '100%' }}
                                    required
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', color: '#999', marginBottom: '8px', fontSize: '14px' }}>새 비밀번호 확인</label>
                                <input
                                    type="password"
                                    className="terminal-input"
                                    style={{ width: '100%' }}
                                    required
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowPasswordModal(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'transparent',
                                        border: '1px solid #666',
                                        color: '#999',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    취소
                                </button>
                                <button type="submit" className="gold-button" style={{ padding: '8px 16px' }}>
                                    변경하기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Layout;
