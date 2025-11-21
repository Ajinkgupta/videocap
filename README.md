# Remotion Captioning Platform

A full-stack web application to upload videos, auto-generate captions (with Hinglish support), and render them using Remotion.

## Features

- **Video Upload**: Upload `.mp4` files.
- **Auto-Captioning**: Mock integration (ready for Whisper API) to generate captions.
- **Hinglish Support**: Renders Devanagari and Latin scripts correctly using Noto Sans.
- **Style Presets**: Choose between Standard, Top-Bar, and Karaoke styles.
- **Preview**: Real-time preview using `@remotion/player`.
- **Export**: Generates a CLI command to render the video (Server-side rendering ready with Docker).
- **SRT Export**: Download captions in SRT format.

## Setup & Run Locally

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

3.  **Render Video (CLI)**
    You can render the video using the command generated in the UI, or manually:
    ```bash
    npx remotion render remotion/index.ts CaptionedVideo out/video.mp4
    ```

## Deployment

### Vercel (Frontend Only)
Deploying to Vercel is straightforward for the Next.js frontend. However, server-side rendering with Remotion requires FFMPEG, which isn't available in standard Vercel functions.
- The "Export" feature in the UI provides a CLI command for local rendering.

### Render / Docker (Full Stack)
To enable server-side rendering, deploy using the provided `Dockerfile` on a platform like Render.
1.  Push to GitHub.
2.  Create a new Web Service on Render.
3.  Connect your repo.
4.  Select "Docker" as the environment.
5.  Deploy.

## Configuration

### Speech-to-Text (STT)
The current implementation uses a mock STT service in `lib/transcription.ts`.
To use OpenAI Whisper:
1.  Get an API key from OpenAI.
2.  Update `lib/transcription.ts` to call the Whisper API.
3.  Set `OPENAI_API_KEY` in `.env.local`.

## Project Structure

- `pages/`: Next.js pages and API routes.
- `remotion/`: Remotion components and composition.
- `public/uploads/`: Temporary storage for uploaded videos.
- `lib/`: Helper functions (transcription service).

## License
MIT
