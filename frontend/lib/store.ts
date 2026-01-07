import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Project, Shot, Voiceover, BrandKit, GenerationProgress,
  ShotStatus, UploadedImage, Duration, Resolution, AspectRatio
} from './types';
import { COST_PER_SECOND_720P, COST_PER_SECOND_1080P, COST_PER_CHARACTER_VOICE } from './types';

interface AdGeneratorState {
  // Project state
  project: Project;
  selectedShotId: string | null;
  generationProgress: GenerationProgress;

  // Actions - Project
  setProjectName: (name: string) => void;
  setBrand: (brand: Partial<BrandKit>) => void;

  // Actions - Shots
  addShot: () => void;
  removeShot: (id: string) => void;
  updateShot: (id: string, updates: Partial<Shot>) => void;
  reorderShots: (fromIndex: number, toIndex: number) => void;
  selectShot: (id: string | null) => void;
  duplicateShot: (id: string) => void;

  // Actions - Images
  addImageToShot: (shotId: string, image: UploadedImage) => void;
  removeImageFromShot: (shotId: string, imageId: string) => void;
  setFirstFrame: (shotId: string, image: UploadedImage | undefined) => void;
  setLastFrame: (shotId: string, image: UploadedImage | undefined) => void;

  // Actions - Voiceover
  updateVoiceover: (updates: Partial<Voiceover>) => void;

  // Actions - Generation
  setGenerationProgress: (progress: Partial<GenerationProgress>) => void;
  setShotStatus: (shotId: string, status: ShotStatus, progress?: number, error?: string) => void;
  setShotVideoUrl: (shotId: string, url: string, thumbnailUrl?: string) => void;
  setVoiceoverAudioUrl: (url: string) => void;
  setFinalVideoUrl: (url: string) => void;

  // Computed
  getSelectedShot: () => Shot | undefined;
  getTotalDuration: () => number;
  getEstimatedCost: () => number;

  // Reset
  resetProject: () => void;
}

const createDefaultShot = (order: number): Shot => ({
  id: uuidv4(),
  order,
  prompt: '',
  negativePrompt: 'low quality, blurry, amateur, text, watermark, distorted',
  duration: 8,
  resolution: '1080p',
  aspectRatio: '16:9',
  referenceImages: [],
  status: 'draft',
  progress: 0,
});

