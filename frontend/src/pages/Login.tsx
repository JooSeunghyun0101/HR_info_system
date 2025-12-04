import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../lib/store';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import ParticleBackground from '../components/ParticleBackground';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { user, token } = response.data;
            setAuth(user, token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || '로그인에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid-background relative flex items-center justify-center" style={{ padding: '32px' }}>
            {/* 파티클 배경 */}
            <ParticleBackground />

            <div style={{ maxWidth: '400px', width: '100%', position: 'relative', zIndex: 10 }}>
                {/* 헤더 */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }} className="fade-in">
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: '#FFB800'
                    }}>
                        HR System
                    </h1>
                    <p style={{ fontSize: '14px', color: '#999' }}>
                        시스템에 로그인하세요
                    </p>
                </div>

                {/* 로그인 폼 */}
                <div className="terminal-card fade-in-delay-1" style={{ padding: '32px' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* 이메일 */}
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: '#999', marginBottom: '8px' }}>
                                이메일
                            </label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                    <Mail style={{ width: '16px', height: '16px', color: '#666' }} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="terminal-input"
                                    style={{ paddingLeft: '38px', height: '44px' }}
                                    placeholder="이메일 주소"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 비밀번호 */}
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: '#999', marginBottom: '8px' }}>
                                비밀번호
                            </label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                    <Lock style={{ width: '16px', height: '16px', color: '#666' }} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="terminal-input"
                                    style={{ paddingLeft: '38px', height: '44px' }}
                                    placeholder="비밀번호"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 에러 메시지 */}
                        {error && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}>
                                <AlertCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                                <span style={{ color: '#ef4444', fontSize: '13px' }}>{error}</span>
                            </div>
                        )}

                        {/* 로그인 버튼 */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="gold-button"
                            style={{ height: '44px', width: '100%' }}
                        >
                            {loading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>
                </div>

                {/* 푸터 */}
                <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#666' }} className="fade-in-delay-2">
                    © 2025 HR System v2.0.1
                </div>
            </div>
        </div>
    );
};

export default Login;
