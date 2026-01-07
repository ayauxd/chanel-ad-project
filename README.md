# Chanel Ad Project

An agentic AI system that autonomously creates luxury brand advertisements using:

- **Google Veo 3.1** - AI video generation from text prompts
- **ElevenLabs** - Professional voice synthesis for narration
- **ffmpeg** - Video post-production and assembly

## Overview

This project demonstrates how Claude Code can orchestrate multiple AI services to create a polished 30-second luxury advertisement with minimal human intervention.

## Features

- Parallel video generation for faster processing
- Automatic shot sequencing and concatenation
- Professional voiceover with customizable voices
- Branding overlays and fade effects
- Error handling and progress tracking

## Requirements

- Python 3.10+
- ffmpeg
- API Keys:
  - `GEMINI_API_KEY` - Google AI Studio
  - `ELEVENLABS_API_KEY` - ElevenLabs

## Installation

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install google-genai elevenlabs requests
```

## Usage

```bash
# Set API keys
export GEMINI_API_KEY="your-key-here"
export ELEVENLABS_API_KEY="your-key-here"

# Test API connections
python test_apis.py

# Generate the advertisement
python chanel_ad_generator.py
```

## Output

The script generates:
- Individual shot clips in `output/shots/`
- Voiceover audio in `output/audio/`
- Final assembled video: `output/chanel_ad_final.mp4`

## Customization

Edit `chanel_ad_generator.py` to modify:
- Shot prompts and durations
- Voiceover script and voice selection
- Branding text and effects
- Output resolution and format

## Cost Estimate

- Veo 3.1: ~$0.40/second of video
- ElevenLabs: ~$0.01 for short narrations
- Total for 32-second ad: ~$13

## License

MIT

---

*Generated with Claude Code - Anthropic's agentic AI assistant*
