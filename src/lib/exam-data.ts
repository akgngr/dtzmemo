/* B1 Sınavı Verileri — DeutschMemo */

export type { WritingPrompt, GrammarQuestion, PicturePrompt, VocabItem } from './exam-types';

export const writingPrompts: WritingPrompt[] = [
  {
    id: 'w1',
    title: 'Einladung schreiben',
    titleTr: 'Davet Yazısı Yazma',
    description: 'Ihre Freundin Maria hat Geburtstag. Schreiben Sie ihr eine E-Mail und laden Sie sie zu einer Geburtstagsfeier ein.',
    descriptionTr: 'Arkadaşınız Maria doğum gününü kutluyor. Ona bir e-posta yazın ve bir doğum günü partisine davet edin.',
    tips: ['Begrüßung (Liebe Maria, ...)', 'Anlass und Einladung', 'Ort, Datum und Uhrzeit angeben', 'Aktivitäten nennen', 'Abschluss und Grußformel'],
    minWords: 60, maxWords: 100,
  },
  {
    id: 'w2',
    title: 'Beschwerdebrief',
    titleTr: 'Şikayet Mektubu',
    description: 'Sie haben in einem Online-Shop einen MP3-Player gekauft. Das Gerät funktioniert nicht richtig. Schreiben Sie eine Beschwerde.',
    descriptionTr: 'Bir çevrimiçi mağazadan MP3 çalar satın aldınız. Cihaz düzgün çalışmıyor. Bir şikayet mektubu yazın.',
    tips: ['Betreff angeben', 'Kaufdatum und Artikel beschreiben', 'Problem genau erklären', 'Lösung fordern', 'Frist setzen und höflich abschließen'],
    minWords: 80, maxWords: 120,
  },
  {
    id: 'w3',
    title: 'Forum-Beitrag',
    titleTr: 'Forum Mesajı',
    description: 'Schreiben Sie Ihre Meinung zum Thema „Smartphones in der Schule" in einem Online-Forum. Sind Sie dafür oder dagegen?',
    descriptionTr: '"Okulda Akıllı Telefonlar" konusu hakkında bir çevrimiçi forumda görüşünüzü yazın. Yanınızda mısınız yoksa karşı mısınız?',
    tips: ['Eigene Meinung klar äußern', 'Argumente mit Beispielen unterstützen', 'Gegenargumente nennen', 'Einleitung und Schluss', 'Forum-Sprache verwenden'],
    minWords: 80, maxWords: 120,
  },
  {
    id: 'w4',
    title: 'Kurznachricht',
    titleTr: 'Kısa Mesaj',
    description: 'Ihr Kollege Thomas ist krank und kann nicht zur Arbeit kommen. Schreiben Sie ihm eine Kurznachricht.',
    descriptionTr: 'Çalışma arkadaşınız Thomas hastalık nedeniyle işe gelemiyor. Ona bir kısa mesaj yazın.',
    tips: ['Kurze Begrüßung', 'Nachricht verstehen und reagieren', 'Gute Besserung wünschen', 'Evtl. Hilfe anbieten', 'Kurze Grußformel'],
    minWords: 40, maxWords: 60,
  },
];

/* ── Dil Yapıları (Sprachbausteine) ── */

