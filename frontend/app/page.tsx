'use client';

import { useState } from 'react';
import { Film, Sparkles, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShotEditor } from '@/components/ShotEditor';
import { Timeline } from '@/components/Timeline';
import { ProgressPipeline } from '@/components/ProgressPipeline';
import { VoiceStudio } from '@/components/VoiceStudio';
import { PreviewPanel } from '@/components/PreviewPanel';
import { BrandSettings } from '@/components/BrandSettings';
import { useAdGeneratorStore } from '@/lib/store';

export default function AdGenerator() {
  const {
    project,
    selectedShotId,
    selectShot,
    generationProgress,
    getEstimatedCost,
    getTotalDuration,
    setGenerationProgress,
    setShotStatus,
  } = useAdGeneratorStore();

  const [activeTab, setActiveTab] = useState<'shots' | 'voice'>('shots');

  const selectedShot = project.shots.find(s => s.id === selectedShotId);
  const estimatedCost = getEstimatedCost();
  const totalDuration = getTotalDuration();

  // Select first shot if none selected
  if (!selectedShotId && project.shots.length > 0) {
    selectShot(project.shots[0].id);
  }

  const handleGenerateAll = async () => {
    // Simulate generation process
    setGenerationProgress({
      stage: 'generating_shots',
      message: 'Starting video generation...',
      currentShot: 1,
      totalShots: project.shots.length,
    });

    // In production, this would call the API
    for (let i = 0; i < project.shots.length; i++) {
      const shot = project.shots[i];
      setShotStatus(shot.id, 'generating', 0);
      setGenerationProgress({
        currentShot: i + 1,
        message: `Generating shot ${i + 1} of ${project.shots.length}...`,
        shotProgress: 0,
      });

      // Simulate progress
      for (let p = 0; p <= 100; p += 10) {
        await new Promise(r => setTimeout(r, 200));
        setShotStatus(shot.id, 'generating', p);
        setGenerationProgress({ shotProgress: p });
      }

      setShotStatus(shot.id, 'completed', 100);
    }

    setGenerationProgress({
      stage: 'generating_voice',
      message: 'Generating voiceover...',
    });

    await new Promise(r => setTimeout(r, 2000));

    setGenerationProgress({
      stage: 'assembling',
      message: 'Assembling final video...',
    });

    await new Promise(r => setTimeout(r, 2000));

    setGenerationProgress({
      stage: 'completed',
      message: 'Your ad is ready!',
    });
  };

  const isGenerating = ['uploading', 'generating_shots', 'generating_voice', 'assembling'].includes(generationProgress.stage);

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-white">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-lg">AdStudio</span>
            </div>
            <div className="h-6 w-px bg-zinc-700" />
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-sm">{project.name}</span>
              <BrandSettings />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Clock className="w-4 h-4" />
                <span>{totalDuration}s</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <DollarSign className="w-4 h-4" />
                <span>${estimatedCost.toFixed(2)}</span>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateAll}
              disabled={isGenerating || project.shots.every(s => !s.prompt)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Ad
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Editor */}
        <div className="w-[400px] flex-shrink-0 border-r border-zinc-800 flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'shots' | 'voice')} className="flex-1 flex flex-col">
            <TabsList className="flex-shrink-0 w-full justify-start rounded-none border-b border-zinc-800 bg-transparent h-12 px-4">
              <TabsTrigger
                value="shots"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white rounded-lg"
              >
                Shots
                <Badge variant="secondary" className="ml-2 text-xs">
                  {project.shots.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="voice"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white rounded-lg"
              >
                Voice
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="shots" className="p-4 m-0 data-[state=inactive]:hidden">
                {selectedShot ? (
                  <ShotEditor shot={selectedShot} />
                ) : (
                  <div className="text-center text-zinc-500 py-8">
                    <p>Select a shot from the timeline</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="voice" className="p-4 m-0 data-[state=inactive]:hidden">
                <VoiceStudio />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Center - Preview & Progress */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Preview Area */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Progress Pipeline */}
              <ProgressPipeline />

              {/* Preview Panel */}
              <PreviewPanel />
            </div>
          </div>

          {/* Timeline */}
          <Timeline />
        </div>
      </div>
    </div>
  );
}
