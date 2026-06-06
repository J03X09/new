import subprocess
import os
import re
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed


# ── Subtitle helpers ──────────────────────────────────────────────────────────

def _srt_timestamp(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def _build_srt(segments: list, clip_start: float, clip_end: float) -> str:
    """Build SRT subtitle content aligned to the clip's local timeline."""
    entries = []
    idx = 1
    for seg in segments:
        seg_start = seg["start"]
        seg_end = seg["end"]

        # Skip segments completely outside the clip window
        if seg_end <= clip_start or seg_start >= clip_end:
            continue

        local_start = max(0.0, seg_start - clip_start)
        local_end = min(clip_end - clip_start, seg_end - clip_start)
        text = seg["text"].strip()
        if not text:
            continue

        # Break long lines at word boundaries (~40 chars per line)
        words = text.split()
        lines, line = [], []
        char_count = 0
        for w in words:
            if char_count + len(w) > 38 and line:
                lines.append(" ".join(line))
                line = [w]
                char_count = len(w)
            else:
                line.append(w)
                char_count += len(w) + 1
        if line:
            lines.append(" ".join(line))
        display = "\n".join(lines).upper()

        entries.append(
            f"{idx}\n"
            f"{_srt_timestamp(local_start)} --> {_srt_timestamp(local_end)}\n"
            f"{display}\n"
        )
        idx += 1

    return "\n".join(entries)


# ── FFmpeg clip extraction ────────────────────────────────────────────────────

def _safe_title(title: str) -> str:
    return re.sub(r'[\\/:*?"<>|]', "", title)[:50].strip()


def _escape_ffmpeg_path(path: str) -> str:
    """Escape a file path for use inside an ffmpeg filter string."""
    return path.replace("\\", "\\\\").replace(":", "\\:")


def extract_clip(
    video_path: str,
    clip: dict,
    clip_idx: int,
    output_dir: str,
    segments: list,
) -> str:
    """Extract a single clip as a 1080×1920 YouTube Short with burned-in captions."""
    start = float(clip["start"])
    end = float(clip["end"])
    duration = end - start
    title = _safe_title(clip.get("title", f"clip_{clip_idx + 1}"))
    caption = clip.get("caption", "").upper()

    output_path = str(Path(output_dir) / f"short_{clip_idx + 1:02d}_{title}.mp4")
    srt_path = str(Path(output_dir) / f".tmp_sub_{clip_idx}.srt")

    # Write SRT
    srt_content = _build_srt(segments, start, end)
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write(srt_content)

    escaped_srt = _escape_ffmpeg_path(srt_path)

    # Subtitle style: Impact-style white text, thick black outline, lower-third
    sub_style = (
        "FontName=Impact,"
        "FontSize=78,"
        "PrimaryColour=&H00FFFFFF,"
        "OutlineColour=&H00000000,"
        "BackColour=&H80000000,"
        "Bold=-1,"
        "Outline=4,"
        "Shadow=2,"
        "Alignment=2,"
        "MarginV=130"
    )

    # Caption overlay at top of frame (shown for first 3.5 s)
    caption_escaped = caption.replace("'", "\\'").replace(":", "\\:")
    drawtext = (
        f"drawtext=text='{caption_escaped}':"
        f"fontsize=64:"
        f"fontcolor=white:"
        f"bordercolor=black:"
        f"borderw=4:"
        f"x=(w-tw)/2:"
        f"y=120:"
        f"enable='between(t,0,3.5)':"
        f"font='Impact'"
    )

    # Full filter chain: crop 9:16 → scale 1080×1920 → captions → top overlay
    vf = (
        f"crop=ih*9/16:ih:(iw-ih*9/16)/2:0,"
        f"scale=1080:1920:flags=lanczos,"
        f"subtitles='{escaped_srt}':force_style='{sub_style}',"
        f"{drawtext}"
    )

    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start),
        "-i", video_path,
        "-t", str(duration),
        "-vf", vf,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "20",
        "-profile:v", "high",
        "-level", "4.0",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-ar", "44100",
        "-movflags", "+faststart",
        "-threads", "0",
        output_path,
        "-loglevel", "error",
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        # Retry without subtitles filter if libass is unavailable
        vf_fallback = (
            f"crop=ih*9/16:ih:(iw-ih*9/16)/2:0,"
            f"scale=1080:1920:flags=lanczos,"
            f"{drawtext}"
        )
        cmd_fallback = [
            "ffmpeg", "-y",
            "-ss", str(start),
            "-i", video_path,
            "-t", str(duration),
            "-vf", vf_fallback,
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-profile:v", "high", "-level", "4.0", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
            "-movflags", "+faststart", "-threads", "0",
            output_path, "-loglevel", "error",
        ]
        subprocess.run(cmd_fallback, check=True)
        print(f"  Note: subtitles filter unavailable for clip {clip_idx + 1}, caption overlay only")

    # Clean up temp SRT
    try:
        os.remove(srt_path)
    except OSError:
        pass

    return output_path


def extract_clips_parallel(
    video_path: str,
    clips: list,
    output_dir: str,
    segments: list,
    max_workers: int = 3,
) -> list:
    """Extract all clips in parallel and return sorted output paths."""
    results = {}

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(extract_clip, video_path, clip, idx, output_dir, segments): idx
            for idx, clip in enumerate(clips)
        }

        for future in as_completed(futures):
            idx = futures[future]
            try:
                path = future.result()
                results[idx] = path
                size_mb = os.path.getsize(path) / (1024 * 1024)
                print(f"  ✓ Clip {idx + 1}: {os.path.basename(path)} ({size_mb:.1f} MB)")
            except Exception as e:
                print(f"  ✗ Clip {idx + 1} failed: {e}")

    return [results[i] for i in sorted(results)]
