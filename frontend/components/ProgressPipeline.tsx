'use client';

import { Upload, Video, Mic, Film, CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAdGeneratorStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface ProgressPipelineProps {
  className?: string;
}

type Stage = 'idle' | 'uploading' | 'generating_shots' | 'generating_voice' | 'assembling' | 'completed' | 'failed';

interface PipelineStage {
  id: Stage;
  label: string;
  icon: React.ReactNode;
}

const STAGES: PipelineStage[] = [
  { id: 'uploading', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
  { id: 'generating_shots', label: 'Video', icon: <Video className="w-4 h-4" /> },
  { id: 'generating_voice', label: 'Voice', icon: <Mic className="w-4 h-4" /> },
  { id: 'assembling', label: 'Assemble', icon: <Film className="w-4 h-4" /> },
];

export function ProgressPipeline({ className }: ProgressPipelineProps) {
  const { generationProgress, project } = useAdGeneratorStore();
  const { stage, currentShot, totalShots, shotProgress, message, eta } = generationProgress;

  const getStageStatus = (stageId: Stage): 'pending' | 'active' | 'completed' | 'failed' => {
    if (stage === 'failed') {
      const stageIndex = STAGES.findIndex(s => s.id === stageId);
      const currentIndex = STAGES.findIndex(s => s.id === stage);
      if (stageIndex <= currentIndex) return 'failed';
      return 'pending';
    }

    if (stage === 'completed') return 'completed';
    if (stage === 'idle') return 'pending';

    const stageOrder: Stage[] = ['uploading', 'generating_shots', 'generating_voice', 'assembling'];
    const currentIndex = stageOrder.indexOf(stage);
    const checkIndex = stageOrder.indexOf(stageId);

    if (checkIndex < currentIndex) return 'completed';
    if (checkIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getStageIcon = (stageId: Stage, originalIcon: React.ReactNode) => {
    const status = getStageStatus(stageId);
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'active':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Circle className="w-4 h-4 text-zinc-500" />;
    }
  };

  // Calculate overall progress
  const calculateOverallProgress = (): number => {
    if (stage === 'idle') return 0;
    if (stage === 'completed') return 100;

    type ActiveStage = 'uploading' | 'generating_shots' | 'generating_voice' | 'assembling';

    const stageWeights: Record<ActiveStage, number> = {
      uploading: 5,
      generating_shots: 70,
      generating_voice: 15,
      assembling: 10,
    };

    let progress = 0;
    const stageOrder: ActiveStage[] = ['uploading', 'generating_shots', 'generating_voice', 'assembling'];

    for (const s of stageOrder) {
      if (getStageStatus(s) === 'completed') {
        progress += stageWeights[s];
      } else if (getStageStatus(s) === 'active') {
        // Partial progress for current stage
        if (s === 'generating_shots' && currentShot && totalShots) {
          const shotsDone = currentShot - 1;
          const currentShotProgress = (shotProgress || 0) / 100;
          const overallShotProgress = (shotsDone + currentShotProgress) / totalShots;
          progress += stageWeights[s] * overallShotProgress;
        } else {
          progress += stageWeights[s] * 0.5; // Assume 50% for other stages
        }
        break;
      }
    }

    return Math.round(progress);
  };

  const overallProgress = calculateOverallProgress();
  const isActive = stage !== 'idle' && stage !== 'completed' && stage !== 'failed';

  return (
    <div className={cn(
      'rounded-lg border transition-colors',
      isActive ? 'bg-blue-950/20 border-blue-800/50' : 'bg-zinc-900/50 border-zinc-800',
      className
    )}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-zinc-300">Generation Progress</h3>
            {isActive && (
              <span className="text-xs text-blue-400 animate-pulse">Processing...</span>
            )}
          </div>
          {overallProgress > 0 && (
            <span className="text-sm font-mono text-zinc-400">{overallProgress}%</span>
          )}
        </div>

        {/* Progress Bar */}
        <Progress
          value={overallProgress}
          className="h-2 mb-4"
        />

        {/* Pipeline Stages */}
        <div className="flex items-center justify-between">
          {STAGES.map((pipelineStage, index) => {
            const status = getStageStatus(pipelineStage.id);
            return (
              <div key={pipelineStage.id} className="flex items-center">
                <div className={cn(
                  'flex flex-col items-center gap-1',
                  status === 'active' && 'scale-110 transition-transform'
                )}>
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                    status === 'completed' && 'bg-green-950/50 border-green-500',
                    status === 'active' && 'bg-blue-950/50 border-blue-500',
                    status === 'failed' && 'bg-red-950/50 border-red-500',
                    status === 'pending' && 'bg-zinc-900 border-zinc-700'
                  )}>
                    {getStageIcon(pipelineStage.id, pipelineStage.icon)}
                  </div>
                  <span className={cn(
                    'text-xs',
                    status === 'completed' && 'text-green-400',
                    status === 'active' && 'text-blue-400',
                    status === 'failed' && 'text-red-400',
                    status === 'pending' && 'text-zinc-500'
                  )}>
                    {pipelineStage.label}
                  </span>
                </div>

                {/* Connector line */}
                {index < STAGES.length - 1 && (
                  <div className={cn(
                    'w-12 h-0.5 mx-2',
                    getStageStatus(STAGES[index + 1].id) !== 'pending'
                      ? 'bg-green-500'
                      : 'bg-zinc-700'
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Status Message */}
        {message && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">{message}</p>
              {eta && eta > 0 && (
                <span className="text-xs text-zinc-500">
                  ~{Math.ceil(eta / 60)} min remaining
                </span>
              )}
            </div>

            {/* Shot-specific progress */}
            {stage === 'generating_shots' && currentShot && totalShots && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                  <span>Shot {currentShot} of {totalShots}</span>
                  <span>{shotProgress || 0}%</span>
                </div>
                <Progress value={shotProgress || 0} className="h-1" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
