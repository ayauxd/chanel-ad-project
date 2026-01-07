'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UploadedImage } from '@/lib/types';

interface ImageDropzoneProps {
  images: UploadedImage[];
  onImagesAdd: (images: UploadedImage[]) => void;
  onImageRemove: (imageId: string) => void;
  maxImages?: number;
  label?: string;
  hint?: string;
  className?: string;
  compact?: boolean;
}

export function ImageDropzone({
  images,
  onImagesAdd,
  onImageRemove,
  maxImages = 3,
  label = 'Reference Images',
  hint = 'Drag & drop images to guide the AI',
  className,
  compact = false,
}: ImageDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const remainingSlots = maxImages - images.length;
    const filesToAdd = acceptedFiles.slice(0, remainingSlots);

    const newImages: UploadedImage[] = filesToAdd.map(file => ({
      id: uuidv4(),
      file,
      preview: URL.createObjectURL(file),
      type: 'reference',
    }));

    onImagesAdd(newImages);
  }, [images.length, maxImages, onImagesAdd]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    disabled: images.length >= maxImages,
  });

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-zinc-300">{label}</label>

      {/* Uploaded Images */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group w-16 h-16 rounded-lg overflow-hidden border border-zinc-700"
            >
              <img
                src={image.preview}
                alt="Reference"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onImageRemove(image.id)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg transition-colors cursor-pointer',
            isDragActive
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50',
            compact ? 'p-3' : 'p-6'
          )}
        >
          <input {...getInputProps()} />
          <div className={cn(
            'flex items-center gap-3',
            compact ? 'flex-row' : 'flex-col text-center'
          )}>
            <div className={cn(
              'rounded-full bg-zinc-800 flex items-center justify-center',
              compact ? 'w-8 h-8' : 'w-12 h-12'
            )}>
              {isDragActive ? (
                <ImageIcon className={cn('text-blue-400', compact ? 'w-4 h-4' : 'w-6 h-6')} />
              ) : (
                <Upload className={cn('text-zinc-400', compact ? 'w-4 h-4' : 'w-6 h-6')} />
              )}
            </div>
            <div className={compact ? 'text-left' : ''}>
              <p className={cn('text-zinc-300', compact ? 'text-xs' : 'text-sm')}>
                {isDragActive ? 'Drop images here' : hint}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {images.length}/{maxImages} images • PNG, JPG, WebP
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Single frame dropzone (for first/last frame)
interface SingleFrameDropzoneProps {
  image?: UploadedImage;
  onImageSet: (image: UploadedImage | undefined) => void;
  label: string;
  className?: string;
}

export function SingleFrameDropzone({
  image,
  onImageSet,
  label,
  className,
}: SingleFrameDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const newImage: UploadedImage = {
      id: uuidv4(),
      file,
      preview: URL.createObjectURL(file),
      type: 'first_frame',
    };

    onImageSet(newImage);
  }, [onImageSet]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
  });

  return (
    <div className={cn('space-y-1', className)}>
      <label className="text-xs font-medium text-zinc-400">{label}</label>

      {image ? (
        <div className="relative group w-full aspect-video rounded-lg overflow-hidden border border-zinc-700">
          <img
            src={image.preview}
            alt={label}
            className="w-full h-full object-cover"
          />
          <button
            onClick={() => onImageSet(undefined)}
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'w-full aspect-video border-2 border-dashed rounded-lg transition-colors cursor-pointer flex items-center justify-center',
            isDragActive
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50'
          )}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <ImageIcon className="w-5 h-5 text-zinc-500 mx-auto mb-1" />
            <p className="text-xs text-zinc-500">
              {isDragActive ? 'Drop' : 'Add frame'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
