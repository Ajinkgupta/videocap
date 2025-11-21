import fs from 'fs';
import OpenAI from 'openai';
import ffmpeg from 'fluent-ffmpeg';

export interface Caption {
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

export async function transcribeVideo(filePath: string, apiKey?: string): Promise<Caption[]> {
  const key = apiKey || process.env.OPENAI_API_KEY;

  // Check if API key is present
  if (!key) {
    console.warn("Missing OPENAI_API_KEY, returning mock captions.");
    
    try {
      const duration = await getVideoDuration(filePath);
      const mockCaptions: Caption[] = [];
      let currentTime = 0;
      const phrases = [
        "This is a dummy caption.",
        "Generated because no API key was provided.",
        "The video is playing smoothly.",
        "Add your OpenAI Key to see real magic.",
        "Videocap makes captioning easy.",
        "Just a placeholder text here.",
        "Look at these beautiful subtitles.",
        "Rendering works perfectly too."
      ];
      
      let i = 0;
      while (currentTime < duration) {
        const segmentDuration = 1.5 + Math.random() * 2.5; // Random duration between 1.5s - 4s
        const text = phrases[i % phrases.length];
        
        // Ensure we don't go past the video end
        const endTime = Math.min(currentTime + segmentDuration, duration);
        
        mockCaptions.push({
          start: currentTime,
          end: endTime,
          text: text
        });
        
        currentTime = endTime;
        i++;
        
        if (currentTime >= duration) break;
      }
      
      return mockCaptions;
    } catch (e) {
      console.error("Failed to get video duration for mock captions", e);
      return [
        { start: 0, end: 2, text: "Mock Caption: OpenAI API Key missing." },
        { start: 2, end: 5, text: "Please enter your API Key in the UI" },
        { start: 5, end: 8, text: "This is a fallback demonstration." }
      ];
    }
  }

  try {
    const openai = new OpenAI({ apiKey: key });

    
    console.log(`Transcribing file: ${filePath}`);
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"]
    });

    const segments = transcription.segments || [];

    return segments.map((segment: any) => ({
      start: segment.start,
      end: segment.end,
      text: segment.text
    }));
  } catch (error) {
    console.error("OpenAI Whisper API Error:", error);
    throw error;
  }
}
