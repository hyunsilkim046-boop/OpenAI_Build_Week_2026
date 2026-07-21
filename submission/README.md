# WhyRight submission handoff

The production app and every upload-ready submission artifact are organized
here.

## Upload-ready files

- `video/WhyRight_Build_Week_2026_Demo.mp4` — narrated 2:53.648 demo
- `video/WhyRight_Build_Week_2026_Demo.en.srt` — English captions
- `video/WhyRight_Thumbnail.png` — 16:9 YouTube/Devpost thumbnail
- `video/YOUTUBE_UPLOAD_COPY.md` — title, description, chapters, and settings
- `video/VERIFY.md` — duration, codec, decode, audio, and SHA-256 evidence
- `screenshots/` — three 1080p Devpost gallery images and captions

## Copy and deadline runbook

- `../docs/DEVPOST_SUBMISSION_COPY.md` — copy-ready English submission fields
- `../docs/MORNING_SUBMISSION_CHECKLIST_KO.md` — 06:30–08:30 KST runbook
- `../docs/DEMO_SCRIPT.md` — original shot plan plus produced-cut metadata
- `../docs/RSI_LOG.md` — three review, fix, and verification cycles

## Final submission status

1. **Completed:** production deployment and both live scenario flows at
   https://whyright-build-week-2026.vercel.app/.
2. **Completed:** Public YouTube upload and signed-out stream/decode check at
   https://youtu.be/9Qos6J0MOuI.
3. **Completed:** Devpost submission is public at
   https://devpost.com/software/whyright.
4. **Completed privately:** the Codex feedback Session ID and entrant
   declarations were supplied directly in Devpost and are intentionally omitted
   from this public repository.

No API key, Vercel token, entrant identity, or Codex feedback ID belongs in
this public folder.

## Remaining public-page cleanup

- YouTube still needs the current description from
  `video/YOUTUBE_UPLOAD_COPY.md`; the public description retains the
  `[LIVE_DEMO_URL]` placeholder, the recording-time 21-test wording, and the
  older privacy sentence.
- Attach `video/WhyRight_Build_Week_2026_Demo.en.srt` as the manual English
  subtitle track. Automatic captions exist, but no uploaded subtitle track is
  currently published.
- In the Devpost gallery, remove the trailing triple backticks from the caption
  “A real GPT-5.6 learner response to a diagnostic fraction hinge question.”
