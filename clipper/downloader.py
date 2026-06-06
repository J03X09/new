import yt_dlp
import os
from pathlib import Path


def download_video(url: str, output_dir: str, quality: str = "720") -> str:
    """Download a YouTube video and return the path to the downloaded file."""
    format_selector = (
        f"bestvideo[height<={quality}][ext=mp4]+bestaudio[ext=m4a]/"
        f"bestvideo[height<={quality}]+bestaudio/"
        f"best[height<={quality}][ext=mp4]/"
        f"best[height<={quality}]/"
        "best[ext=mp4]/best"
    )

    output_template = str(Path(output_dir) / "source.%(ext)s")

    ydl_opts = {
        "format": format_selector,
        "outtmpl": output_template,
        "merge_output_format": "mp4",
        "quiet": False,
        "no_warnings": False,
        "postprocessors": [{
            "key": "FFmpegVideoConvertor",
            "preferedformat": "mp4",
        }],
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        title = info.get("title", "video")
        duration = info.get("duration", 0)

    # Find the downloaded file
    for ext in ("mp4", "mkv", "webm", "avi"):
        candidate = str(Path(output_dir) / f"source.{ext}")
        if os.path.exists(candidate):
            return candidate, title, duration

    raise FileNotFoundError(f"Downloaded file not found in {output_dir}")
