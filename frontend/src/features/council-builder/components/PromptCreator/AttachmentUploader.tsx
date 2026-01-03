import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { extractPdfText } from '@/lib/pdfExtract';
import { useAuthStore } from '@/store';
import type { PromptAttachment } from '@/types';

interface AttachmentUploaderProps {
  attachments: PromptAttachment[];
  onAttach: (attachment: PromptAttachment) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/markdown': 'md',
};

export function AttachmentUploader({
  attachments,
  onAttach,
  onRemove,
  disabled = false,
}: AttachmentUploaderProps) {
  const { user } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;

    setError(null);
    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
          setError(`Unsupported file type: ${file.type}. Use images or PDFs.`);
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          setError(`File too large: ${file.name}. Maximum size is 50MB.`);
          continue;
        }

        // Generate unique filename
        const fileId = crypto.randomUUID();
        const ext = ACCEPTED_TYPES[file.type as keyof typeof ACCEPTED_TYPES];
        const storagePath = `${user.id}/${fileId}.${ext}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('prompt-attachments')
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          setError(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('prompt-attachments')
          .getPublicUrl(storagePath);

        // Extract text from PDFs and text files so all models can access content
        let extractedText: string | undefined;
        if (file.type === 'application/pdf') {
          try {
            setUploadStatus('Extracting PDF text...');
            const text = await extractPdfText(file, (status) => {
              setUploadStatus(status);
            });
            // Only set if we actually got text
            if (text && text.length > 0) {
              extractedText = text;
              console.log(`[AttachmentUploader] PDF extraction successful: ${text.length} chars`);
            } else {
              console.log(`[AttachmentUploader] PDF extraction returned no text`);
            }
          } catch (err) {
            console.error('PDF text extraction failed:', err);
          }
          setUploadStatus('');
        } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
          // Read text files directly
          try {
            setUploadStatus('Reading text file...');
            extractedText = await file.text();
            console.log(`[AttachmentUploader] Text file read: ${extractedText.length} chars`);
          } catch (err) {
            console.error('Text file read failed:', err);
          }
          setUploadStatus('');
        }

        // Determine attachment type
        const getAttachmentType = (mimeType: string): 'image' | 'pdf' | 'text' => {
          if (mimeType === 'application/pdf') return 'pdf';
          if (mimeType === 'text/plain' || mimeType === 'text/markdown') return 'text';
          return 'image';
        };

        // Create attachment object
        const attachment: PromptAttachment = {
          id: fileId,
          type: getAttachmentType(file.type),
          filename: file.name,
          storage_path: storagePath,
          public_url: urlData.publicUrl,
          mime_type: file.type,
          size_bytes: file.size,
          extracted_text: extractedText,
        };

        onAttach(attachment);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [user, onAttach]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleRemove = async (attachment: PromptAttachment) => {
    try {
      // Delete from storage
      await supabase.storage
        .from('prompt-attachments')
        .remove([attachment.storage_path]);
    } catch (err) {
      console.error('Failed to delete from storage:', err);
    }
    onRemove(attachment.id);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          relative p-4 rounded-lg border-2 border-dashed
          transition-colors cursor-pointer
          ${dragActive
            ? 'border-accent bg-accent/10'
            : 'border-border hover:border-accent/50 hover:bg-bg-secondary'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={`${Object.keys(ACCEPTED_TYPES).join(',')},.txt,.md`}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-2 text-center">
          {isUploading ? (
            <>
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
              <span className="text-sm text-text-secondary">
                {uploadStatus || 'Uploading...'}
              </span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-text-muted" />
              <div>
                <span className="text-sm text-text-secondary">
                  Drop files here or{' '}
                  <span className="text-accent font-medium">browse</span>
                </span>
                <p className="text-xs text-text-muted mt-1">
                  Images, PDFs, or text files (.txt, .md) up to 50MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Attachment List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-bg-secondary border border-border"
            >
              {/* Thumbnail/Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded bg-bg-tertiary flex items-center justify-center overflow-hidden">
                {attachment.type === 'image' ? (
                  <img
                    src={attachment.public_url}
                    alt={attachment.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="w-5 h-5 text-text-muted" />
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">
                  {attachment.filename}
                </p>
                <p className="text-xs text-text-muted">
                  {attachment.type === 'image' ? (
                    <span className="inline-flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      Image
                    </span>
                  ) : attachment.type === 'text' ? (
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Text
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      PDF
                    </span>
                  )}
                  {' '}• {formatFileSize(attachment.size_bytes)}
                  {/* Show extraction status for PDFs and text files */}
                  {(attachment.type === 'pdf' || attachment.type === 'text') && (
                    attachment.extracted_text ? (
                      <span className="inline-flex items-center gap-1 ml-2 text-green-500">
                        <CheckCircle className="w-3 h-3" />
                        {attachment.extracted_text.length.toLocaleString()} chars
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 ml-2 text-amber-500">
                        <AlertCircle className="w-3 h-3" />
                        No text extracted
                      </span>
                    )
                  )}
                </p>
              </div>

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(attachment);
                }}
                className="p-1.5 rounded hover:bg-red-500/10 transition-colors"
                title="Remove attachment"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
