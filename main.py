#!/usr/bin/env python3
"""
YouTube Shorts Clipper - Football / World Cup Edition
Generates 5 viral-ready vertical clips from any YouTube video using AI.

Usage:
    python main.py "https://www.youtube.com/watch?v=VIDEO_ID"
    python main.py "URL" --clips 5 --quality 1080 --output my_clips
"""

import argparse
import os
import shutil
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def check_dependencies() -> bool:
    ok = True
    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            print(f"  ERROR: '{tool}' not found. Install FFmpeg: https://ffmpeg.org/download.html")
            ok = False
    try:
        import yt_dlp  # noqa: F401
    except ImportError:
        print("  ERROR: yt-dlp not installed. Run: pip install yt-dlp")
        ok = False
    try:
        import whisper  # noqa: F401
    except ImportError:
        print("  ERROR: openai-whisper not installed. Run: pip install openai-whisper")
        ok = False
    try:
        import anthropic  # noqa: F401
    except ImportError:
        print("  ERROR: anthropic not installed. Run: pip install anthropic")
        ok = False
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("  ERROR: ANTHROPIC_API_KEY not set. Add it to .env or export it.")
        ok = False
    return ok


def banner(url: str, num_clips: int, quality: str, model: str) -> None:
    print()
    print("=" * 64)
    print("  ⚽  YouTube Shorts Clipper — Football Edition  ⚽")
    print("=" * 64)
    print(f"  URL     : {url}")
    print(f"  Clips   : {num_clips}   Quality: {quality}p   Model: {model}")
    print("=" * 64)
    print()


def fmt_time(seconds: float) -> str:
    m, s = divmod(int(seconds), 60)
    return f"{m}m {s}s"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate viral YouTube Shorts from football videos",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("url", help="YouTube video URL")
    parser.add_argument("--output", "-o", default="clips", help="Output directory (default: clips)")
    parser.add_argument("--clips", "-n", type=int, default=5, help="Number of clips (default: 5)")
    parser.add_argument(
        "--quality", "-q", choices=["480", "720", "1080"], default="720",
        help="Download quality (default: 720)"
    )
    parser.add_argument(
        "--model", "-m", choices=["tiny", "small", "medium", "large"], default="small",
        help="Whisper model size (default: small)"
    )
    args = parser.parse_args()

    banner(args.url, args.clips, args.quality, args.model)

    print("Checking dependencies...")
    if not check_dependencies():
        sys.exit(1)
    print("  ✓ All dependencies found\n")

    # Late imports (after dependency check)
    from clipper.downloader import download_video
    from clipper.transcriber import extract_audio, transcribe_audio, get_video_duration
    from clipper.analyzer import find_viral_moments
    from clipper.editor import extract_clips_parallel

    t0 = time.time()
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    temp_dir = output_dir / ".tmp"
    temp_dir.mkdir(exist_ok=True)

    # ── Step 1: Download ─────────────────────────────────────────────────────
    print("📥  Step 1/4  Downloading video...")
    t1 = time.time()
    video_path, video_title, _ = download_video(args.url, str(temp_dir), quality=args.quality)
    duration = get_video_duration(video_path)
    print(f"  ✓ '{video_title}' ({fmt_time(duration)}) — done in {fmt_time(time.time() - t1)}\n")

    # ── Step 2: Transcribe ───────────────────────────────────────────────────
    print(f"🎙️   Step 2/4  Transcribing with Whisper ({args.model})...")
    t2 = time.time()
    audio_path = extract_audio(video_path, str(temp_dir))
    transcript = transcribe_audio(audio_path, model_size=args.model)
    seg_count = len(transcript.get("segments", []))
    print(f"  ✓ {seg_count} segments transcribed — done in {fmt_time(time.time() - t2)}\n")

    # ── Step 3: AI Moment Detection ──────────────────────────────────────────
    print(f"🤖  Step 3/4  AI identifying {args.clips} viral moments...")
    t3 = time.time()
    clips = find_viral_moments(transcript, duration, num_clips=args.clips)
    print(f"  ✓ {len(clips)} moments selected — done in {fmt_time(time.time() - t3)}")
    for i, c in enumerate(clips):
        print(f"     {i+1}. [{c['start']:.0f}s→{c['end']:.0f}s]  {c['title']}")
    print()

    # ── Step 4: Extract Clips ────────────────────────────────────────────────
    print(f"✂️   Step 4/4  Extracting {len(clips)} clips (parallel)...")
    t4 = time.time()
    output_paths = extract_clips_parallel(
        video_path, clips, str(output_dir), transcript.get("segments", [])
    )
    print(f"  Done in {fmt_time(time.time() - t4)}\n")

    # ── Cleanup ──────────────────────────────────────────────────────────────
    shutil.rmtree(str(temp_dir), ignore_errors=True)

    # ── Summary ──────────────────────────────────────────────────────────────
    total = time.time() - t0
    print("=" * 64)
    print(f"  ✅  {len(output_paths)} clips ready in {fmt_time(total)}")
    print(f"  📁  {output_dir.resolve()}")
    print("=" * 64)
    for path in output_paths:
        if os.path.exists(path):
            mb = os.path.getsize(path) / (1024 * 1024)
            print(f"  🎬  {os.path.basename(path)} ({mb:.1f} MB)")
    print("=" * 64)
    print()


if __name__ == "__main__":
    main()
