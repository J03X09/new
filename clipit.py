#!/usr/bin/env python3
"""
Football Shorts Clipper — run this file to generate real clips.

Requirements:
  - Python 3.9+
  - ffmpeg installed (https://ffmpeg.org/download.html)
  - An Anthropic API key (https://console.anthropic.com)

First run:
  pip install yt-dlp openai-whisper anthropic python-dotenv
  python clipit.py
"""

import subprocess
import sys
import os
import shutil
import time
import json
from pathlib import Path


# ── Auto-install missing packages ─────────────────────────────────────────────
REQUIRED = ["yt_dlp", "whisper", "anthropic", "dotenv"]
INSTALL  = ["yt-dlp", "openai-whisper", "anthropic", "python-dotenv"]

missing = [pkg for pkg in REQUIRED if not __import__("importlib").util.find_spec(pkg)]
if missing:
    print(f"Installing missing packages: {', '.join(missing)}")
    subprocess.run([sys.executable, "-m", "pip", "install", "-q"] + INSTALL, check=True)
    print()


# ── Load .env if present ──────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
    load_dotenv(Path.home() / ".env")
except ImportError:
    pass


# ── Dependency checks ─────────────────────────────────────────────────────────
def check():
    errors = []
    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            errors.append(f"  ✗ '{tool}' not found. Install FFmpeg: https://ffmpeg.org/download.html")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        errors.append("  ✗ ANTHROPIC_API_KEY not set.\n"
                      "    Set it by running:  export ANTHROPIC_API_KEY=sk-ant-...\n"
                      "    Or create a .env file next to this script with:\n"
                      "    ANTHROPIC_API_KEY=sk-ant-...")
    if errors:
        print("\n".join(errors))
        sys.exit(1)


# ── Helpers ───────────────────────────────────────────────────────────────────
def fmt(seconds):
    m, s = divmod(int(seconds), 60)
    return f"{m}m {s}s" if m else f"{s}s"


def get_video_duration(path):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True, check=True,
    )
    return float(r.stdout.strip())


# ── Step 1: Download ──────────────────────────────────────────────────────────
def download(url, out_dir, quality="720"):
    import yt_dlp
    fmt_sel = (f"bestvideo[height<={quality}][ext=mp4]+bestaudio[ext=m4a]/"
               f"bestvideo[height<={quality}]+bestaudio/"
               f"best[height<={quality}]/best")
    opts = {
        "format": fmt_sel,
        "outtmpl": str(out_dir / "source.%(ext)s"),
        "merge_output_format": "mp4",
        "quiet": False,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=True)
        title = info.get("title", "video")
    for ext in ("mp4", "mkv", "webm"):
        p = out_dir / f"source.{ext}"
        if p.exists():
            return str(p), title
    raise FileNotFoundError("Downloaded file not found")


# ── Step 2: Transcribe ────────────────────────────────────────────────────────
def transcribe(video_path, out_dir, model_size="small"):
    import whisper
    # Extract audio
    audio = str(out_dir / "audio.wav")
    subprocess.run(
        ["ffmpeg", "-y", "-i", video_path, "-vn", "-acodec", "pcm_s16le",
         "-ar", "16000", "-ac", "1", audio, "-loglevel", "error"],
        check=True,
    )
    model = whisper.load_model(model_size)
    return model.transcribe(audio, word_timestamps=True, verbose=False)


# ── Step 3: AI moment detection ───────────────────────────────────────────────
def find_moments(transcript, duration, num_clips=5):
    import anthropic, json

    segments = transcript.get("segments", [])
    lines = [f"[{s['start']:.1f}s-{s['end']:.1f}s] {s['text'].strip()}"
             for s in segments if s.get("text", "").strip()]
    formatted = "\n".join(lines) if lines else "(no speech detected)"

    client = anthropic.Anthropic()
    prompt = f"""You are a viral football/soccer content editor for YouTube Shorts.

Analyse this transcript from a football video (duration: {duration:.0f}s).
Select the {num_clips} most viral-worthy moments.

Look for: goals, saves, skill moves, VAR reviews, red cards, penalties,
celebrations, crowd reactions, last-minute drama, confrontations.

TRANSCRIPT:
{formatted}

Return ONLY a valid JSON array of exactly {num_clips} objects:
  "start"       – float, seconds (2-3s before action)
  "end"         – float, seconds, 20-50s after start, max {duration:.0f}
  "title"       – punchy Shorts title ≤60 chars
  "caption"     – ALL CAPS on-screen text ≤6 words

Rules: no overlaps, 20-50s each, within 0-{duration:.0f}s. JSON only."""

    msg = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = msg.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1].lstrip("json").strip()
    clips = json.loads(raw)
    for c in clips:
        c["start"] = max(0.0, float(c["start"]))
        c["end"]   = min(float(duration), float(c["end"]))
        if c["end"] - c["start"] < 15:
            c["end"] = min(duration, c["start"] + 30)
    return clips


