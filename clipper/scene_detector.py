import subprocess
import re
from typing import List


def detect_scene_changes(video_path: str, threshold: float = 0.3, min_gap: float = 8.0) -> List[float]:
    """Return timestamps (seconds) of significant scene changes via FFmpeg."""
    cmd = [
        "ffmpeg", "-i", video_path,
        "-vf", f"select=gt(scene\\,{threshold}),showinfo",
        "-vsync", "vfr", "-f", "null", "-",
        "-loglevel", "error",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)

    timestamps: List[float] = []
    for line in result.stderr.split("\n"):
        if "pts_time" in line:
            m = re.search(r"pts_time:(\d+\.?\d*)", line)
            if m:
                t = float(m.group(1))
                if not timestamps or t - timestamps[-1] >= min_gap:
                    timestamps.append(round(t, 2))

    return timestamps


def scene_clips(
    timestamps: List[float],
    duration: float,
    num_clips: int = 5,
    clip_duration: float = 38.0,
) -> List[dict]:
    """Convert scene-change timestamps into clip dicts ready for the editor."""
    candidates = timestamps[:]

    # If not enough scene changes, fill with evenly-spaced positions
    if len(candidates) < num_clips:
        gap = duration / (num_clips + 1)
        for i in range(1, num_clips + 1):
            t = gap * i
            if not any(abs(t - c) < 10 for c in candidates):
                candidates.append(t)
    candidates.sort()

    clips = []
    last_end = -1.0
    for ts in candidates:
        if len(clips) >= num_clips:
            break
        start = max(0.0, ts - 2.0)
        if start < last_end + 5.0:
            continue
        end = min(duration, start + clip_duration)
        clips.append(
            {
                "start": round(start, 1),
                "end": round(end, 1),
                "title": f"Football Highlight #{len(clips) + 1}",
                "description": "Viral football moment detected via scene analysis",
                "caption": "WATCH THIS",
            }
        )
        last_end = end

    # Top up if still short
    while len(clips) < num_clips:
        i = len(clips)
        gap = duration / (num_clips + 1)
        start = round(gap * (i + 1), 1)
        end = round(min(duration, start + clip_duration), 1)
        clips.append(
            {
                "start": start,
                "end": end,
                "title": f"Football Highlight #{i + 1}",
                "description": "Viral football moment",
                "caption": f"INCREDIBLE #{i + 1}",
            }
        )

    return clips[:num_clips]
