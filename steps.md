# Implementation Steps — Remotion Captioning Platform

This document outlines a practical plan and commands to implement, run, and deploy the Remotion captioning platform.

Environment
-----------
- Node.js: 18.x or 20.x recommended
- npm or pnpm
- Optional: Docker for containerized runs

Local Setup (quick)
-------------------
1. Clone repository:

   git clone <your-repo-url>
   cd videocap

2. Install dependencies:

   npm install

3. Run dev server (Next.js + Remotion):

   npm run dev

High-Level Implementation Steps
-------------------------------
1. Scaffold Next.js app with Remotion
   - Use `create-next-app` or Remotion template
   - Add `remotion` package and `@remotion/player`

2. Build upload UI
   - Create a page `pages/index.tsx` with an upload input for `.mp4`
   - Store uploads temporarily (local path or cloud bucket)

3. Speech-to-Text (Auto-generate captions)
   - Implement a server API route `pages/api/caption` that accepts a video path or file and calls an STT provider
   - Suggested providers: OpenAI Whisper API, AssemblyAI
   - Return results as an array of { start, end, text }

4. Caption format and Hinglish rendering
   - Normalize timestamps and produce SRT/VTT if needed
   - Install `Noto Sans` and `Noto Sans Devanagari` fonts and load them in Remotion for proper Devanagari rendering

5. Remotion composition
   - Create a composition `src/VideoComposition` that accepts `videoSrc`, `captions`, and `stylePreset`
   - Implement 2–3 styles: bottom-centered, top-bar, karaoke (simple highlight)

6. Preview and export
   - Use `@remotion/player` for in-browser preview
   - Provide a server-side render path / CLI command using Remotion’s `renderMedia` for final MP4 export

7. Deployment
   - Deploy Next.js + Remotion to a host that supports server environments (Vercel or Render). For heavy Remotion rendering consider using Render or a server with enough CPU.

8. Documentation & sample assets
   - Add `README.md` with setup steps, STT provider details, and deployment notes
   - Include at least one sample `.mp4` and its captioned `.mp4`

Commands (example)
------------------
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm start`
- Remotion render (example CLI):

  npx remotion render ./src/index.tsx MyComp out/video.mp4 --webpack-cache

Notes & Integrations
---------------------
- STT: Document the exact API used and how to set API keys (env vars) in `README.md`.
- Fonts: Add `@font-face` usage inside Remotion root so both Latin and Devanagari scripts render correctly.
- Storage: For production, use S3/GCS for uploads; use signed URLs for secure upload/download.

Next Steps (implementation order)
1. Scaffold repo (Next.js + Remotion). 2. Upload UI. 3. STT API route. 4. Remotion composition & styles. 5. Preview & render. 6. Documentation, sample assets, deploy.
