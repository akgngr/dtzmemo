---
Task ID: 1
Agent: Main Agent
Task: Sözlüklerim ayarlara taşıma, ayarlar yeniden tasarlama, AI prompt iyileştirme

Work Log:
- CustomWordsModule navigasyondan kaldırıldı (constants.ts, page.tsx)
- SettingsModule tamamen yeniden tasarlandı: sol sidebar (desktop) + üst tab bar (mobil)
- 5 sekme: Genel, Görünüm, Sözlüklerim, Veri Yönetimi, Hakkında
- CustomWordsContent.tsx oluşturuldu (kelime listeleri, flashcard, pratik)
- ImportExportContent.tsx oluşturuldu (CSV/JSON dışa/içe aktarma, örnek dosyalar)
- Store güncellendi: addCustomWordList string ID dönüyor, v7'ye yükseltildi
- AI prompt iyileştirildi: 250-400 kelime, profesyonel gazeteci tarzı, kompleks sözdizimi
- AI max_tokens 4096'a yükseltildi
- Textarea UI component oluşturuldu
- Card.tsx exports düzeltildi
- ReadingModule hook çağrısı dışa taşıdı (wrapper pattern)
- Build başarıyla tamamlandı, 0 hata

Stage Summary:
- Sözlüklerim artık Ayarlar > Sözlüklerim sekmesinde erişilebilir
- Ayarlar modülü modern sidebar/tap tasarımına kavuştu
- AI daha uzun ve profesyonel metinler üretecek
- Build: 0 hata