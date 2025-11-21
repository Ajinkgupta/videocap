import { Caption } from './transcription';

function formatTime(seconds: number): string {
  const date = new Date(0);
  date.setMilliseconds(seconds * 1000);
  const hh = date.getUTCHours().toString().padStart(2, '0');
  const mm = date.getUTCMinutes().toString().padStart(2, '0');
  const ss = date.getUTCSeconds().toString().padStart(2, '0');
  const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
  return `${hh}:${mm}:${ss},${ms}`;
}

export function generateSRT(captions: Caption[]): string {
  return captions
    .map((caption, index) => {
      return `${index + 1}\n${formatTime(caption.start)} --> ${formatTime(caption.end)}\n${caption.text}\n`;
    })
    .join('\n');
}
