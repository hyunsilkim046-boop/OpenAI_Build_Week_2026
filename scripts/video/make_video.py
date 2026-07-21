"""Build the narrated WhyRight submission video from verified app captures.

Requires Python 3.11, Pillow, edge-tts, FFmpeg and FFprobe. The script keeps
the narration, audio, composited slides, intermediate clips, subtitles and
verification frames under submission/video/work for reproducibility.
"""

from __future__ import annotations

import asyncio
import json
import os
import re
import shutil
import subprocess
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
import edge_tts


ROOT = Path(__file__).resolve().parents[2]
VIDEO_DIR = ROOT / "submission" / "video"
WORK_DIR = VIDEO_DIR / "work"
SLIDE_DIR = WORK_DIR / "slides"
AUDIO_DIR = WORK_DIR / "audio"
CLIP_DIR = WORK_DIR / "clips"
CHECK_DIR = WORK_DIR / "verification_frames"
SEGMENTS_FILE = Path(__file__).with_name("narration_segments.json")
FINAL_VIDEO = VIDEO_DIR / "WhyRight_Build_Week_2026_Demo.mp4"
FINAL_SRT = VIDEO_DIR / "WhyRight_Build_Week_2026_Demo.en.srt"
MOTION_SOURCE = WORK_DIR / "recordings" / "diagnostic_flow_rsi3_raw.webm"
MOTION_RANGES = {
    "03_probe": (36.6, 44.8),
    "04_live": (44.8, 51.4),
    "05_diagnose": (51.4, 56.6),
}

WIDTH, HEIGHT = 1920, 1080
CREAM = "#F5EEDC"
PAPER = "#FFFDF7"
DARK = "#13261D"
RED = "#C93F2B"
LIME = "#C7EA67"
INK = "#12231B"
MUTED = "#52665C"


def find_tool(name: str) -> str:
    found = shutil.which(name)
    if found:
        return found
    link = Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "WinGet" / "Links" / f"{name}.exe"
    if link.exists():
        return str(link)
    candidates = list(
        (Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "WinGet" / "Packages").glob(
            f"Gyan.FFmpeg_*/*/bin/{name}.exe"
        )
    )
    if candidates:
        return str(candidates[0])
    raise RuntimeError(f"{name} was not found")


FFMPEG = find_tool("ffmpeg")
FFPROBE = find_tool("ffprobe")


def run(command: list[str]) -> None:
    subprocess.run(command, cwd=ROOT, check=True)


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    path = Path("C:/Windows/Fonts") / name
    return ImageFont.truetype(str(path), size=size)


SERIF_BOLD = font("georgiab.ttf", 92)
SERIF_MEDIUM = font("georgiab.ttf", 64)
SANS_BOLD = font("arialbd.ttf", 34)
SANS = font("arial.ttf", 31)
SANS_SMALL = font("arial.ttf", 24)
MONO_BOLD = font("consolab.ttf", 25)


def draw_grid(draw: ImageDraw.ImageDraw) -> None:
    for x in range(0, WIDTH, 32):
        draw.line((x, 0, x, HEIGHT), fill="#E6DECA", width=1)
    for y in range(0, HEIGHT, 32):
        draw.line((0, y, WIDTH, y), fill="#E6DECA", width=1)


def fit_text(draw: ImageDraw.ImageDraw, text: str, max_width: int, initial_size: int, bold: bool = True):
    size = initial_size
    file_name = "arialbd.ttf" if bold else "arial.ttf"
    while size >= 18:
        candidate = font(file_name, size)
        if draw.textbbox((0, 0), text, font=candidate)[2] <= max_width:
            return candidate
        size -= 2
    return font(file_name, 18)