const createDefaultProject = (): Project => ({
  id: uuidv4(),
  name: 'Untitled Ad',
  brand: {
    name: 'Brand Name',
    tagline: 'Your Tagline Here',
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
  },
  shots: [createDefaultShot(0)],
  voiceover: {
    script: '',
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    voiceName: 'Sarah',
    stability: 0.7,
    similarityBoost: 0.8,
    style: 0.5,
    status: 'draft',
    progress: 0,
  },
  status: 'draft',
  totalDuration: 8,
  estimatedCost: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const useAdGeneratorStore = create<AdGeneratorState>((set, get) => ({
  project: createDefaultProject(),
  selectedShotId: null,
  generationProgress: {
    stage: 'idle',
    message: 'Ready to generate',
  },

  // Project actions
  setProjectName: (name) => set((state) => ({
    project: { ...state.project, name, updatedAt: new Date() }
  })),

  setBrand: (brand) => set((state) => ({
    project: {
      ...state.project,
      brand: { ...state.project.brand, ...brand },
      updatedAt: new Date()
    }
  })),

  // Shot actions
  addShot: () => set((state) => {
    const newShot = createDefaultShot(state.project.shots.length);
    return {
      project: {
        ...state.project,
        shots: [...state.project.shots, newShot],
        updatedAt: new Date()
      },
      selectedShotId: newShot.id,
    };
  }),

  removeShot: (id) => set((state) => {
    if (state.project.shots.length <= 1) return state;
    const shots = state.project.shots
      .filter(s => s.id !== id)
      .map((s, i) => ({ ...s, order: i }));
    return {
      project: { ...state.project, shots, updatedAt: new Date() },
      selectedShotId: state.selectedShotId === id ? shots[0]?.id || null : state.selectedShotId,
    };
  }),

  updateShot: (id, updates) => set((state) => ({
    project: {
      ...state.project,
      shots: state.project.shots.map(s =>
        s.id === id ? { ...s, ...updates } : s
      ),
      updatedAt: new Date()
    }
  })),

  reorderShots: (fromIndex, toIndex) => set((state) => {
    const shots = [...state.project.shots];
    const [moved] = shots.splice(fromIndex, 1);
    shots.splice(toIndex, 0, moved);
    return {
      project: {
        ...state.project,
        shots: shots.map((s, i) => ({ ...s, order: i })),
        updatedAt: new Date()
      }
    };
  }),

  selectShot: (id) => set({ selectedShotId: id }),

  duplicateShot: (id) => set((state) => {
    const shot = state.project.shots.find(s => s.id === id);
    if (!shot) return state;
    const newShot: Shot = {
      ...shot,
      id: uuidv4(),
      order: state.project.shots.length,
      status: 'draft',
      progress: 0,
      generatedVideoUrl: undefined,
      thumbnailUrl: undefined,
    };
    return {
      project: {
        ...state.project,
        shots: [...state.project.shots, newShot],
        updatedAt: new Date()
      },
      selectedShotId: newShot.id,
    };
  }),

  // Image actions
  addImageToShot: (shotId, image) => set((state) => ({
    project: {
      ...state.project,
      shots: state.project.shots.map(s =>
        s.id === shotId
          ? { ...s, referenceImages: [...s.referenceImages, image] }
          : s
      ),
      updatedAt: new Date()
    }
  })),

  removeImageFromShot: (shotId, imageId) => set((state) => ({
    project: {
      ...state.project,
      shots: state.project.shots.map(s =>
        s.id === shotId
          ? { ...s, referenceImages: s.referenceImages.filter(i => i.id !== imageId) }
          : s
      ),
      updatedAt: new Date()
    }
  })),

  setFirstFrame: (shotId, image) => set((state) => ({
    project: {
      ...state.project,
      shots: state.project.shots.map(s =>
        s.id === shotId ? { ...s, firstFrame: image } : s
      ),
      updatedAt: new Date()
    }
  })),

  setLastFrame: (shotId, image) => set((state) => ({
    project: {
      ...state.project,
      shots: state.project.shots.map(s =>
        s.id === shotId ? { ...s, lastFrame: image } : s
      ),
      updatedAt: new Date()
    }
  })),

  // Voiceover actions
  updateVoiceover: (updates) => set((state) => ({
    project: {
      ...state.project,
      voiceover: { ...state.project.voiceover, ...updates },
      updatedAt: new Date()
    }
  })),

  // Generation actions
  setGenerationProgress: (progress) => set((state) => ({
    generationProgress: { ...state.generationProgress, ...progress }
  })),

  setShotStatus: (shotId, status, progress = 0, error) => set((state) => ({
    project: {
      ...state.project,
      shots: state.project.shots.map(s =>
        s.id === shotId ? { ...s, status, progress, error } : s
      )
    }
  })),

  setShotVideoUrl: (shotId, url, thumbnailUrl) => set((state) => ({
    project: {
      ...state.project,
      shots: state.project.shots.map(s =>
        s.id === shotId ? { ...s, generatedVideoUrl: url, thumbnailUrl, status: 'completed' as ShotStatus, progress: 100 } : s
      )
    }
  })),

  setVoiceoverAudioUrl: (url) => set((state) => ({
    project: {
      ...state.project,
      voiceover: { ...state.project.voiceover, generatedAudioUrl: url, status: 'completed', progress: 100 }
    }
  })),

  setFinalVideoUrl: (url) => set((state) => ({
    project: {
      ...state.project,
      finalVideoUrl: url,
      status: 'completed'
    }
  })),

  // Computed values
  getSelectedShot: () => {
    const state = get();
    return state.project.shots.find(s => s.id === state.selectedShotId);
  },

  getTotalDuration: () => {
    return get().project.shots.reduce((sum, shot) => sum + shot.duration, 0);
  },

  getEstimatedCost: () => {
    const state = get();
    const videoCost = state.project.shots.reduce((sum, shot) => {
      const rate = shot.resolution === '1080p' ? COST_PER_SECOND_1080P : COST_PER_SECOND_720P;
      return sum + (shot.duration * rate);
    }, 0);
    const voiceCost = state.project.voiceover.script.length * COST_PER_CHARACTER_VOICE;
    return videoCost + voiceCost;
  },

  // Reset
  resetProject: () => set({
    project: createDefaultProject(),
    selectedShotId: null,
    generationProgress: { stage: 'idle', message: 'Ready to generate' },
  }),
}));
