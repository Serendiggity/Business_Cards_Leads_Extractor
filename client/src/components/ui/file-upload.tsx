import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CloudUpload, Plus, X } from 'lucide-react';

interface FileUploadProps {
  onUploadStarted?: (cardId: number) => void;
}

export function FileUpload({ onUploadStarted }: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Validate each file
      const validFiles = acceptedFiles.filter((file) => {
        // Check file type
        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/bmp',
        ];
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: 'Unsupported file type',
            description: `${file.name} is not supported. Please upload JPG, PNG, GIF, or BMP files.`,
            variant: 'destructive',
          });
          return false;
        }

        // Check file size (10MB limit)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          toast({
            title: 'File too large',
            description: `${file.name} is too large. Please upload files smaller than 10MB.`,
            variant: 'destructive',
          });
          return false;
        }

        return true;
      });

      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
      }
    },
    [toast],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/bmp': ['.bmp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('businessCard', file);

        const response = await fetch('/api/business-cards/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          onUploadStarted?.(result.id);
          setUploadProgress(((i + 1) / selectedFiles.length) * 100);

          toast({
            title: 'Upload Successful',
            description: `${file.name} has been uploaded and processing started.`,
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to upload ${file.name}`);
        }
      }

      setSelectedFiles([]);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description:
          'There was an error uploading your files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-primary'
        }`}
      >
        <input {...getInputProps()} />
        <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag & drop business card images here'}
        </p>
        <p className="text-xs text-gray-500 mb-4">or click to select files</p>
        <Button type="button" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Select Files
        </Button>
      </div>

      {/* File List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Selected Files</h4>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div className="flex items-center">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading files...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <Button onClick={uploadFiles} disabled={isUploading} className="w-full">
          {isUploading
            ? 'Uploading...'
            : `Upload ${selectedFiles.length} file(s)`}
        </Button>
      )}

      {/* File Type Info */}
      <div className="text-xs text-gray-500">
        <p>Supported formats: JPG, PNG, SVG, PDF</p>
        <p>Max file size: 10MB</p>
      </div>
    </div>
  );
}
