// Test script for the new free LLM-powered /api/chat endpoint
// Usage: node scripts/test-free-chat.mjs

const TEST_PROMPT = {
  systemPrompt:
    'Sen Almanca öğretmenisin. Öğrenciye Almanca cevap ver ve hatalarını nazikçe düzelt. Yanıtını her zaman şu JSON formatında ver: {"reply": "Almanca yanıt", "tip": "Türkçe açıklama (varsa)", "isEnding": false}',
  messages: [
    {
      role: 'user',
      content: 'Hallo, ich heiße Ahmet und ich komme aus der Türkei.',
    },
  ],
  temperature: 0.7,
  maxTokens: 300,
};

async function main() {
  console.log('Testing /api/chat with z-ai-web-dev-sdk (free LLM)...');
  console.log('User message:', TEST_PROMPT.messages[0].content);

  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_PROMPT),
  });

  console.log('\nStatus:', res.status);
  const data = await res.json();

  if (!res.ok) {
    console.error('Error:', data);
    process.exit(1);
  }

  console.log('\nAI reply:', data.reply);
  if (data.tip) console.log('Tip:', data.tip);
  console.log('isEnding:', data.isEnding);
  console.log('\n✓ Test passed — free LLM chat is working');
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
