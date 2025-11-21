import { NextApiRequest, NextApiResponse } from 'next';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { videoUrl, captions, stylePreset, width, height } = req.body;

  if (!videoUrl || !captions) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), 'public', 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const compositionId = 'CaptionedVideo';
    const entry = path.join(process.cwd(), 'remotion', 'index.ts');
    
    console.log('Bundling...');
    const bundleLocation = await bundle({
      entryPoint: entry,
      webpackOverride: (config) => config, // Default webpack config
    });

    const inputProps = {
      videoSrc: videoUrl.startsWith('http') ? videoUrl : `http://${req.headers.host}${videoUrl}`,
      captions,
      stylePreset
    };

    console.log('Selecting composition...');
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    // Override dimensions if provided
    if (width) composition.width = width;
    if (height) composition.height = height;

    const fileName = `render-${Date.now()}.mp4`;
    const outputLocation = path.join(outputDir, fileName);

    console.log('Rendering to:', outputLocation);
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation,
      inputProps,
    });

    console.log('Render complete!');
    
    res.status(200).json({ 
      url: `/outputs/${fileName}`,
      message: "Render successful" 
    });

  } catch (error) {
    console.error('Render failed:', error);
    res.status(500).json({ error: 'Render failed', details: (error as Error).message });
  }
}
