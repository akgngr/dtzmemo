'use client';

/**
 * Convert any browser-recorded audio blob (webm/opus, mp4, ogg) to a
 * 16-bit mono PCM WAV file at 44.1 kHz, returned as a base64 string.
 *
 * GLM-4-Voice expects base64-encoded WAV (mono, 16-bit, 44100 Hz).
 *
 * The conversion pipeline:
 *   Blob → ArrayBuffer → AudioContext.decodeAudioData → AudioBuffer
 *       → OfflineAudioContext (resample + downmix to mono) → Float32Array
 *       → 16-bit PCM → WAV file → base64
 */
export async function audioBlobToWavBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();

  // Decode using a temporary AudioContext. Browser supports decoding webm/opus natively.
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const tmpCtx = new AudioCtx();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await tmpCtx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    tmpCtx.close();
  }

  // Resample to 44100 Hz mono using OfflineAudioContext.
  const targetSampleRate = 44100;
  const numFrames = Math.ceil(audioBuffer.duration * targetSampleRate);
  const offlineCtx = new OfflineAudioContext(1, numFrames, targetSampleRate);

  // Source from the original buffer
  const source = offlineCtx.createBufferSource();
  // Re-render the original buffer at the offline context's sample rate.
  // We need to copy channel data into a new buffer compatible with offlineCtx.
  const offlineBuffer = offlineCtx.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
    offlineBuffer.copyToChannel(audioBuffer.getChannelData(c), c);
  }
  source.buffer = offlineBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);

  const rendered = await offlineCtx.startRendering();

  // Now we have a mono 44100Hz AudioBuffer. Convert Float32 PCM to 16-bit PCM.
  const samples = rendered.getChannelData(0);
  const dataLength = samples.length * 2; // 2 bytes per sample
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  // ArrayBuffer → base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000; // 32k chunks to avoid call stack limits
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk) as unknown as number[]);
  }
  return btoa(binary);
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Play a base64-encoded WAV audio string. Returns an HTMLAudioElement that
 * can be controlled (pause, seek). Throws if the data is invalid.
 */
export function playWavBase64(base64: string): HTMLAudioElement {
  const byteString = atob(base64);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play().catch((e) => console.warn('Audio play failed:', e));
  return audio;
}
