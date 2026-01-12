import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

interface CommentData {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
    created_by: {
        id: string;
        full_name: string;
    };
    updated_by?: {
        id: string;
        full_name: string;
    };
    replies?: CommentData[];
}

interface CommentSectionProps {
    entityType: 'qna' | 'manual';
    entityId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ entityType, entityId }) => {
    const [comments, setComments] = useState<CommentData[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();

    useEffect(() => {
        if (entityId) {
            fetchComments();
        }
    }, [entityId]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/comments/${entityType}/${entityId}`);
            setComments(response.data);
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (content: string, parentId?: string) => {
        try {
            await api.post('/comments', {
                content,
                entity_type: entityType,
                entity_id: entityId,
                parent_id: parentId || null
            });
            await fetchComments(); // Refresh comments
        } catch (error) {
            console.error('Failed to create comment:', error);
            throw error;
        }
    };

    const handleUpdate = async (id: string, content: string) => {
        try {
            await api.put(`/comments/${id}`, { content });
            await fetchComments(); // Refresh comments
        } catch (error) {
            console.error('Failed to update comment:', error);
            alert('댓글 수정에 실패했습니다.');
            throw error;
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/comments/${id}`);
            await fetchComments(); // Refresh comments
        } catch (error) {
            console.error('Failed to delete comment:', error);
            alert('댓글 삭제에 실패했습니다.');
            throw error;
        }
    };

    return (
        <div style={{ marginTop: '24px', borderTop: '1px solid #333', paddingTop: '24px' }}>
            <h3
                style={{
                    fontSize: '16px',
                    color: '#FFB800',
                    marginBottom: '16px',
                    fontWeight: '600'
                }}
            >
                댓글 ({comments.length})
            </h3>

            {/* Comment Form */}
            <CommentForm onSubmit={(content) => handleCreate(content)} />

            {/* Comments List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    로딩 중...
                </div>
            ) : comments.length === 0 ? (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: '#999',
                        fontSize: '14px'
                    }}
                >
                    아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
                </div>
            ) : (
                <div>
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            currentUserId={user?.id || ''}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            onReply={handleCreate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentSection;
