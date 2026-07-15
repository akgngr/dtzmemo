---
Task ID: 1
Agent: main
Task: Tar arşivinden DeutschMemo uygulamasını çıkar, incele, sorunları düzelt ve ayağa kaldır

Work Log:
- Kullanıcıdan gelen .tar arşivini /home/z/my-project/upload/ dizininden buldum
- Arşivi projeye çıkardım (139 dosya, .git hariç)
- Proje yapısını inceledim: Next.js 16 + Tailwind CSS 4 + shadcn/ui + Prisma (SQLite) + Zustand
- DeutschMemo: Almanca-Türkçe ezberleme uygulaması (kartlar, boşluk doldurma, sürükle-bırak, eşleştirme, konuşma pratiği, TTS/STT)
- API route'ları inceledim: /api/chat (Zhipu GLM), /api/tts (ElevenLabs/Google fallback), /api/transcribe (Zhipu ASR), /api/voice (GLM-4-Voice)
- `bun install` ile 827 paket başarıyla yüklendi
- `prisma generate` + `prisma db push` ile veritabanı oluşturuldu (SQLite: db/custom.db)
- `next build` → başarıyla derlendi (0 hata, 8 route)
- `next dev -p 3000` → sunucu başarıyla başladı, HTTP 200 yanıtı veriyor (~62KB HTML)

Stage Summary:
- Uygulama sorunsuz çalışır durumda
- Build hatası veya çalışma zamanı hatası tespit edilmedi
- Sunucu http://localhost:3000 adresinde aktif