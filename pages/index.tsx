import React, { useState } from 'react';
import Head from 'next/head';
import { Player } from '@remotion/player';
import { CaptionedVideo, CaptionStyle } from '../remotion/CaptionedVideo';
import { generateSRT } from '../lib/srt';
import { demoCaptions } from '../lib/demo';

interface Caption {
  start: number;
  end: number;
  text: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [generatingCaptions, setGeneratingCaptions] = useState(false);
  const [stylePreset, setStylePreset] = useState<CaptionStyle>('standard');
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({ width: 1080, height: 1920 });
  const [rendering, setRendering] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [durationInFrames, setDurationInFrames] = useState<number>(300);
  const [showOriginal, setShowOriginal] = useState(false);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const { videoWidth, videoHeight, duration } = e.currentTarget;
    setVideoDimensions({ width: videoWidth, height: videoHeight });
    if (duration) {
      setDurationInFrames(Math.ceil(duration * 30));
    }
  };

  const handleExport = async () => {
    setRendering(true);
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoUrl, 
          captions, 
          stylePreset,
          width: videoDimensions.width,
          height: videoDimensions.height
        }),
      });
      const data = await res.json();
      if (data.url) {
        setDownloadUrl(data.url);
      }
    } catch (error) {
      console.error('Export failed', error);
    } finally {
      setRendering(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setVideoUrl(null);
      setCaptions([]);
      setDownloadUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setVideoUrl(data.url);
      }
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateCaptions = async () => {
    if (!videoUrl) return;
    setGeneratingCaptions(true);
    try {
      const res = await fetch('/api/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl, apiKey }),
      });
      const data = await res.json();
      if (data.captions) {
        setCaptions(data.captions);
      }
    } catch (error) {
      console.error('Caption generation failed', error);
    } finally {
      setGeneratingCaptions(false);
    }
  };

  const handleDownloadSRT = () => {
    if (captions.length === 0) return;
    const srtContent = generateSRT(captions);
    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captions.srt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetProject = () => {
    setFile(null);
    setVideoUrl(null);
    setCaptions([]);
    setDownloadUrl(null);
  };

  const loadDemo = () => {
    setFile(null);
    setVideoUrl('/uploads/demo.mp4');
    setCaptions(demoCaptions);
    setVideoDimensions({ width: 1920, height: 1080 }); // Landscape demo video
    setDurationInFrames(31 * 30); // ~30s video
    setDownloadUrl('/outputs/demo-captioned.mp4');
  };

  return (
    <div className="app-container">
      <Head>
        <title>Videocap - AI Video Captioning</title>
      </Head>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          video<span>cap</span>
        </div>
        
        <button onClick={resetProject} className="btn btn-primary btn-full" style={{ marginBottom: '2rem' }}>
          + New Project
        </button>

        <div style={{ marginTop: 'auto', padding: '1rem', background: '#f1f5f9', borderRadius: '8px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--secondary)' }}>
            OpenAI API Key
          </label>
          <input 
            type="password" 
            placeholder="sk-..." 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              borderRadius: '4px', 
              border: '1px solid var(--border)',
              fontSize: '0.85rem'
            }}
          />
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Required for real captions.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <div style={{ fontWeight: 600 }}>
            {file ? file.name : 'Untitled Project'}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
             {/* Header Actions if needed */}
          </div>
        </header>

        <div className="workspace">
          {!videoUrl ? (
            <div className="upload-zone">
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem', color: '#cbd5e1' }}>☁️</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Upload your video</h2>
              <p style={{ color: 'var(--secondary)', marginBottom: '2rem' }}>MP4 files supported. Max 50MB.</p>
              
              <input 
                type="file" 
                accept="video/mp4" 
                onChange={handleFileChange} 
                id="file-upload"
                style={{ display: 'none' }}
              />
              
              {!file ? (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <label htmlFor="file-upload" className="btn btn-primary">
                    Select File
                  </label>
                  <span style={{ color: 'var(--text-muted)' }}>or</span>
                  <button onClick={loadDemo} className="btn btn-secondary">
                    Try Demo Video
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ marginBottom: '1rem', fontWeight: 500 }}>{file.name}</p>
                  <button 
                    onClick={handleUpload} 
                    disabled={uploading} 
                    className="btn btn-primary"
                  >
                    {uploading ? 'Uploading...' : 'Start Upload'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="editor-grid">
              {/* Left: Preview */}
              <div className="preview-panel" style={{ overflow: 'hidden', padding: '1rem' }}>
                {captions.length > 0 ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                       <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer', background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                          <input 
                            type="checkbox" 
                            checked={showOriginal} 
                            onChange={(e) => setShowOriginal(e.target.checked)} 
                          />
                          Compare Original
                       </label>
                    </div>
                    <Player
                      component={CaptionedVideo as any}
                      inputProps={{
                        videoSrc: videoUrl,
                        captions: showOriginal ? [] : captions,
                        stylePreset: stylePreset,
                      }}
                      durationInFrames={durationInFrames}
                      compositionWidth={videoDimensions.width}
                      compositionHeight={videoDimensions.height}
                      fps={30}
                      style={{
                        width: '100%',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        aspectRatio: `${videoDimensions.width} / ${videoDimensions.height}`,
                        flex: 1
                      }}
                      controls
                    />
                  </div>
                ) : (
                  <video 
                    src={videoUrl} 
                    controls 
                    onLoadedMetadata={handleLoadedMetadata}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                    }} 
                  />
                )}
              </div>

              {/* Right: Controls */}
              <div className="controls-panel">
                
                {/* Section 1: Transcription */}
                <div className="panel-section">
                  <div className="panel-title">
                    <span>📝</span> Transcription
                  </div>
                  
                  {captions.length === 0 ? (
                    <div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '1rem' }}>
                        Generate AI captions for your video.
                      </p>
                      <button 
                        onClick={handleGenerateCaptions} 
                        disabled={generatingCaptions}
                        className="btn btn-primary btn-full"
                      >
                        {generatingCaptions ? 'Generating...' : '✨ Auto-Caption'}
                      </button>
                    </div>
                  ) : (
                    <div className="status-badge">
                      ✓ Captions Generated ({captions.length} segments)
                    </div>
                  )}
                </div>

                {/* Section 2: Styling */}
                {captions.length > 0 && (
                  <div className="panel-section">
                    <div className="panel-title">
                      <span>🎨</span> Style
                    </div>
                    
                    <div className="control-group">
                      <label className="control-label">Preset</label>
                      <select 
                        value={stylePreset} 
                        onChange={(e) => setStylePreset(e.target.value as CaptionStyle)}
                      >
                        <option value="standard">Standard (Bottom)</option>
                        <option value="top-bar">Top Bar (News)</option>
                        <option value="karaoke">Karaoke (Gold)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Section 3: Export */}
                {captions.length > 0 && (
                  <div className="panel-section">
                    <div className="panel-title">
                      <span>📤</span> Export
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <button onClick={handleDownloadSRT} className="btn btn-secondary btn-full">
                        Download .SRT
                      </button>
                      
                      {downloadUrl && (
                        <a 
                          href={downloadUrl} 
                          download="captioned-video.mp4"
                          className="btn btn-success btn-full"
                          style={{ textDecoration: 'none' }}
                        >
                          ⬇️ Download Video
                        </a>
                      )}

                      <button 
                        onClick={handleExport} 
                        disabled={rendering}
                        className="btn btn-primary btn-full"
                      >
                        {rendering ? 'Rendering Video...' : (downloadUrl ? 'Re-render Video' : 'Render & Download Video')}
                      </button>
                    </div>
                    
                    {rendering && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--secondary)', marginTop: '1rem', textAlign: 'center' }}>
                        Rendering might take a minute. Please wait...
                      </p>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
