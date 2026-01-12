import React, { useState } from 'react';
import { format } from 'date-fns';
import { useAuthStore } from '../../lib/store';
import ReplyForm from './ReplyForm';

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

interface CommentItemProps {
    comment: CommentData;
    currentUserId: string;
    onUpdate: (id: string, content: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onReply: (content: string, parentId: string) => Promise<void>;
    isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
    comment,
    currentUserId,
    onUpdate,
    onDelete,
    onReply,
    isReply = false
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const { user } = useAuthStore();

    const isAuthor = comment.created_by.id === currentUserId;
    const isAdmin = user?.role && ['admin', 'hr_staff'].includes(user.role);
    const canDelete = isAuthor || isAdmin;
    const isEdited = comment.updated_at !== comment.created_at;

    const handleUpdate = async () => {
        if (!editContent.trim()) return;

        try {
            await onUpdate(comment.id, editContent);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update comment:', error);
        }
    };

    const handleDelete = async () => {
        if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

        try {
            await onDelete(comment.id);
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    const handleReplySubmit = async (content: string) => {
        await onReply(content, comment.id);
        setIsReplying(false);
    };

    return (
        <div
            style={{
                padding: '12px',
                backgroundColor: isReply ? '#1a1a1a' : '#222',
                border: '1px solid #333',
                borderRadius: '6px',
                marginLeft: isReply ? '40px' : '0',
                marginBottom: '12px'
            }}
        >
            {/* Header with author and timestamp */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    alignItems: 'center'
                }}
            >
                <div style={{ fontSize: '13px', color: '#999' }}>
                    <span style={{ color: '#FFB800', fontWeight: '500' }}>
                        {comment.created_by.full_name}
                    </span>
                    <span style={{ marginLeft: '8px' }}>
                        {format(new Date(comment.created_at), 'yyyy-MM-dd HH:mm')}
                    </span>
                    {isEdited && (
                        <span style={{ marginLeft: '8px', fontStyle: 'italic', fontSize: '12px' }}>
                            (수정됨)
                        </span>
                    )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    {!isReply && (
                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                backgroundColor: 'transparent',
                                color: '#FFB800',
                                border: '1px solid #FFB800',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            답글
                        </button>
                    )}
                    {isAuthor && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                backgroundColor: 'transparent',
                                color: '#999',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            수정
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={handleDelete}
                            style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                backgroundColor: 'transparent',
                                color: '#ff6b6b',
                                border: '1px solid #ff6b6b',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            삭제
                        </button>
                    )}
                </div>
            </div>

            {/* Content or Edit Form */}
            {isEditing ? (
                <div>
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        style={{
                            width: '100%',
                            minHeight: '60px',
                            padding: '10px',
                            backgroundColor: '#0a0a0a',
                            border: '1px solid #333',
                            borderRadius: '6px',
                            color: '#e5e5e5',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button
                            onClick={handleUpdate}
                            className="gold-button"
                            style={{
                                padding: '6px 12px',
                                fontSize: '13px'
                            }}
                        >
                            저장
                        </button>
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setEditContent(comment.content);
                            }}
                            style={{
                                padding: '6px 12px',
                                fontSize: '13px',
                                backgroundColor: '#333',
                                color: '#e5e5e5',
                                border: '1px solid #444',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            취소
                        </button>
                    </div>
                </div>
            ) : (
                <p
                    style={{
                        color: '#e5e5e5',
                        lineHeight: '1.6',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }}
                >
                    {comment.content}
                </p>
            )}

            {/* Reply Form */}
            {isReplying && (
                <ReplyForm
                    onSubmit={handleReplySubmit}
                    onCancel={() => setIsReplying(false)}
                />
            )}

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            currentUserId={currentUserId}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            onReply={onReply}
                            isReply={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentItem;