export const grammarQuestions: GrammarQuestion[] = [
  { id: 'g1', sentence: 'Wenn ich genug Geld ___, würde ich ein Auto kaufen.', sentenceTr: 'Yeterli param olsaydı, bir araba satın alırdım.', blank: '___', options: ['habe', 'hätte', 'hättest', 'haben'], correctIndex: 1, grammarTopic: 'Konjunktiv II', grammarTopicTr: 'Konjunktiv II (Istek kipi)' },
  { id: 'g2', sentence: 'Er hat das Buch gelesen, ___ er gestern gekauft hat.', sentenceTr: 'Dün satın aldığı kitabı okudu.', blank: '___', options: ['den', 'dem', 'das', 'dessen'], correctIndex: 0, grammarTopic: 'Relativsätze', grammarTopicTr: 'İlgi Cümlecikleri' },
  { id: 'g3', sentence: 'Ich muss morgen früh zum Arzt ___.', sentenceTr: 'Yarın sabah doktora gitmeliyim.', blank: '___', options: ['gehen', 'zu gehen', 'gehe', 'gegangen'], correctIndex: 0, grammarTopic: 'Modalverben', grammarTopicTr: 'Yardımcı Fiiller' },
  { id: 'g4', sentence: 'Das Haus, ___ wir wohnen, ist sehr alt.', sentenceTr: 'Yaşadığımız ev çok eski.', blank: '___', options: ['wo', 'das', 'welches', 'in dem'], correctIndex: 0, grammarTopic: 'Relativsätze', grammarTopicTr: 'İlgi Cümlecikleri' },
  { id: 'g5', sentence: 'Sie ___ seit drei Jahren in Berlin.', sentenceTr: 'Üç yıldır Berlin\'de yaşıyor.', blank: '___', options: ['lebt', 'lebst', 'leben', 'lebe'], correctIndex: 0, grammarTopic: 'Präsens', grammarTopicTr: 'Şimdiki Zaman' },
  { id: 'g6', sentence: '___ du gestern im Kino warst, habe ich gearbeitet.', sentenceTr: 'Sen dün sinemaydayken ben çalışıyordum.', blank: '___', options: ['Als', 'Wenn', 'Während', 'Seitdem'], correctIndex: 0, grammarTopic: 'Temporalsätze', grammarTopicTr: 'Zaman Cümlecikleri' },
  { id: 'g7', sentence: 'Der Mann, ___ Frau Lehrerin ist, arbeitet bei Siemens.', sentenceTr: 'Eşi öğretmen olan adam Siemens\'te çalışıyor.', blank: '___', options: ['dessen', 'deren', 'deren', 'seiner'], correctIndex: 1, grammarTopic: 'Genitiv-Attribut', grammarTopicTr: 'Genitiv Sıfatları' },
  { id: 'g8', sentence: 'Ich hätte gern ___ Wasser, bitte.', sentenceTr: 'Lütfen biraz su istiyorum.', blank: '___', options: ['ein paar', 'ein wenig', 'viele', 'mehrere'], correctIndex: 1, grammarTopic: 'Indefinitpronomen', grammarTopicTr: 'Belirsiz Zamirler' },
  { id: 'g9', sentence: 'Das Kind wird ___ Mutter ähneln.', sentenceTr: 'Çocuk annesine benzeyecek.', blank: '___', options: ['sein', 'seiner', 'seine', 'ihrem'], correctIndex: 1, grammarTopic: 'Dativ', grammarTopicTr: 'Dativ (Yönlme Durumu)' },
  { id: 'g10', sentence: 'Wir sind in die Schweiz ___, um Schnee zu sehen.', sentenceTr: 'Kar görmek için İsviçre\'ye gittik.', blank: '___', options: ['gefahren', 'gefahrt', 'gefahren', 'fahre'], correctIndex: 0, grammarTopic: 'Perfekt', grammarTopicTr: 'Geçmiş Zaman (Perfekt)' },
];

/* ── Resim Tanımlama (Bildbeschreibung) ── */