def draw_capture_overlay(segment: dict) -> Image.Image:
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rounded_rectangle((54, 42, 610, 100), radius=9, fill=(19, 38, 29, 238))
    draw.text((80, 58), segment["eyebrow"], font=MONO_BOLD, fill=LIME)
    draw.rectangle((0, 928, WIDTH, HEIGHT), fill=(19, 38, 29, 244))
    callout = segment["callout"]
    callout_font = fit_text(draw, callout, WIDTH - 220, 36, bold=True)
    draw.text((110, 975), callout, font=callout_font, fill=PAPER)
    draw.rectangle((74, 972, 84, 1020), fill=RED)
    return overlay


def add_capture_overlay(base: Image.Image, segment: dict) -> Image.Image:
    image = base.convert("RGB").resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    overlay = draw_capture_overlay(segment)
    return Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")


def draw_brand(draw: ImageDraw.ImageDraw) -> None:
    draw.text((110, 72), "Why", font=SERIF_MEDIUM, fill=INK)
    draw.text((255, 72), "Right", font=SERIF_MEDIUM, fill=RED)
    draw.line((252, 146, 425, 136), fill=RED, width=5)
    draw.text((1410, 92), "90-SECOND DIAGNOSTIC LAB", font=MONO_BOLD, fill=INK)
    draw.ellipse((1370, 99, 1388, 117), fill=LIME, outline=INK, width=3)


def draw_intro_or_outro(segment: dict) -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), CREAM)
    draw = ImageDraw.Draw(image)
    draw_grid(draw)
    draw_brand(draw)
    draw.line((110, 180, 1810, 180), fill="#A9A28F", width=2)
    draw.text((116, 270), segment["eyebrow"], font=MONO_BOLD, fill=RED)
    headline = segment["headline"]
    lines = headline.split("\n")
    y = 345
    for index, line in enumerate(lines):
        draw.text((110, y), line, font=SERIF_BOLD, fill=RED if index else INK)
        y += 126
    draw.rounded_rectangle((112, 730, 1810, 900), radius=18, fill=PAPER, outline=INK, width=3)
    draw.rectangle((112, 730, 131, 900), fill=LIME)
    callout_font = fit_text(draw, segment["callout"], 1530, 42, bold=True)
    draw.text((180, 790), segment["callout"], font=callout_font, fill=INK)
    draw.text((114, 982), "BUILT WITH CODEX + GPT-5.6", font=MONO_BOLD, fill=MUTED)
    draw.text((1510, 982), "WHYRIGHT / 2026", font=MONO_BOLD, fill=MUTED)
    return image


def draw_architecture(segment: dict) -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), CREAM)
    draw = ImageDraw.Draw(image)
    draw_grid(draw)
    draw_brand(draw)
    draw.text((110, 220), segment["eyebrow"], font=MONO_BOLD, fill=RED)
    draw.text((110, 296), segment["headline"], font=font("georgiab.ttf", 66), fill=INK)
    boxes = [
        ("CODEX BUILD ROLE", "Architecture, implementation\n& tests", "ADVERSARIAL REVIEWS + SUBMISSION"),
        ("GPT-5.6 RUNTIME", "student_reply\nresponse_mode", "FICTIONAL LEARNER ONLY"),
        ("TRUST BOUNDARY", "Encrypted state\n+ fixed scorer", "GENERATION IS NOT JUDGMENT"),
        ("VERIFICATION", "21 tests  |  8/8 probes", "MANUAL REVIEW STILL REQUIRED"),
    ]
    x_positions = [110, 970, 110, 970]
    y_positions = [480, 480, 725, 725]
    for index, (label, value, note) in enumerate(boxes):
        x, y = x_positions[index], y_positions[index]
        fill = DARK if index in (0, 2) else PAPER
        text_fill = PAPER if index in (0, 2) else INK
        draw.rounded_rectangle((x, y, x + 760, y + 195), radius=12, fill=fill, outline=INK, width=3)
        draw.text((x + 32, y + 26), label, font=MONO_BOLD, fill=LIME if index in (0, 2) else RED)
        value_font = fit_text(draw, value.split("\n")[0], 690, 40, bold=True)
        draw.multiline_text((x + 32, y + 70), value, font=value_font, fill=text_fill, spacing=4)
        draw.text((x + 32, y + 153), note, font=SANS_SMALL, fill=LIME if index in (0, 2) else MUTED)
    draw.rounded_rectangle((1300, 290, 1810, 386), radius=12, fill=LIME, outline=INK, width=3)
    draw.text((1340, 320), segment["callout"], font=MONO_BOLD, fill=INK)
    return image


