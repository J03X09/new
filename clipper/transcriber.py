import subprocess
import os
from pathlib import Path


def extract_audio(video_path: str, output_dir: str) -> str:
    """Extract mono 16kHz WAV audio from a video file for Whisper."""
    audio_path = str(Path(output_dir) / "audio.wav")
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        audio_path,
        "-loglevel", "error",
    ]
    subprocess.run(cmd, check=True)
    return audio_path


def transcribe_audio(audio_path: str, model_size: str = "small") -> dict:
    """Transcribe audio using OpenAI Whisper and return segments with timestamps."""
    import whisper

    model = whisper.load_model(model_size)
    result = model.transcribe(
        audio_path,
        word_timestamps=True,
        verbose=False,
        task="transcribe",
    )
    return result


def get_video_duration(video_path: str) -> float:
    """Get video duration in seconds using ffprobe."""
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        video_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(result.stdout.strip())
