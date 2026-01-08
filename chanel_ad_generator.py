#!/usr/bin/env python3
"""
Chanel Luxury Advertisement Generator
=====================================
An agentic AI orchestration system that creates a 30-second luxury advertisement
using Google Veo 3.1 for video generation, ElevenLabs for voice synthesis,
and ffmpeg for post-production assembly.

Author: Claude Code (Anthropic)
Date: January 2026
"""

import os
import sys
import time
import json
import asyncio
import subprocess
from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

# Import AI SDKs
from google import genai
from google.genai import types
from elevenlabs import ElevenLabs

# ============================================================================
# CONFIGURATION
# ============================================================================

@dataclass
class Shot:
    """Represents a single cinematic shot in the advertisement."""
    id: int
    duration: int  # seconds (4, 6, or 8 for Veo 3.1)
    prompt: str
    negative_prompt: str = "low quality, blurry, amateur, text, watermark"
    aspect_ratio: str = "16:9"
    resolution: str = "1080p"


@dataclass
class AdConfig:
    """Configuration for the entire advertisement."""
    brand: str = "Chanel"
    tagline: str = "Timeless Elegance"
    total_duration: int = 30  # seconds
    output_dir: Path = Path("./output")


# ============================================================================
# CHANEL AD CREATIVE STRUCTURE
# ============================================================================

# 4 shots × 8 seconds = 32 seconds total (trimmed to 30 in post)
# Using 1080p requires 8-second duration per Veo 3.1 API constraints
CHANEL_SHOTS = [
    Shot(
        id=1,
        duration=8,
        prompt="""Cinematic extreme close-up of a crystal Chanel No. 5 perfume bottle
        emerging from soft morning mist, golden sunlight refracting through the glass,
        creating prismatic rainbows. Slow motion droplets of perfume catching light.
        Camera slowly orbits the bottle revealing its iconic silhouette.
        Luxury product photography style, 8K quality, shallow depth of field."""
    ),
    Shot(
        id=2,
        duration=8,
        prompt="""Elegant fashion runway at dusk, soft purple and gold lighting,
        a model in a classic black Chanel tweed jacket walking confidently toward camera,
        pearl necklace catching spotlight. Blurred audience in background.
        Cut to close-up of intricate diamond and pearl jewelry catching brilliant sparkles.
        High fashion cinematography, dramatic lighting, cinematic color grading."""
    ),
    Shot(
        id=3,
        duration=8,
        prompt="""Aerial establishing shot of Place Vendôme in Paris at golden hour,
        slowly descending toward an elegant storefront. Elegant Parisians walking past.
        Transition to interior: a sophisticated woman in a white suit seated at marble
        vanity, applying lipstick with confidence, soft window light on her face.
        Cinematic drone to interior shot, warm color palette, romantic atmosphere."""
    ),
    Shot(
        id=4,
        duration=8,
        prompt="""Close-up of artisan hands meticulously stitching a quilted leather
        handbag, needle and thread visible, leather texture in sharp detail.
        Dissolve to slow motion silk fabric in black, white, and gold flowing through air.
        Final reveal: elegant interlocking CC logo materializing from golden particles
        against deep black background with subtle lens flare. Premium brand moment."""
    ),
]

VOICEOVER_SCRIPT = """
Since 1910, Chanel has defined the essence of timeless elegance.

Each creation, a testament to uncompromising artistry.

From the ateliers of Paris to the dreams of women everywhere.

Where tradition meets tomorrow.

Chanel. Timeless Elegance.
"""


# ============================================================================
# VIDEO GENERATION (Google Veo 3.1)
# ============================================================================

