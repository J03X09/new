import subprocess
import os
from pathlib import Path


def generate_thumbnails(clip_paths: list) -> dict:
    """Extract a JPEG thumbnail at the midpoint of each clip."""
    thumbnails = {}
    for path in clip_paths:
        if not os.path.exists(path):
            continue

        probe = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                path,
            ],
            capture_output=True, text=True,
        )
        try:
            duration = float(probe.stdout.strip())
        except ValueError:
            duration = 10.0

        midpoint = duration / 2
        thumb_path = str(Path(path).with_suffix(".jpg"))

        try:
            subprocess.run(
                [
                    "ffmpeg", "-y",
                    "-ss", str(midpoint),
                    "-i", path,
                    "-vframes", "1",
                    "-q:v", "2",
                    "-vf", "scale=360:640",
                    thumb_path,
                    "-loglevel", "error",
                ],
                check=True,
            )
            thumbnails[path] = thumb_path
        except subprocess.CalledProcessError:
            pass

    return thumbnails
