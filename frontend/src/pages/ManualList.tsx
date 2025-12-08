


import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Calendar, User, Book, Plus, Search, FileText, Edit2, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import Modal from '../components/Modal';
import { useAuthStore } from '../lib/store';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FileUpload from '../components/FileUpload';

import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';
import { Editor } from '@toast-ui/react-editor';

interface Manual {
    id: string;
    title: string;
    version_major: number;
    version_minor: number;
    updated_at: string;
    updated_by: { full_name: string };
    created_at: string;
    created_by: { full_name: string };
}

interface ManualVersion {
    id: string;
    version_major: number;
    version_minor: number;
    change_type: 'major' | 'minor';
    change_log: string;
    content: string;
    created_at: string;
    created_by: { full_name: string };
}

const ManualContent = ({ manualId }: { manualId: string }) => {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await api.get(`/manuals/${manualId}`);
                setContent(response.data.content);
            } catch (error) {
                console.error('Failed to fetch manual content', error);
                setContent('내용을 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [manualId]);

    if (loading) return <div style={{ color: '#999' }}>로딩 중...</div>;

    return (
        <div className="markdown-content" style={{ lineHeight: '1.6', color: '#e5e5e5' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
            </ReactMarkdown>
        </div>
    );
};

const ManualList: React.FC = () => {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin' || user?.role === 'hr_staff';
    const navigate = useNavigate();
    const [manuals, setManuals] = useState<Manual[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [searchInput, setSearchInput] = useState(query);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedManual, setSelectedManual] = useState<Manual | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', content: '', change_log: '' });
    const [newManual, setNewManual] = useState({
        title: '',
        content: '',
    });

    const createEditorRef = useRef<Editor>(null);
    const editEditorRef = useRef<Editor>(null);

    useEffect(() => {
        const fetchManuals = async () => {
            setLoading(true);
            try {
                const response = await api.get('/manuals', { params: { q: query } });
                setManuals(response.data.data);
            } catch (error) {
                console.error('Failed to fetch Manuals', error);
            } finally {
                setLoading(false);
            }
        };

        fetchManuals();
    }, [query]);

    const [activeTab, setActiveTab] = useState<'content' | 'history'>('content');
    const [versions, setVersions] = useState<ManualVersion[]>([]);
    const [viewingVersion, setViewingVersion] = useState<ManualVersion | null>(null);

    useEffect(() => {
        if (selectedManual && activeTab === 'history') {
            fetchVersions();
        }
        if (!selectedManual) {
            setViewingVersion(null);
            setActiveTab('content');
        }
    }, [selectedManual, activeTab]);

    const fetchVersions = async () => {
        if (!selectedManual) return;
        try {
            const response = await api.get(`/manuals/${selectedManual.id}/versions`);
            setVersions(response.data);
        } catch (error) {
            console.error('Failed to fetch versions', error);
        }
    };

    const handleRevert = async (versionId: string, major: number, minor: number) => {
        if (!confirm(`정말로 v${major}.${minor} 버전으로 되돌리시겠습니까?\n현재 내용은 새로운 버전으로 저장됩니다.`)) return;

        try {
            await api.post(`/manuals/${selectedManual!.id}/revert`, { version_id: versionId });
            alert('성공적으로 되돌렸습니다.');
            // Refresh manual and switch to content tab
            const response = await api.get(`/manuals/${selectedManual!.id}`);
            setSelectedManual(response.data);
            setActiveTab('content');
            // Refresh list
            const listResponse = await api.get('/manuals', { params: { q: query } });
            setManuals(listResponse.data.data);
        } catch (error) {
            console.error('Failed to revert', error);
            alert('되돌리기에 실패했습니다.');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Get content from editor
        const content = createEditorRef.current?.getInstance().getMarkdown() || '';
        if (!content.trim()) {
            alert('내용을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            await api.post('/manuals', {
                title: newManual.title,
                content: content,
                qna_ids: [] // Optional for now
            });
            setIsModalOpen(false);
            setNewManual({ title: '', content: '' });
            // Refresh list
            const response = await api.get('/manuals', { params: { q: query } });
            setManuals(response.data.data);
            alert('매뉴얼이 생성되었습니다.');
        } catch (error) {
            console.error('Failed to create Manual', error);
            alert('매뉴얼 생성에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (manualId: string) => {
        if (!confirm('정말로 이 매뉴얼을 삭제하시겠습니까?')) return;

        try {
            await api.delete(`/manuals/${manualId}`);
            alert('매뉴얼이 삭제되었습니다.');
            setSelectedManual(null);
            // Refresh list
            const response = await api.get('/manuals', { params: { q: query } });
            setManuals(response.data.data);
        } catch (error) {
            console.error('Failed to delete Manual', error);
            alert('삭제에 실패했습니다.');
        }
    };

    // Populate edit form when selectedManual changes or isEditing becomes true
    useEffect(() => {
        if (selectedManual && isEditing) {
            const fetchFullManual = async () => {
                try {
                    const response = await api.get(`/manuals/${selectedManual.id}`);
                    setEditForm({
                        title: response.data.title,
                        content: response.data.content,
                        change_log: ''
                    });
                    // Update editor content
                    if (editEditorRef.current) {
                        editEditorRef.current.getInstance().setMarkdown(response.data.content);
                    }
                } catch (error) {
                    console.error('Failed to fetch manual details', error);
                }
            };
            fetchFullManual();
        }
    }, [selectedManual, isEditing]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedManual || isSubmitting) return;

        // Get content from editor
        const content = editEditorRef.current?.getInstance().getMarkdown() || '';
        if (!content.trim()) {
            alert('내용을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            await api.put(`/manuals/${selectedManual.id}`, {
                title: editForm.title,
                content: content,
                change_log: editForm.change_log,
                change_type: 'minor' // Default to minor for simple edits
            });
            alert('매뉴얼이 수정되었습니다.');
            setIsEditing(false);
            setSelectedManual(null);
            // Refresh list
            const response = await api.get('/manuals', { params: { q: query } });
            setManuals(response.data.data);
        } catch (error) {
            console.error('Failed to update Manual', error);
            alert('매뉴얼 수정에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSearch = () => {
        if (searchInput.trim()) {
            navigate(`/manuals?q=${encodeURIComponent(searchInput)}`);
        } else {
            navigate('/manuals');
        }
    };

    return (
        <div className="min-h-screen grid-background" style={{ padding: '32px 0' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 10 }}>
                {/* 헤더 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }} className="fade-in">
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#CC8800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Book style={{ width: '28px', height: '28px' }} />
                            프로세스 매뉴얼
                        </h1>
                        <p style={{ fontSize: '14px', color: '#666' }}>
                            {manuals.length}개의 매뉴얼
                        </p>
                    </div>
                    {isAdmin && (
                        <button
                            className="gold-button"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Plus style={{ width: '16px', height: '16px' }} />
                            매뉴얼 생성
                        </button>
                    )}
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
                            placeholder="매뉴얼 검색..."
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

                {/* 리스트 */}
                {loading ? (
                    <div className="terminal-card" style={{ textAlign: 'center', padding: '60px 32px' }}>
                        <p style={{ color: '#999', fontSize: '14px' }}>로딩 중...</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="fade-in-delay-2">
                        {manuals.length === 0 ? (
                            <div className="terminal-card" style={{ textAlign: 'center', padding: '60px 32px' }}>
                                <Book style={{ width: '48px', height: '48px', color: '#333', margin: '0 auto 16px' }} />
                                <p style={{ color: '#999', fontSize: '14px' }}>등록된 매뉴얼이 없습니다</p>
                            </div>
                        ) : (
                            manuals.map((manual) => (
                                <div
                                    key={manual.id}
                                    className="terminal-card"
                                    style={{ cursor: 'pointer', padding: '24px' }}
                                    onClick={() => setSelectedManual(manual)}
                                >
                                    <div style={{ position: 'relative', zIndex: 10 }}>
                                        {/* 제목 & 버전 */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '6px',
                                                    background: 'linear-gradient(135deg, #CC8800 0%, #FFB800 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    <FileText style={{ width: '20px', height: '20px', color: '#0a0a0a' }} />
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#CC8800', marginBottom: '4px' }}>
                                                        {manual.title}
                                                    </h3>
                                                    <p style={{ fontSize: '12px', color: '#666' }}>
                                                        문서 ID: {manual.id.slice(0, 8)}
                                                    </p>
                                                </div>
                                            </div>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                backgroundColor: 'rgba(204, 136, 0, 0.1)',
                                                border: '1px solid rgba(204, 136, 0, 0.3)',
                                                color: '#CC8800',
                                                flexShrink: 0
                                            }}>
                                                v{manual.version_major}.{manual.version_minor}
                                            </span>
                                        </div>

                                        {/* 메타 정보 */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#666', paddingTop: '12px', borderTop: '1px solid #2a2a2a' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <User style={{ width: '14px', height: '14px' }} />
                                                <span>최종 수정: {manual.updated_by?.full_name || 'Unknown'}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Calendar style={{ width: '14px', height: '14px' }} />
                                                <span>{format(new Date(manual.updated_at), 'yyyy-MM-dd HH:mm')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="새 매뉴얼 생성">
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#999', marginBottom: '8px' }}>매뉴얼 제목</label>
                        <input
                            type="text"
                            className="terminal-input"
                            style={{ width: '100%', height: '44px', paddingLeft: '12px' }}
                            placeholder="매뉴얼 제목을 입력하세요"
                            required
                            value={newManual.title}
                            onChange={(e) => setNewManual({ ...newManual, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#999', marginBottom: '8px' }}>내용 (Markdown 지원)</label>
                        <div style={{ border: '1px solid #333', borderRadius: '4px', overflow: 'hidden' }}>
                            <Editor
                                initialValue=" "
                                previewStyle="vertical"
                                height="400px"
                                initialEditType="markdown"
                                useCommandShortcut={true}
                                ref={createEditorRef}
                                theme="dark"
                                toolbarItems={[
                                    ['heading', 'bold', 'italic', 'strike'],
                                    ['hr', 'quote'],
                                    ['ul', 'ol', 'task', 'indent', 'outdent'],
                                    ['table', 'image', 'link'],
                                    ['code', 'codeblock']
                                ]}
                            />
                        </div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                        * 파일 첨부는 매뉴얼 생성 후 수정 화면에서 가능합니다.
                    </div>
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
                            {isSubmitting ? '처리 중...' : '생성하기'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Detail Modal */}
            <Modal isOpen={!!selectedManual} onClose={() => { setSelectedManual(null); setIsEditing(false); }} title={isEditing ? "매뉴얼 수정" : "매뉴얼 상세"}>
                {selectedManual && (
                    isEditing ? (
                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#999', marginBottom: '8px' }}>매뉴얼 제목</label>
                                <input
                                    type="text"
                                    className="terminal-input"
                                    style={{ width: '100%', height: '44px', paddingLeft: '12px' }}
                                    required
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#999', marginBottom: '8px' }}>내용 (Markdown 지원)</label>
                                <div style={{ border: '1px solid #333', borderRadius: '4px', overflow: 'hidden' }}>
                                    <Editor
                                        initialValue={editForm.content || ' '}
                                        previewStyle="vertical"
                                        height="400px"
                                        initialEditType="markdown"
                                        useCommandShortcut={true}
                                        ref={editEditorRef}
                                        theme="dark"
                                        toolbarItems={[
                                            ['heading', 'bold', 'italic', 'strike'],
                                            ['hr', 'quote'],
                                            ['ul', 'ol', 'task', 'indent', 'outdent'],
                                            ['table', 'image', 'link'],
                                            ['code', 'codeblock']
                                        ]}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#999', marginBottom: '8px' }}>수정 내역 (Change Log)</label>
                                <input
                                    type="text"
                                    className="terminal-input"
                                    style={{ width: '100%', height: '44px', paddingLeft: '12px' }}
                                    placeholder="수정 사항을 간단히 입력하세요"
                                    value={editForm.change_log}
                                    onChange={(e) => setEditForm({ ...editForm, change_log: e.target.value })}
                                />
                            </div>

                            <FileUpload entityType="manual" entityId={selectedManual.id} />

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
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
                                    {isSubmitting ? '처리 중...' : '수정 완료'}
                                </button>
                            </div>
                        </form>
                    ) : (
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
                                        v{selectedManual.version_major}.{selectedManual.version_minor}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#666' }}>
                                        ID: {selectedManual.id}
                                    </span>
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#CC8800', marginBottom: '8px' }}>
                                    {selectedManual.title}
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#666' }}>
                                    <span>최종 수정: {selectedManual.updated_by?.full_name || 'Unknown'}</span>
                                    <span>수정일: {format(new Date(selectedManual.updated_at), 'yyyy-MM-dd HH:mm')}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#666', marginTop: '4px' }}>
                                    <span>최초 등록: {selectedManual.created_by?.full_name || 'Unknown'}</span>
                                    <span>등록일: {format(new Date(selectedManual.created_at), 'yyyy-MM-dd HH:mm')}</span>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div style={{ display: 'flex', borderBottom: '1px solid #333', marginBottom: '16px' }}>
                                <button
                                    onClick={() => setActiveTab('content')}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: activeTab === 'content' ? '2px solid #CC8800' : '2px solid transparent',
                                        color: activeTab === 'content' ? '#CC8800' : '#666',
                                        cursor: 'pointer',
                                        fontWeight: activeTab === 'content' ? '600' : '400'
                                    }}
                                >
                                    내용
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: activeTab === 'history' ? '2px solid #CC8800' : '2px solid transparent',
                                        color: activeTab === 'history' ? '#CC8800' : '#666',
                                        cursor: 'pointer',
                                        fontWeight: activeTab === 'history' ? '600' : '400'
                                    }}
                                >
                                    버전 이력
                                </button>
                            </div>

                            {activeTab === 'content' ? (
                                <>
                                    {viewingVersion ? (
                                        <div style={{ marginBottom: '16px' }}>
                                            <div style={{
                                                padding: '12px 16px',
                                                backgroundColor: 'rgba(204, 136, 0, 0.1)',
                                                border: '1px solid rgba(204, 136, 0, 0.3)',
                                                borderRadius: '6px',
                                                color: '#CC8800',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '16px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Book style={{ width: '16px', height: '16px' }} />
                                                    <span>
                                                        현재 <strong>v{viewingVersion.version_major}.{viewingVersion.version_minor}</strong> (과거 버전) 내용을 보고 있습니다.
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => setViewingVersion(null)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#CC8800',
                                                        textDecoration: 'underline',
                                                        cursor: 'pointer',
                                                        fontSize: '13px'
                                                    }}
                                                >
                                                    최신 버전으로 돌아가기
                                                </button>
                                            </div>
                                            <div style={{ padding: '20px', backgroundColor: '#111', borderRadius: '8px', border: '1px solid #333' }}>
                                                <div className="markdown-content" style={{ lineHeight: '1.6', color: '#e5e5e5' }}>
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {viewingVersion.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ padding: '20px', backgroundColor: '#111', borderRadius: '8px', border: '1px solid #333' }}>
                                                <ManualContent manualId={selectedManual.id} />
                                            </div>
                                            <FileUpload entityType="manual" entityId={selectedManual.id} readOnly={true} />
                                        </>
                                    )}
                                </>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {versions.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>이력이 없습니다.</div>
                                    ) : (
                                        versions.map((version) => (
                                            <div
                                                key={version.id}
                                                onClick={() => {
                                                    setViewingVersion(version);
                                                    setActiveTab('content');
                                                }}
                                                style={{
                                                    padding: '16px',
                                                    backgroundColor: '#1a1a1a',
                                                    border: '1px solid #333',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#222'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                                            >
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                                        <span style={{
                                                            color: '#CC8800',
                                                            fontWeight: '600',
                                                            fontSize: '14px'
                                                        }}>
                                                            v{version.version_major}.{version.version_minor}
                                                        </span>
                                                        <span style={{
                                                            fontSize: '12px',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            backgroundColor: version.change_type === 'major' ? 'rgba(255, 68, 68, 0.1)' : 'rgba(204, 136, 0, 0.1)',
                                                            color: version.change_type === 'major' ? '#ff4444' : '#CC8800',
                                                            border: version.change_type === 'major' ? '1px solid rgba(255, 68, 68, 0.3)' : '1px solid rgba(204, 136, 0, 0.3)',
                                                        }}>
                                                            {version.change_type.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p style={{ color: '#e5e5e5', fontSize: '14px', marginBottom: '4px' }}>
                                                        {version.change_log}
                                                    </p>
                                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                                        {version.created_by.full_name} • {format(new Date(version.created_at), 'yyyy-MM-dd HH:mm')}
                                                    </div>
                                                </div>
                                                {isAdmin && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent triggering row click
                                                            handleRevert(version.id, version.version_major, version.version_minor);
                                                        }}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '4px',
                                                            border: '1px solid #555',
                                                            backgroundColor: 'transparent',
                                                            color: '#999',
                                                            fontSize: '12px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        되돌리기
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                {isAdmin && (
                                    <>
                                        <button
                                            onClick={() => handleDelete(selectedManual.id)}
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
                                            onClick={() => setIsEditing(true)}
                                            className="gold-button"
                                            style={{ padding: '0 24px', height: '44px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            <Edit2 style={{ width: '14px', height: '14px' }} />
                                            수정
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setSelectedManual(null)}
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
                    )
                )}
            </Modal >

        </div >
    );
};

export default ManualList;
