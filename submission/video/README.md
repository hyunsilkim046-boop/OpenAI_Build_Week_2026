# WhyRight submission video

The final narrated demo is `WhyRight_Build_Week_2026_Demo.mp4`. The folder also
contains English captions, a 16:9 custom thumbnail, verified upload copy, and a
technical verification record.

The 2:53.648 video is assembled from verified 1920x1080 captures of the running
app. Its browser sequence preserves the real question typing, send action,
loading state, GPT-5.6 response, and candidate reduction. The English narration,
raw browser recording, intermediate audio, composited slides, captions, encoded
clips, FFprobe report, and verification frames are preserved locally under
`work/`. That reproducible render workspace is intentionally ignored by Git;
the final MP4, captions, and verification record are committed.

The final architecture card makes the boundary explicit: Codex shaped the
concept and built the Next.js architecture, implementation, tests, adversarial
reviews, and submission package. GPT-5.6 supplies only a fictional learner
reply and response mode at runtime; encrypted state and fixed TypeScript own the
answer key and scoring. See `VERIFY.md` for the decode, audio, captions, and
SHA-256 evidence.

Rebuild from the original local working copy after verified captures exist:

```powershell
py -3.11 scripts/video/make_video.py
```

Requirements: Python 3.11, Pillow, edge-tts, FFmpeg, and FFprobe.
