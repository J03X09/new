import json
import os
import anthropic

from .scene_detector import detect_scene_changes, scene_clips


def _format_transcript(segments: list) -> str:
    return "\n".join(
        f"[{seg['start']:.1f}s-{seg['end']:.1f}s] {seg['text'].strip()}"
        for seg in segments
        if seg.get("text", "").strip()
    )


def _parse_clips(raw: str) -> list:
    text = raw.strip()
    if text.startswith("```"):
        parts = text.split("```")
        text = parts[1].lstrip("json").strip()
    return json.loads(text)


def find_viral_moments(
    transcript: dict,
    duration: float,
    num_clips: int = 5,
    video_path: str = "",
) -> list:
    """
    Use Claude to pick the most viral football moments from the transcript.
    Falls back to scene-detection when there is little usable speech.
    """
    segments = transcript.get("segments", [])
    total_speech = sum(
        len(s.get("text", "").strip()) for s in segments
    )

    # ── Scene-detection fallback ──────────────────────────────────────────────
    if total_speech < 200 and video_path:
        print("  Low speech detected — using scene-change analysis instead")
        timestamps = detect_scene_changes(video_path)
        return scene_clips(timestamps, duration, num_clips=num_clips)

    if not segments:
        from .scene_detector import scene_clips as _sc
        timestamps = detect_scene_changes(video_path) if video_path else []
        return _sc(timestamps, duration, num_clips=num_clips)

    # ── Claude AI analysis ────────────────────────────────────────────────────
    formatted = _format_transcript(segments)

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    prompt = f"""You are a viral football/soccer content editor specialising in YouTube Shorts.

Analyse this transcript from a football video (total duration: {duration:.0f} seconds) and select the {num_clips} best moments for viral Shorts.

High-value moments to look for:
• Goals (build-up, finish, celebration)
• Incredible saves or keeper heroics
• Skill moves, nutmegs, dribbles
• VAR reviews, red cards, controversial decisions
• Penalties – spot kicks and run-ups
• Last-minute drama or comebacks
• Wild crowd reactions
• Player confrontations or post-match emotions
• Tactical masterclasses or shocking blunders

TRANSCRIPT:
{formatted}

Return ONLY a valid JSON array of exactly {num_clips} objects. Each object:
  "start"       – float, seconds before key action (give 2-3 s lead-in)
  "end"         – float, seconds, 20-50 s after start, max {duration:.0f}
  "title"       – string, punchy YouTube Shorts title ≤ 60 chars
  "description" – string, one sentence why this goes viral
  "caption"     – string, ALL CAPS on-screen text ≤ 6 words, very punchy

Constraints:
- Clips must NOT overlap
- Each clip must be 20–50 seconds long
- All timestamps within 0 and {duration:.0f}
- Output ONLY the JSON array, no markdown, no explanation"""

    message = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text

    try:
        clips = _parse_clips(raw)
    except (json.JSONDecodeError, IndexError, KeyError):
        print("  Warning: Claude returned invalid JSON — using scene fallback")
        timestamps = detect_scene_changes(video_path) if video_path else []
        return scene_clips(timestamps, duration, num_clips=num_clips)

    # Sanitise timestamps
    for clip in clips:
        clip["start"] = max(0.0, float(clip.get("start", 0)))
        clip["end"] = min(float(duration), float(clip.get("end", 40)))
        if clip["end"] - clip["start"] < 15:
            clip["end"] = min(duration, clip["start"] + 30)

    return clips
