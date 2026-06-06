import subprocess
import os
import re
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List


# ── Subtitle / caption helpers ────────────────────────────────────────────────

def _srt_ts(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int(round((seconds % 1) * 1000))
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def _build_word_srt(segments: list, clip_start: float, clip_end: float) -> str:
    """
    Build SRT using Whisper word-level timestamps for the viral 'pop-up' effect.
    Groups words into 2-3 word phrases so the text feels punchy, not flickery.
    Falls back to segment-level if word timestamps are absent.
    """
    entries: List[str] = []
    idx = 1

    for seg in segments:
        words = seg.get("words") or []

        if words:
            # ── Word-level: group into short phrases ──────────────────────────
            phrase_words: list = []
            phrase_start: float = 0.0
            phrase_end: float = 0.0

            def flush():
                nonlocal idx
                if not phrase_words:
                    return
                text = " ".join(w.get("word", "").strip() for w in phrase_words).upper()
                if not text:
                    return
                ls = max(0.0, phrase_start - clip_start)
                le = min(clip_end - clip_start, phrase_end - clip_start)
                if le > ls:
                    entries.append(f"{idx}\n{_srt_ts(ls)} --> {_srt_ts(le)}\n{text}\n")
                    idx += 1

            for wi in words:
                ws = float(wi.get("start", seg["start"]))
                we = float(wi.get("end", seg["end"]))

                # Skip words outside the clip
                if we <= clip_start or ws >= clip_end:
                    if phrase_words:
                        flush()
                        phrase_words = []
                    continue

                if not phrase_words:
                    phrase_start = ws

                phrase_words.append(wi)
                phrase_end = we

                # Flush after 3 words or when phrase is >1.4 s
                if len(phrase_words) >= 3 or (phrase_end - phrase_start) >= 1.4:
                    flush()
                    phrase_words = []

            flush()

        else:
            # ── Segment-level fallback ────────────────────────────────────────
            ss, se = float(seg["start"]), float(seg["end"])
            if se <= clip_start or ss >= clip_end:
                continue
            ls = max(0.0, ss - clip_start)
            le = min(clip_end - clip_start, se - clip_start)
            text = seg.get("text", "").strip().upper()
            # Wrap long lines
            words_flat = text.split()
            lines, line, n = [], [], 0
            for w in words_flat:
                if n + len(w) > 32 and line:
                    lines.append(" ".join(line))
                    line, n = [w], len(w)
                else:
                    line.append(w)
                    n += len(w) + 1
            if line:
                lines.append(" ".join(line))
            text = "\n".join(lines)
            if text and le > ls:
                entries.append(f"{idx}\n{_srt_ts(ls)} --> {_srt_ts(le)}\n{text}\n")
                idx += 1

    return "\n".join(entries)


# ── Clip extraction ───────────────────────────────────────────────────────────

def _safe_title(title: str) -> str:
    return re.sub(r'[\\/:*?"<>|]', "", title)[:48].strip() or "clip"


def _escape_filter_path(path: str) -> str:
    """Escape a file path for embedding inside an ffmpeg -vf string."""
    return path.replace("\\", "\\\\").replace("'", "\\'").replace(":", "\\:")


def extract_clip(
    video_path: str,
    clip: dict,
    clip_idx: int,
    output_dir: str,
    segments: list,
) -> str:
    """Produce a single 1080×1920 YouTube Short with pop-up captions."""
    start = float(clip["start"])
    end = float(clip["end"])
    duration = max(end - start, 5.0)
    title = _safe_title(clip.get("title", f"clip_{clip_idx + 1}"))
    caption = clip.get("caption", "").upper().strip()

    output_path = str(Path(output_dir) / f"short_{clip_idx + 1:02d}_{title}.mp4")
    srt_path = str(Path(output_dir) / f".sub_{clip_idx}.srt")

    # Write SRT
    srt_content = _build_word_srt(segments, start, end)
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write(srt_content)

    escaped_srt = _escape_filter_path(srt_path)

    # Subtitle style – Impact-style, lower-third, thick outline
    sub_style = (
        "FontName=Impact,"
        "FontSize=82,"
        "PrimaryColour=&H00FFFFFF,"
        "OutlineColour=&H00000000,"
        "BackColour=&H00000000,"
        "Bold=-1,"
        "Outline=5,"
        "Shadow=2,"
        "Alignment=2,"
        "MarginV=140"
    )

    # Caption banner shown for the first 3.5 s
    caption_esc = caption.replace("'", "\\'").replace(":", "\\:")
    drawtext = (
        f"drawtext="
        f"text='{caption_esc}':"
        f"font='Impact':"
        f"fontsize=68:"
        f"fontcolor=white:"
        f"bordercolor=black:"
        f"borderw=5:"
        f"x=(w-tw)/2:"
        f"y=110:"
        f"enable='between(t,0,3.5)'"
    )

    # Filter chain: crop centre to 9:16 → scale → pop-up captions → title banner
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
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise subprocess.CalledProcessError(result.returncode, cmd, result.stderr)
    except subprocess.CalledProcessError as exc:
        # Subtitles filter may fail if the SRT is empty; retry without it
        err = exc.stderr if hasattr(exc, "stderr") and exc.stderr else str(exc)
        print(f"  Retrying clip {clip_idx + 1} without subtitles filter… ({err[:80]})")
        vf_fallback = (
            f"crop=ih*9/16:ih:(iw-ih*9/16)/2:0,"
            f"scale=1080:1920:flags=lanczos,"
            f"{drawtext}"
        )
        cmd_fb = [
            "ffmpeg", "-y",
            "-ss", str(start), "-i", video_path,
            "-t", str(duration),
            "-vf", vf_fallback,
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-profile:v", "high", "-level", "4.0", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
            "-movflags", "+faststart", "-threads", "0",
            output_path, "-loglevel", "error",
        ]
        subprocess.run(cmd_fb, check=True)

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
    results: dict = {}
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futures = {
            ex.submit(extract_clip, video_path, clip, idx, output_dir, segments): idx
            for idx, clip in enumerate(clips)
        }
        for future in as_completed(futures):
            idx = futures[future]
            try:
                path = future.result()
                results[idx] = path
                mb = os.path.getsize(path) / (1024 * 1024) if os.path.exists(path) else 0
                print(f"  ✓ Clip {idx + 1}: {os.path.basename(path)} ({mb:.1f} MB)")
            except Exception as e:
                print(f"  ✗ Clip {idx + 1} failed: {e}")

    return [results[i] for i in sorted(results)]
