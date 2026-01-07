import { NextResponse } from 'next/server';

// Available voices for the voice studio
const VOICES = [
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    description: 'Mature, Reassuring, Confident',
    gender: 'female',
    accent: 'american',
    previewUrl: null,
  },
  {
    id: 'XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte',
    description: 'Sophisticated, British, Elegant',
    gender: 'female',
    accent: 'british',
    previewUrl: null,
  },
  {
    id: 'JBFqnCBsd6RMkjVDRZzb',
    name: 'George',
    description: 'Warm, Captivating Storyteller',
    gender: 'male',
    accent: 'british',
    previewUrl: null,
  },
  {
    id: 'CwhRBWXzGAHq8TQ4Fs17',
    name: 'Roger',
    description: 'Laid-Back, Casual, Resonant',
    gender: 'male',
    accent: 'american',
    previewUrl: null,
  },
  {
    id: 'IKne3meq5aSn9XLyUdCD',
    name: 'Charlie',
    description: 'Deep, Confident, Energetic',
    gender: 'male',
    accent: 'australian',
    previewUrl: null,
  },
];

export async function GET() {
  // In production, this could fetch from ElevenLabs API
  // const response = await fetch('https://api.elevenlabs.io/v1/voices', {
  //   headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! }
  // });

  return NextResponse.json({
    voices: VOICES,
  });
}
