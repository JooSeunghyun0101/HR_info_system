

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Modal from '../components/Modal';
import { useAuthStore } from '../lib/store';
import { MessageCircle, Calendar, User, Eye, Plus, Search, Trash2, Edit2, X } from 'lucide-react';
import { format } from 'date-fns';
import FileUpload from '../components/FileUpload';

interface QnA {
    id: string;
    question_title: string;
    question_details: string;
    answer?: string;
    answer_basis?: string; // Added field
    view_count: number;
    created_at: string;
    created_by: { full_name: string };
    updated_at: string; // Added field
    updated_by?: { full_name: string }; // Added field
    categories: { category: { id: string; name: string; color: string } }[];
    tags: { tag: { name: string } }[];
}

interface Category {
    id: string;
    name: string;
    color: string;
}

const QnAList: React.FC = () => {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin' || user?.role === 'hr_staff';
    const navigate = useNavigate();

    const [qnas, setQnas] = useState<QnA[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedQnA, setSelectedQnA] = useState<QnA | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [searchInput, setSearchInput] = useState(query);

    const [filters, setFilters] = useState({
        categoryId: '',
        tag: '',
        startDate: '',
        endDate: ''
    });

    const [newQnA, setNewQnA] = useState({
        question_title: '',
        question_details: '',
        answer: '',
        answer_basis: '',
        tags: '',
        categoryId: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchQnas();
        fetchCategories();
    }, [query]);

    useEffect(() => {
        setSearchInput(query);
    }, [query]);

    const fetchQnas = async () => {
        try {
            setLoading(true);
            const params = {
                q: query,
                category: filters.categoryId || undefined,
                tag: filters.tag || undefined,
                start_date: filters.startDate || undefined,
                end_date: filters.endDate || undefined
            };
            const response = await api.get('/qna', { params });
            setQnas(response.data.data);
        } catch (error) {
            console.error('Failed to fetch Q&As', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data);
            if (response.data.length > 0) {
                setNewQnA(prev => ({ ...prev, categoryId: response.data[0].id }));
            }
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            if (isEditing && selectedQnA) {
                await api.put(`/qna/${selectedQnA.id}`, {
                    ...newQnA,
                    tags: newQnA.tags.split(',').map(t => t.trim()).filter(t => t),
                    categories: [newQnA.categoryId]
                });
                alert('질문이 수정되었습니다.');
            } else {
                await api.post('/qna', {
                    ...newQnA,
                    tags: newQnA.tags.split(',').map(t => t.trim()).filter(t => t),
                    categories: [newQnA.categoryId]
                });
                alert('질문이 등록되었습니다.');
            }

            setIsModalOpen(false);
            setIsEditing(false);
            setSelectedQnA(null);
            setNewQnA({ question_title: '', question_details: '', answer: '', answer_basis: '', tags: '', categoryId: categories[0]?.id || '' });

            // Refresh list
            fetchQnas();
        } catch (error) {
            console.error('Failed to save Q&A', error);
            alert('저장에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (qnaId: string) => {
        if (!confirm('정말로 이 질문을 삭제하시겠습니까?')) return;

        try {
            await api.delete(`/qna/${qnaId}`);
            alert('질문이 삭제되었습니다.');
            setSelectedQnA(null);
            fetchQnas();
        } catch (error) {
            console.error('Failed to delete Q&A', error);
            alert('삭제에 실패했습니다.');
        }
    };

    const openEditModal = () => {
        if (!selectedQnA) return;

        setIsEditing(true);
        setNewQnA({
            question_title: selectedQnA.question_title,
            question_details: selectedQnA.question_details,
            answer: selectedQnA.answer || '',
            answer_basis: selectedQnA.answer_basis || '', // Added field
            tags: selectedQnA.tags.map(t => t.tag.name).join(', '),
            categoryId: selectedQnA.categories[0]?.category.id || categories[0]?.id || ''
        });
        setIsModalOpen(true);
        // setSelectedQnA(null); // Keep selectedQnA for ID reference during update
    };

    const handleSearch = () => {
        if (searchInput.trim()) {
            navigate(`/qna?q=${encodeURIComponent(searchInput)}`);
        } else {
            navigate('/qna');
        }
    };

    return (
        <div className="min-h-screen grid-background" style={{ padding: '32px 0' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 10 }}>
                {/* 헤더 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }} className="fade-in">
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#FFB800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <MessageCircle style={{ width: '28px', height: '28px' }} />
                            Q&A 데이터베이스
                        </h1>
                        <p style={{ fontSize: '14px', color: '#666' }}>
                            {qnas.length}개의 질문
                        </p>
                    </div>
                    <button
                        className="gold-button"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => {
                            setIsEditing(false);
                            setNewQnA({ question_title: '', question_details: '', answer: '', answer_basis: '', tags: '', categoryId: categories[0]?.id || '' });
                            setIsModalOpen(true);
                        }}
                    >
                        <Plus style={{ width: '16px', height: '16px' }} />
                        질문 등록
                    </button>
                </div>

                {/* 검색 바 */}
                <div style={{ marginBottom: '24px' }} className="fade-in-delay-1">
                    <div style={{ position: 'relative', maxWidth: '500px' }}>
                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            <Search style={{ width: '16px', height: '16px', color: '#666' }} />
                        </div>
                        <input
                            type="text"
                            className="terminal-input"
                            style={{ paddingLeft: '38px', height: '42px' }}
                            placeholder="질문 검색..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Filters */}
                <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }} className="fade-in-delay-1">
                    <select
                        className="terminal-input"
                        style={{ width: '150px', height: '42px' }}
                        value={filters.categoryId}
                        onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
                    >
                        <option value="">모든 카테고리</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        className="terminal-input"
                        style={{ width: '150px', height: '42px' }}
                        placeholder="태그 입력"
                        value={filters.tag}
                        onChange={(e) => setFilters(prev => ({ ...prev, tag: e.target.value }))}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                        <input
                            type="date"
                            className="terminal-input"
                            style={{ width: '140px', height: '42px' }}
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                        <span>~</span>
                        <input
                            type="date"
                            className="terminal-input"
                            style={{ width: '140px', height: '42px' }}
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>
                    <button
                        onClick={fetchQnas}
                        className="gold-button"
                        style={{ height: '42px', padding: '0 20px' }}
                    >
                        필터 적용
                    </button>
                </div>

                {/* 리스트 */}
                {loading ? (
                    <div className="terminal-card" style={{ textAlign: 'center', padding: '60px 32px' }}>
                        <p style={{ color: '#999', fontSize: '14px' }}>로딩 중...</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="fade-in-delay-2">
                        {qnas.length === 0 ? (
                            <div className="terminal-card" style={{ textAlign: 'center', padding: '60px 32px' }}>
                                <MessageCircle style={{ width: '48px', height: '48px', color: '#333', margin: '0 auto 16px' }} />
                                <p style={{ color: '#999', fontSize: '14px' }}>등록된 질문이 없습니다</p>
                            </div>
                        ) : (
                            qnas.map((qna) => (
                                <div
                                    key={qna.id}
                                    className="terminal-card"
                                    style={{ cursor: 'pointer', padding: '24px' }}
                                    onClick={() => setSelectedQnA(qna)}
                                >
                                    <div style={{ position: 'relative', zIndex: 10 }}>
                                        {/* 제목 & 카테고리 */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFB800', flex: 1 }}>
                                                {qna.question_title}
                                            </h3>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {qna.categories.map((cat) => (
                                                    <span
                                                        key={cat.category.name}
                                                        style={{
                                                            padding: '4px 12px',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
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

                                        {/* 설명 */}
                                        <p style={{ color: '#999', fontSize: '14px', marginBottom: '16px', lineHeight: '1.6' }}>
                                            {qna.question_details}
                                        </p>

                                        {/* 메타 정보 */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#666' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <User style={{ width: '14px', height: '14px' }} />
                                                <span>{qna.created_by.full_name}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Eye style={{ width: '14px', height: '14px' }} />
                                                <span>{qna.view_count} 조회</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Calendar style={{ width: '14px', height: '14px' }} />
                                                <span>{format(new Date(qna.created_at), 'yyyy-MM-dd')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setIsEditing(false); }} title={isEditing ? "질문 수정" : "새 질문 등록"}>
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#999', marginBottom: '8px' }}>카테고리</label>
                        <select
                            className="terminal-input"
                            style={{ width: '100%', height: '44px' }}
                            value={newQnA.categoryId}
                            onChange={(e) => setNewQnA({ ...newQnA, categoryId: e.target.value })}
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#999', marginBottom: '8px' }}>질문 제목</label>
                        <input
                            type="text"
                            className="terminal-input"
                            style={{ width: '100%', height: '44px', paddingLeft: '12px' }}
                            placeholder="질문의 핵심 내용을 입력하세요"
                            required
                            value={newQnA.question_title}
                            onChange={(e) => setNewQnA({ ...newQnA, question_title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#999', marginBottom: '8px' }}>상세 내용</label>
                        <textarea
                            className="terminal-input"
                            style={{ width: '100%', height: '120px', padding: '12px', resize: 'vertical' }}
                            placeholder="질문의 상세 내용을 입력하세요"
                            required
                            value={newQnA.question_details}
                            onChange={(e) => setNewQnA({ ...newQnA, question_details: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#999', marginBottom: '8px' }}>답변 (선택사항)</label>
                        <textarea
                            className="terminal-input"
                            style={{ width: '100%', height: '120px', padding: '12px', resize: 'vertical' }}
                            placeholder="이미 알고 있는 답변이 있다면 입력하세요"
                            value={newQnA.answer}
                            onChange={(e) => setNewQnA({ ...newQnA, answer: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#999', marginBottom: '8px' }}>답변 근거 (선택사항)</label>
                        <textarea
                            className="terminal-input"
                            style={{ width: '100%', height: '80px', padding: '12px', resize: 'vertical' }}
                            placeholder="답변의 근거가 되는 규정이나 문서 등을 입력하세요"
                            value={newQnA.answer_basis}
                            onChange={(e) => setNewQnA({ ...newQnA, answer_basis: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#999', marginBottom: '8px' }}>태그 (쉼표로 구분)</label>
                        <input
                            type="text"
                            className="terminal-input"
                            style={{ width: '100%', height: '44px', paddingLeft: '12px' }}
                            placeholder="예: 인사, 휴가, 연차"
                            value={newQnA.tags}
                            onChange={(e) => setNewQnA({ ...newQnA, tags: e.target.value })}
                        />
                    </div>

                    {isEditing && selectedQnA && (
                        <FileUpload entityType="qna" entityId={selectedQnA.id} />
                    )}
                    {!isEditing && (
                        <div style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                            * 파일 첨부는 질문 등록 후 수정 화면에서 가능합니다.
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            style={{
                                padding: '0 20px',
                                height: '44px',
                                borderRadius: '6px',
                                backgroundColor: 'transparent',
                                border: '1px solid #333',
                                color: '#999',
                                cursor: 'pointer'
                            }}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="gold-button"
                            style={{ height: '44px', padding: '0 24px', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '처리 중...' : (isEditing ? '수정하기' : '등록하기')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Detail Modal - Hide when Edit Modal is open to prevent overlap */}
            <Modal isOpen={!!selectedQnA && !isModalOpen} onClose={() => setSelectedQnA(null)} title="질문 상세">
                {selectedQnA && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Title */}
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#FFB800', marginBottom: '12px' }}>
                                {selectedQnA.question_title}
                            </h2>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {selectedQnA.categories.map((cat) => (
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

                        {/* Question Details */}
                        <div>
                            <h3 style={{ fontSize: '14px', color: '#FFB800', marginBottom: '8px' }}>질문 내용</h3>
                            <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.7' }}>
                                {selectedQnA.question_details}
                            </p>
                        </div>

                        {/* Answer */}
                        {selectedQnA.answer && (
                            <div>
                                <h3 style={{ fontSize: '14px', color: '#FFB800', marginBottom: '8px' }}>답변</h3>
                                <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.7' }}>
                                    {selectedQnA.answer}
                                </p>
                            </div>
                        )}

                        {/* Answer Basis */}
                        {selectedQnA.answer_basis && (
                            <div>
                                <h3 style={{ fontSize: '14px', color: '#FFB800', marginBottom: '8px' }}>답변 근거</h3>
                                <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.7', fontStyle: 'italic' }}>
                                    {selectedQnA.answer_basis}
                                </p>
                            </div>
                        )}

                        {/* Attachments */}
                        <FileUpload entityType="qna" entityId={selectedQnA.id} readOnly={true} />

                        {/* Tags */}
                        {selectedQnA.tags && selectedQnA.tags.length > 0 && (
                            <div>
                                <h3 style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>태그</h3>
                                {selectedQnA.tags.map((tagItem, index) => (
                                    <span
                                        key={index}
                                        style={{
                                            fontSize: '12px',
                                            color: '#999',
                                            backgroundColor: '#222',
                                            padding: '4px 10px',
                                            borderRadius: '12px'
                                        }}
                                    >
                                        #{tagItem.tag.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Metadata Footer */}
                        <div style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #333', fontSize: '12px', color: '#666', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>최초 등록: {selectedQnA.created_by?.full_name || 'Unknown'} ({format(new Date(selectedQnA.created_at), 'yyyy-MM-dd HH:mm')})</span>
                            </div>
                            {selectedQnA.updated_at !== selectedQnA.created_at && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>최종 수정: {selectedQnA.updated_by?.full_name || selectedQnA.created_by?.full_name || 'Unknown'} ({format(new Date(selectedQnA.updated_at), 'yyyy-MM-dd HH:mm')})</span>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            {isAdmin && (
                                <>
                                    <button
                                        onClick={() => selectedQnA && handleDelete(selectedQnA.id)}
                                        style={{
                                            padding: '0 24px',
                                            height: '44px',
                                            borderRadius: '6px',
                                            backgroundColor: '#331111',
                                            border: '1px solid #552222',
                                            color: '#ff4444',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <Trash2 style={{ width: '14px', height: '14px' }} />
                                        삭제
                                    </button>
                                    <button
                                        onClick={openEditModal}
                                        className="gold-button"
                                        style={{
                                            padding: '0 24px',
                                            height: '44px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <Edit2 style={{ width: '14px', height: '14px' }} />
                                        수정
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setSelectedQnA(null)}
                                className="gold-button"
                                style={{
                                    padding: '0 24px',
                                    height: '44px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <X style={{ width: '14px', height: '14px' }} />
                                닫기
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    );
};

export default QnAList;
