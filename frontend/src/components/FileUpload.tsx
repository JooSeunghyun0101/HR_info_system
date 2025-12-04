
import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Upload, FileText, Download, Trash2 } from 'lucide-react';

interface Attachment {
    id: string;
    file_name: string;
    file_size: number;
    created_at: string;
}

interface FileUploadProps {
    entityType: 'qna' | 'manual';
    entityId: string;
    readOnly?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ entityType, entityId, readOnly = false }) => {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (entityId) {
            fetchAttachments();
        }
    }, [entityId]);

    const fetchAttachments = async () => {
        try {
            const response = await api.get(`/upload/${entityType}/${entityId}`);
            setAttachments(response.data);
        } catch (error) {
            console.error('Failed to fetch attachments', error);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', entityType);
        formData.append('entityId', entityId);

        setUploading(true);
        try {
            await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            fetchAttachments();
        } catch (error) {
            console.error('Upload failed', error);
            alert('파일 업로드에 실패했습니다.');
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말로 이 파일을 삭제하시겠습니까?')) return;

        try {
            await api.delete(`/upload/${id}`);
            fetchAttachments();
        } catch (error) {
            console.error('Delete failed', error);
            alert('파일 삭제에 실패했습니다.');
        }
    };

    const handleDownload = async (id: string, fileName: string) => {
        try {
            const response = await api.get(`/upload/download/${id}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download failed', error);
            alert('다운로드에 실패했습니다.');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>첨부 파일</h3>

            {!readOnly && (
                <div style={{ marginBottom: '12px' }}>
                    <input
                        type="file"
                        id={`file-upload-${entityId}`}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                    <label
                        htmlFor={`file-upload-${entityId}`}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            backgroundColor: '#222',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            color: '#e5e5e5',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            fontSize: '13px'
                        }}
                    >
                        <Upload style={{ width: '14px', height: '14px' }} />
                        {uploading ? '업로드 중...' : '파일 추가'}
                    </label>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {attachments.map((file) => (
                    <div
                        key={file.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '4px'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                            <FileText style={{ width: '16px', height: '16px', color: '#FFB800', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', color: '#e5e5e5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {file.file_name}
                            </span>
                            <span style={{ fontSize: '11px', color: '#666', flexShrink: 0 }}>
                                ({formatFileSize(file.file_size)})
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <button
                                onClick={() => handleDownload(file.id, file.file_name)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '4px' }}
                                title="다운로드"
                            >
                                <Download style={{ width: '14px', height: '14px' }} />
                            </button>
                            {!readOnly && (
                                <button
                                    onClick={() => handleDelete(file.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4444', padding: '4px' }}
                                    title="삭제"
                                >
                                    <Trash2 style={{ width: '14px', height: '14px' }} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {attachments.length === 0 && (
                    <div style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                        첨부된 파일이 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
