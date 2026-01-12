import React, { useState } from 'react';

interface CommentFormProps {
    onSubmit: (content: string) => Promise<void>;
    placeholder?: string;
}

const CommentForm: React.FC<CommentFormProps> = ({
    onSubmit,
    placeholder = '댓글을 입력하세요...'
}) => {
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || submitting) return;

        setSubmitting(true);
        try {
            await onSubmit(content);
            setContent('');
        } catch (error) {
            console.error('Failed to submit comment:', error);
            alert('댓글 등록에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ marginBottom: '16px' }}>
            <textarea
                className="terminal-input"
                style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '12px',
                    resize: 'vertical',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#e5e5e5',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                }}
                placeholder={placeholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={submitting}
            />
            <button
                type="submit"
                className="gold-button"
                style={{
                    marginTop: '8px',
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? 'not-allowed' : 'pointer'
                }}
                disabled={submitting}
            >
                {submitting ? '등록 중...' : '댓글 등록'}
            </button>
        </form>
    );
};

export default CommentForm;
