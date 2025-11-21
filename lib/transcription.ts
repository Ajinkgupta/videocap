import fs from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
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
  const key = apiKey || process.env.GEMINI_API_KEY;

  // Check if API key is present
  if (!key) {
    console.warn("Missing GEMINI_API_KEY, returning mock captions.");
    
    try {
      const duration = await getVideoDuration(filePath);
      const mockCaptions: Caption[] = [];
      let currentTime = 0;
      const phrases = [
        "This is a dummy caption.",
        "Generated because no API key was provided.",
        "The video is playing smoothly.",
        "Add your Gemini Key to see real magic.",
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
        { start: 0, end: 2, text: "Mock Caption: Gemini API Key missing." },
        { start: 2, end: 5, text: "Please enter your API Key in the UI" },
        { start: 5, end: 8, text: "This is a fallback demonstration." }
      ];
    }
  }

  try {
    console.log(`Transcribing file with Gemini: ${filePath}`);
    
    const fileManager = new GoogleAIFileManager(key);
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType: "video/mp4", // Assuming MP4, could detect dynamically
      displayName: "Video for transcription",
    });

    console.log(`Uploaded file: ${uploadResult.file.uri}`);

    // Wait for file to be active
    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === "PROCESSING") {
        console.log("Processing file...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        file = await fileManager.getFile(uploadResult.file.name);
    }

    if (file.state === "FAILED") {
      throw new Error("Video processing failed.");
    }

    console.log("File processed. Generating content...");

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri
        }
      },
      { text: `Transcribe the audio in this video into Hinglish (Hindi + English mixed). 
      
      Return ONLY a valid JSON array of objects. 
      Each object MUST have exactly these three fields:
      - "start": number (start time in seconds)
      - "end": number (end time in seconds)
      - "text": string (the transcribed text)

      Example format:
      [
        { "start": 0, "end": 2.5, "text": "Hello doston, kaise ho aap?" },
        { "start": 2.5, "end": 5, "text": "Aaj hum coding karenge." }
      ]

      Do not wrap the result in markdown code blocks. Do not include any other text. Return just the JSON array.` }
    ]);

    const responseText = result.response.text();
    console.log("Gemini Response:", responseText.substring(0, 200) + "...");

    // Clean up response text if it contains markdown
    let cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Handle case where model returns an object wrapping the array
    if (cleanedText.startsWith('{') && cleanedText.endsWith('}')) {
       try {
         const parsed = JSON.parse(cleanedText);
         // If it's wrapped in a key like "json_array" or "captions", extract it
         const keys = Object.keys(parsed);
         if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
           cleanedText = JSON.stringify(parsed[keys[0]]);
         }
       } catch (e) {
         // Ignore parse error here, will fail below if invalid
       }
    }
    
    const segments = JSON.parse(cleanedText);

    // Cleanup file
    await fileManager.deleteFile(uploadResult.file.name);

    return segments.map((segment: any) => ({
      start: segment.start,
      end: segment.end,
      text: segment.text
    }));

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
