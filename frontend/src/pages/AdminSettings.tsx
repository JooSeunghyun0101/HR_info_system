import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import api from '../lib/api';
import { Users, FolderOpen, Tag, BarChart3, Edit2, Check, Download } from 'lucide-react';

type Tab = 'users' | 'categories' | 'tags' | 'stats';

const AdminSettings: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('users');
    const { user } = useAuthStore();

    useEffect(() => {
        // Check if user is admin
        if (!user) {
            navigate('/login');
        } else if (user.role !== 'admin') {
            alert('Admin 권한이 필요합니다.');
            navigate('/');
        }
    }, [user, navigate]);

    if (!user || user.role !== 'admin') {
        return null;
    }

    const tabs = [
        { id: 'users' as Tab, label: '사용자 관리', icon: Users },
        { id: 'categories' as Tab, label: '카테고리 관리', icon: FolderOpen },
        { id: 'tags' as Tab, label: '태그 관리', icon: Tag },
        { id: 'stats' as Tab, label: '시스템 통계', icon: BarChart3 }
    ];

    return (
        <div className="min-h-screen grid-background" style={{ padding: '32px 0' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 10 }}>
                {/* Header */}
                <div style={{ marginBottom: '32px' }} className="fade-in">
                    <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#CC8800', marginBottom: '4px' }}>
                        ⚙️ Admin 설정
                    </h1>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        시스템 관리 및 설정
                    </p>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '24px',
                    borderBottom: '1px solid #333',
                    paddingBottom: '0'
                }} className="fade-in-delay-1">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '12px 20px',
                                    background: activeTab === tab.id ? 'rgba(204, 136, 0, 0.1)' : 'transparent',
                                    border: 'none',
                                    borderBottom: activeTab === tab.id ? '2px solid #CC8800' : '2px solid transparent',
                                    color: activeTab === tab.id ? '#CC8800' : '#999',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    fontSize: '14px',
                                    fontWeight: activeTab === tab.id ? '600' : '400',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Icon style={{ width: '16px', height: '16px' }} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="fade-in-delay-2">
                    {activeTab === 'users' && <UserManagement />}
                    {activeTab === 'categories' && <CategoryManagement />}
                    {activeTab === 'tags' && <TagManagement />}
                    {activeTab === 'stats' && <SystemStats />}
                </div>
            </div>
        </div>
    );
};

