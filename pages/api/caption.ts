import { NextApiRequest, NextApiResponse } from 'next';
import { transcribeVideo } from '../../lib/transcription';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { videoUrl, apiKey } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Video URL is required' });
  }

  try {
    // Convert public URL to file path
    // videoUrl is like /uploads/filename.mp4
    const fileName = path.basename(videoUrl);
    const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);

    const captions = await transcribeVideo(filePath, apiKey);
    res.status(200).json({ captions });
  } catch (error) {
    console.error('Transcription failed:', error);
    res.status(500).json({ error: 'Transcription failed' });
  }
}
