"""
FastAPI web server for the YouTube Shorts Football Clipper.
Run: python web/app.py
Open: http://localhost:8080
"""

import asyncio
import json
import os
import shutil
import sys
import uuid
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Add project root to path so clipper package is importable
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

app = FastAPI(title="Football Shorts Clipper", version="2.0")

CLIPS_ROOT = Path("clips")
CLIPS_ROOT.mkdir(exist_ok=True)

# In-memory job store  {job_id: state_dict}
JOBS: dict[str, dict] = {}


# ── Pydantic models ───────────────────────────────────────────────────────────

class ProcessRequest(BaseModel):
    url: str
    num_clips: int = 5
    quality: str = "720"
    model: str = "small"


class BatchRequest(BaseModel):
    urls: list[str]
    num_clips: int = 5
    quality: str = "720"
    model: str = "small"


# ── Pipeline ──────────────────────────────────────────────────────────────────

def _update(job_id: str, **kwargs: object) -> None:
    if job_id in JOBS:
        JOBS[job_id].update(kwargs)


async def _run_pipeline(job_id: str, url: str, num_clips: int, quality: str, model: str) -> None:
    from clipper.downloader import download_video
    from clipper.transcriber import extract_audio, transcribe_audio, get_video_duration
    from clipper.analyzer import find_viral_moments
    from clipper.editor import extract_clips_parallel
    from clipper.thumbnail import generate_thumbnails

    job_dir = CLIPS_ROOT / job_id
    temp_dir = job_dir / ".tmp"
    job_dir.mkdir(parents=True, exist_ok=True)
    temp_dir.mkdir(exist_ok=True)

    try:
        # 1 – Download
        _update(job_id, status="running", step="Downloading video…", progress=5)
        video_path, title, _ = await asyncio.to_thread(
            download_video, url, str(temp_dir), quality=quality
        )
        duration = await asyncio.to_thread(get_video_duration, video_path)
        _update(job_id, step=f"Downloaded: {title[:45]}", progress=25, title=title, duration=round(duration))

        # 2 – Transcribe
        _update(job_id, step="Transcribing audio with Whisper…", progress=28)
        audio_path = await asyncio.to_thread(extract_audio, video_path, str(temp_dir))
        transcript = await asyncio.to_thread(transcribe_audio, audio_path, model_size=model)
        segs = len(transcript.get("segments", []))
        _update(job_id, step=f"Transcribed {segs} segments", progress=50)

        # 3 – AI moment detection
        _update(job_id, step="AI identifying viral moments…", progress=52)
        clips_meta = await asyncio.to_thread(
            find_viral_moments, transcript, duration, num_clips, video_path
        )
        _update(
            job_id,
            step=f"Found {len(clips_meta)} moments",
            progress=60,
            clips_meta=[
                {"title": c.get("title"), "start": c.get("start"), "end": c.get("end")}
                for c in clips_meta
            ],
        )

        # 4 – Extract clips (parallel)
        _update(job_id, step="Extracting & encoding clips…", progress=62)
        output_paths = await asyncio.to_thread(
            extract_clips_parallel,
            video_path,
            clips_meta,
            str(job_dir),
            transcript.get("segments", []),
        )
        _update(job_id, progress=88)

        # 5 – Thumbnails
        _update(job_id, step="Generating thumbnails…", progress=90)
        thumbs = await asyncio.to_thread(generate_thumbnails, output_paths)

        # Build result payload
        clips_result = []
        for i, (path, meta) in enumerate(zip(output_paths, clips_meta)):
            if not os.path.exists(path):
                continue
            mb = round(os.path.getsize(path) / (1024 * 1024), 1)
            thumb = thumbs.get(path, "")
            fname = os.path.basename(path)
            thumb_fname = os.path.basename(thumb) if thumb else ""
            clips_result.append(
                {
                    "id": i + 1,
                    "filename": fname,
                    "title": meta.get("title", f"Clip {i + 1}"),
                    "description": meta.get("description", ""),
                    "caption": meta.get("caption", ""),
                    "start": round(meta.get("start", 0), 1),
                    "end": round(meta.get("end", 0), 1),
                    "duration": round(meta.get("end", 0) - meta.get("start", 0), 1),
                    "size_mb": mb,
                    "download_url": f"/clips/{job_id}/{fname}",
                    "thumbnail_url": f"/clips/{job_id}/{thumb_fname}" if thumb_fname else "",
                }
            )

        # Save metadata JSON
        metadata = {"job_id": job_id, "url": url, "title": title, "clips": clips_result}
        with open(job_dir / "metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)

        shutil.rmtree(str(temp_dir), ignore_errors=True)
        _update(job_id, status="done", step="Complete!", progress=100, clips=clips_result)

    except Exception as exc:
        shutil.rmtree(str(temp_dir), ignore_errors=True)
        _update(job_id, status="error", step=f"Error: {exc}", error=str(exc))


# ── API routes ────────────────────────────────────────────────────────────────

@app.post("/api/process")
async def process(request: ProcessRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())[:8]
    JOBS[job_id] = {
        "status": "queued", "step": "Queued", "progress": 0,
        "clips": [], "clips_meta": [], "error": None,
        "title": "", "duration": 0,
    }
    background_tasks.add_task(
        _run_pipeline, job_id, request.url, request.num_clips, request.quality, request.model
    )
    return {"job_id": job_id}


@app.post("/api/batch")
async def batch_process(request: BatchRequest, background_tasks: BackgroundTasks):
    job_ids = []
    for url in request.urls:
        job_id = str(uuid.uuid4())[:8]
        JOBS[job_id] = {
            "status": "queued", "step": "Queued", "progress": 0,
            "clips": [], "error": None, "title": url[:60], "duration": 0,
        }
        background_tasks.add_task(
            _run_pipeline, job_id, url, request.num_clips, request.quality, request.model
        )
        job_ids.append(job_id)
    return {"job_ids": job_ids}


@app.get("/api/progress/{job_id}")
async def stream_progress(job_id: str):
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")

    async def generate():
        while True:
            state = JOBS.get(job_id, {})
            yield f"data: {json.dumps(state)}\n\n"
            if state.get("status") in ("done", "error"):
                break
            await asyncio.sleep(0.4)

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.get("/api/job/{job_id}")
async def get_job(job_id: str):
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")
    return JOBS[job_id]


@app.get("/api/jobs")
async def list_jobs():
    return [{"job_id": k, **{f: v for f, v in s.items() if f != "clips"}} for k, s in JOBS.items()]


@app.delete("/api/job/{job_id}")
async def delete_job(job_id: str):
    JOBS.pop(job_id, None)
    job_dir = CLIPS_ROOT / job_id
    shutil.rmtree(str(job_dir), ignore_errors=True)
    return {"deleted": job_id}


# Serve generated clips & thumbnails
app.mount("/clips", StaticFiles(directory=str(CLIPS_ROOT)), name="clips")


@app.get("/")
async def root():
    return FileResponse(str(Path(__file__).parent / "static" / "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("web.app:app", host="0.0.0.0", port=8080, reload=False)