// User Management Tab
const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', role: 'employee' });

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await api.patch(`/admin/users/${userId}/role`, { role: newRole });
            alert('역할이 변경되었습니다.');
            fetchUsers();
        } catch (error) {
            alert('역할 변경에 실패했습니다.');
        }
    };

    const handleStatusToggle = async (userId: string, isActive: boolean) => {
        try {
            await api.patch(`/admin/users/${userId}/status`, { is_active: !isActive });
            alert('상태가 변경되었습니다.');
            fetchUsers();
        } catch (error) {
            alert('상태 변경에 실패했습니다.');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/users', newUser);
            alert('사용자가 생성되었습니다.');
            setShowCreateForm(false);
            setNewUser({ email: '', password: '', full_name: '', role: 'employee' });
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.message || '사용자 생성에 실패했습니다.');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>로딩 중...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFF' }}>사용자 목록 ({users.length})</h2>
                <button
                    className="gold-button"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    {showCreateForm ? '취소' : '+ 사용자 생성'}
                </button>
            </div>

            {showCreateForm && (
                <div className="terminal-card" style={{ marginBottom: '16px', padding: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#CC8800' }}>신규 사용자</h3>
                    <form onSubmit={handleCreateUser} autoComplete="off">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', color: '#CC8800', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>이메일</label>
                                <input
                                    className="terminal-input"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    placeholder="user@example.com"
                                    required
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#CC8800', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>이름</label>
                                <input
                                    className="terminal-input"
                                    type="text"
                                    name="full_name"
                                    autoComplete="off"
                                    placeholder="홍길동"
                                    required
                                    value={newUser.full_name}
                                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#CC8800', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>비밀번호</label>
                                <input
                                    className="terminal-input"
                                    type="password"
                                    name="password"
                                    autoComplete="new-password"
                                    placeholder="최소 6자 이상 입력해주세요"
                                    required
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#CC8800', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>역할 (Role)</label>
                                <select
                                    className="terminal-input"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    style={{ width: '100%' }}
                                >
                                    <option value="employee">Employee (일반 사용자 - 질문 작성 가능)</option>
                                    <option value="hr_staff">HR Staff (담당자 - 답변 작성 가능)</option>
                                    <option value="admin">Admin (관리자 - 전체 권한)</option>
                                </select>
                                <p style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
                                    * 각 역할에 따라 접근 가능한 메뉴와 기능이 달라집니다.
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="gold-button" style={{ padding: '10px 24px' }}>사용자 생성</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="terminal-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid #333' }}>
                        <tr>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#CC8800' }}>이름</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#CC8800' }}>이메일</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#CC8800' }}>역할</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#CC8800' }}>상태</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#CC8800' }}>작업</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid #222' }}>
                                <td style={{ padding: '12px', fontSize: '14px', color: '#FFF' }}>{user.full_name}</td>
                                <td style={{ padding: '12px', fontSize: '14px', color: '#999' }}>{user.email}</td>
                                <td style={{ padding: '12px' }}>
                                    <select
                                        className="terminal-input"
                                        style={{ padding: '6px 12px', fontSize: '13px' }}
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    >
                                        <option value="employee">Employee</option>
                                        <option value="hr_staff">HR Staff</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        background: user.is_active ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                                        color: user.is_active ? '#0F0' : '#F00'
                                    }}>
                                        {user.is_active ? '활성' : '비활성'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <button
                                        onClick={() => handleStatusToggle(user.id, user.is_active)}
                                        style={{
                                            padding: '6px 12px',
                                            background: user.is_active ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
                                            border: user.is_active ? '1px solid #F00' : '1px solid #0F0',
                                            color: user.is_active ? '#F00' : '#0F0',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        {user.is_active ? '비활성화' : '활성화'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Category Management Tab (continuing in next message due to length...)
const CategoryManagement: React.FC = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ id: '', name: '', description: '', color: '#CC8800', display_order: 0, is_active: true });

    const fetchCategories = async () => {
        try {
            const response = await api.get('/admin/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await api.patch(`/admin/categories/${formData.id}`, formData);
                alert('카테고리가 수정되었습니다.');
            } else {
                await api.post('/admin/categories', formData);
                alert('카테고리가 생성되었습니다.');
            }
            setShowForm(false);
            setFormData({ id: '', name: '', description: '', color: '#CC8800', display_order: 0, is_active: true });
            fetchCategories();
        } catch (error: any) {
            alert(error.response?.data?.message || '작업에 실패했습니다.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await api.delete(`/admin/categories/${id}`);
            alert('삭제되었습니다.');
            fetchCategories();
        } catch (error: any) {
            alert(error.response?.data?.message || '삭제에 실패했습니다.');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>로딩 중...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFF' }}>카테고리 목록 ({categories.length})</h2>
                <button className="gold-button" onClick={() => { setShowForm(!showForm); setFormData({ id: '', name: '', description: '', color: '#CC8800', display_order: 0, is_active: true }); }}>
                    {showForm ? '취소' : '+ 카테고리 생성'}
                </button>
            </div>

            {showForm && (
                <div className="terminal-card" style={{ marginBottom: '16px', padding: '20px' }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', color: '#CC8800', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>카테고리 이름</label>
                                <input
                                    className="terminal-input"
                                    placeholder="예: 인사, 급여, 복지"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#CC8800', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>설명</label>
                                <input
                                    className="terminal-input"
                                    placeholder="카테고리에 대한 간단한 설명을 입력하세요"
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', color: '#CC8800', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>색상</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input
                                            type="color"
                                            value={formData.color || '#CC8800'}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            style={{ width: '60px', height: '40px', padding: '0', border: 'none', background: 'none', cursor: 'pointer' }}
                                        />
                                        <span style={{ color: '#999', fontSize: '12px' }}>목록에서 배지 색상으로 사용됩니다.</span>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#CC8800', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>표시 순서</label>
                                    <input
                                        className="terminal-input"
                                        type="number"
                                        placeholder="0"
                                        value={formData.display_order}
                                        onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                                        style={{ width: '100%' }}
                                    />
                                    <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>낮은 숫자가 목록의 상단에 표시됩니다.</p>
                                </div>
                            </div>

                            <div style={{ marginTop: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFF', cursor: 'pointer', width: 'fit-content' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        style={{ width: '16px', height: '16px', accentColor: '#CC8800' }}
                                    />
                                    <span style={{ fontWeight: '600' }}>활성화 상태</span>
                                </label>
                                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px', marginLeft: '24px' }}>
                                    체크 해제 시 사용자 화면에서 이 카테고리가 보이지 않습니다.
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="gold-button" style={{ padding: '10px 24px' }}>{formData.id ? '수정 완료' : '카테고리 생성'}</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gap: '12px' }}>
                {categories.map(cat => (
                    <div key={cat.id} className="terminal-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: cat.color }} />
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: '#FFF' }}>{cat.name}</div>
                                <div style={{ fontSize: '12px', color: '#999' }}>순서: {cat.display_order} | 사용: {cat._count.qna_entries}개 | {cat.is_active ? '활성' : '비활성'}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="gold-button" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => { setFormData({ ...cat, description: cat.description || '' }); setShowForm(true); }}>수정</button>
                            <button onClick={() => handleDelete(cat.id)} style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(255,0,0,0.1)', border: '1px solid #F00', color: '#F00', borderRadius: '4px', cursor: 'pointer' }}>삭제</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TagManagement: React.FC = () => {
    const [tags, setTags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTags = async () => {
        try {
            const response = await api.get('/admin/tags');
            setTags(response.data);
        } catch (error) {
            console.error('Failed to fetch tags', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('태그를 삭제하시겠습니까?')) return;
        try {
            await api.delete(`/admin/tags/${id}`);
            alert('삭제되었습니다.');
            fetchTags();
        } catch (error) {
            alert('삭제에 실패했습니다.');
        }
    };

    const [editingTag, setEditingTag] = useState<{ id: string, name: string } | null>(null);

    const handleUpdateTag = async () => {
        if (!editingTag || !editingTag.name.trim()) return;
        try {
            await api.patch(`/admin/tags/${editingTag.id}`, { name: editingTag.name });
            alert('태그가 수정되었습니다.');
            setEditingTag(null);
            fetchTags();
        } catch (error: any) {
            alert(error.response?.data?.message || '수정에 실패했습니다.');
        }
    };

    const [mergeSource, setMergeSource] = useState('');
    const [mergeTarget, setMergeTarget] = useState('');

    const handleMerge = async () => {
        if (!mergeSource || !mergeTarget) {
            alert('원본 태그와 대상 태그를 모두 선택해주세요.');
            return;
        }
        if (mergeSource === mergeTarget) {
            alert('원본과 대상이 같을 수 없습니다.');
            return;
        }
        if (!confirm(`'${tags.find(t => t.id === mergeSource)?.name}' 태그를 '${tags.find(t => t.id === mergeTarget)?.name}' 태그로 통합하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;

        try {
            await api.post('/admin/tags/merge', { sourceTagId: mergeSource, targetTagId: mergeTarget });
            alert('태그가 통합되었습니다.');
            setMergeSource('');
            setMergeTarget('');
            fetchTags();
        } catch (error: any) {
            alert(error.response?.data?.message || '태그 통합에 실패했습니다.');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>로딩 중...</div>;

    return (
        <div>
            <div style={{ marginBottom: '24px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid #333' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#CC8800', marginBottom: '16px' }}>태그 통합</h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', color: '#999', marginBottom: '8px', fontSize: '12px' }}>원본 태그 (삭제됨)</label>
                        <select
                            className="terminal-input"
                            style={{ width: '100%' }}
                            value={mergeSource}
                            onChange={(e) => setMergeSource(e.target.value)}
                        >
                            <option value="">선택하세요</option>
                            {tags.filter(t => t.id !== mergeTarget).map(tag => (
                                <option key={tag.id} value={tag.id}>{tag.name} ({tag._count.qna_entries})</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ paddingBottom: '12px', color: '#666' }}>→</div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', color: '#999', marginBottom: '8px', fontSize: '12px' }}>대상 태그 (유지됨)</label>
                        <select
                            className="terminal-input"
                            style={{ width: '100%' }}
                            value={mergeTarget}
                            onChange={(e) => setMergeTarget(e.target.value)}
                        >
                            <option value="">선택하세요</option>
                            {tags.filter(t => t.id !== mergeSource).map(tag => (
                                <option key={tag.id} value={tag.id}>{tag.name} ({tag._count.qna_entries})</option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="gold-button"
                        onClick={handleMerge}
                        disabled={!mergeSource || !mergeTarget}
                        style={{ opacity: (!mergeSource || !mergeTarget) ? 0.5 : 1, position: 'relative', zIndex: 10 }}
                    >
                        통합하기
                    </button>
                </div>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '12px' }}>
                    * 원본 태그가 붙은 모든 게시글이 대상 태그로 변경되며, 원본 태그는 삭제됩니다.
                </p>
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFF', marginBottom: '16px' }}>태그 목록 ({tags.length})</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
                {tags.map(tag => (
                    <div key={tag.id} className="terminal-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {editingTag && editingTag.id === tag.id ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                                <input
                                    className="terminal-input"
                                    value={editingTag.name}
                                    onChange={(e) => setEditingTag(prev => prev ? { ...prev, name: e.target.value } : null)}
                                    style={{ padding: '6px 12px', fontSize: '14px', flex: 1, width: 'auto' }}
                                    autoFocus
                                />
                                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                    <button
                                        className="gold-button"
                                        onClick={handleUpdateTag}
                                        style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <Check style={{ width: '12px', height: '12px' }} />
                                        저장
                                    </button>
                                    <button
                                        onClick={() => setEditingTag(null)}
                                        style={{ padding: '6px 12px', fontSize: '12px', background: 'transparent', border: '1px solid #666', color: '#999', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        취소
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#FFF' }}>{tag.name}</div>
                                    <div style={{ fontSize: '12px', color: '#999' }}>사용 횟수: {tag._count.qna_entries}회</div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => setEditingTag({ id: tag.id, name: tag.name })}
                                        className="gold-button"
                                        style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <Edit2 style={{ width: '12px', height: '12px' }} />
                                        수정
                                    </button>
                                    <button onClick={() => handleDelete(tag.id)} style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(255,0,0,0.1)', border: '1px solid #F00', color: '#F00', borderRadius: '4px', cursor: 'pointer' }}>삭제</button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const SystemStats: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/admin/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>로딩 중...</div>;

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="terminal-card" style={{ padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#CC8800', marginBottom: '8px' }}>{stats.totalQnA}</div>
                    <div style={{ fontSize: '14px', color: '#999' }}>총 Q&A</div>
                </div>
                <div className="terminal-card" style={{ padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#CC8800', marginBottom: '8px' }}>{stats.totalManuals}</div>
                    <div style={{ fontSize: '14px', color: '#999' }}>총 Manual</div>
                </div>
                <div className="terminal-card" style={{ padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#CC8800', marginBottom: '8px' }}>{stats.activeUsers}</div>
                    <div style={{ fontSize: '14px', color: '#999' }}>활성 사용자</div>
                </div>
            </div>

            <div className="terminal-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#CC8800', marginBottom: '16px' }}>최근 7일 활동</h3>
                {stats.recentActivity.length === 0 ? (
                    <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>최근 활동이 없습니다.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {stats.recentActivity.map((activity: any) => (
                            <div key={activity.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', borderLeft: '3px solid #CC8800' }}>
                                <div style={{ fontSize: '14px', color: '#FFF', marginBottom: '4px' }}>{activity.question_title}</div>
                                <div style={{ fontSize: '12px', color: '#999' }}>
                                    {activity.created_by.full_name} • {new Date(activity.created_at).toLocaleDateString('ko-KR')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="terminal-card" style={{ padding: '20px', marginTop: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#CC8800', marginBottom: '16px' }}>데이터 내보내기</h3>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button
                        className="gold-button"
                        onClick={async () => {
                            try {
                                const response = await api.get('/admin/export/qna', { responseType: 'blob' });
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', 'qna_export.csv');
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                            } catch (error) {
                                alert('다운로드에 실패했습니다.');
                            }
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Download style={{ width: '16px', height: '16px' }} />
                        Q&A 전체 다운로드 (CSV)
                    </button>
                    <button
                        className="gold-button"
                        onClick={async () => {
                            try {
                                const response = await api.get('/admin/export/manuals', { responseType: 'blob' });
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', 'manuals_export.csv');
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                            } catch (error) {
                                alert('다운로드에 실패했습니다.');
                            }
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Download style={{ width: '16px', height: '16px' }} />
                        매뉴얼 전체 다운로드 (CSV)
                    </button>
                </div>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '12px' }}>
                    * 모든 데이터가 CSV 형식으로 다운로드됩니다. 엑셀에서 열람 가능합니다.
                </p>
            </div>
        </div>
    );
};

export default AdminSettings;
