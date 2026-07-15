// Test multi-turn conversation with GLM-4.5-Air
const SYSTEM_PROMPT = `Sen Almanca pratik yaptıran bir konuşma hocasısın. Konu: Restoranda sipariş verme.

Kurallar:
- Her turda SADECE şu JSON formatında cevap ver: {"reply":"<Almanca cümle>","tip":"<Türkçe açıklama>","isEnding":false}
- reply alanı SADECE Almanca olmalı
- tip alanı kısa Türkçe yardım/ipucu içermeli
- Konuşma 8-10 tur sonra doğal şekilde bitmeli, o zaman isEnding:true döndür
- Türkçe açıklama veya talimat ASLA reply alanına koyma`;

// Simulate 2nd turn — user replied in German
const messages = [
  {
    role: 'user',
    content: 'Merhaba, restorana girdim ve garson bana bakıyor.',
  },
  {
    role: 'assistant',
    content:
      '{"reply":"Guten Tag, ich hätte gerne einen Tisch für zwei Personen.","tip":"Bu ifade iki kişilik masa isteğini ifade eder.","isEnding":false}',
  },
  {
    role: 'user',
    content: 'Guten Tag, einen Tisch für zwei, bitte. Haben Sie eine Speisekarte?',
  },
];

console.log('=== Testing 2nd turn (multi-turn) ===');
const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages,
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.7,
    maxTokens: 400,
  }),
});

const data = await response.json();
console.log('Status:', response.status);
console.log('reply (DE):', data.reply);
console.log('tip    (TR):', data.tip);
console.log('isEnding   :', data.isEnding);

// Also test ending detection
console.log('\n=== Testing ending detection ===');
const endMessages = [
  ...messages,
  {
    role: 'assistant',
    content:
      '{"reply":"Vielen Dank, das war lecker. Die Rechnung, bitte.","tip":"Hesap isteme ifadesi.","isEnding":false}',
  },
  { role: 'user', content: 'Die Rechnung, bitte. Ich zahle mit Karte.' },
];

const endResponse = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: endMessages,
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.7,
    maxTokens: 400,
  }),
});

const endData = await endResponse.json();
console.log('Status:', endResponse.status);
console.log('reply (DE):', endData.reply);
console.log('tip    (TR):', endData.tip);
console.log('isEnding   :', endData.isEnding);