class VeoVideoGenerator:
    """Handles video generation using Google Veo 3.1 API."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")
        self.client = genai.Client(api_key=self.api_key)
        self.model = "veo-3.1-fast-generate-preview"  # Fast tier: $0.15/sec vs $0.40/sec

    def generate_shot(self, shot: Shot, output_path: Path) -> Path:
        """Generate a single video shot using Veo 3.1."""
        print(f"  🎬 Generating shot {shot.id}: {shot.prompt[:50]}...")

        try:
            # Initiate video generation
            operation = self.client.models.generate_videos(
                model=self.model,
                prompt=shot.prompt,
                config=types.GenerateVideosConfig(
                    aspect_ratio=shot.aspect_ratio,
                    duration_seconds=shot.duration,
                    resolution=shot.resolution,
                    negative_prompt=shot.negative_prompt,
                )
            )

            # Poll for completion
            max_wait = 300  # 5 minutes max
            start_time = time.time()

            while not operation.done:
                elapsed = time.time() - start_time
                if elapsed > max_wait:
                    raise TimeoutError(f"Shot {shot.id} generation timed out after {max_wait}s")

                print(f"    ⏳ Shot {shot.id} generating... ({int(elapsed)}s elapsed)")
                time.sleep(10)
                operation = self.client.operations.get(operation)

            # Download the generated video
            if operation.response and operation.response.generated_videos:
                generated_video = operation.response.generated_videos[0]
                self.client.files.download(file=generated_video.video)

                video_path = output_path / f"shot_{shot.id:02d}.mp4"
                generated_video.video.save(str(video_path))

                print(f"    ✅ Shot {shot.id} saved to {video_path}")
                return video_path
            else:
                raise RuntimeError(f"No video generated for shot {shot.id}")

        except Exception as e:
            print(f"    ❌ Shot {shot.id} failed: {e}")
            raise

    def generate_all_shots(self, shots: List[Shot], output_path: Path,
                          parallel: bool = True, max_workers: int = 3) -> List[Path]:
        """Generate all shots, optionally in parallel."""
        output_path.mkdir(parents=True, exist_ok=True)

        if parallel:
            print(f"\n🎥 Generating {len(shots)} shots in parallel (max {max_workers} concurrent)...\n")
            video_paths = [None] * len(shots)

            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                future_to_shot = {
                    executor.submit(self.generate_shot, shot, output_path): shot
                    for shot in shots
                }

                for future in as_completed(future_to_shot):
                    shot = future_to_shot[future]
                    try:
                        video_path = future.result()
                        video_paths[shot.id - 1] = video_path
                    except Exception as e:
                        print(f"Shot {shot.id} failed: {e}")

            return [p for p in video_paths if p is not None]
        else:
            print(f"\n🎥 Generating {len(shots)} shots sequentially...\n")
            return [self.generate_shot(shot, output_path) for shot in shots]


# ============================================================================
# VOICE SYNTHESIS (ElevenLabs)
# ============================================================================

class VoiceGenerator:
    """Handles voice synthesis using ElevenLabs API."""

    # Premium voices suitable for luxury advertising
    LUXURY_VOICES = {
        "rachel": "21m00Tcm4TlvDq8ikWAM",  # Warm, professional female
        "drew": "29vD33N1CtxCmqQRPOHJ",     # Confident male
        "charlotte": "XB0fDUnXU5powFXDhCwa", # Sophisticated British female
        "sarah": "EXAVITQu4vr4xnSDxMaL",    # Clear, elegant female
    }

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("ELEVENLABS_API_KEY")
        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY not found in environment")
        self.client = ElevenLabs(api_key=self.api_key)

    def generate_voiceover(self, script: str, output_path: Path,
                           voice_name: str = "charlotte") -> Path:
        """Generate voiceover narration from script."""
        print(f"\n🎙️ Generating voiceover with voice '{voice_name}'...")

        voice_id = self.LUXURY_VOICES.get(voice_name)
        if not voice_id:
            # Try to use the name as a direct voice ID
            voice_id = voice_name

        try:
            # Generate audio
            audio = self.client.text_to_speech.convert(
                voice_id=voice_id,
                text=script,
                model_id="eleven_multilingual_v2",
                voice_settings={
                    "stability": 0.7,
                    "similarity_boost": 0.8,
                    "style": 0.5,
                    "use_speaker_boost": True
                }
            )

            # Save audio file
            output_path.mkdir(parents=True, exist_ok=True)
            audio_path = output_path / "voiceover.mp3"

            with open(audio_path, "wb") as f:
                for chunk in audio:
                    f.write(chunk)

            print(f"  ✅ Voiceover saved to {audio_path}")
            return audio_path

        except Exception as e:
            print(f"  ❌ Voiceover generation failed: {e}")
            raise


# ============================================================================
# VIDEO ASSEMBLY (ffmpeg)
# ============================================================================

class VideoAssembler:
    """Handles video post-production using ffmpeg."""

    def __init__(self):
        # Verify ffmpeg is available
        result = subprocess.run(["which", "ffmpeg"], capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError("ffmpeg not found in PATH")
        self.ffmpeg = result.stdout.strip()

    def concat_videos(self, video_paths: List[Path], output_path: Path) -> Path:
        """Concatenate multiple video clips into one."""
        print("\n🎬 Concatenating video clips...")

        # Create concat file
        concat_file = output_path / "concat_list.txt"
        with open(concat_file, "w") as f:
            for path in video_paths:
                f.write(f"file '{path.absolute()}'\n")

        # Run ffmpeg concat
        output_video = output_path / "concatenated.mp4"
        cmd = [
            self.ffmpeg, "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_file),
            "-c", "copy",
            str(output_video)
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"ffmpeg concat failed: {result.stderr}")

        print(f"  ✅ Concatenated video saved to {output_video}")
        return output_video

    def add_audio(self, video_path: Path, audio_path: Path, output_path: Path) -> Path:
        """Mix voiceover audio with video."""
        print("\n🔊 Adding voiceover to video...")

        output_video = output_path / "with_voiceover.mp4"

        # Merge audio with video, keeping original video audio at lower volume
        cmd = [
            self.ffmpeg, "-y",
            "-i", str(video_path),
            "-i", str(audio_path),
            "-filter_complex",
            "[0:a]volume=0.3[original];[1:a]volume=1.0[voiceover];[original][voiceover]amix=inputs=2:duration=shortest",
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "192k",
            str(output_video)
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            # Try simpler approach if video has no audio
            cmd = [
                self.ffmpeg, "-y",
                "-i", str(video_path),
                "-i", str(audio_path),
                "-c:v", "copy",
                "-c:a", "aac",
                "-b:a", "192k",
                "-shortest",
                str(output_video)
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise RuntimeError(f"ffmpeg audio merge failed: {result.stderr}")

        print(f"  ✅ Video with voiceover saved to {output_video}")
        return output_video

    def add_branding_overlay(self, video_path: Path, output_path: Path,
                             logo_text: str = "CHANEL",
                             tagline: str = "Timeless Elegance") -> Path:
        """Add branding text overlay and fade effects."""
        print("\n✨ Adding branding overlay and effects...")

        final_output = output_path / "chanel_ad_final.mp4"

        # Get video duration
        probe_cmd = [
            self.ffmpeg, "-i", str(video_path),
            "-hide_banner", "-f", "null", "-"
        ]

        # Create elegant text overlay with fade in/out
        # The logo appears in the last 5 seconds with fade
        cmd = [
            self.ffmpeg, "-y",
            "-i", str(video_path),
            "-vf", (
                # Elegant drawtext for brand name
                f"drawtext=text='{logo_text}':"
                "fontfile=/System/Library/Fonts/Supplemental/Times New Roman.ttf:"
                "fontsize=72:fontcolor=white:"
                "x=(w-text_w)/2:y=(h-text_h)/2-50:"
                "enable='between(t,25,30)':"
                "alpha='if(lt(t,26),t-25,if(gt(t,29),30-t,1))',"
                # Tagline below
                f"drawtext=text='{tagline}':"
                "fontfile=/System/Library/Fonts/Supplemental/Times New Roman.ttf:"
                "fontsize=36:fontcolor=white:"
                "x=(w-text_w)/2:y=(h-text_h)/2+50:"
                "enable='between(t,26,30)':"
                "alpha='if(lt(t,27),t-26,if(gt(t,29),30-t,1))',"
                # Fade in at start, fade out at end
                "fade=t=in:st=0:d=1,fade=t=out:st=29:d=1"
            ),
            "-c:a", "copy",
            str(final_output)
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            # Simplified version without fancy fonts
            cmd = [
                self.ffmpeg, "-y",
                "-i", str(video_path),
                "-vf", "fade=t=in:st=0:d=1,fade=t=out:st=29:d=1",
                "-c:a", "copy",
                str(final_output)
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise RuntimeError(f"ffmpeg branding failed: {result.stderr}")

        print(f"  ✅ Final video saved to {final_output}")
        return final_output


# ============================================================================
# MAIN ORCHESTRATOR
# ============================================================================

class LuxuryAdOrchestrator:
    """
    Main orchestrator that coordinates all components to create
    a complete luxury advertisement.
    """

    def __init__(self, config: AdConfig = None):
        self.config = config or AdConfig()
        self.config.output_dir.mkdir(parents=True, exist_ok=True)

        # Initialize components
        self.video_gen = VeoVideoGenerator()
        self.voice_gen = VoiceGenerator()
        self.assembler = VideoAssembler()

    def create_ad(self, shots: List[Shot], voiceover_script: str,
                  parallel_generation: bool = True) -> Path:
        """
        Execute the complete ad creation pipeline.

        Returns the path to the final video file.
        """
        print("=" * 60)
        print(f"🎬 CHANEL LUXURY AD GENERATOR")
        print(f"   Creating {self.config.total_duration}s advertisement")
        print("=" * 60)

        start_time = time.time()

        try:
            # Step 1: Generate all video shots
            video_paths = self.video_gen.generate_all_shots(
                shots,
                self.config.output_dir / "shots",
                parallel=parallel_generation
            )

            if not video_paths:
                raise RuntimeError("No video shots were generated successfully")

            # Step 2: Generate voiceover
            voiceover_path = self.voice_gen.generate_voiceover(
                voiceover_script,
                self.config.output_dir / "audio"
            )

            # Step 3: Concatenate video clips
            concat_video = self.assembler.concat_videos(
                video_paths,
                self.config.output_dir
            )

            # Step 4: Add voiceover to video
            with_audio = self.assembler.add_audio(
                concat_video,
                voiceover_path,
                self.config.output_dir
            )

            # Step 5: Add branding and final effects
            final_video = self.assembler.add_branding_overlay(
                with_audio,
                self.config.output_dir,
                logo_text=self.config.brand.upper(),
                tagline=self.config.tagline
            )

            # Summary
            elapsed = time.time() - start_time
            print("\n" + "=" * 60)
            print(f"✨ AD CREATION COMPLETE!")
            print(f"   Total time: {elapsed:.1f} seconds ({elapsed/60:.1f} minutes)")
            print(f"   Output: {final_video}")
            print("=" * 60)

            return final_video

        except Exception as e:
            print(f"\n❌ Ad creation failed: {e}")
            raise


# ============================================================================
# ENTRY POINT
# ============================================================================

def main():
    """Main entry point for the Chanel ad generator."""

    # Check for required environment variables
    required_vars = ["GEMINI_API_KEY", "ELEVENLABS_API_KEY"]
    missing = [var for var in required_vars if not os.environ.get(var)]
    if missing:
        print(f"❌ Missing required environment variables: {', '.join(missing)}")
        print("\nPlease set them before running:")
        for var in missing:
            print(f"  export {var}='your-api-key'")
        sys.exit(1)

    # Create configuration
    config = AdConfig(
        brand="Chanel",
        tagline="Timeless Elegance",
        total_duration=30,
        output_dir=Path("./output")
    )

    # Initialize orchestrator
    orchestrator = LuxuryAdOrchestrator(config)

    # Create the advertisement
    final_video = orchestrator.create_ad(
        shots=CHANEL_SHOTS,
        voiceover_script=VOICEOVER_SCRIPT,
        parallel_generation=True  # Generate shots in parallel for speed
    )

    print(f"\n🎉 Your Chanel advertisement is ready: {final_video}")
    return final_video


if __name__ == "__main__":
    main()