# ── Step 4: Extract clips ─────────────────────────────────────────────────────
def srt_ts(s):
    h, m = int(s//3600), int((s%3600)//60)
    return f"{h:02d}:{m:02d}:{int(s%60):02d},{int((s%1)*1000):03d}"


def build_srt(segments, clip_start, clip_end):
    lines, idx = [], 1
    for seg in segments:
        words = seg.get("words") or []
        items = words if words else [{"start": seg["start"], "end": seg["end"],
                                      "word": seg.get("text", "")}]
        phrase, ps, pe = [], 0.0, 0.0
        for wi in items:
            ws = float(wi.get("start", seg["start"]))
            we = float(wi.get("end",   seg["end"]))
            if we <= clip_start or ws >= clip_end:
                continue
            if not phrase:
                ps = ws
            phrase.append(wi.get("word", wi.get("text", "")).strip())
            pe = we
            if len(phrase) >= 3 or (pe - ps) >= 1.4:
                text = " ".join(phrase).upper()
                ls, le = max(0, ps - clip_start), min(clip_end - clip_start, pe - clip_start)
                if le > ls and text:
                    lines.append(f"{idx}\n{srt_ts(ls)} --> {srt_ts(le)}\n{text}\n")
                    idx += 1
                phrase = []
        if phrase:
            text = " ".join(phrase).upper()
            ls, le = max(0, ps - clip_start), min(clip_end - clip_start, pe - clip_start)
            if le > ls and text:
                lines.append(f"{idx}\n{srt_ts(ls)} --> {srt_ts(le)}\n{text}\n")
                idx += 1
    return "\n".join(lines)


def extract_clip(video_path, clip, idx, out_dir, segments):
    import re
    start, end = float(clip["start"]), float(clip["end"])
    dur = max(end - start, 5.0)
    caption = clip.get("caption", "").upper()
    safe_title = re.sub(r'[\\/:*?"<>|]', "", clip.get("title", f"clip_{idx+1}"))[:48]
    out_path = str(out_dir / f"short_{idx+1:02d}_{safe_title}.mp4")
    srt_path = str(out_dir / f".sub_{idx}.srt")

    with open(srt_path, "w", encoding="utf-8") as f:
        f.write(build_srt(segments, start, end))

    esc_srt = srt_path.replace("\\", "\\\\").replace(":", "\\:")
    cap_esc = caption.replace("'", "\\'").replace(":", "\\:")

    sub_style = ("FontName=Impact,FontSize=82,PrimaryColour=&H00FFFFFF,"
                 "OutlineColour=&H00000000,Bold=-1,Outline=5,Shadow=2,"
                 "Alignment=2,MarginV=140")
    drawtext  = (f"drawtext=text='{cap_esc}':font='Impact':fontsize=68:"
                 f"fontcolor=white:bordercolor=black:borderw=5:"
                 f"x=(w-tw)/2:y=110:enable='between(t,0,3.5)'")
    vf = (f"crop=ih*9/16:ih:(iw-ih*9/16)/2:0,"
          f"scale=1080:1920:flags=lanczos,"
          f"subtitles='{esc_srt}':force_style='{sub_style}',"
          f"{drawtext}")

    cmd = ["ffmpeg", "-y", "-ss", str(start), "-i", video_path,
           "-t", str(dur), "-vf", vf,
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
           "-profile:v", "high", "-level", "4.0", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
           "-movflags", "+faststart", "-threads", "0",
           out_path, "-loglevel", "error"]
    try:
        subprocess.run(cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError:
        # Retry without subtitles if libass unavailable
        vf_fb = (f"crop=ih*9/16:ih:(iw-ih*9/16)/2:0,"
                 f"scale=1080:1920:flags=lanczos,{drawtext}")
        cmd[cmd.index(vf)] = vf_fb
        subprocess.run(cmd, check=True)

    try:
        os.remove(srt_path)
    except OSError:
        pass
    return out_path


def extract_all(video_path, clips, out_dir, segments):
    from concurrent.futures import ThreadPoolExecutor, as_completed
    results = {}
    with ThreadPoolExecutor(max_workers=3) as ex:
        futures = {ex.submit(extract_clip, video_path, c, i, out_dir, segments): i
                   for i, c in enumerate(clips)}
        for f in as_completed(futures):
            i = futures[f]
            try:
                p = f.result()
                results[i] = p
                mb = os.path.getsize(p) / (1024*1024)
                print(f"  ✓ Clip {i+1}: {os.path.basename(p)} ({mb:.1f} MB)")
            except Exception as e:
                print(f"  ✗ Clip {i+1} failed: {e}")
    return [results[i] for i in sorted(results)]


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print()
    print("=" * 60)
    print("  ⚽  Football Shorts Clipper")
    print("=" * 60)

    check()

    url = input("\n  Paste YouTube URL: ").strip()
    if not url:
        print("No URL entered.")
        sys.exit(1)

    n_clips  = int(input("  How many clips? [5]: ").strip() or "5")
    quality  = input("  Quality 480/720/1080 [720]: ").strip() or "720"
    model    = input("  Whisper model tiny/small/medium [small]: ").strip() or "small"

    out_dir = Path("clips") / f"job_{int(time.time())}"
    out_dir.mkdir(parents=True, exist_ok=True)
    tmp_dir = out_dir / ".tmp"
    tmp_dir.mkdir(exist_ok=True)

    t0 = time.time()
    print()

    # 1 – Download
    print(f"📥  [1/4]  Downloading ({quality}p)…")
    t = time.time()
    video_path, title = download(url, tmp_dir, quality)
    duration = get_video_duration(video_path)
    print(f"  ✓ '{title[:55]}' ({fmt(duration)}) — {fmt(time.time()-t)}\n")

    # 2 – Transcribe
    print(f"🎙️   [2/4]  Transcribing with Whisper ({model})…")
    t = time.time()
    transcript = transcribe(video_path, tmp_dir, model)
    segs = len(transcript.get("segments", []))
    print(f"  ✓ {segs} segments — {fmt(time.time()-t)}\n")

    # 3 – AI
    print(f"🤖  [3/4]  AI selecting {n_clips} viral moments…")
    t = time.time()
    clips = find_moments(transcript, duration, n_clips)
    print(f"  ✓ {len(clips)} moments — {fmt(time.time()-t)}")
    for i, c in enumerate(clips):
        print(f"     {i+1}. [{c['start']:.0f}s→{c['end']:.0f}s]  {c['title']}")
    print()

    # 4 – Extract
    print(f"✂️   [4/4]  Extracting clips…")
    t = time.time()
    output_paths = extract_all(video_path, clips, out_dir, transcript.get("segments", []))
    print(f"  Done — {fmt(time.time()-t)}\n")

    # Save metadata
    meta = {"url": url, "title": title, "clips": [
        {"file": os.path.basename(p), "title": c.get("title"), "caption": c.get("caption"),
         "start": c["start"], "end": c["end"]}
        for p, c in zip(output_paths, clips) if os.path.exists(p)
    ]}
    with open(out_dir / "metadata.json", "w") as f:
        json.dump(meta, f, indent=2)

    # Cleanup temp
    shutil.rmtree(str(tmp_dir), ignore_errors=True)

    total = time.time() - t0
    print("=" * 60)
    print(f"  ✅  {len(output_paths)} clips ready in {fmt(total)}")
    print(f"  📁  {out_dir.resolve()}")
    print("=" * 60)
    for p in output_paths:
        if os.path.exists(p):
            print(f"  🎬  {os.path.basename(p)}")
    print()

    # Open output folder automatically
    folder = str(out_dir.resolve())
    if sys.platform == "win32":
        os.startfile(folder)
    elif sys.platform == "darwin":
        subprocess.run(["open", folder])
    else:
        subprocess.run(["xdg-open", folder], stderr=subprocess.DEVNULL)


if __name__ == "__main__":
    main()
