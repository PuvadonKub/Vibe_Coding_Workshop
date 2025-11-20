import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value?: string[];
  onChange: (value: string[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  className?: string;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value = [],
  onChange,
  maxFiles = 5,
  maxFileSize = 5,
  className,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const response = await fetch('/api/upload/image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    const data = await response.json();
    return data.filename;
  };

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    
    // Check file count
    if (value.length + fileArray.length > maxFiles) {
      toast({
        variant: 'destructive',
        title: 'Too many files',
        description: `Maximum ${maxFiles} images allowed`
      });
      return;
    }

    // Validate files
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Please select only image files'
        });
        return;
      }

      if (file.size > maxFileSize * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `Please select images smaller than ${maxFileSize}MB`
        });
        return;
      }
    }

    setUploading(true);
    try {
      const uploadPromises = fileArray.map(uploadImage);
      const filenames = await Promise.all(uploadPromises);
      onChange([...value, ...filenames]);
      toast({
        title: 'Upload successful',
        description: `${filenames.length} image(s) uploaded`
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload images'
      });
    } finally {
      setUploading(false);
    }
  }, [value, onChange, maxFiles, maxFileSize, disabled, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeImage = async (filename: string) => {
    if (disabled) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/upload/images/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      onChange(value.filter(img => img !== filename));
      toast({
        title: 'Image removed',
        description: 'Image has been deleted'
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: 'Failed to delete image'
      });
    }
  };

  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors cursor-pointer hover:border-primary/50',
          dragOver && 'border-primary bg-primary/5',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 px-4">
          <Upload className={cn(
            'h-8 w-8 mb-4 text-muted-foreground',
            uploading && 'animate-pulse'
          )} />
          <p className="text-sm text-center text-muted-foreground mb-2">
            {uploading ? 'Uploading...' : 'Drag and drop images here, or click to select'}
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum {maxFiles} images, up to {maxFileSize}MB each
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            disabled={disabled || uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Select Images
          </Button>
        </CardContent>
      </Card>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {value.map((filename) => (
            <div key={filename} className="relative group">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                <img
                  src={`/api/upload/images/${filename}?size=thumbnail`}
                  alt="Product image"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              
              {!disabled && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(filename)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* File count info */}
      <div className="text-xs text-muted-foreground">
        {value.length} of {maxFiles} images uploaded
      </div>
    </div>
  );
};

export default ImageUpload;