def make_slides(segments: list[dict]) -> None:
    for segment in segments:
        if segment["kind"] == "screenshot":
            source = ROOT / segment["source"]
            if not source.exists():
                raise FileNotFoundError(source)
            slide = add_capture_overlay(Image.open(source), segment)
        elif segment["kind"] == "architecture":
            slide = draw_architecture(segment)
        else:
            slide = draw_intro_or_outro(segment)
        slide.save(SLIDE_DIR / f"{segment['id']}.png", optimize=True)
        if segment["id"] in MOTION_RANGES:
            draw_capture_overlay(segment).save(SLIDE_DIR / f"{segment['id']}_overlay.png", optimize=True)


async def make_audio(segments: list[dict]) -> None:
    voice = "en-US-AvaMultilingualNeural"
    for segment in segments:
        target = AUDIO_DIR / f"{segment['id']}.mp3"
        communicate = edge_tts.Communicate(segment["narration"], voice=voice, rate="-3%")
        await communicate.save(str(target))


def media_duration(path: Path) -> float:
    result = subprocess.run(
        [FFPROBE, "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def srt_time(seconds: float) -> str:
    milliseconds = round(seconds * 1000)
    hours, milliseconds = divmod(milliseconds, 3_600_000)
    minutes, milliseconds = divmod(milliseconds, 60_000)
    secs, milliseconds = divmod(milliseconds, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{milliseconds:03d}"


def make_srt(segments: list[dict], durations: list[float]) -> None:
    lines: list[str] = []
    cursor = 0.0
    for index, (segment, duration) in enumerate(zip(segments, durations), start=1):
        lines.append(str(index))
        lines.append(f"{srt_time(cursor)} --> {srt_time(cursor + duration - 0.15)}")
        lines.append("\n".join(textwrap.wrap(segment["narration"], width=72)))
        lines.append("")
        cursor += duration
    FINAL_SRT.write_text("\n".join(lines), encoding="utf-8")


def make_clips(segments: list[dict]) -> list[float]:
    durations: list[float] = []
    concat_lines: list[str] = []
    for segment in segments:
        audio = AUDIO_DIR / f"{segment['id']}.mp3"
        slide = SLIDE_DIR / f"{segment['id']}.png"
        clip = CLIP_DIR / f"{segment['id']}.mp4"
        audio_duration = media_duration(audio)
        duration = audio_duration + 0.45
        durations.append(duration)
        fade_out = max(duration - 0.42, 0)
        audio_fade_out = max(audio_duration - 0.18, 0)
        if segment["id"] in MOTION_RANGES:
            if not MOTION_SOURCE.exists():
                raise FileNotFoundError(MOTION_SOURCE)
            start, end = MOTION_RANGES[segment["id"]]
            motion_duration = end - start
            hold_duration = max(duration - motion_duration, 0)
            overlay = SLIDE_DIR / f"{segment['id']}_overlay.png"
            filters = (
                f"[0:v]trim=start={start}:end={end},setpts=PTS-STARTPTS,"
                f"scale={WIDTH}:{HEIGHT},fps=30,tpad=stop_mode=clone:stop_duration={hold_duration:.3f}[base];"
                f"[1:v]format=rgba[ov];[base][ov]overlay=0:0:shortest=1,format=yuv420p[v];"
                f"[2:a]afade=t=in:st=0:d=0.08,afade=t=out:st={audio_fade_out:.3f}:d=0.18,"
                f"apad=pad_dur=0.45[a]"
            )
            inputs = [
                "-i",
                str(MOTION_SOURCE),
                "-loop",
                "1",
                "-framerate",
                "30",
                "-i",
                str(overlay),
                "-i",
                str(audio),
            ]
        else:
            filters = (
                f"[0:v]scale={WIDTH}:{HEIGHT},"
                f"fade=t=in:st=0:d=0.35,fade=t=out:st={fade_out:.3f}:d=0.40,format=yuv420p[v];"
                f"[1:a]afade=t=in:st=0:d=0.08,afade=t=out:st={audio_fade_out:.3f}:d=0.18,"
                f"apad=pad_dur=0.45[a]"
            )
            inputs = [
                "-loop",
                "1",
                "-framerate",
                "30",
                "-i",
                str(slide),
                "-i",
                str(audio),
            ]
        run(
            [
                FFMPEG,
                "-y",
                *inputs,
                "-filter_complex",
                filters,
                "-map",
                "[v]",
                "-map",
                "[a]",
                "-t",
                f"{duration:.3f}",
                "-r",
                "30",
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-crf",
                "19",
                "-pix_fmt",
                "yuv420p",
                "-c:a",
                "aac",
                "-b:a",
                "192k",
                str(clip),
            ]
        )
        concat_lines.append(f"file '{clip.as_posix()}'")
    (WORK_DIR / "concat.txt").write_text("\n".join(concat_lines), encoding="utf-8")
    return durations


def concatenate() -> None:
    run(
        [
            FFMPEG,
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(WORK_DIR / "concat.txt"),
            "-c",
            "copy",
            "-movflags",
            "+faststart",
            str(FINAL_VIDEO),
        ]
    )


def verify_and_extract() -> dict:
    probe = subprocess.run(
        [
            FFPROBE,
            "-v",
            "error",
            "-show_entries",
            "format=duration,size:stream=index,codec_type,codec_name,width,height,r_frame_rate",
            "-of",
            "json",
            str(FINAL_VIDEO),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    metadata = json.loads(probe.stdout)
    duration = float(metadata["format"]["duration"])
    for old_frame in CHECK_DIR.glob("frame_*.png"):
        old_frame.unlink()
    checkpoints = [5.0, duration / 2, 116.0, 140.0, max(duration - 8, 0)]
    for index, timestamp in enumerate(checkpoints, start=1):
        run(
            [
                FFMPEG,
                "-y",
                "-ss",
                f"{timestamp:.3f}",
                "-i",
                str(FINAL_VIDEO),
                "-frames:v",
                "1",
                str(CHECK_DIR / f"frame_{index:02d}_{timestamp:06.2f}s.png"),
            ]
        )
    (WORK_DIR / "ffprobe.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return metadata


def main() -> None:
    for directory in (VIDEO_DIR, WORK_DIR, SLIDE_DIR, AUDIO_DIR, CLIP_DIR, CHECK_DIR):
        directory.mkdir(parents=True, exist_ok=True)
    segments = json.loads(SEGMENTS_FILE.read_text(encoding="utf-8"))
    (WORK_DIR / "narration_full.txt").write_text(
        "\n\n".join(f"{segment['id']}\n{segment['narration']}" for segment in segments),
        encoding="utf-8",
    )
    make_slides(segments)
    asyncio.run(make_audio(segments))
    durations = make_clips(segments)
    make_srt(segments, durations)
    concatenate()
    metadata = verify_and_extract()
    duration = float(metadata["format"]["duration"])
    if not 140 <= duration <= 175:
        raise RuntimeError(f"Final duration {duration:.3f}s is outside the required 140-175s window")
    streams = {stream["codec_type"]: stream for stream in metadata["streams"]}
    if streams.get("video", {}).get("codec_name") != "h264":
        raise RuntimeError("Final video is not H.264")
    if streams.get("audio", {}).get("codec_name") != "aac":
        raise RuntimeError("Final audio is not AAC")
    if (streams["video"].get("width"), streams["video"].get("height")) != (WIDTH, HEIGHT):
        raise RuntimeError("Final video resolution is not 1920x1080")
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
