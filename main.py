#!/usr/bin/env python3
"""
YouTube Shorts Clipper – Football / World Cup Edition
Generates viral vertical clips from any YouTube video using AI.

Usage (single URL):
    python main.py "https://www.youtube.com/watch?v=VIDEO_ID"

Usage (batch – file of URLs):
    python main.py --batch urls.txt

Usage (web dashboard):
    python web/app.py
    # then open http://localhost:8080
"""

import argparse
import json
import os
import shutil
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


# ── Dependency check ──────────────────────────────────────────────────────────

def check_deps() -> bool:
    ok = True
    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            print(f"  ERROR: '{tool}' not found — run setup.sh first")
            ok = False
    for pkg in ("yt_dlp", "whisper", "anthropic"):
        try:
            __import__(pkg)
        except ImportError:
            print(f"  ERROR: Python package '{pkg}' missing — pip install -r requirements.txt")
            ok = False
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("  ERROR: ANTHROPIC_API_KEY not set — add to .env")
        ok = False
    return ok


# ── Formatting helpers ────────────────────────────────────────────────────────

def fmt(seconds: float) -> str:
    m, s = divmod(int(seconds), 60)
    return f"{m}m {s}s"


def banner(url: str, num_clips: int, quality: str, model: str) -> None:
    w = 66
    print()
    print("=" * w)
    print("  ⚽  YouTube Shorts Clipper — Football Edition  ⚽")
    print("=" * w)
    print(f"  URL     : {url}")
    print(f"  Clips   : {num_clips}   Quality: {quality}p   Whisper: {model}")
    print("=" * w)
    print()


# ── Single video pipeline ─────────────────────────────────────────────────────

def process_one(url: str, output_dir: Path, num_clips: int, quality: str, model: str) -> list:
    from clipper.downloader import download_video
    from clipper.transcriber import extract_audio, transcribe_audio, get_video_duration
    from clipper.analyzer import find_viral_moments
    from clipper.editor import extract_clips_parallel
    from clipper.thumbnail import generate_thumbnails

    temp_dir = output_dir / ".tmp"
    temp_dir.mkdir(parents=True, exist_ok=True)

    t0 = time.time()

    # 1 – Download
    print(f"📥  [1/5]  Downloading video…")
    t1 = time.time()
    video_path, title, _ = download_video(url, str(temp_dir), quality=quality)
    duration = get_video_duration(video_path)
    print(f"  ✓ '{title[:55]}' ({fmt(duration)}) — {fmt(time.time() - t1)}\n")

    # 2 – Transcribe
    print(f"🎙️   [2/5]  Transcribing audio (Whisper {model})…")
    t2 = time.time()
    audio_path = extract_audio(video_path, str(temp_dir))
    transcript = transcribe_audio(audio_path, model_size=model)
    segs = len(transcript.get("segments", []))
    print(f"  ✓ {segs} segments — {fmt(time.time() - t2)}\n")

    # 3 – AI moment detection
    print(f"🤖  [3/5]  AI selecting {num_clips} viral moments…")
    t3 = time.time()
    clips_meta = find_viral_moments(transcript, duration, num_clips=num_clips, video_path=video_path)
    print(f"  ✓ {len(clips_meta)} moments identified — {fmt(time.time() - t3)}")
    for i, c in enumerate(clips_meta):
        print(f"     {i+1}. [{c['start']:.0f}s → {c['end']:.0f}s]  {c['title']}")
    print()

    # 4 – Extract clips (parallel)
    print(f"✂️   [4/5]  Extracting clips (parallel)…")
    t4 = time.time()
    output_paths = extract_clips_parallel(
        video_path, clips_meta, str(output_dir), transcript.get("segments", [])
    )
    print(f"  Done — {fmt(time.time() - t4)}\n")

    # 5 – Thumbnails
    print(f"🖼️   [5/5]  Generating thumbnails…")
    t5 = time.time()
    thumbs = generate_thumbnails(output_paths)
    print(f"  ✓ {len(thumbs)} thumbnails — {fmt(time.time() - t5)}\n")

    # Metadata JSON
    clips_result = []
    for i, (path, meta) in enumerate(zip(output_paths, clips_meta)):
        if not os.path.exists(path):
            continue
        mb = round(os.path.getsize(path) / (1024 * 1024), 1)
        clips_result.append({
            "id": i + 1,
            "file": os.path.basename(path),
            "thumbnail": os.path.basename(thumbs.get(path, "")),
            "title": meta.get("title", ""),
            "caption": meta.get("caption", ""),
            "start": meta.get("start"),
            "end": meta.get("end"),
            "duration_s": round(meta.get("end", 0) - meta.get("start", 0), 1),
            "size_mb": mb,
        })

    metadata = {
        "url": url,
        "video_title": title,
        "duration_s": round(duration, 1),
        "generated_clips": len(clips_result),
        "clips": clips_result,
        "total_time_s": round(time.time() - t0, 1),
    }
    meta_path = output_dir / "metadata.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    shutil.rmtree(str(temp_dir), ignore_errors=True)

    total = time.time() - t0
    w = 66
    print("=" * w)
    print(f"  ✅  {len(clips_result)} clips ready in {fmt(total)}")
    print(f"  📁  {output_dir.resolve()}")
    print("=" * w)
    for c in clips_result:
        print(f"  🎬  {c['file']} ({c['size_mb']} MB, {c['duration_s']}s)")
    print(f"  📄  metadata.json")
    print("=" * w)
    print()

    return clips_result


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate viral YouTube Shorts from football videos",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("url", nargs="?", help="YouTube video URL")
    group.add_argument("--batch", metavar="FILE", help="Text file with one URL per line")

    parser.add_argument("--output", "-o", default="clips", help="Output directory")
    parser.add_argument("--clips", "-n", type=int, default=5, help="Clips per video (default: 5)")
    parser.add_argument("--quality", "-q", choices=["480", "720", "1080"], default="720")
    parser.add_argument("--model", "-m", choices=["tiny", "small", "medium", "large"], default="small")
    parser.add_argument("--web", action="store_true", help="Launch web dashboard instead")
    args = parser.parse_args()

    if args.web:
        import uvicorn
        print("Starting web dashboard at http://localhost:8080")
        uvicorn.run("web.app:app", host="0.0.0.0", port=8080)
        return

    print("\nChecking dependencies…")
    if not check_deps():
        sys.exit(1)
    print("  ✓ All good\n")

    if args.batch:
        with open(args.batch) as f:
            urls = [line.strip() for line in f if line.strip().startswith("http")]
        print(f"Batch mode: {len(urls)} URLs")
        for i, url in enumerate(urls):
            banner(url, args.clips, args.quality, args.model)
            job_dir = Path(args.output) / f"batch_{i+1:03d}"
            try:
                process_one(url, job_dir, args.clips, args.quality, args.model)
            except Exception as e:
                print(f"  ERROR on URL {i+1}: {e}\n")
    else:
        banner(args.url, args.clips, args.quality, args.model)
        process_one(args.url, Path(args.output), args.clips, args.quality, args.model)


if __name__ == "__main__":
    main()
