import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { LogOut, Search, Book, MessageCircle, User, Menu, X, Settings } from 'lucide-react';
import ParticleBackground from './ParticleBackground';

const Layout: React.FC = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                                        <User style={{ width: '14px', height: '14px', color: '#999' }} />
                                        <span style={{ fontSize: '14px', color: '#e5e5e5' }}>
                                            {user.full_name}
                                        </span>
                                    </div>
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
        </div>
    );
};

export default Layout;
