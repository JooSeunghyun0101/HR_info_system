import React, { useState } from 'react';

interface ReplyFormProps {
    onSubmit: (content: string) => Promise<void>;
    onCancel: () => void;
}

const ReplyForm: React.FC<ReplyFormProps> = ({ onSubmit, onCancel }) => {
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
            console.error('Failed to submit reply:', error);
            alert('답글 등록에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ marginTop: '12px' }}>
            <textarea
                className="terminal-input"
                style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '10px',
                    resize: 'vertical',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#e5e5e5',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                }}
                placeholder="답글을 입력하세요..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={submitting}
                autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                    type="submit"
                    className="gold-button"
                    style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        opacity: submitting ? 0.7 : 1,
                        cursor: submitting ? 'not-allowed' : 'pointer'
                    }}
                    disabled={submitting}
                >
                    {submitting ? '등록 중...' : '답글 등록'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        backgroundColor: '#333',
                        color: '#e5e5e5',
                        border: '1px solid #444',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                    disabled={submitting}
                >
                    취소
                </button>
            </div>
        </form>
    );
};

export default ReplyForm;
