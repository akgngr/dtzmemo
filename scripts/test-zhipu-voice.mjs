// Generate a sample German speech WAV using macOS 'say' or fallback to silence
// Then test /api/transcribe (GLM-ASR-2512) and /api/voice (GLM-4-Voice)
import fs from 'node:fs';
import path from 'node:path';

const API_KEY = '51d6b2bb24364d4c9f44912ebd64cd86.z122Ar2NXutBAB4L';
const ZHIPU_TRANSCRIPTION_URL = 'https://open.bigmodel.cn/api/paas/v4/audio/transcriptions';
const ZHIPU_CHAT_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// Build a simple WAV file with a 440Hz tone for 1 second (just to test API shape)
function buildWav() {
  const sampleRate = 44100;
  const numFrames = sampleRate * 1; // 1 second
  const bytesPerSample = 2;
  const dataSize = numFrames * bytesPerSample;
  const buf = Buffer.alloc(44 + dataSize);

  // RIFF header
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  // Sine wave
  for (let i = 0; i < numFrames; i++) {
    const sample = Math.sin(2 * Math.PI * 440 * (i / sampleRate)) * 0.3;
    const int = Math.max(-1, Math.min(1, sample)) * 0x7fff;
    buf.writeInt16LE(int, 44 + i * 2);
  }
  return buf;
}

async function testTranscribe() {
  console.log('\n=== Test 1: /api/transcribe (GLM-ASR-2512) ===');
  const wav = buildWav();
  const blob = new Blob([wav], { type: 'audio/wav' });
  const fd = new FormData();
  fd.append('audio', blob, 'test.wav');
  fd.append('language', 'de');

  const response = await fetch('http://localhost:3000/api/transcribe', {
    method: 'POST',
    body: fd,
  });
  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

async function testVoice() {
  console.log('\n=== Test 2: /api/voice (GLM-4-Voice) ===');
  const wav = buildWav();
  const audioBase64 = wav.toString('base64');

  const response = await fetch('http://localhost:3000/api/voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64,
      audioFormat: 'wav',
      history: [],
      scenarioLabel: 'Im Restaurant',
      scenarioDescription: 'Restoranda sipariş verme',
      userRoleLabel: 'Öğrenci',
      aiRoleLabel: 'Garson',
      turnIndex: 0,
      maxTurns: 10,
    }),
  });
  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Reply (DE):', data.reply);
  console.log('AudioBase64 length:', data.audioBase64?.length || 0);
  console.log('isEnding:', data.isEnding);
  if (data.error) console.log('Error:', data.error);
}

async function main() {
  // Wait for dev server
  console.log('Waiting for dev server...');
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch('http://localhost:3000/');
      if (r.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }

  await testTranscribe();
  await testVoice();
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
