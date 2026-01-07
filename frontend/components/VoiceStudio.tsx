'use client';

import { useState } from 'react';
import { Play, Pause, Volume2, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdGeneratorStore } from '@/lib/store';
import { AVAILABLE_VOICES, COST_PER_CHARACTER_VOICE } from '@/lib/types';
import { cn } from '@/lib/utils';

interface VoiceStudioProps {
  className?: string;
}

export function VoiceStudio({ className }: VoiceStudioProps) {
  const { project, updateVoiceover, getTotalDuration } = useAdGeneratorStore();
  const { voiceover } = project;
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const totalDuration = getTotalDuration();
  const voiceCost = voiceover.script.length * COST_PER_CHARACTER_VOICE;
  const wordsPerSecond = 2.5; // Average speaking rate
  const estimatedDuration = (voiceover.script.split(/\s+/).length / wordsPerSecond);

  const selectedVoice = AVAILABLE_VOICES.find(v => v.id === voiceover.voiceId);

  const handleVoiceChange = (voiceId: string) => {
    const voice = AVAILABLE_VOICES.find(v => v.id === voiceId);
    if (voice) {
      updateVoiceover({ voiceId, voiceName: voice.name });
    }
  };

  const handlePreview = async () => {
    if (!voiceover.script.trim()) return;

    setIsGeneratingPreview(true);
    // In production, this would call the ElevenLabs API
    setTimeout(() => {
      setIsGeneratingPreview(false);
      setIsPreviewPlaying(true);
      // Simulate audio playing
      setTimeout(() => setIsPreviewPlaying(false), 3000);
    }, 1500);
  };

  const handleEnhanceScript = () => {
    // AI script enhancement - would call API in production
    const enhanced = voiceover.script.trim()
      ? voiceover.script + '\n\n[Brand Name]. [Tagline].'
      : 'Discover the art of timeless elegance.\n\nWhere tradition meets innovation.\n\nCrafted for those who appreciate the extraordinary.\n\n[Brand Name]. [Tagline].';
    updateVoiceover({ script: enhanced });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Voiceover</h3>
          <Badge variant="outline" className="text-zinc-400">
            ~${voiceCost.toFixed(3)}
          </Badge>
        </div>
        <Badge
          variant={voiceover.status === 'completed' ? 'default' : 'outline'}
          className={cn(
            voiceover.status === 'completed' && 'bg-green-600',
            voiceover.status === 'generating' && 'bg-blue-600 animate-pulse'
          )}
        >
          {voiceover.status}
        </Badge>
      </div>

      {/* Voice Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Voice</label>
        <Select value={voiceover.voiceId} onValueChange={handleVoiceChange}>
          <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_VOICES.map((voice) => (
              <SelectItem key={voice.id} value={voice.id}>
                <div className="flex flex-col">
                  <span>{voice.name}</span>
                  <span className="text-xs text-zinc-500">{voice.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedVoice && (
          <p className="text-xs text-zinc-500">{selectedVoice.description}</p>
        )}
      </div>

      {/* Script Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-300">Script</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEnhanceScript}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            <Wand2 className="w-3 h-3 mr-1" />
            Enhance
          </Button>
        </div>
        <Textarea
          value={voiceover.script}
          onChange={(e) => updateVoiceover({ script: e.target.value })}
          placeholder="Write your voiceover script here. Aim for about 2.5 words per second of video..."
          className="min-h-[150px] bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 resize-none"
        />
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{voiceover.script.length} characters • {voiceover.script.split(/\s+/).filter(Boolean).length} words</span>
          <span>
            Est. {estimatedDuration.toFixed(1)}s / {totalDuration}s video
            {estimatedDuration > totalDuration && (
              <span className="text-yellow-500 ml-1">(too long!)</span>
            )}
          </span>
        </div>
      </div>

      {/* Voice Settings */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <h4 className="text-sm font-medium text-zinc-300">Voice Settings</h4>

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400">Stability</label>
              <span className="text-xs text-zinc-500">{(voiceover.stability * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[voiceover.stability]}
              onValueChange={([v]) => updateVoiceover({ stability: v })}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
            <p className="text-xs text-zinc-600">Higher = more consistent, Lower = more expressive</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400">Clarity</label>
              <span className="text-xs text-zinc-500">{(voiceover.similarityBoost * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[voiceover.similarityBoost]}
              onValueChange={([v]) => updateVoiceover({ similarityBoost: v })}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400">Style</label>
              <span className="text-xs text-zinc-500">{(voiceover.style * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[voiceover.style]}
              onValueChange={([v]) => updateVoiceover({ style: v })}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
            <p className="text-xs text-zinc-600">Higher = more dramatic delivery</p>
          </div>
        </div>
      </div>

      {/* Preview Button */}
      <Button
        onClick={handlePreview}
        disabled={!voiceover.script.trim() || isGeneratingPreview}
        className="w-full"
        variant="outline"
      >
        {isGeneratingPreview ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating Preview...
          </>
        ) : isPreviewPlaying ? (
          <>
            <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
            Playing...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Preview Voice
          </>
        )}
      </Button>

      {/* Generated Audio */}
      {voiceover.generatedAudioUrl && (
        <div className="pt-4 border-t border-zinc-800">
          <label className="text-sm font-medium text-zinc-300 mb-2 block">Generated Audio</label>
          <audio
            src={voiceover.generatedAudioUrl}
            controls
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
