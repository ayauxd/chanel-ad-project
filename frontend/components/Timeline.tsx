'use client';

import { Plus, Copy, Trash2, GripVertical, Play, RotateCcw, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAdGeneratorStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { Shot } from '@/lib/types';

interface TimelineProps {
  className?: string;
}

export function Timeline({ className }: TimelineProps) {
  const {
    project,
    selectedShotId,
    selectShot,
    addShot,
    removeShot,
    duplicateShot,
    getTotalDuration,
  } = useAdGeneratorStore();

  const totalDuration = getTotalDuration();

  const getStatusIcon = (status: Shot['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="w-3 h-3 text-green-400" />;
      case 'generating':
        return <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      case 'queued':
        return <Loader2 className="w-3 h-3 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: Shot['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-950/30';
      case 'generating':
        return 'border-blue-500 bg-blue-950/30';
      case 'failed':
        return 'border-red-500 bg-red-950/30';
      case 'queued':
        return 'border-yellow-500 bg-yellow-950/30';
      default:
        return 'border-zinc-700 bg-zinc-900';
    }
  };

  return (
    <div className={cn('bg-zinc-900/50 border-t border-zinc-800', className)}>
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-zinc-300">Timeline</h3>
            <Badge variant="outline" className="text-xs text-zinc-400">
              {project.shots.length} shots • {totalDuration}s total
            </Badge>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addShot}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Shot
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add a new shot to the timeline</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Shot Cards */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {project.shots.map((shot) => (
            <div
              key={shot.id}
              onClick={() => selectShot(shot.id)}
              className={cn(
                'flex-shrink-0 w-40 rounded-lg border-2 transition-all cursor-pointer group',
                selectedShotId === shot.id
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : getStatusColor(shot.status),
                'hover:border-zinc-500'
              )}
            >
              {/* Thumbnail / Preview */}
              <div className="relative aspect-video bg-zinc-800 rounded-t-md overflow-hidden">
                {shot.thumbnailUrl || shot.generatedVideoUrl ? (
                  <img
                    src={shot.thumbnailUrl || shot.generatedVideoUrl}
                    alt={`Shot ${shot.order + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : shot.referenceImages.length > 0 ? (
                  <img
                    src={shot.referenceImages[0].preview}
                    alt="Reference"
                    className="w-full h-full object-cover opacity-50"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-zinc-600" />
                  </div>
                )}

                {/* Status indicator */}
                <div className="absolute top-1 right-1">
                  {getStatusIcon(shot.status)}
                </div>

                {/* Progress bar for generating */}
                {shot.status === 'generating' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${shot.progress}%` }}
                    />
                  </div>
                )}

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateShot(shot.id);
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Duplicate</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {project.shots.length > 1 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-400 hover:bg-red-500/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeShot(shot.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>

              {/* Shot Info */}
              <div className="p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-zinc-300">
                    Shot {shot.order + 1}
                  </span>
                  <span className="text-xs text-zinc-500">{shot.duration}s</span>
                </div>
                <p className="text-xs text-zinc-500 truncate">
                  {shot.prompt || 'No prompt yet'}
                </p>
              </div>
            </div>
          ))}

          {/* Add Shot Card */}
          <button
            onClick={addShot}
            className="flex-shrink-0 w-28 aspect-[4/3] rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-500 transition-colors flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs">Add Shot</span>
          </button>
        </div>

        {/* Time ruler */}
        <div className="mt-2 flex gap-2">
          {project.shots.map((shot, i) => (
            <div
              key={shot.id}
              className="flex-shrink-0 w-40"
            >
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    shot.status === 'completed'
                      ? 'bg-green-500'
                      : shot.status === 'generating'
                        ? 'bg-blue-500'
                        : 'bg-zinc-600'
                  )}
                  style={{
                    width: shot.status === 'generating' ? `${shot.progress}%` : shot.status === 'completed' ? '100%' : '0%'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
