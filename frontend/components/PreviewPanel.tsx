'use client';

import { useState, useRef } from 'react';
import {
  Play, Pause, Download, Share2, RotateCcw, Maximize2,
  Volume2, VolumeX, SkipBack, SkipForward
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useAdGeneratorStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface PreviewPanelProps {
  className?: string;
}

export function PreviewPanel({ className }: PreviewPanelProps) {
  const { project, getTotalDuration, getEstimatedCost } = useAdGeneratorStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const totalDuration = getTotalDuration();
  const estimatedCost = getEstimatedCost();
  const hasFinalVideo = !!project.finalVideoUrl;

  // Get completed shots for preview
  const completedShots = project.shots.filter(s => s.status === 'completed' && s.generatedVideoUrl);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (videoRef.current) {
      videoRef.current.volume = value[0];
    }
    setIsMuted(value[0] === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (project.finalVideoUrl) {
      const a = document.createElement('a');
      a.href = project.finalVideoUrl;
      a.download = `${project.name.replace(/\s+/g, '_')}.mp4`;
      a.click();
    }
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Video Preview Area */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        {hasFinalVideo ? (
          <video
            ref={videoRef}
            src={project.finalVideoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          />
        ) : completedShots.length > 0 ? (
          // Show first completed shot as preview
          <video
            src={completedShots[0].generatedVideoUrl}
            className="w-full h-full object-contain"
            controls
          />
        ) : (
          // Placeholder
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
            <Play className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-sm">Preview will appear here</p>
            <p className="text-xs text-zinc-600 mt-1">
              {project.shots.length} shot{project.shots.length !== 1 ? 's' : ''} • {totalDuration}s
            </p>
          </div>
        )}

        {/* Fullscreen button */}
        {(hasFinalVideo || completedShots.length > 0) && (
          <button
            onClick={() => videoRef.current?.requestFullscreen()}
            className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Video Controls */}
      {hasFinalVideo && (
        <div className="mt-3 space-y-2">
          {/* Progress bar */}
          <Slider
            value={[currentTime]}
            onValueChange={handleSeek}
            max={totalDuration}
            step={0.1}
            className="w-full"
          />

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
                className="h-8 w-8"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>

              <span className="text-xs text-zinc-400 font-mono">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-8 w-8"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.1}
                className="w-20"
              />
            </div>
          </div>
        </div>
      )}

      {/* Project Info */}
      <div className="mt-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-zinc-500">Total Duration</p>
            <p className="text-white font-medium">{totalDuration} seconds</p>
          </div>
          <div>
            <p className="text-zinc-500">Estimated Cost</p>
            <p className="text-white font-medium">${estimatedCost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-zinc-500">Shots</p>
            <p className="text-white font-medium">
              {completedShots.length}/{project.shots.length} generated
            </p>
          </div>
          <div>
            <p className="text-zinc-500">Voice</p>
            <p className="text-white font-medium">{project.voiceover.voiceName}</p>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="mt-4 space-y-2">
        <Button
          onClick={handleDownload}
          disabled={!hasFinalVideo}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Video
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" disabled={!hasFinalVideo}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Link
          </Button>
          <Button variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Regenerate All
          </Button>
        </div>
      </div>
    </div>
  );
}
