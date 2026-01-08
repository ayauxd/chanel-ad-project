// Core data types for the Ad Generator

export type ShotStatus = 'draft' | 'queued' | 'generating' | 'completed' | 'failed';
export type ProjectStatus = 'draft' | 'generating' | 'completed' | 'failed';
export type Resolution = '720p' | '1080p';
export type AspectRatio = '16:9' | '9:16';
export type Duration = 4 | 6 | 8;

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  type: 'reference' | 'first_frame' | 'last_frame';
}

export interface Shot {
  id: string;
  order: number;
  prompt: string;
  negativePrompt: string;
  duration: Duration;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  referenceImages: UploadedImage[];
  firstFrame?: UploadedImage;
  lastFrame?: UploadedImage;
  generatedVideoUrl?: string;
  thumbnailUrl?: string;
  status: ShotStatus;
  progress: number;
  error?: string;
  generationTime?: number;
}

export interface Voice {
  id: string;
  name: string;
  description: string;
  previewUrl?: string;
}

export interface Voiceover {
  script: string;
  voiceId: string;
  voiceName: string;
  stability: number;
  similarityBoost: number;
  style: number;
  generatedAudioUrl?: string;
  status: ShotStatus;
  progress: number;
  error?: string;
}

export interface BrandKit {
  name: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  brand: BrandKit;
  shots: Shot[];
  voiceover: Voiceover;
  finalVideoUrl?: string;
  status: ProjectStatus;
  totalDuration: number;
  estimatedCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerationProgress {
  stage: 'idle' | 'uploading' | 'generating_shots' | 'generating_voice' | 'assembling' | 'completed' | 'failed';
  currentShot?: number;
  totalShots?: number;
  shotProgress?: number;
  voiceProgress?: number;
  assemblyProgress?: number;
  message: string;
  eta?: number; // seconds remaining
}

// Available voices from ElevenLabs
export const AVAILABLE_VOICES: Voice[] = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Mature, Reassuring, Confident' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', description: 'Sophisticated, British, Elegant' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'Warm, Captivating Storyteller' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', description: 'Laid-Back, Casual, Resonant' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'Deep, Confident, Energetic' },
];

// Cost estimates (Veo 3.1 Fast tier)
export const COST_PER_SECOND_720P = 0.15;
export const COST_PER_SECOND_1080P = 0.15;  // Fast tier is same price for both
export const COST_PER_CHARACTER_VOICE = 0.00003;
