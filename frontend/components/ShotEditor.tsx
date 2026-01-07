'use client';

import { useState } from 'react';
import {
  Wand2, ChevronDown, ChevronUp, Sparkles, Clock, Monitor, Ratio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ImageDropzone, SingleFrameDropzone } from './ImageDropzone';
import { useAdGeneratorStore } from '@/lib/store';
import type { Shot, Duration, Resolution, AspectRatio, UploadedImage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { COST_PER_SECOND_720P, COST_PER_SECOND_1080P } from '@/lib/types';

interface ShotEditorProps {
  shot: Shot;
  className?: string;
}

export function ShotEditor({ shot, className }: ShotEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { updateShot, addImageToShot, removeImageFromShot, setFirstFrame, setLastFrame } = useAdGeneratorStore();

  const shotCost = shot.duration * (shot.resolution === '1080p' ? COST_PER_SECOND_1080P : COST_PER_SECOND_720P);

  const handlePromptEnhance = () => {
    // AI prompt enhancement - would call API in production
    const enhanced = shot.prompt + ' Cinematic lighting, professional photography, 8K quality, shallow depth of field.';
    updateShot(shot.id, { prompt: enhanced });
  };

  const handleImagesAdd = (images: UploadedImage[]) => {
    images.forEach(img => addImageToShot(shot.id, img));
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Shot {shot.order + 1}</h3>
          <Badge
            variant={shot.status === 'completed' ? 'default' : shot.status === 'generating' ? 'secondary' : 'outline'}
            className={cn(
              shot.status === 'completed' && 'bg-green-600',
              shot.status === 'generating' && 'bg-blue-600 animate-pulse',
              shot.status === 'failed' && 'bg-red-600'
            )}
          >
            {shot.status}
          </Badge>
        </div>
        <Badge variant="outline" className="text-zinc-400">
          ~${shotCost.toFixed(2)}
        </Badge>
      </div>

      {/* Main Prompt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-300">Prompt</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePromptEnhance}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            <Wand2 className="w-3 h-3 mr-1" />
            Enhance
          </Button>
        </div>
        <Textarea
          value={shot.prompt}
          onChange={(e) => updateShot(shot.id, { prompt: e.target.value })}
          placeholder="Describe what you want to see in this shot. Be specific about mood, lighting, camera movement, and style..."
          className="min-h-[120px] bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 resize-none"
        />
        <p className="text-xs text-zinc-500">
          {shot.prompt.length} characters • Be descriptive for best results
        </p>
      </div>

      {/* Quick Settings */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Duration
          </label>
          <Select
            value={String(shot.duration)}
            onValueChange={(v) => updateShot(shot.id, { duration: Number(v) as Duration })}
          >
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4" disabled={shot.resolution === '1080p'}>4 seconds</SelectItem>
              <SelectItem value="6" disabled={shot.resolution === '1080p'}>6 seconds</SelectItem>
              <SelectItem value="8">8 seconds</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
            <Monitor className="w-3 h-3" /> Quality
          </label>
          <Select
            value={shot.resolution}
            onValueChange={(v) => {
              const resolution = v as Resolution;
              // 1080p requires 8s duration
              const duration = resolution === '1080p' ? 8 : shot.duration;
              updateShot(shot.id, { resolution, duration });
            }}
          >
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="720p">720p HD</SelectItem>
              <SelectItem value="1080p">1080p Full HD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
            <Ratio className="w-3 h-3" /> Aspect
          </label>
          <Select
            value={shot.aspectRatio}
            onValueChange={(v) => updateShot(shot.id, { aspectRatio: v as AspectRatio })}
          >
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">16:9 Landscape</SelectItem>
              <SelectItem value="9:16">9:16 Portrait</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reference Images */}
      <ImageDropzone
        images={shot.referenceImages}
        onImagesAdd={handleImagesAdd}
        onImageRemove={(imageId) => removeImageFromShot(shot.id, imageId)}
        maxImages={3}
        label="Reference Images (Optional)"
        hint="Add up to 3 images to guide the style"
        compact
      />

      {/* Advanced Options */}
      <div className="border-t border-zinc-800 pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Advanced Options
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            {/* First/Last Frame */}
            <div className="grid grid-cols-2 gap-4">
              <SingleFrameDropzone
                image={shot.firstFrame}
                onImageSet={(img) => setFirstFrame(shot.id, img)}
                label="First Frame (Start)"
              />
              <SingleFrameDropzone
                image={shot.lastFrame}
                onImageSet={(img) => setLastFrame(shot.id, img)}
                label="Last Frame (End)"
              />
            </div>

            {/* Negative Prompt */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Negative Prompt</label>
              <Input
                value={shot.negativePrompt}
                onChange={(e) => updateShot(shot.id, { negativePrompt: e.target.value })}
                placeholder="Elements to avoid..."
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
              />
              <p className="text-xs text-zinc-500">
                Describe what you DON&apos;T want in the video
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Generation Preview/Status */}
      {shot.generatedVideoUrl && (
        <div className="border-t border-zinc-800 pt-4">
          <label className="text-sm font-medium text-zinc-300 mb-2 block">Generated Preview</label>
          <video
            src={shot.generatedVideoUrl}
            controls
            className="w-full rounded-lg border border-zinc-700"
          />
        </div>
      )}

      {shot.status === 'generating' && (
        <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-300">Generating video...</p>
              <div className="w-full bg-blue-900/50 rounded-full h-1.5 mt-2">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${shot.progress}%` }}
                />
              </div>
            </div>
            <span className="text-sm text-blue-400">{shot.progress}%</span>
          </div>
        </div>
      )}

      {shot.status === 'failed' && shot.error && (
        <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-4">
          <p className="text-sm text-red-300">{shot.error}</p>
        </div>
      )}
    </div>
  );
}
