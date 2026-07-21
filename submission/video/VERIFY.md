# WhyRight video verification

- Final file: `WhyRight_Build_Week_2026_Demo.mp4`
- Duration: 173.647982 seconds (2:53.648, below three minutes)
- Video: H.264, 1920x1080, 30 fps, yuv420p
- Audio: AAC LC, 24 kHz mono, English neural TTS narration
- File size: 5,887,802 bytes
- Full decode: passed (`ffmpeg -v error`, exit code 0)
- Audio level: mean -19.7 dB, peak -2.3 dB; no silence longer than 3 seconds
- Captions: 9 entries; final cue ends at 173.436 seconds, 0.212 seconds before the video ends
- SHA-256: `A56D5904D1B137316F7F350B1E523FEE1E7C036C22072BCFC0E800B933F53825`

## Demonstrated flow

1. WhyRight premise and two synthetic case choices.
2. Mathematics case starts with four plausible misconceptions.
3. The teacher types and sends the fraction transfer question; the real loading
   state is visible in the browser capture.
4. The live GPT-5.6 API response appears in the app transcript: “I think it'll
   be greater than eight, because multiplying a positive number should make it
   bigger.”
5. H2, H3, and H4 are removed while H1 remains.
6. H1 is locked as the final diagnosis.
7. The fixed scorer returns 100/100 with the 70/10/20 breakdown.
8. The final trust-boundary card explains that Codex shaped the concept and
   built the Next.js architecture, implementation, tests, adversarial reviews,
   and submission package, while GPT-5.6 generates only the fictional learner
   reply and response mode at runtime.
9. The card reports 21 passing tests and 8/8 fixed probes passing automatic
   signal checks, with manual review still required.

## Visual inspection frames

- `work/verification_frames/frame_01_005.00s.png` - opening title
- `work/verification_frames/frame_motion_055.65s.png` - question typed
- `work/verification_frames/frame_motion_069.90s.png` - live loading state
- `work/verification_frames/frame_motion_072.50s.png` - live GPT-5.6 response
- `work/verification_frames/frame_motion_089.10s.png` - H1 retained after H2/H3/H4 removal
- `work/verification_frames/frame_02_086.82s.png` - diagnosis transition
- `work/verification_frames/frame_03_116.00s.png` - deterministic 100/100 score
- `work/verification_frames/frame_04_140.00s.png` - architecture and verification
- `work/verification_frames/frame_05_165.65s.png` - closing title

No API key, local filesystem path, personal information, or real student data is
visible in the video.
