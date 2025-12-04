

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { MessageCircle, Book, Search, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import Modal from '../components/Modal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FileUpload from '../components/FileUpload';

interface SearchResultQnA {
    id: string;
    question_title: string;
    question_details: string;
    answer?: string;
    answer_basis?: string; // Added field
    created_at: string;
    view_count: number;
    created_by: { full_name: string };
    tags?: { tag: { name: string } }[]; // Added field
    categories?: { category: { name: string; color: string } }[]; // Added field
}

interface SearchResultManual {
    id: string;
    title: string;
    content?: string; // Added field
    updated_at: string;
    version_major: number;
    version_minor: number;
    updated_by: { full_name: string };
    created_by?: { full_name: string }; // Added field
    created_at?: string; // Added field
}

type SelectedItem =
    | { type: 'qna'; data: SearchResultQnA }
    | { type: 'manual'; data: SearchResultManual };

const SearchPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState(query);

    const [qnaResults, setQnaResults] = useState<SearchResultQnA[]>([]);
    const [manualResults, setManualResults] = useState<SearchResultManual[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

    useEffect(() => {
        if (query) {
            fetchResults();
        }
    }, [query]);

    const fetchResults = async () => {
        setLoading(true);
        try {
            const [qnaRes, manualRes] = await Promise.all([
                api.get('/qna', { params: { q: query, limit: 5 } }),
                api.get('/manuals', { params: { q: query, limit: 5 } })
            ]);
            setQnaResults(qnaRes.data.data);
            setManualResults(manualRes.data.data);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchInput)}`);
        }
    };

    const handleItemClick = async (type: 'qna' | 'manual', id: string) => {
        try {
            if (type === 'qna') {
                const response = await api.get(`/qna/${id}`);
                setSelectedItem({ type: 'qna', data: response.data });
            } else {
                const response = await api.get(`/manuals/${id}`);
                setSelectedItem({ type: 'manual', data: response.data });
            }
        } catch (error) {
            console.error('Failed to fetch detail', error);
            alert('내용을 불러오는데 실패했습니다.');
        }
    };

    return (
        <div className="min-h-screen grid-background" style={{ padding: '32px 0' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 10 }}>
                {/* Header & Search Bar */}
                <div style={{ marginBottom: '48px' }} className="fade-in">
                    <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#FFF', marginBottom: '24px' }}>
                        통합 검색
                    </h1>
                    <form onSubmit={handleSearch} style={{ position: 'relative', maxWidth: '600px' }}>
                        <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            <Search style={{ width: '18px', height: '18px', color: '#666' }} />
                        </div>
                        <input
                            type="text"
                            className="terminal-input"
                            style={{ paddingLeft: '42px', height: '48px', width: '100%' }}
                            placeholder="검색어를 입력하세요..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </form>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>검색 중...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }} className="fade-in-delay-1">
                        {/* QnA Results */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#FFB800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MessageCircle style={{ width: '20px', height: '20px' }} />
                                    Q&A ({qnaResults.length})
                                </h2>
                                {qnaResults.length > 0 && (
                                    <button
                                        onClick={() => navigate(`/qna?q=${encodeURIComponent(query)}`)}
                                        style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        더보기 <ArrowRight style={{ width: '12px', height: '12px' }} />
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {qnaResults.length === 0 ? (
                                    <div className="terminal-card" style={{ padding: '32px', textAlign: 'center', color: '#666' }}>검색 결과가 없습니다.</div>
                                ) : (
                                    qnaResults.map(qna => (
                                        <div
                                            key={qna.id}
                                            className="terminal-card"
                                            style={{ padding: '20px', cursor: 'pointer' }}
                                            onClick={() => handleItemClick('qna', qna.id)}
                                        >
                                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#FFF', marginBottom: '8px' }}>{qna.question_title}</h3>
                                            <p style={{ fontSize: '13px', color: '#999', marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{qna.question_details}</p>
                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                                {qna.created_by.full_name} • {format(new Date(qna.created_at), 'yyyy-MM-dd')}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Manual Results */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#CC8800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Book style={{ width: '20px', height: '20px' }} />
                                    매뉴얼 ({manualResults.length})
                                </h2>
                                {manualResults.length > 0 && (
                                    <button
                                        onClick={() => navigate(`/manuals?q=${encodeURIComponent(query)}`)}
                                        style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        더보기 <ArrowRight style={{ width: '12px', height: '12px' }} />
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {manualResults.length === 0 ? (
                                    <div className="terminal-card" style={{ padding: '32px', textAlign: 'center', color: '#666' }}>검색 결과가 없습니다.</div>
                                ) : (
                                    manualResults.map(manual => (
                                        <div
                                            key={manual.id}
                                            className="terminal-card"
                                            style={{ padding: '20px', cursor: 'pointer' }}
                                            onClick={() => handleItemClick('manual', manual.id)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#FFF' }}>{manual.title}</h3>
                                                <span style={{ fontSize: '12px', color: '#CC8800', background: 'rgba(204,136,0,0.1)', padding: '2px 8px', borderRadius: '4px' }}>v{manual.version_major}.{manual.version_minor}</span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                                최종 수정: {manual.updated_by?.full_name || 'Unknown'} • {format(new Date(manual.updated_at), 'yyyy-MM-dd')}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <Modal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                title={selectedItem?.type === 'qna' ? '질문 상세' : '매뉴얼 상세'}
            >
                {selectedItem?.type === 'qna' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#FFB800', marginBottom: '12px' }}>
                                {selectedItem.data.question_title}
                            </h2>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {selectedItem.data.categories?.map((cat) => (
                                    <span
                                        key={cat.category.name}
                                        style={{
                                            padding: '6px 14px',
                                            borderRadius: '4px',
                                            fontSize: '13px',
                                            backgroundColor: `${cat.category.color}15`,
                                            border: `1px solid ${cat.category.color}40`,
                                            color: cat.category.color,
                                        }}
                                    >
                                        {cat.category.name}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>질문 내용</h3>
                            <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.7' }}>
                                {selectedItem.data.question_details}
                            </p>
                        </div>

                        {selectedItem.data.answer && (
                            <div>
                                <h3 style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>답변</h3>
                                <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.7' }}>
                                    {selectedItem.data.answer}
                                </p>
                            </div>
                        )}

                        {selectedItem.data.answer_basis && (
                            <div>
                                <h3 style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>답변 근거</h3>
                                <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.7', fontStyle: 'italic' }}>
                                    {selectedItem.data.answer_basis}
                                </p>
                            </div>
                        )}

                        <FileUpload entityType="qna" entityId={selectedItem.data.id} readOnly={true} />

                        {selectedItem.data.tags && selectedItem.data.tags.length > 0 && (
                            <div>
                                <h3 style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>태그</h3>
                                {selectedItem.data.tags.map((tagItem, index) => (
                                    <span
                                        key={index}
                                        style={{
                                            fontSize: '12px',
                                            color: '#999',
                                            backgroundColor: '#222',
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            marginRight: '8px'
                                        }}
                                    >
                                        #{tagItem.tag.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #333', fontSize: '12px', color: '#666', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>최초 등록: {selectedItem.data.created_by?.full_name || 'Unknown'} ({format(new Date(selectedItem.data.created_at), 'yyyy-MM-dd HH:mm')})</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="gold-button"
                                style={{ padding: '0 24px', height: '44px' }}
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                )}

                {selectedItem?.type === 'manual' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    backgroundColor: 'rgba(204, 136, 0, 0.1)',
                                    border: '1px solid rgba(204, 136, 0, 0.3)',
                                    color: '#CC8800',
                                }}>
                                    v{selectedItem.data.version_major}.{selectedItem.data.version_minor}
                                </span>
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#CC8800', marginBottom: '8px' }}>
                                {selectedItem.data.title}
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#666' }}>
                                <span>최종 수정: {selectedItem.data.updated_by?.full_name || 'Unknown'}</span>
                                <span>수정일: {format(new Date(selectedItem.data.updated_at), 'yyyy-MM-dd HH:mm')}</span>
                            </div>
                        </div>

                        <div style={{ padding: '20px', backgroundColor: '#111', borderRadius: '8px', border: '1px solid #333' }}>
                            <div className="markdown-content" style={{ lineHeight: '1.6', color: '#e5e5e5' }}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {selectedItem.data.content || '내용을 불러오는데 실패했습니다.'}
                                </ReactMarkdown>
                            </div>
                        </div>

                        <FileUpload entityType="manual" entityId={selectedItem.data.id} readOnly={true} />

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="gold-button"
                                style={{ padding: '0 24px', height: '44px' }}
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SearchPage;
