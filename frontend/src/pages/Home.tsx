import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, Book } from 'lucide-react';

const Home: React.FC = () => {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    const handleCardHover = (e: React.MouseEvent<HTMLDivElement>, isEntering: boolean, cardId: string) => {
        if (isEntering) {
            const rect = e.currentTarget.getBoundingClientRect();

            // 카드의 정확한 위치 (viewport 기준)
            const left = rect.left;
            const top = rect.top;
            const width = rect.width;
            const height = rect.height;
            const centerX = left + width / 2;
            const centerY = top + height / 2;

            window.dispatchEvent(new CustomEvent('cardAttract', {
                detail: {
                    x: centerX,
                    y: centerY,
                    left: left,
                    top: top,
                    width: width,
                    height: height,
                    cardId: cardId,
                    active: true
                }
            }));
        } else {
            window.dispatchEvent(new CustomEvent('cardAttract', {
                detail: { x: 0, y: 0, left: 0, top: 0, width: 0, height: 0, cardId: '', active: false }
            }));
        }
    };

    const handleCardClick = (path: string) => {
        // 파티클 원상복귀
        window.dispatchEvent(new CustomEvent('cardAttract', {
            detail: { x: 0, y: 0, left: 0, top: 0, width: 0, height: 0, cardId: '', active: false }
        }));
        navigate(path);
    };

    return (
        <div className="min-h-screen grid-background relative flex items-center">
            <div className="w-full max-w-6xl mx-auto px-8 relative z-10">
                <div className="text-center py-16">
                    {/* 헤더 */}
                    <div className="mb-12 fade-in">
                        <h1 style={{
                            fontSize: '48px',
                            fontWeight: '600',
                            marginBottom: '12px',
                            background: 'linear-gradient(to right, #FFB800, #F59E0B, #C05621)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            color: 'transparent', // Fallback
                            letterSpacing: '-0.02em'
                        }}>
                            HR 정보 시스템
                        </h1>
                        <p style={{
                            fontSize: '16px',
                            color: '#999',
                            fontWeight: '400'
                        }}>
                            인사 관련 정보를 검색하고 관리하세요
                        </p>
                    </div>

                    {/* 검색 바 */}
                    <div style={{ maxWidth: '700px', margin: '0 auto 48px' }} className="fade-in-delay-1">
                        <form onSubmit={handleSearch} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                    <Search style={{ width: '18px', height: '18px', color: '#666' }} />
                                </div>
                                <input
                                    type="text"
                                    className="terminal-input"
                                    style={{ paddingLeft: '42px', paddingRight: '14px', height: '48px' }}
                                    placeholder="질문이나 매뉴얼을 검색하세요..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="gold-button"
                                style={{ height: '48px', padding: '0 24px' }}
                            >
                                검색
                            </button>
                        </form>
                    </div>

                    {/* 메뉴 카드들 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
                        {/* Q&A 데이터베이스 카드 */}
                        <div
                            className="terminal-card slide-in-left"
                            onClick={() => handleCardClick('/qna')}
                            onMouseEnter={(e) => handleCardHover(e, true, 'qna')}
                            onMouseLeave={(e) => handleCardHover(e, false, 'qna')}
                            style={{ cursor: 'pointer', padding: '32px' }}
                        >
                            <div style={{ position: 'relative', zIndex: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '8px',
                                        background: 'linear-gradient(135deg, #FFB800 0%, #F59E0B 100%)', // Gold -> Amber
                                        boxShadow: '0 0 15px rgba(255, 184, 0, 0.3)', // Gold Glow
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <MessageCircle style={{ width: '24px', height: '24px', color: '#0a0a0a' }} />
                                    </div>
                                    <div style={{ textAlign: 'left', flex: 1 }}>
                                        <h3 style={{
                                            fontSize: '20px',
                                            fontWeight: '600',
                                            background: 'linear-gradient(to right, #FFB800, #F59E0B)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            color: 'transparent',
                                            marginBottom: '6px'
                                        }}>
                                            Q&A 데이터베이스
                                        </h3>
                                        <p style={{
                                            color: '#999',
                                            fontSize: '14px',
                                            lineHeight: '1.6'
                                        }}>
                                            자주 묻는 질문을 검색하거나 새로운 질문을 등록할 수 있습니다
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#666', paddingTop: '16px', borderTop: '1px solid #2a2a2a' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '6px', height: '6px', backgroundColor: '#FFB800', borderRadius: '50%' }}></div>
                                        <span>실시간 검색</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '6px', height: '6px', backgroundColor: '#F59E0B', borderRadius: '50%' }}></div>
                                        <span>AI 지원</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 프로세스 매뉴얼 카드 */}
                        <div
                            className="terminal-card slide-in-right"
                            onClick={() => handleCardClick('/manuals')}
                            onMouseEnter={(e) => handleCardHover(e, true, 'manual')}
                            onMouseLeave={(e) => handleCardHover(e, false, 'manual')}
                            style={{ cursor: 'pointer', padding: '32px' }}
                        >
                            <div style={{ position: 'relative', zIndex: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '8px',
                                        background: 'linear-gradient(135deg, #C05621 0%, #F59E0B 100%)', // Bronze -> Amber
                                        boxShadow: '0 0 15px rgba(192, 86, 33, 0.4)', // Bronze Glow
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <Book style={{ width: '24px', height: '24px', color: '#0a0a0a' }} />
                                    </div>
                                    <div style={{ textAlign: 'left', flex: 1 }}>
                                        <h3 style={{
                                            fontSize: '20px',
                                            fontWeight: '600',
                                            background: 'linear-gradient(to right, #F59E0B, #C05621)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            color: 'transparent',
                                            marginBottom: '6px'
                                        }}>
                                            프로세스 매뉴얼
                                        </h3>
                                        <p style={{
                                            color: '#999',
                                            fontSize: '14px',
                                            lineHeight: '1.6'
                                        }}>
                                            상세한 HR 프로세스 매뉴얼과 가이드라인에 접근할 수 있습니다
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#666', paddingTop: '16px', borderTop: '1px solid #2a2a2a' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '6px', height: '6px', backgroundColor: '#C05621', borderRadius: '50%' }}></div>
                                        <span>문서 관리</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '6px', height: '6px', backgroundColor: '#F59E0B', borderRadius: '50%' }}></div>
                                        <span>버전 관리</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

    );
};

export default Home;
