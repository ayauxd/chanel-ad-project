#!/usr/bin/env python3
"""
API Connection Test Script
==========================
Tests connectivity to Google Veo 3.1 and ElevenLabs APIs
before running the full ad generation pipeline.
"""

import os
import sys

def test_google_genai():
    """Test Google GenAI / Veo connection."""
    print("\n🧪 Testing Google GenAI (Veo 3.1) connection...")

    try:
        from google import genai

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("  ❌ GEMINI_API_KEY not set")
            return False

        client = genai.Client(api_key=api_key)

        # List available models to verify connection
        models = client.models.list()
        veo_models = [m for m in models if 'veo' in m.name.lower()]

        if veo_models:
            print(f"  ✅ Connected! Found {len(veo_models)} Veo models:")
            for m in veo_models[:5]:
                print(f"     - {m.name}")
            return True
        else:
            print("  ⚠️ Connected but no Veo models found")
            # Still might work if model is accessible by name
            return True

    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False


def test_elevenlabs():
    """Test ElevenLabs connection."""
    print("\n🧪 Testing ElevenLabs connection...")

    try:
        from elevenlabs import ElevenLabs

        api_key = os.environ.get("ELEVENLABS_API_KEY")
        if not api_key:
            print("  ❌ ELEVENLABS_API_KEY not set")
            return False

        client = ElevenLabs(api_key=api_key)

        # List voices to verify connection
        voices = client.voices.get_all()

        print(f"  ✅ Connected! Found {len(voices.voices)} voices available:")
        for v in voices.voices[:5]:
            print(f"     - {v.name} ({v.voice_id})")

        return True

    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False


def test_ffmpeg():
    """Test ffmpeg availability."""
    print("\n🧪 Testing ffmpeg availability...")

    import subprocess

    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0]
            print(f"  ✅ {version_line}")
            return True
        else:
            print(f"  ❌ ffmpeg returned error: {result.stderr}")
            return False

    except FileNotFoundError:
        print("  ❌ ffmpeg not found in PATH")
        return False


def main():
    """Run all API tests."""
    print("=" * 50)
    print("🔬 CHANEL AD GENERATOR - API TEST SUITE")
    print("=" * 50)

    results = {
        "Google GenAI (Veo)": test_google_genai(),
        "ElevenLabs": test_elevenlabs(),
        "ffmpeg": test_ffmpeg(),
    }

    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)

    all_passed = True
    for name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {name}: {status}")
        if not passed:
            all_passed = False

    print()
    if all_passed:
        print("🎉 All tests passed! Ready to generate the ad.")
        print("\nRun: python chanel_ad_generator.py")
        return 0
    else:
        print("⚠️ Some tests failed. Please fix before running the generator.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
