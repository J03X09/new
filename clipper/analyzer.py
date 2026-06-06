import json
import os
import anthropic


def _format_transcript(segments: list) -> str:
    lines = []
    for seg in segments:
        start = seg["start"]
        end = seg["end"]
        text = seg["text"].strip()
        if text:
            lines.append(f"[{start:.1f}s-{end:.1f}s] {text}")
    return "\n".join(lines)


def _fallback_clips(duration: float, num_clips: int) -> list:
    """Generate evenly distributed clips when no usable transcript exists."""
    clip_dur = min(45, duration / num_clips)
    spacing = (duration - clip_dur * num_clips) / (num_clips + 1)
    clips = []
    for i in range(num_clips):
        start = spacing * (i + 1) + clip_dur * i
        end = start + clip_dur
        clips.append({
            "start": round(start, 1),
            "end": round(end, 1),
            "title": f"Epic Football Moment #{i + 1}",
            "description": "Viral football moment",
            "caption": f"MOMENT #{i + 1}",
        })
    return clips


def find_viral_moments(transcript: dict, duration: float, num_clips: int = 5) -> list:
    """Use Claude to identify the most viral-worthy football moments."""
    segments = transcript.get("segments", [])

    if not segments or duration < 30:
        return _fallback_clips(duration, num_clips)

    formatted = _format_transcript(segments)

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    prompt = f"""You are an expert viral content editor for football/soccer YouTube Shorts.

Analyze this transcript from a football video (total duration: {duration:.0f} seconds).
Identify the {num_clips} most viral-worthy moments to clip for YouTube Shorts.

Look for these high-engagement moments:
- Goals (scored or conceded), including build-up play
- Incredible saves or goalkeeping heroics
- Skill moves, dribbles, and nutmegs
- VAR reviews, controversial decisions, red cards, penalties
- Wild celebrations or emotional reactions
- Near-misses and last-minute drama
- Player confrontations or intense moments
- Crowd atmosphere at pivotal moments
- Tactical brilliance or shocking errors

TRANSCRIPT:
{formatted}

Return ONLY a valid JSON array with exactly {num_clips} objects. Each object must have:
- "start": float — start time in seconds (begin 2-3s BEFORE the key action)
- "end": float — end time in seconds (20–50 seconds after start, must be ≤ {duration:.0f})
- "title": string — punchy YouTube Shorts title (max 60 chars, no quotes)
- "description": string — one sentence on why this goes viral
- "caption": string — on-screen caption in ALL CAPS, max 6 words, very punchy

Rules:
- Clips must NOT overlap
- Each clip must be between 20 and 50 seconds long
- All timestamps must be within 0 and {duration:.0f}
- Return ONLY the JSON array, no markdown, no explanation"""

    message = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        clips = json.loads(raw)
    except json.JSONDecodeError:
        print("  Warning: Claude returned invalid JSON, using fallback clips")
        return _fallback_clips(duration, num_clips)

    # Clamp timestamps to valid range
    for clip in clips:
        clip["start"] = max(0.0, float(clip["start"]))
        clip["end"] = min(float(duration), float(clip["end"]))
        if clip["end"] - clip["start"] < 15:
            clip["end"] = min(duration, clip["start"] + 30)

    return clips