export const picturePrompts: PicturePrompt[] = [
  {
    id: 'p1',
    title: 'Familienfeier',
    titleTr: 'Aile Kutlaması',
    imageUrl: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/809165d392bb.jpg',
    description: 'Beschreiben Sie das Bild: Eine Familie feiert im Garten. Es gibt Menschen verschiedenen Alters.',
    descriptionTr: 'Resmi tanımlayın: Bir aile bahçede kutlama yapıyor. Farklı yaşlarda insanlar var.',
    guidedQuestions: [
      { de: 'Was sehen Sie im Vordergrund?', tr: 'Ön planda ne görüyorsunuz?' },
      { de: 'Welche Aktivitäten finden statt?', tr: 'Hangi etkinlikler gerçekleşiyor?' },
      { de: 'Wie ist die Stimmung?', tr: 'Atmosfer nasıl?' },
      { de: 'Was sehen Sie im Hintergrund?', tr: 'Arka planda ne görüyorsunuz?' },
    ],
    usefulPhrases: ['Im Vordergrund sieht man...', 'Auf dem Bild sind... zu sehen', 'Es scheint, als ob...', 'Die Stimmung ist...', 'Im Hintergrund erkennt man...'],
    minSentences: 8,
  },
  {
    id: 'p2',
    title: 'Marktszene',
    titleTr: 'Pazar Sahnesi',
    imageUrl: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d3cfae216943.jpg',
    description: 'Beschreiben Sie das Bild: Ein Wochenmarkt mit verschiedenen Ständen und Menschen.',
    descriptionTr: 'Resmi tanımlayın: Farklı tezgahlar ve insanlarla bir hafta pazarı.',
    guidedQuestions: [
      { de: 'Was wird auf dem Markt verkauft?', tr: 'Pazarda ne satılıyor?' },
      { de: 'Was machen die Menschen?', tr: 'İnsanlar ne yapıyor?' },
      { de: 'Wie ist das Wetter?', tr: 'Hava nasıl?' },
      { de: 'In welcher Jahreszeit könnte das Bild entstehen?', tr: 'Resim hangi mevsimde çekilmiş olabilir?' },
    ],
    usefulPhrases: ['Auf dem Markt gibt es...', 'Die Menschen kaufen/stehen/sprechen...', 'Rechts/Links sieht man...', 'Man kann erkennen, dass...', 'Das Bild entstand wahrscheinlich im...'],
    minSentences: 8,
  },
  {
    id: 'p3',
    title: 'Bahnhof',
    titleTr: 'Tren İstasyonu',
    imageUrl: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/8599c596ae2f.jpg',
    description: 'Beschreiben Sie das Bild: Ein belebter Bahnhof mit Reisenden und Zügen.',
    descriptionTr: 'Resmi tanımlayın: Yolcular ve trenlerle kalabalık bir tren istasyonu.',
    guidedQuestions: [
      { de: 'Was machen die Reisenden?', tr: 'Yolcular ne yapıyor?' },
      { de: 'Welche Mittel der Kommunikation sehen Sie?', tr: 'Hangi iletişim araçları görüyorsunuz?' },
      { de: 'Wie wirkt die Atmosphäre?', tr: 'Atmosfer nasıl etkiliyor?' },
      { de: 'Gibt es Anzeichen für Probleme oder Eile?', tr: 'Sorun veya acele işaretleri var mı?' },
    ],
    usefulPhrases: ['Auf dem Bahnhof herrscht viel Betrieb', 'Einige Leute warten auf...', 'An der Informationstafel steht...', 'Man bemerkt, dass...', 'Die Atmosphäre ist...'],
    minSentences: 8,
  },
];

/* ── Sınav Kelimeleri (Prüfungswortschatz) ── */
import { VocabItem } from './exam-types';

