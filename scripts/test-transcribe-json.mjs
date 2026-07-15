// Test the new JSON-based /api/transcribe endpoint with a real WAV file.
// We use ffmpeg to generate a real WAV file with spoken German (via macOS say + ffmpeg)
// or fall back to a synthetic sine wave if ffmpeg isn't available.
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const TARGET_WAV = '/tmp/german-test.wav';

// Try to make a real spoken-German WAV using espeak (cross-platform)
function makeSpokenWav() {
  try {
    execSync(`which espeak-ng || which espeak`, { stdio: 'ignore' });
    const cmd = `espeak-ng -v de -w ${TARGET_WAV} "Guten Tag, wie geht es dir?"`;
    execSync(cmd, { stdio: 'inherit' });
    if (fs.existsSync(TARGET_WAV) && fs.statSync(TARGET_WAV).size > 1000) {
      console.log('✓ Generated spoken WAV with espeak-ng');
      return true;
    }
  } catch {}
  return false;
}

// Fallback: synthetic sine wave WAV
function makeSineWav() {
  const sampleRate = 44100;
  const numFrames = sampleRate * 2;
  const buf = Buffer.alloc(44 + numFrames * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + numFrames * 2, 4);
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
  buf.writeUInt32LE(numFrames * 2, 40);
  for (let i = 0; i < numFrames; i++) {
    const sample = Math.sin(2 * Math.PI * 440 * (i / sampleRate)) * 0.3;
    buf.writeInt16LE(Math.max(-1, Math.min(1, sample)) * 0x7fff, 44 + i * 2);
  }
  fs.writeFileSync(TARGET_WAV, buf);
  console.log('✓ Generated sine wave WAV (fallback)');
}

const ok = makeSpokenWav();
if (!ok) makeSineWav();

const audioBase64 = fs.readFileSync(TARGET_WAV).toString('base64');
console.log('WAV size:', fs.statSync(TARGET_WAV).size, 'bytes');
console.log('Base64 length:', audioBase64.length);

console.log('\n=== Testing /api/transcribe with JSON body ===');
const response = await fetch('http://localhost:3000/api/transcribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    audioBase64,
    audioFormat: 'wav',
    language: 'de',
    hotwords: ['Guten Tag', 'geht es dir'],
  }),
});

console.log('Status:', response.status);
const data = await response.json();
console.log('Response:', JSON.stringify(data, null, 2));
