import React from 'react';
import { AbsoluteFill, Video, useCurrentFrame, useVideoConfig } from 'remotion';

interface Caption {
  start: number;
  end: number;
  text: string;
}

export type CaptionStyle = 'standard' | 'top-bar' | 'karaoke';

interface CaptionedVideoProps {
  videoSrc: string;
  captions: Caption[];
  stylePreset?: CaptionStyle;
}

export const CaptionedVideo: React.FC<CaptionedVideoProps> = ({ videoSrc, captions, stylePreset = 'standard' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!videoSrc) {
    return <AbsoluteFill style={{ backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', color: 'white' }}>No Video Source</AbsoluteFill>;
  }

  const currentTime = frame / fps;
  const activeCaption = captions.find(
    (caption) => currentTime >= caption.start && currentTime <= caption.end
  );

  const getStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      color: 'white',
      fontSize: 50,
      textShadow: '2px 2px 4px black',
      textAlign: 'center',
      fontFamily: '"Noto Sans", "Noto Sans Devanagari", sans-serif',
      padding: '10px 20px',
    };

    switch (stylePreset) {
      case 'top-bar':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(0,0,0,0.7)',
          width: '100%',
          position: 'absolute',
          top: '5%',
        };
      case 'karaoke':
        return {
          ...baseStyle,
          color: '#FFD700', // Gold
          textShadow: '3px 3px 0px #000',
          fontSize: 60,
          fontWeight: 'bold',
          bottom: '15%',
          position: 'absolute',
        };
      case 'standard':
      default:
        return {
          ...baseStyle,
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: '10px',
          bottom: '15%',
          position: 'absolute',
        };
    }
  };

  return (
    <AbsoluteFill>
      <Video src={videoSrc} />
      {activeCaption && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={getStyle()}>
             {activeCaption.text}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