/* Mevcut el ile yazılmış kelimeler (örnek cümleli) */
export const examVocabCore: VocabItem[] = [
  { id: 'ev1', german: 'die Einladung', article: 'die', plural: 'Einladungen', turkish: 'davet', example: 'Ich habe eine Einladung zur Party bekommen.', exampleTr: 'Partiye bir davet aldım.', topic: 'Kommunikation', topicTr: 'İletişim' },
  { id: 'ev2', german: 'die Beschwerde', article: 'die', plural: 'Beschwerden', turkish: 'şikayet', example: 'Sie hat eine Beschwerde geschrieben.', exampleTr: 'Bir şikayet yazdı.', topic: 'Kommunikation', topicTr: 'İletişim' },
  { id: 'ev3', german: 'der Teilnehmer', article: 'der', plural: 'Teilnehmer', turkish: 'katılımcı', example: 'Jeder Teilnehmer bekommt ein Zertifikat.', exampleTr: 'Her katılımcı bir sertifika alıyor.', topic: 'Gesellschaft', topicTr: 'Toplum' },
  { id: 'ev4', german: 'die Veranstaltung', article: 'die', plural: 'Veranstaltungen', turkish: 'etkinlik', example: 'Die Veranstaltung beginnt um 19 Uhr.', exampleTr: 'Etkinlik saat 19\'da başlıyor.', topic: 'Gesellschaft', topicTr: 'Toplum' },
  { id: 'ev5', german: 'die Bewerbung', article: 'die', plural: 'Bewerbungen', turkish: 'başvuru', example: 'Ich habe meine Bewerbung abgesendet.', exampleTr: 'Başvurumu gönderdim.', topic: 'Arbeit', topicTr: 'İş' },
  { id: 'ev6', german: 'das Vorstellungsgespräch', article: 'das', plural: 'Vorstellungsgespräche', turkish: 'mülakat', example: 'Das Vorstellungsgespräch war sehr positiv.', exampleTr: 'Mülakat çok olumluydu.', topic: 'Arbeit', topicTr: 'İş' },
  { id: 'ev7', german: 'die Stellungnahme', article: 'die', plural: 'Stellungnahmen', turkish: 'düşünce bildirme', example: 'Wir bitten um eine schriftliche Stellungnahme.', exampleTr: 'Yazılı bir görüş bildirmenizi rica ediyoruz.', topic: 'Kommunikation', topicTr: 'İletişim' },
  { id: 'ev8', german: 'die Voraussetzung', article: 'die', plural: 'Voraussetzungen', turkish: 'ön koşul', example: 'Gute Deutschkenntnisse sind eine Voraussetzung.', exampleTr: 'İyi Almanca bilgisi bir ön koşuldur.', topic: 'Bildung', topicTr: 'Eğitim' },
  { id: 'ev9', german: 'die Einschreibung', article: 'die', plural: 'Einschreibungen', turkish: 'kayıt', example: 'Die Einschreibung für den Kurs ist noch möglich.', exampleTr: 'Kursa kayıt hâlâ mümkün.', topic: 'Bildung', topicTr: 'Eğitim' },
  { id: 'ev10', german: 'der Grund', article: 'der', plural: 'Gründe', turkish: 'neden/sebep', example: 'Aus welchem Grund kommst du zu spät?', exampleTr: 'Hangi nedenle geç kalıyorsun?', topic: 'Allgemein', topicTr: 'Genel' },
  { id: 'ev11', german: 'die Erfahrung', article: 'die', plural: 'Erfahrungen', turkish: 'deneyim', example: 'Diese Erfahrung hat mich sehr geprägt.', exampleTr: 'Bu deneyim beni çok etkiledi.', topic: 'Allgemein', topicTr: 'Genel' },
  { id: 'ev12', german: 'die Meinung', article: 'die', plural: 'Meinungen', turkish: 'görüş/fikir', example: 'Meiner Meinung nach ist das richtig.', exampleTr: 'Bana göre bu doğru.', topic: 'Kommunikation', topicTr: 'İletişim' },
  { id: 'ev13', german: 'der Vorteil', article: 'der', plural: 'Vorteile', turkish: 'avantaj', example: 'Der größte Vorteil ist die Flexibilität.', exampleTr: 'En büyük avantaj esnekliktir.', topic: 'Allgemein', topicTr: 'Genel' },
  { id: 'ev14', german: 'der Nachteil', article: 'der', plural: 'Nachteile', turkish: 'dezavantaj', example: 'Ein Nachteil sind die hohen Kosten.', exampleTr: 'Bir dezavantaj yüksek maliyetlerdir.', topic: 'Allgemein', topicTr: 'Genel' },
  { id: 'ev15', german: 'die Entscheidung', article: 'die', plural: 'Entscheidungen', turkish: 'karar', example: 'Die Entscheidung fiel mir nicht leicht.', exampleTr: 'Karar vermek bana kolay gelmedi.', topic: 'Allgemein', topicTr: 'Genel' },
  { id: 'ev16', german: 'die Verantwortung', article: 'die', plural: 'Verantwortungen', turkish: 'sorumluluk', example: 'Er übernimmt die Verantwortung.', exampleTr: 'O sorumluluğu üstleniyor.', topic: 'Arbeit', topicTr: 'İş' },
];

/* B1 Wortschatzliste — TS dosyasından import (JSON import sorunlu) */
import { b1VocabEntries } from './b1-exam-vocab-entries';

export const b1ExamVocab: VocabItem[] = b1VocabEntries;

/* Birleştirilmiş liste: core + B1 tam liste (tekilleştirilmiş) */
const existingGerman = new Set(examVocabCore.map(v => v.german.toLowerCase()));
const b1New = b1ExamVocab.filter(v => !existingGerman.has(v.german.toLowerCase()));

export const examVocab: VocabItem[] = [...examVocabCore, ...b1New];

/* Konu başlıkları (tüm listelerden toplanmış) */
export const examVocabTopics: { de: string; tr: string; count: number }[] = (() => {
  const map = new Map<string, { de: string; tr: string; count: number }>();
  examVocab.forEach(v => {
    const existing = map.get(v.topic);
    if (existing) existing.count++;
    else map.set(v.topic, { de: v.topic, tr: v.topicTr, count: 1 });
  });
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
})();
